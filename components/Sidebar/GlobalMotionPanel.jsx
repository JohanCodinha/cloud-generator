import React from 'react';
import { Crosshair, X, Circle, Minus } from 'lucide-react';
import { useCloud } from '../../context/CloudContext';

export const GlobalMotionPanel = () => {
  const { selectedId, setSelectedId, config, handleUpdateSelected } = useCloud();

  if (selectedId !== 'GLOBAL') return null;

  return (
    <section className="animate-in slide-in-from-left-4 duration-200">
      <div className="flex items-center justify-between mb-4 border-b pb-2 border-indigo-100">
        <div className="flex items-center gap-2 text-indigo-700 font-bold">
          <Crosshair className="w-4 h-4" />
          <h2>Global Group Motion</h2>
        </div>
        <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
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
  );
};
