import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  Copy, 
  Settings2,
  MousePointer2,
  Move,
  Code,
  Link2,
  X,
  Hand,
  Activity,
  FileCode,
  PenTool,
  Repeat,
  Circle,
  Minus,
  Maximize2,
  Crosshair
} from 'lucide-react';

// Utility for unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Default configuration
const DEFAULT_CONFIG = {
  blur: 15,
  alphaContrast: 20,
  alphaShift: -5,
  fillColor: '#3b82f6', // blue-500
  bgColor: '#ffffff',
  animate: false,
  globalSpeed: 1,
  showGuides: true,
  constraintActive: true, 
  exportAnimated: true, 
  loopDuration: 12,
  
  // Global Motion Settings
  globalPattern: 'circle',
  globalOrbitRx: 0,
  globalOrbitRy: 0,
  globalOrbitRotation: 0,
  globalOrbitSpeed: 1,
};

// Initial state
const INITIAL_CIRCLES = [
  { id: '1', x: 200, y: 200, r: 60, anchorX: 200, anchorY: 200, pattern: 'circle', orbitRx: 10, orbitRy: 10, orbitRotation: 0, orbitSpeed: 1, phase: 0, isAnimated: true, radiusAnim: false, minR: 50, maxR: 70, radiusSpeed: 0.5, radiusPhase: 0 },
  { id: '2', x: 280, y: 200, r: 50, anchorX: 280, anchorY: 200, pattern: 'line', orbitRx: 20, orbitRy: 0, orbitRotation: 45, orbitSpeed: 2, phase: 2, isAnimated: true, radiusAnim: true, minR: 40, maxR: 60, radiusSpeed: 0.8, radiusPhase: 1 },
  { id: '3', x: 240, y: 150, r: 45, anchorX: 240, anchorY: 150, pattern: 'oval', orbitRx: 15, orbitRy: 8, orbitRotation: 90, orbitSpeed: 1, phase: 4, isAnimated: true, radiusAnim: false, minR: 35, maxR: 55, radiusSpeed: 0.5, radiusPhase: 0 },
];

