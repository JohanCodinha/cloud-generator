import { useState, useCallback } from 'react';
import { constrainPosition } from '../utils/geometry';

/**
 * Hook to manage SVG drag interactions (circles and panning)
 */
export const useSvgDrag = (
  circles,
  setCircles,
  viewBox,
  setViewBox,
  selectedId,
  setSelectedId,
  svgRef,
  constraintActive
) => {
  const [dragState, setDragState] = useState(null);

  const handleCircleDown = useCallback((e, id) => {
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
  }, [circles, setSelectedId, svgRef]);

  const handleGlobalDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId('GLOBAL');
  }, [setSelectedId]);

  const handleCanvasDown = useCallback((e) => {
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
  }, [viewBox, selectedId, setSelectedId]);

  const handlePointerMove = useCallback((e) => {
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
          // Current offset from anchor (due to animation)
          const animOffsetX = c.x - c.anchorX;
          const animOffsetY = c.y - c.anchorY;

          const intendedX = targetAnchorX + animOffsetX;
          const intendedY = targetAnchorY + animOffsetY;

          // Apply constraint
          const constrained = constrainPosition(intendedX, intendedY, c, prev, constraintActive);

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
  }, [dragState, setCircles, setViewBox, svgRef, constraintActive]);

  const handlePointerUp = useCallback(() => {
    setDragState(null);
  }, []);

  return {
    dragState,
    handleCircleDown,
    handleGlobalDown,
    handleCanvasDown,
    handlePointerMove,
    handlePointerUp
  };
};
