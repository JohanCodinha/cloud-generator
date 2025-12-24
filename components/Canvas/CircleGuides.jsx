import React from 'react';
import { useCloud } from '../../context/CloudContext';

export const CircleGuides = () => {
  const { circles, selectedId, config, globalAnimOffset, handleCircleDown } = useCloud();

  return (
    <>
      {circles.map(c => {
        const isSelected = c.id === selectedId;
        const displayR = (config.animate && c.radiusAnim) ? c.currentR : c.r;

        // Guides relative to the anchor's CURRENT position (which includes global offset)
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
                d={`M ${guideX - 4} ${guideY} L ${guideX + 4} ${guideY} M ${guideX} ${guideY - 4} L ${guideX} ${guideY + 4}`}
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
        );
      })}
    </>
  );
};
