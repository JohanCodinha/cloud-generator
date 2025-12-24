import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { DEFAULT_CONFIG, INITIAL_CIRCLES, generateId } from '../utils/constants';
import { getBoundingBox, getCentroid } from '../utils/geometry';
import { useAnimation } from '../hooks/useAnimation';
import { useSvgDrag } from '../hooks/useSvgDrag';

const CloudContext = createContext(null);

export const useCloud = () => {
  const context = useContext(CloudContext);
  if (!context) {
    throw new Error('useCloud must be used within a CloudProvider');
  }
  return context;
};

export const CloudProvider = ({ children }) => {
  const [circles, setCircles] = useState(INITIAL_CIRCLES);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [selectedId, setSelectedId] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 600 });
  const [lockedExportBox, setLockedExportBox] = useState(null);
  const [showSource, setShowSource] = useState(false);
  const [globalAnimOffset, setGlobalAnimOffset] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);

  // Animation hook
  const { timeRef } = useAnimation(config, setCircles, setGlobalAnimOffset);

  // Drag handling hook
  const dragHandlers = useSvgDrag(
    circles,
    setCircles,
    viewBox,
    setViewBox,
    selectedId,
    setSelectedId,
    svgRef,
    config.constraintActive
  );

  // Handle Animation Toggle - lock export box
  useEffect(() => {
    if (config.animate) {
      setLockedExportBox(getBoundingBox(circles, config, 1.2));
    } else {
      setLockedExportBox(null);
    }
  }, [config.animate]);

  // Get centroid
  const centroid = getCentroid(circles);

  // Get selected circle
  const selectedCircle = circles.find(c => c.id === selectedId);

  // Circle management functions
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
      const numValue = key === 'globalPattern' ? value : Number(value);
      const updates = { [key]: numValue };
      if (key === 'globalPattern') {
        if (value === 'circle') updates.globalOrbitRy = config.globalOrbitRx;
        if (value === 'line') updates.globalOrbitRy = 0;
        if (value === 'oval' && config.globalOrbitRy === 0) updates.globalOrbitRy = Math.max(config.globalOrbitRx * 0.6, 10);
      }
      setConfig(prev => ({ ...prev, ...updates }));
    } else {
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

  const value = {
    // State
    circles,
    setCircles,
    config,
    setConfig,
    selectedId,
    setSelectedId,
    viewBox,
    setViewBox,
    lockedExportBox,
    showSource,
    setShowSource,
    globalAnimOffset,
    svgRef,
    centroid,
    selectedCircle,

    // Handlers
    handleAddCircle,
    handleRemoveCircle,
    handleUpdateSelected,
    toggleSelectedAnimation,
    toggleRadiusAnimation,
    ...dragHandlers
  };

  return (
    <CloudContext.Provider value={value}>
      {children}
    </CloudContext.Provider>
  );
};
