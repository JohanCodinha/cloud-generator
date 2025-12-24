import React from 'react';
import { Plus } from 'lucide-react';
import { useCloud } from '../../context/CloudContext';
import { GlobalMotionPanel } from './GlobalMotionPanel';
import { CirclePanel } from './CirclePanel';
import { ShapeSettingsPanel } from './ShapeSettingsPanel';
import { CanvasOptionsPanel } from './CanvasOptionsPanel';

export const Sidebar = () => {
  const { handleAddCircle } = useCloud();

  return (
    <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-6 flex flex-col gap-8 shadow-inner z-10 shrink-0">
      <GlobalMotionPanel />
      <CirclePanel />
      <ShapeSettingsPanel />

      <section>
        <button
          onClick={handleAddCircle}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Circle
        </button>
      </section>

      <CanvasOptionsPanel />
    </aside>
  );
};
