import React from 'react';
import { useCloud } from '../../context/CloudContext';

export const GlobalCentroidHandle = () => {
  const { centroid, globalAnimOffset, selectedId, handleGlobalDown, config } = useCloud();

  return (
    <>
      {/* Static Path Visualization (Only visible when GLOBAL selected) */}
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
              rx={config.globalOrbitRx}
              ry={config.globalPattern === 'circle' ? config.globalOrbitRx : config.globalOrbitRy}
              fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="2" strokeDasharray="4 4"
            />
          )}
        </g>
      )}

      {/* Moving Marker (The Centroid Handle) */}
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
    </>
  );
};
