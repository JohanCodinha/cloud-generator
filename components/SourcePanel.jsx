import React from 'react';
import { useCloud } from '../context/CloudContext';
import { getSVGString } from '../utils/svgExport';

export const SourcePanel = () => {
  const { showSource, circles, config, lockedExportBox } = useCloud();

  if (!showSource) return null;

  return (
    <div className="w-96 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col transition-all z-20">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center text-slate-100">
        <h3 className="font-mono text-sm font-semibold text-blue-400">SVG Source</h3>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          {config.exportAnimated ? 'Pure SVG Animation (SMIL)' : 'Static SVG'}
        </span>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all leading-relaxed select-text">
          {getSVGString(circles, config, lockedExportBox)}
        </pre>
      </div>
      <div className="p-4 border-t border-slate-800 bg-slate-800/50">
        <p className="text-[10px] text-slate-500 text-center">
          Copy code to use in your project.
        </p>
      </div>
    </div>
  );
};