export default function CloudGenerator() {
  const [circles, setCircles] = useState(INITIAL_CIRCLES);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [selectedId, setSelectedId] = useState(null); // can be 'GLOBAL'
  
  // Viewport State
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 600 });
  const [lockedExportBox, setLockedExportBox] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [showSource, setShowSource] = useState(false);
  
  // Live Tracking for UI elements
  const [globalAnimOffset, setGlobalAnimOffset] = useState({ x: 0, y: 0 });
  
  const svgRef = useRef(null);
  const requestRef = useRef();
  const timeRef = useRef(0);

  // Helper: Calculate centroid of all anchors
  const getCentroid = () => {
    if (circles.length === 0) return { x: 400, y: 300 };
    const sumX = circles.reduce((sum, c) => sum + c.anchorX, 0);
    const sumY = circles.reduce((sum, c) => sum + c.anchorY, 0);
    return { x: sumX / circles.length, y: sumY / circles.length };
  };

  // Helper: Calculate Global Motion Offset at time T
  const calculateGlobalOffset = useCallback((t) => {
      const loopProgress = t / config.loopDuration;
      const globalTheta = loopProgress * Math.PI * 2 * config.globalOrbitSpeed;
      let gRawX, gRawY;
      
      if (config.globalPattern === 'line') {
         const sine = Math.sin(globalTheta); 
         gRawX = config.globalOrbitRx * sine; 
         gRawY = 0;
      } else {
         gRawX = config.globalOrbitRx * Math.cos(globalTheta);
         gRawY = config.globalOrbitRy * Math.sin(globalTheta);
      }

      const gRotRad = (config.globalOrbitRotation * Math.PI) / 180;
      const globalOffsetX = gRawX * Math.cos(gRotRad) - gRawY * Math.sin(gRotRad);
      const globalOffsetY = gRawX * Math.sin(gRotRad) + gRawY * Math.cos(gRotRad);
      
      return { x: globalOffsetX, y: globalOffsetY };
  }, [config.loopDuration, config.globalOrbitSpeed, config.globalPattern, config.globalOrbitRx, config.globalOrbitRy, config.globalOrbitRotation]);

  // --- Constraint Logic ---
  const constrainPosition = useCallback((targetX, targetY, circle, allCircles) => {
    if (!config.constraintActive || allCircles.length <= 1) return { x: targetX, y: targetY };

    let isOverlapping = false;
    let nearestDist = Infinity;
    let nearestNeighbor = null;
    const neighbors = allCircles.filter(c => c.id !== circle.id);

    const currentR = circle.currentR || circle.r;

    for (let n of neighbors) {
      const dist = Math.sqrt(Math.pow(targetX - n.x, 2) + Math.pow(targetY - n.y, 2));
      const neighborR = n.currentR || n.r;
      const minDist = currentR + neighborR; 
      const limit = minDist * 0.95;

      if (dist < limit) {
        isOverlapping = true;
        break; 
      }
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestNeighbor = n;
      }
    }

    if (isOverlapping) return { x: targetX, y: targetY };

    if (nearestNeighbor) {
      const neighborR = nearestNeighbor.currentR || nearestNeighbor.r;
      const angle = Math.atan2(targetY - nearestNeighbor.y, targetX - nearestNeighbor.x);
      const limit = (currentR + neighborR) * 0.95; 
      return {
        x: nearestNeighbor.x + Math.cos(angle) * limit,
        y: nearestNeighbor.y + Math.sin(angle) * limit
      };
    }

    return { x: targetX, y: targetY };
  }, [config.constraintActive]);

  // --- Bounding Box ---
  const getBoundingBox = (currentCircles, paddingMultiplier = 1) => {
    if (currentCircles.length === 0) return { x: 0, y: 0, w: 100, h: 100 };
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Calculate global motion expansion
    const globalExp = config.animate ? Math.max(config.globalOrbitRx, config.globalOrbitRy) : 0;

    currentCircles.forEach(c => {
      const orbitExp = c.isAnimated ? Math.max(c.orbitRx, c.orbitRy) : 0;
      const radiusExp = c.radiusAnim ? c.maxR : c.r;
      
      minX = Math.min(minX, c.anchorX - radiusExp - orbitExp - globalExp);
      minY = Math.min(minY, c.anchorY - radiusExp - orbitExp - globalExp);
      maxX = Math.max(maxX, c.anchorX + radiusExp + orbitExp + globalExp);
      maxY = Math.max(maxY, c.anchorY + radiusExp + orbitExp + globalExp);
    });

    const basePadding = config.blur * 2 + 20;
    const padding = basePadding * paddingMultiplier;

    return {
      x: minX - padding,
      y: minY - padding,
      w: (maxX - minX) + (padding * 2),
      h: (maxY - minY) + (padding * 2)
    };
  };

  // Sync Global Offset when config changes (to update visuals even when paused)
  useEffect(() => {
    const offset = calculateGlobalOffset(timeRef.current);
    setGlobalAnimOffset(offset);
  }, [config, calculateGlobalOffset]);

  // Handle Animation Toggle
  useEffect(() => {
    if (config.animate) {
      setLockedExportBox(getBoundingBox(circles, 1.2));
    } else {
      setLockedExportBox(null);
      // Removed the reset of globalAnimOffset here so guides stay aligned with frozen circles
    }
  }, [config.animate]);

  
  // --- Animation Loop ---
  const animate = useCallback(() => {
    if (config.animate) {
      timeRef.current += 0.016 * config.globalSpeed;
      
      const globalOffset = calculateGlobalOffset(timeRef.current);
      setGlobalAnimOffset(globalOffset);

      setCircles(prevCircles => {
        // Pre-calculate radius
        const sizedCircles = prevCircles.map(c => {
           let newR = c.r;
           if (c.radiusAnim) {
              const loopProgress = timeRef.current / config.loopDuration;
              const theta = c.radiusPhase + (loopProgress * Math.PI * 2 * c.radiusSpeed);
              const sine = (Math.sin(theta) + 1) / 2;
              newR = c.minR + (c.maxR - c.minR) * sine;
           }
           return { ...c, currentR: newR };
        });

        // Calculate positions
        return sizedCircles.map((c, index, all) => {
          // Base Anchor
          let targetX = c.anchorX;
          let targetY = c.anchorY;

          // Add Individual Motion
          if (c.isAnimated) {
            const loopProgress = timeRef.current / config.loopDuration;
            const theta = c.phase + (loopProgress * Math.PI * 2 * c.orbitSpeed);
            let rawX, rawY;
            
            if (c.pattern === 'line') {
                const sine = Math.sin(theta);
                rawX = c.orbitRx * sine;
                rawY = 0;
            } else {
                rawX = c.orbitRx * Math.cos(theta);
                rawY = c.orbitRy * Math.sin(theta);
            }

            const rotRad = (c.orbitRotation * Math.PI) / 180;
            const rotatedX = rawX * Math.cos(rotRad) - rawY * Math.sin(rotRad);
            const rotatedY = rawX * Math.sin(rotRad) + rawY * Math.cos(rotRad);
            targetX += rotatedX;
            targetY += rotatedY;
          }

          // Add Global Motion
          targetX += globalOffset.x;
          targetY += globalOffset.y;

          // Apply Constraint logic ONLY if animation is off, OR if we want live constraint solving.
          // User requested constraint off during animation for smoothness.
          // But to prevent shape breaking, we might need it.
          // For now, let's skip constraint during animation to prevent jumping as requested.
          return { ...c, x: targetX, y: targetY };
        });
      });
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [config, calculateGlobalOffset, constrainPosition]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);


  // --- Event Handlers ---
  const handleCircleDown = (e, id) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    const svg = svgRef.current;
    if (!svg) return;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX || e.touches?.[0]?.clientX;
    pt.y = e.clientY || e.touches?.[0]?.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    const circle = circles.find(c => c.id === id);
    setSelectedId(id);
    setDragState({
      type: 'CIRCLE',
      id,
      startX: svgP.x,
      startY: svgP.y,
      originalAnchorX: circle.anchorX,
      originalAnchorY: circle.anchorY,
      offsetX: svgP.x - circle.x,
      offsetY: svgP.y - circle.y
    });
  };

  const handleGlobalDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId('GLOBAL');
  };

  const handleCanvasDown = (e) => {
    e.preventDefault();
    if (e.target !== e.currentTarget) return; 
    setDragState({
      type: 'PAN',
      startX: e.clientX || e.touches?.[0]?.clientX,
      startY: e.clientY || e.touches?.[0]?.clientY,
      originalViewBoxX: viewBox.x,
      originalViewBoxY: viewBox.y
    });
    // Deselect if clicking background
    if (selectedId) setSelectedId(null);
  };

  const handlePointerMove = (e) => {
    if (!dragState) return;
    e.preventDefault();
    const svg = svgRef.current;
    
    if (dragState.type === 'CIRCLE') {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX || e.touches?.[0]?.clientX;
      pt.y = e.clientY || e.touches?.[0]?.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

      const deltaX = svgP.x - dragState.startX;
      const deltaY = svgP.y - dragState.startY;

      const targetAnchorX = dragState.originalAnchorX + deltaX;
      const targetAnchorY = dragState.originalAnchorY + deltaY;

      setCircles(prev => prev.map(c => {
        if (c.id === dragState.id) {
          const dx = c.x - c.anchorX;
          const dy = c.y - c.anchorY;
          
          // During drag, we want to respect the constraint relative to other circles
          // The constraint solver uses 'c.x' and 'c.y'.
          // If paused, c.x is static. If playing, c.x is moving.
          // We calculate the *intended* new anchor position
          // And then derive the intended new world position
          // But constraint solver returns a constrained world position.
          // We must back-calculate the anchor.
          
          // Current offset from anchor (due to animation)
          const animOffsetX = c.x - c.anchorX;
          const animOffsetY = c.y - c.anchorY;
          
          const intendedX = targetAnchorX + animOffsetX; 
          const intendedY = targetAnchorY + animOffsetY;
          
          // Apply constraint
          const constrained = constrainPosition(intendedX, intendedY, c, prev);

          return {
            ...c,
            x: constrained.x,
            y: constrained.y,
            anchorX: constrained.x - animOffsetX, 
            anchorY: constrained.y - animOffsetY 
          };
        }
        return c;
      }));

    } else if (dragState.type === 'PAN') {
      const clientX = e.clientX || e.touches?.[0]?.clientX;
      const clientY = e.clientY || e.touches?.[0]?.clientY;
      const dx = clientX - dragState.startX;
      const dy = clientY - dragState.startY;
      const CTM = svg.getScreenCTM();
      const scale = CTM ? 1 / CTM.a : 1; 

      setViewBox(prev => ({
        ...prev,
        x: dragState.originalViewBoxX - (dx * scale),
        y: dragState.originalViewBoxY - (dy * scale)
      }));
    }
  };

  const handlePointerUp = () => {
    setDragState(null);
  };

  const handleAddCircle = () => {
    const cx = viewBox.x + 400 + (Math.random() * 40 - 20);
    const cy = viewBox.y + 300 + (Math.random() * 40 - 20);
    let finalX = cx;
    let finalY = cy;
    
    if (circles.length > 0) {
      const parent = circles[circles.length - 1];
      finalX = parent.x + 20;
      finalY = parent.y + 20;
    }

    const newCircle = {
      id: generateId(),
      x: finalX,
      y: finalY,
      anchorX: finalX,
      anchorY: finalY,
      r: 40,
      pattern: 'circle',
      orbitRx: 20,
      orbitRy: 20,
      orbitRotation: 0,
      orbitSpeed: Math.ceil(Math.random() * 2), 
      phase: Math.random() * Math.PI * 2,
      isAnimated: true,
      radiusAnim: false,
      minR: 30,
      maxR: 50,
      radiusSpeed: 0.5,
      radiusPhase: 0
    };
    setCircles(prev => [...prev, newCircle]);
    setSelectedId(newCircle.id);
  };

  const handleRemoveCircle = (id) => {
    setCircles(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Phase shifting helper to prevent jumping when changing speed/duration
  const adjustPhaseForContinuity = (circle, newSpeed, newDuration) => {
     const currentTime = timeRef.current;
     const currentLoopProgress = currentTime / config.loopDuration;
     const currentAngle = circle.phase + (currentLoopProgress * Math.PI * 2 * circle.orbitSpeed);
     
     const newLoopProgress = currentTime / newDuration;
     const newPhase = currentAngle - (newLoopProgress * Math.PI * 2 * newSpeed);
     return newPhase;
  };

  const handleUpdateSelected = (key, value) => {
    if (!selectedId) return;
    
    if (selectedId === 'GLOBAL') {
       // Global update
       const numValue = key === 'globalPattern' ? value : Number(value);
       const updates = { [key]: numValue };
       if (key === 'globalPattern') {
          if (value === 'circle') updates.globalOrbitRy = config.globalOrbitRx;
          if (value === 'line') updates.globalOrbitRy = 0;
          if (value === 'oval' && config.globalOrbitRy === 0) updates.globalOrbitRy = Math.max(config.globalOrbitRx * 0.6, 10);
       }
       setConfig(prev => ({ ...prev, ...updates }));
    } else {
       // Circle update
       setCircles(prev => prev.map(c => {
        if (c.id !== selectedId) return c;
        let numValue = key === 'pattern' ? value : Number(value);
        let updates = { [key]: numValue };
        
        // Prevent jump when changing speed
        if (key === 'orbitSpeed' && config.animate) {
           updates.phase = adjustPhaseForContinuity(c, numValue, config.loopDuration);
        }

        if (key === 'pattern') {
          if (value === 'circle') updates.orbitRy = c.orbitRx;
          if (value === 'line') updates.orbitRy = 0;
          if (value === 'oval' && c.orbitRy === 0) updates.orbitRy = Math.max(c.orbitRx * 0.6, 10);
        }
        return { ...c, ...updates };
      }));
    }
  };
  
  const toggleSelectedAnimation = () => {
    if (!selectedId || selectedId === 'GLOBAL') return;
    setCircles(prev => prev.map(c => 
      c.id === selectedId ? { ...c, isAnimated: !c.isAnimated } : c
    ));
  };
  
  const toggleRadiusAnimation = () => {
    if (!selectedId || selectedId === 'GLOBAL') return;
    setCircles(prev => prev.map(c => {
      if (c.id !== selectedId) return c;
      const newStatus = !c.radiusAnim;
      return { 
        ...c, 
        radiusAnim: newStatus,
        minR: newStatus ? c.r : c.minR,
        maxR: newStatus ? c.r + 15 : c.maxR 
      };
    }));
  };

  // --- SVG Export ---
  const getSVGString = () => {
    if (circles.length === 0) return '<svg></svg>';

    const box = lockedExportBox || getBoundingBox(circles, 1.2);
    const vbX = box.x.toFixed(1);
    const vbY = box.y.toFixed(1);
    const vbW = box.w.toFixed(1);
    const vbH = box.h.toFixed(1);

    // -- Generate Inner Elements (Circles) --
    const elements = circles.map(c => {
      let radiusAttribute = `r="${c.r}"`;
      let radiusAnimateTag = "";

      if (config.exportAnimated && c.radiusAnim && c.radiusSpeed > 0) {
         const speed = c.radiusSpeed * config.globalSpeed;
         const rDuration = (config.loopDuration / speed).toFixed(3);
         const rPhaseRatio = (c.radiusPhase % (Math.PI * 2)) / (Math.PI * 2);
         const rBegin = -1 * rPhaseRatio * rDuration;
         
         radiusAttribute = `r="${c.minR}"`;
         radiusAnimateTag = `
        <animate 
           attributeName="r" 
           values="${c.minR};${c.maxR};${c.minR}" 
           dur="${rDuration}s" 
           repeatCount="indefinite"
           calcMode="spline"
           keyTimes="0;0.5;1"
           keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
           begin="${rBegin.toFixed(3)}s"
        />`;
      } else if (c.radiusAnim) {
         radiusAttribute = `r="${(c.minR + c.maxR)/2}"`;
      }

      if (!config.exportAnimated || !c.isAnimated) {
         const staticR = c.radiusAnim ? (c.minR + c.maxR)/2 : c.r;
         return `    <circle cx="${c.anchorX.toFixed(1)}" cy="${c.anchorY.toFixed(1)}" r="${staticR}" fill="${config.fillColor}" />`;
      } 
      else {
        const duration = (config.loopDuration / (c.orbitSpeed * config.globalSpeed)).toFixed(3);
        const phaseRatio = (c.phase % (Math.PI * 2)) / (Math.PI * 2);
        const beginOffset = -1 * phaseRatio * duration;

        let pathData = "";
        let calcMode = "";
        let keyTimes = "";
        let keySplines = "";

        if (c.pattern === 'line') {
            // Line pattern: Right -> Left -> Right
            pathData = `M ${c.orbitRx.toFixed(1)} 0 L ${-c.orbitRx.toFixed(1)} 0 L ${c.orbitRx.toFixed(1)} 0`;
            // Smooth easing for line
            calcMode = 'calcMode="spline"';
            keyTimes = 'keyTimes="0;0.5;1"';
            keySplines = 'keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"';
        } else {
            // Circle/Oval pattern
            const rx = c.orbitRx.toFixed(1);
            const ry = Math.max(c.orbitRy, 0.1).toFixed(1);
            pathData = `M ${rx} 0 A ${rx} ${ry} 0 1 1 -${rx} 0 A ${rx} ${ry} 0 1 1 ${rx} 0`;
        }

        return `    <g transform="translate(${c.anchorX.toFixed(1)}, ${c.anchorY.toFixed(1)}) rotate(${c.orbitRotation})">
      <g>
        <animateMotion 
          path="${pathData}"
          dur="${duration}s" 
          repeatCount="indefinite"
          rotate="0"
          begin="${beginOffset.toFixed(3)}s"
          ${calcMode} ${keyTimes} ${keySplines}
        />
        <circle ${radiusAttribute} fill="${config.fillColor}">${radiusAnimateTag}
        </circle>
      </g>
    </g>`;
      }
    }).join('\n');

    // -- Wrap in Global Motion Group if needed --
    let content = elements;
    if (config.exportAnimated && (config.globalOrbitRx > 0 || config.globalOrbitRy > 0)) {
        const duration = (config.loopDuration / (config.globalOrbitSpeed * config.globalSpeed)).toFixed(3);
        let pathData = "";
        let calcMode = "";
        let keyTimes = "";
        let keySplines = "";

        if (config.globalPattern === 'line') {
            pathData = `M ${config.globalOrbitRx.toFixed(1)} 0 L ${-config.globalOrbitRx.toFixed(1)} 0 L ${config.globalOrbitRx.toFixed(1)} 0`;
            calcMode = 'calcMode="spline"';
            keyTimes = 'keyTimes="0;0.5;1"';
            keySplines = 'keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"';
        } else {
            const rx = config.globalOrbitRx.toFixed(1);
            const ry = Math.max(config.globalOrbitRy, 0.1).toFixed(1);
            pathData = `M ${rx} 0 A ${rx} ${ry} 0 1 1 -${rx} 0 A ${rx} ${ry} 0 1 1 ${rx} 0`;
        }

        content = `  <g transform="rotate(${config.globalOrbitRotation})">
    <g>
      <animateMotion 
        path="${pathData}"
        dur="${duration}s" 
        repeatCount="indefinite"
        rotate="0"
        ${calcMode} ${keyTimes} ${keySplines}
      />
      <g transform="rotate(${-config.globalOrbitRotation})">
${elements}
      </g>
    </g>
  </g>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" style="background-color: ${config.bgColor}">
  <defs>
    <filter id="goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${config.blur}" result="blur" />
      <feColorMatrix 
        in="blur" 
        mode="matrix" 
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${config.alphaContrast} ${config.alphaShift}" 
        result="goo" 
      />
      <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
    </filter>
  </defs>
  <g filter="url(#goo)">
${content}
  </g>
</svg>`;
  };

  const copyToClipboard = () => {
    const str = getSVGString();
    navigator.clipboard.writeText(str);
  };

  const selectedCircle = circles.find(c => c.id === selectedId);
  const centroid = getCentroid();

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden">
      
      {/* Header */}
      <header className="flex-none bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Move className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Liquid Shape Generator</h1>
            <p className="text-xs text-gray-500">Create organic clouds, drops, and blobs</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setConfig(prev => ({ ...prev, animate: !prev.animate }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${config.animate ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {config.animate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {config.animate ? 'Pause Editor' : 'Play Editor'}
          </button>
          
          <button 
            onClick={() => setShowSource(!showSource)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showSource ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {showSource ? <X className="w-4 h-4" /> : <Code className="w-4 h-4" />}
            {showSource ? 'Close Source' : 'View Source'}
          </button>

          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors shadow-sm active:scale-95"
          >
            <Copy className="w-4 h-4" />
            Copy SVG
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Controls */}
        <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-6 flex flex-col gap-8 shadow-inner z-10 shrink-0">
          
          {/* Global Group Motion Panel */}
          {selectedId === 'GLOBAL' && (
            <section className="animate-in slide-in-from-left-4 duration-200">
               <div className="flex items-center justify-between mb-4 border-b pb-2 border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold">
                    <Crosshair className="w-4 h-4" />
                    <h2>Global Group Motion</h2>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 space-y-4">
                 <div className="text-xs text-indigo-700 font-medium">Animate entire shape as a group</div>
                 <div className="grid grid-cols-3 gap-2 mb-2">
                   <button 
                    onClick={() => handleUpdateSelected('globalPattern', 'circle')}
                    className={`p-2 rounded flex flex-col items-center gap-1 border ${config.globalPattern === 'circle' ? 'bg-indigo-100 border-indigo-300 text-indigo-800' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                   >
                     <Circle className="w-4 h-4" />
                     <span className="text-[10px]">Circle</span>
                   </button>
                   <button 
                    onClick={() => handleUpdateSelected('globalPattern', 'oval')}
                    className={`p-2 rounded flex flex-col items-center gap-1 border ${config.globalPattern === 'oval' ? 'bg-indigo-100 border-indigo-300 text-indigo-800' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                   >
                     <div className="w-4 h-3 border-2 border-current rounded-full" />
                     <span className="text-[10px]">Oval</span>
                   </button>
                   <button 
                    onClick={() => handleUpdateSelected('globalPattern', 'line')}
                    className={`p-2 rounded flex flex-col items-center gap-1 border ${config.globalPattern === 'line' ? 'bg-indigo-100 border-indigo-300 text-indigo-800' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                   >
                     <Minus className="w-4 h-4" />
                     <span className="text-[10px]">Line</span>
                   </button>
                </div>

                <div className="space-y-3 pt-2 border-t border-indigo-200/50">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label>{config.globalPattern === 'line' ? 'Length' : 'Width (Rx)'}</label>
                      <span className="text-slate-400">{config.globalOrbitRx}px</span>
                    </div>
                    <input 
                      type="range" min="0" max="150"
                      value={config.globalOrbitRx || 0}
                      onChange={(e) => handleUpdateSelected('globalOrbitRx', e.target.value)}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {config.globalPattern === 'oval' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label>Height (Ry)</label>
                        <span className="text-slate-400">{config.globalOrbitRy}px</span>
                      </div>
                      <input 
                        type="range" min="0" max="150"
                        value={config.globalOrbitRy || 0}
                        onChange={(e) => handleUpdateSelected('globalOrbitRy', e.target.value)}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  )}

                  {config.globalPattern !== 'circle' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label>Rotation</label>
                        <span className="text-slate-400">{config.globalOrbitRotation}°</span>
                      </div>
                      <input 
                        type="range" min="0" max="360"
                        value={config.globalOrbitRotation || 0}
                        onChange={(e) => handleUpdateSelected('globalOrbitRotation', e.target.value)}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label>Speed (Loops)</label>
                      <span className="text-slate-400">{config.globalOrbitSpeed}x</span>
                    </div>
                    <input 
                      type="range" min="0" max="6" step="1"
                      value={config.globalOrbitSpeed || 1}
                      onChange={(e) => handleUpdateSelected('globalOrbitSpeed', e.target.value)}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Selected Circle Controls */}
          {selectedId && selectedId !== 'GLOBAL' && (
          <section className={`transition-opacity duration-200 ${selectedId ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
             <div className="flex items-center justify-between mb-4 border-b pb-2 border-slate-100">
                <div className="flex items-center gap-2 text-blue-700 font-bold">
                  <MousePointer2 className="w-4 h-4" />
                  <h2>Selected Circle</h2>
                </div>
                {selectedId && (
                  <button 
                    onClick={() => handleRemoveCircle(selectedId)}
                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Circle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
            </div>

            <div className="space-y-6">
               {/* Basic Radius (Hidden if animated) */}
               {!selectedCircle?.radiusAnim && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <label className="font-medium text-slate-700">Radius</label>
                    <span className="text-slate-400 font-mono text-xs">{selectedCircle?.r.toFixed(0)}px</span>
                  </div>
                  <input 
                    type="range" min="10" max="150"
                    value={selectedCircle?.r || 40}
                    onChange={(e) => handleUpdateSelected('r', e.target.value)}
                    className="w-full accent-blue-600"
                  />
                </div>
               )}

               {/* Radius Pulse Controls */}
               <div className={`p-3 rounded-lg border ${selectedCircle?.radiusAnim ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                       <Maximize2 className="w-3.5 h-3.5" />
                       <span>Radius Pulse</span>
                    </div>
                    <button 
                      onClick={toggleRadiusAnimation}
                      className={`text-xs px-2 py-1 rounded font-medium border ${selectedCircle?.radiusAnim ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                      {selectedCircle?.radiusAnim ? 'Active' : 'Off'}
                    </button>
                  </div>
                  
                  {selectedCircle?.radiusAnim && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                           <label>Range (Min - Max)</label>
                        </div>
                        <div className="flex gap-2">
                           <input 
                              type="number" className="w-full p-1 text-xs border rounded"
                              value={selectedCircle.minR}
                              onChange={(e) => handleUpdateSelected('minR', e.target.value)}
                           />
                           <input 
                              type="number" className="w-full p-1 text-xs border rounded"
                              value={selectedCircle.maxR}
                              onChange={(e) => handleUpdateSelected('maxR', e.target.value)}
                           />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                           <label>Pulse Speed</label>
                           <span>{selectedCircle.radiusSpeed}x</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.05"
                          value={selectedCircle.radiusSpeed}
                          onChange={(e) => handleUpdateSelected('radiusSpeed', e.target.value)}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>
                  )}
               </div>

              {/* Animation Pattern Controls */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Motion Path</span>
                  </div>
                  <button
                    onClick={toggleSelectedAnimation}
                    className={`text-xs px-2 py-1 rounded font-medium border ${selectedCircle?.isAnimated ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                  >
                    {selectedCircle?.isAnimated ? 'Active' : 'Frozen'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2">
                   <button 
                    onClick={() => handleUpdateSelected('pattern', 'circle')}
                    className={`p-2 rounded flex flex-col items-center gap-1 border ${selectedCircle?.pattern === 'circle' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                   >
                     <Circle className="w-4 h-4" />
                     <span className="text-[10px]">Circle</span>
                   </button>
                   <button 
                    onClick={() => handleUpdateSelected('pattern', 'oval')}
                    className={`p-2 rounded flex flex-col items-center gap-1 border ${selectedCircle?.pattern === 'oval' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                   >
                     <div className="w-4 h-3 border-2 border-current rounded-full" />
                     <span className="text-[10px]">Oval</span>
                   </button>
                   <button 
                    onClick={() => handleUpdateSelected('pattern', 'line')}
                    className={`p-2 rounded flex flex-col items-center gap-1 border ${selectedCircle?.pattern === 'line' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                   >
                     <Minus className="w-4 h-4" />
                     <span className="text-[10px]">Line</span>
                   </button>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  {/* Contextual Inputs based on Pattern */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label>{selectedCircle?.pattern === 'line' ? 'Length' : 'Width (Rx)'}</label>
                      <span className="text-slate-400">{selectedCircle?.orbitRx}px</span>
                    </div>
                    <input 
                      type="range" min="0" max="150"
                      value={selectedCircle?.orbitRx || 0}
                      onChange={(e) => handleUpdateSelected('orbitRx', e.target.value)}
                      disabled={!selectedCircle?.isAnimated}
                      className="w-full accent-blue-600 disabled:opacity-50"
                    />
                  </div>

                  {selectedCircle?.pattern === 'oval' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label>Height (Ry)</label>
                        <span className="text-slate-400">{selectedCircle?.orbitRy}px</span>
                      </div>
                      <input 
                        type="range" min="0" max="150"
                        value={selectedCircle?.orbitRy || 0}
                        onChange={(e) => handleUpdateSelected('orbitRy', e.target.value)}
                        disabled={!selectedCircle?.isAnimated}
                        className="w-full accent-blue-600 disabled:opacity-50"
                      />
                    </div>
                  )}

                  {selectedCircle?.pattern !== 'circle' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label>Rotation</label>
                        <span className="text-slate-400">{selectedCircle?.orbitRotation}°</span>
                      </div>
                      <input 
                        type="range" min="0" max="360"
                        value={selectedCircle?.orbitRotation || 0}
                        onChange={(e) => handleUpdateSelected('orbitRotation', e.target.value)}
                        disabled={!selectedCircle?.isAnimated}
                        className="w-full accent-blue-600 disabled:opacity-50"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label>Speed (Rotations/Loop)</label>
                      <span className="text-slate-400">{selectedCircle?.orbitSpeed}x</span>
                    </div>
                    <input 
                      type="range" min="0" max="6" step="1"
                      value={selectedCircle?.orbitSpeed || 1}
                      onChange={(e) => handleUpdateSelected('orbitSpeed', e.target.value)}
                      disabled={!selectedCircle?.isAnimated}
                      className="w-full accent-blue-600 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Global Parameters (Always visible if nothing else is selected, or pushed down) */}
          <section className="mt-8 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
              <Settings2 className="w-4 h-4" />
              <h2>Shape Settings</h2>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label>Blur (Softness)</label>
                  <span className="text-gray-500">{config.blur}px</span>
                </div>
                <input 
                  type="range" min="0" max="50" step="0.5"
                  value={config.blur}
                  onChange={(e) => setConfig({...config, blur: Number(e.target.value)})}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label>Edge Sharpness</label>
                  <span className="text-gray-500">{config.alphaContrast}</span>
                </div>
                <input 
                  type="range" min="10" max="100" step="1"
                  value={config.alphaContrast}
                  onChange={(e) => setConfig({...config, alphaContrast: Number(e.target.value)})}
                  className="w-full accent-blue-600"
                />
              </div>

               <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Fill Color</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={config.fillColor}
                      onChange={(e) => setConfig({...config, fillColor: e.target.value})}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs font-mono text-gray-600 uppercase">{config.fillColor}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Background</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={config.bgColor}
                      onChange={(e) => setConfig({...config, bgColor: e.target.value})}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs font-mono text-gray-600 uppercase">{config.bgColor}</span>
                  </div>
                </div>
              </div>

               <div className="pt-4 border-t border-dashed border-gray-200">
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <label className="text-sm font-medium text-slate-700">Loop Duration</label>
                     <span className="text-xs font-mono text-slate-400">{config.loopDuration}s</span>
                   </div>
                   <input 
                    type="range" min="2" max="20" step="1"
                    value={config.loopDuration}
                    onChange={(e) => setConfig({...config, loopDuration: Number(e.target.value)})}
                    className="w-full accent-slate-400"
                  />
                  <div className="flex justify-between text-sm pt-2">
                    <label className="font-medium text-slate-700">Playback Speed</label>
                    <span className="text-gray-500">{config.globalSpeed}x</span>
                  </div>
                  <input 
                    type="range" min="0" max="3" step="0.1"
                    value={config.globalSpeed}
                    onChange={(e) => setConfig({...config, globalSpeed: Number(e.target.value)})}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              {/* Export Option */}
               <div className="pt-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Export Format</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setConfig({...config, exportAnimated: false})}
                      className={`flex-1 py-1.5 text-xs rounded border ${!config.exportAnimated ? 'bg-slate-700 text-white border-slate-800' : 'bg-white text-slate-600 border-gray-200'}`}
                    >
                      Static Shape
                    </button>
                    <button 
                       onClick={() => setConfig({...config, exportAnimated: true})}
                      className={`flex-1 py-1.5 text-xs rounded border ${config.exportAnimated ? 'bg-slate-700 text-white border-slate-800' : 'bg-white text-slate-600 border-gray-200'}`}
                    >
                      Animated (SMIL)
                    </button>
                  </div>
              </div>
            </div>
          </section>

          <section>
             <button 
              onClick={handleAddCircle}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Circle
            </button>
          </section>

          <section className="mt-auto pt-4 border-t">
            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="showGuides"
                  checked={config.showGuides}
                  onChange={(e) => setConfig({...config, showGuides: e.target.checked})}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showGuides" className="text-sm text-gray-600 select-none cursor-pointer">Show Control Points</label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="constraint"
                  checked={config.constraintActive}
                  onChange={(e) => setConfig({...config, constraintActive: e.target.checked})}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="constraint" className="text-sm text-gray-600 select-none cursor-pointer">Strict Shape Integrity</label>
              </div>
            </div>
          </section>

        </aside>

        {/* Workspace */}
        <main 
          className="flex-1 relative bg-gray-100 overflow-hidden select-none flex"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Canvas Wrapper */}
          <div className="flex-1 relative m-4 shadow-2xl rounded-lg overflow-hidden border border-gray-200 bg-white">
            <svg
              ref={svgRef}
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
              preserveAspectRatio="xMidYMid slice"
              onPointerDown={handleCanvasDown}
              className={`w-full h-full ${dragState?.type === 'PAN' ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ backgroundColor: config.bgColor }}
            >
              <defs>
                <filter id="goo-effect">
                  <feGaussianBlur in="SourceGraphic" stdDeviation={config.blur} result="blur" />
                  <feColorMatrix 
                    in="blur" 
                    mode="matrix" 
                    values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${config.alphaContrast} ${config.alphaShift}`} 
                    result="goo" 
                  />
                  <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
                </filter>
              </defs>

              <g filter="url(#goo-effect)">
                {circles.map(c => {
                  const displayR = (config.animate && c.radiusAnim) ? c.currentR : c.r;
                  return (
                    <circle
                      key={c.id}
                      cx={c.x}
                      cy={c.y}
                      r={displayR}
                      fill={config.fillColor}
                    />
                  );
                })}
              </g>

              {config.showGuides && (
                <>
                  {/* 1. Static Path Visualization (Only visible when GLOBAL selected) */}
                  {selectedId === 'GLOBAL' && (
                    <g 
                        className="pointer-events-none"
                        transform={`translate(${centroid.x}, ${centroid.y}) rotate(${config.globalOrbitRotation})`}
                    >
                       {config.globalPattern === 'line' ? (
                         <line 
                           x1={-config.globalOrbitRx} y1={0} x2={config.globalOrbitRx} y2={0}
                           stroke="rgba(99, 102, 241, 0.4)" strokeWidth="2" strokeDasharray="4 4"
                         />
                      ) : (
                         <ellipse 
                           rx={config.globalOrbitRx} ry={config.globalPattern === 'circle' ? config.globalOrbitRx : config.globalOrbitRy}
                           fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="2" strokeDasharray="4 4"
                         />
                      )}
                    </g>
                  )}

                  {/* 2. Moving Marker (The Centroid Handle) */}
                  <g 
                    className="cursor-pointer group"
                    transform={`translate(${centroid.x + globalAnimOffset.x}, ${centroid.y + globalAnimOffset.y})`}
                    onClick={handleGlobalDown}
                  >
                     {/* The Crosshair Icon */}
                     <line 
                       x1="-10" y1="0" x2="10" y2="0" 
                       stroke={selectedId === 'GLOBAL' ? '#4f46e5' : 'rgba(0,0,0,0.4)'} 
                       strokeWidth="2" 
                       className="transition-colors group-hover:stroke-indigo-600"
                     />
                     <line 
                       x1="0" y1="-10" x2="0" y2="10" 
                       stroke={selectedId === 'GLOBAL' ? '#4f46e5' : 'rgba(0,0,0,0.4)'} 
                       strokeWidth="2" 
                       className="transition-colors group-hover:stroke-indigo-600"
                     />
                     <circle 
                       r="4" 
                       fill={selectedId === 'GLOBAL' ? '#4f46e5' : 'transparent'} 
                       stroke="none" 
                       className="transition-colors group-hover:fill-indigo-600"
                     />
                     {/* Invisible larger hit area */}
                     <circle r="15" fill="transparent" stroke="none" />
                  </g>

                  {/* Individual Circle Guides - Now tracking global offset */}
                  {circles.map(c => {
                    const isSelected = c.id === selectedId;
                    const displayR = (config.animate && c.radiusAnim) ? c.currentR : c.r;
                    
                    // We need to render guides relative to the anchor's CURRENT position (which includes global offset)
                    // The circle's 'anchorX' property is static. 
                    // But in the animation loop, we add globalOffsetX to targetX.
                    // To make guides follow, we must add globalAnimOffset to the transform.
                    const guideX = c.anchorX + globalAnimOffset.x;
                    const guideY = c.anchorY + globalAnimOffset.y;

                    return (
                    <g 
                        key={`ctrl-${c.id}`} 
                        className="cursor-move"
                        onPointerDown={(e) => handleCircleDown(e, c.id)}
                      >
                        {/* Visual guide for the Path */}
                        {isSelected && c.isAnimated && (
                          <g transform={`translate(${guideX}, ${guideY}) rotate(${c.orbitRotation})`}>
                              {c.pattern === 'line' ? (
                                <line 
                                  x1={-c.orbitRx} y1={0} x2={c.orbitRx} y2={0}
                                  stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" strokeDasharray="4 4"
                                  className="pointer-events-none"
                                />
                              ) : (
                                <ellipse 
                                  rx={c.orbitRx} ry={c.pattern === 'circle' ? c.orbitRx : c.orbitRy}
                                  fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" strokeDasharray="4 4"
                                  className="pointer-events-none"
                                />
                              )}
                          </g>
                        )}

                        {/* Anchor Center Point */}
                        {isSelected && c.isAnimated && (
                            <path 
                              d={`M ${guideX-4} ${guideY} L ${guideX+4} ${guideY} M ${guideX} ${guideY-4} L ${guideX} ${guideY+4}`}
                              stroke="rgba(0,0,0,0.3)"
                              strokeWidth="2"
                            />
                        )}

                        {/* The Actual Control Point (Follows circle actual pos) */}
                        <g transform={`translate(${c.x}, ${c.y})`}>
                          <circle 
                            r={displayR} 
                            fill="none" 
                            stroke={isSelected ? '#2563eb' : 'rgba(0,0,0,0.1)'} 
                            strokeWidth={isSelected ? 2 : 1}
                            strokeDasharray={isSelected ? "none" : "4 4"}
                            className="pointer-events-none"
                          />
                          <circle 
                            r={isSelected ? 8 : 6} 
                            fill={isSelected ? '#2563eb' : 'white'}
                            stroke="rgba(0,0,0,0.2)"
                            strokeWidth="2"
                            className="transition-transform hover:scale-125"
                          />
                        </g>
                    </g>
                  )})}
                </>
              )}
            </svg>
            
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-mono text-gray-500 pointer-events-none border border-gray-200">
               {circles.length} Nodes • View: {viewBox.x.toFixed(0)},{viewBox.y.toFixed(0)}
            </div>
            
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 pointer-events-none border border-gray-200 flex items-center gap-2">
               <Hand className="w-3 h-3" />
               Drag background to pan
            </div>
          </div>

          {/* Live Code View Overlay */}
          {showSource && (
            <div className="w-96 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col transition-all z-20">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center text-slate-100">
                <h3 className="font-mono text-sm font-semibold text-blue-400">SVG Source</h3>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {config.exportAnimated ? 'Pure SVG Animation (SMIL)' : 'Static SVG'}
                </span>
              </div>
              <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all leading-relaxed select-text">
                  {getSVGString()}
                </pre>
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-800/50">
                 <p className="text-[10px] text-slate-500 text-center">
                   Copy code to use in your project.
                 </p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}