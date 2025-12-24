import React from 'react';
import { CloudProvider } from './context/CloudContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Canvas } from './components/Canvas/Canvas';
import { SourcePanel } from './components/SourcePanel';

const CloudGeneratorContent = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 relative bg-gray-100 overflow-hidden select-none flex">
          <Canvas />
          <SourcePanel />
        </main>
      </div>
    </div>
  );
};

export default function CloudGenerator() {
  return (
    <CloudProvider>
      <CloudGeneratorContent />
    </CloudProvider>
  );
}
