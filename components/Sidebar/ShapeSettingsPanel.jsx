import React from 'react';
import { Settings2, FileCode } from 'lucide-react';
import { useCloud } from '../../context/CloudContext';

export const ShapeSettingsPanel = () => {
  const { config, setConfig } = useCloud();

  return (
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
            onChange={(e) => setConfig({ ...config, blur: Number(e.target.value) })}
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
            onChange={(e) => setConfig({ ...config, alphaContrast: Number(e.target.value) })}
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
                onChange={(e) => setConfig({ ...config, fillColor: e.target.value })}
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
                onChange={(e) => setConfig({ ...config, bgColor: e.target.value })}
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
              onChange={(e) => setConfig({ ...config, loopDuration: Number(e.target.value) })}
              className="w-full accent-slate-400"
            />
            <div className="flex justify-between text-sm pt-2">
              <label className="font-medium text-slate-700">Playback Speed</label>
              <span className="text-gray-500">{config.globalSpeed}x</span>
            </div>
            <input
              type="range" min="0" max="3" step="0.1"
              value={config.globalSpeed}
              onChange={(e) => setConfig({ ...config, globalSpeed: Number(e.target.value) })}
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
              onClick={() => setConfig({ ...config, exportAnimated: false })}
              className={`flex-1 py-1.5 text-xs rounded border ${!config.exportAnimated ? 'bg-slate-700 text-white border-slate-800' : 'bg-white text-slate-600 border-gray-200'}`}
            >
              Static Shape
            </button>
            <button
              onClick={() => setConfig({ ...config, exportAnimated: true })}
              className={`flex-1 py-1.5 text-xs rounded border ${config.exportAnimated ? 'bg-slate-700 text-white border-slate-800' : 'bg-white text-slate-600 border-gray-200'}`}
            >
              Animated (SMIL)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
