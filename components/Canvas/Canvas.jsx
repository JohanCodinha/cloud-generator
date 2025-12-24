import React from 'react';
import { Hand } from 'lucide-react';
import { useCloud } from '../../context/CloudContext';
import { GooFilter } from './GooFilter';
import { CircleGuides } from './CircleGuides';
import { GlobalCentroidHandle } from './GlobalCentroidHandle';

export const Canvas = () => {
  const {
    circles,
    config,
    viewBox,
    svgRef,
    dragState,
    handleCanvasDown,
    handlePointerMove,
    handlePointerUp
  } = useCloud();

  return (
    <div
      className="flex-1 relative m-4 shadow-2xl rounded-lg overflow-hidden border border-gray-200 bg-white"
    >
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid slice"
        onPointerDown={handleCanvasDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`w-full h-full ${dragState?.type === 'PAN' ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ backgroundColor: config.bgColor }}
      >
        <GooFilter />

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
            <GlobalCentroidHandle />
            <CircleGuides />
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
  );
};
