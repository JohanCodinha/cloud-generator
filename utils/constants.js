// Utility for unique IDs
export const generateId = () => Math.random().toString(36).substr(2, 9);

// Default configuration
export const DEFAULT_CONFIG = {
  blur: 15,
  alphaContrast: 20,
  alphaShift: -5,
  fillColor: '#3b82f6', // blue-500
  bgColor: '#ffffff',
  animate: false,
  globalSpeed: 1,
  showGuides: true,
  constraintActive: true,
  exportAnimated: true,
  loopDuration: 12,

  // Global Motion Settings
  globalPattern: 'circle',
  globalOrbitRx: 0,
  globalOrbitRy: 0,
  globalOrbitRotation: 0,
  globalOrbitSpeed: 1,
};

// Initial state
export const INITIAL_CIRCLES = [
  { id: '1', x: 200, y: 200, r: 60, anchorX: 200, anchorY: 200, pattern: 'circle', orbitRx: 10, orbitRy: 10, orbitRotation: 0, orbitSpeed: 1, phase: 0, isAnimated: true, radiusAnim: false, minR: 50, maxR: 70, radiusSpeed: 0.5, radiusPhase: 0 },
  { id: '2', x: 280, y: 200, r: 50, anchorX: 280, anchorY: 200, pattern: 'line', orbitRx: 20, orbitRy: 0, orbitRotation: 45, orbitSpeed: 2, phase: 2, isAnimated: true, radiusAnim: true, minR: 40, maxR: 60, radiusSpeed: 0.8, radiusPhase: 1 },
  { id: '3', x: 240, y: 150, r: 45, anchorX: 240, anchorY: 150, pattern: 'oval', orbitRx: 15, orbitRy: 8, orbitRotation: 90, orbitSpeed: 1, phase: 4, isAnimated: true, radiusAnim: false, minR: 35, maxR: 55, radiusSpeed: 0.5, radiusPhase: 0 },
];
