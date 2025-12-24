import React from 'react';
import { useCloud } from '../../context/CloudContext';

export const CanvasOptionsPanel = () => {
  const { config, setConfig } = useCloud();

  return (
    <section className="mt-auto pt-4 border-t">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showGuides"
            checked={config.showGuides}
            onChange={(e) => setConfig({ ...config, showGuides: e.target.checked })}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="showGuides" className="text-sm text-gray-600 select-none cursor-pointer">
            Show Control Points
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="constraint"
            checked={config.constraintActive}
            onChange={(e) => setConfig({ ...config, constraintActive: e.target.checked })}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="constraint" className="text-sm text-gray-600 select-none cursor-pointer">
            Strict Shape Integrity
          </label>
        </div>
      </div>
    </section>
  );
};
