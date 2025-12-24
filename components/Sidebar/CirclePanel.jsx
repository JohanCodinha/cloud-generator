import React from 'react';
import { MousePointer2, Trash2, Maximize2, Activity, Circle, Minus } from 'lucide-react';
import { useCloud } from '../../context/CloudContext';

export const CirclePanel = () => {
  const {
    selectedId,
    selectedCircle,
    handleRemoveCircle,
    handleUpdateSelected,
    toggleSelectedAnimation,
    toggleRadiusAnimation
  } = useCloud();

  if (!selectedId || selectedId === 'GLOBAL') return null;

  return (
    <section className="transition-opacity duration-200 opacity-100">
      <div className="flex items-center justify-between mb-4 border-b pb-2 border-slate-100">
        <div className="flex items-center gap-2 text-blue-700 font-bold">
          <MousePointer2 className="w-4 h-4" />
          <h2>Selected Circle</h2>
        </div>
        <button
          onClick={() => handleRemoveCircle(selectedId)}
          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors"
          title="Delete Circle"
        >
          <Trash2 className="w-4 h-4" />
        </button>
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
  );
};
