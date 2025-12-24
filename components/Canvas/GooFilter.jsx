import React from 'react';
import { useCloud } from '../../context/CloudContext';

export const GooFilter = () => {
  const { config } = useCloud();

  return (
    <defs>
      <filter id="goo-effect">
        <feGaussianBlur in="SourceGraphic" stdDeviation={config.blur} result="blur" />
        <feColorMatrix
          in="blur"
          mode="matrix"
          values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${config.alphaContrast} ${config.alphaShift}`}
          result="goo"
        />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  );
};
