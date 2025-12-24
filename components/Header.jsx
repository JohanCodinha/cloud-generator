import React from 'react';
import { Play, Pause, Copy, Code, X, Move } from 'lucide-react';
import { useCloud } from '../context/CloudContext';
import { copyToClipboard } from '../utils/svgExport';

export const Header = () => {
  const {
    config,
    setConfig,
    showSource,
    setShowSource,
    circles,
    lockedExportBox
  } = useCloud();

  const handleCopy = () => {
    copyToClipboard(circles, config, lockedExportBox);
  };

  return (
    <header className="flex-none bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Move className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Liquid Shape Generator</h1>
          <p className="text-xs text-gray-500">Create organic clouds, drops, and blobs</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setConfig(prev => ({ ...prev, animate: !prev.animate }))}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${config.animate ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {config.animate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {config.animate ? 'Pause Editor' : 'Play Editor'}
        </button>

        <button
          onClick={() => setShowSource(!showSource)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showSource ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {showSource ? <X className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          {showSource ? 'Close Source' : 'View Source'}
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors shadow-sm active:scale-95"
        >
          <Copy className="w-4 h-4" />
          Copy SVG
        </button>
      </div>
    </header>
  );
};
