import { useEffect, useState } from 'react';
import { X, Navigation, Compass, MapPin } from 'lucide-react';

interface WayfindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string; // e.g. "Room 102", "Lab Room", "Billing Desk", "Pharmacy"
}

// 10x10 Floor Grid definition
// 0: Hallway/Walkable, 1: Wall/Structure, 2: Lobby, 3: Destination
const GRID_SIZE = 10;

// Grid layout coordinate types:
// Doctor Cabin A (Room 101/102): top-left
// Doctor Cabin B (Room 104/106): top-right
// Lab: middle-right
// Billing: bottom-left
// Pharmacy: bottom-right
// Lobby: bottom-center
const STATIC_GRID = [
  [1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 0, 2, 2, 0, 1, 1, 1],
  [1, 1, 1, 0, 2, 2, 0, 1, 1, 1],
];

interface Point {
  r: number;
  c: number;
}

// Predefined paths from lobby (9, 4) to destinations
const DESTINATION_PATHS: Record<string, Point[]> = {
  'Room 101': [
    { r: 9, c: 4 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 6, c: 3 }, { r: 3, c: 3 }, { r: 3, c: 1 }, { r: 1, c: 1 }
  ],
  'Room 102': [
    { r: 9, c: 4 }, { r: 8, c: 4 }, { r: 6, c: 4 }, { r: 3, c: 3 }, { r: 1, c: 3 }
  ],
  'Room 104': [
    { r: 9, c: 4 }, { r: 8, c: 4 }, { r: 8, c: 6 }, { r: 6, c: 6 }, { r: 3, c: 6 }, { r: 1, c: 5 }
  ],
  'Room 106': [
    { r: 9, c: 4 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 6, c: 3 }, { r: 3, c: 3 }, { r: 3, c: 1 }
  ],
  'Lab Room': [
    { r: 9, c: 4 }, { r: 8, c: 4 }, { r: 8, c: 6 }, { r: 6, c: 6 }, { r: 6, c: 8 }, { r: 4, c: 8 }
  ],
  'Billing Desk': [
    { r: 9, c: 4 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 7, c: 3 }, { r: 7, c: 1 }
  ],
  'Pharmacy': [
    { r: 9, c: 4 }, { r: 8, c: 4 }, { r: 8, c: 6 }, { r: 7, c: 6 }, { r: 7, c: 8 }
  ],
};

const DESTINATION_NAMES: Record<string, string> = {
  'Room 101': 'Room 101 (Dr. Sharma)',
  'Room 102': 'Room 102 (Dr. Sarah)',
  'Room 104': 'Room 104 (Dr. Rahul)',
  'Room 106': 'Room 106 (Dr. Anil)',
  'Lab Room': 'Diagnostics & Lab Room',
  'Billing Desk': 'Billing & Finance Counter',
  'Pharmacy': 'Pharmacy & Dispensary',
};

const DESTINATION_LABELS: Record<string, string> = {
  'Room 101': 'R101',
  'Room 102': 'R102',
  'Room 104': 'R104',
  'Room 106': 'R106',
  'Lab Room': 'LAB',
  'Billing Desk': 'BILLING',
  'Pharmacy': 'PHARMACY',
};

export const WayfindingModal = ({ isOpen, onClose, destination }: WayfindingModalProps) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setActiveStep(0);
    // Auto-advance step guides for micro-animation effect
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < 2 ? prev + 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const path = DESTINATION_PATHS[destination] || DESTINATION_PATHS['Room 102'];
  const targetName = DESTINATION_NAMES[destination] || destination;
  const targetLabel = DESTINATION_LABELS[destination] || 'DEST';

  // Construct SVG path string from coordinates
  const svgPathString = path
    .map((p, idx) => {
      // Cell center coordinates in percentage for responsiveness
      const x = (p.c * 10) + 5;
      const y = (p.r * 10) + 5;
      return `${idx === 0 ? 'M' : 'L'} ${x}% ${y}%`;
    })
    .join(' ');

  // Get text guide instructions based on destination
  const getInstructions = () => {
    switch (destination) {
      case 'Room 102':
        return [
          'Exit the waiting lobby and head straight down the primary hallway.',
          'Walk past Cabin A on your left.',
          'Arrive at Room 102 (Dr. Sarah’s Cardiology consultation cabin).'
        ];
      case 'Lab Room':
        return [
          'Exit the lobby and take the right corridor corridor.',
          'Continue straight until you reach the diagnostic imaging section.',
          'Enter the Lab Room on your right for your tests.'
        ];
      case 'Billing Desk':
        return [
          'Turn left directly outside the waiting lobby doors.',
          'Follow the corridor to the main reception block.',
          'The Billing and Claims desk will be on your immediate left.'
        ];
      case 'Pharmacy':
        return [
          'Turn right when leaving the main lobby area.',
          'Walk straight to the end of the east corridor.',
          'The Pharmacy counter is at the right corner.'
        ];
      default:
        return [
          'Exit the waiting lobby doors.',
          'Follow the highlighted path indicators on your dashboard map.',
          `Arrive at your destination: ${targetName}.`
        ];
    }
  };

  const steps = getInstructions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card w-full max-w-4xl overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl flex flex-col md:flex-row animate-fade-in-up duration-300">
        
        {/* Left Side: Map Visualizer */}
        <div className="flex-1 p-6 bg-slate-900/50 border-r border-white/[0.04] flex flex-col items-center justify-center min-h-[350px] md:min-h-[450px]">
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Live Indoor Wayfinder</span>
            </div>
            <span className="text-[10px] bg-sky-500/10 border border-sky-500/20 text-sky-400 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
              Lobby → {targetLabel}
            </span>
          </div>

          {/* Grid Container */}
          <div className="relative w-[320px] h-[320px] sm:w-[360px] sm:h-[360px] bg-slate-950 border border-white/[0.08] rounded-xl overflow-hidden p-1 shadow-inner">
            
            {/* Grid Cells */}
            <div className="grid grid-cols-10 grid-rows-10 w-full h-full gap-0.5">
              {Array.from({ length: GRID_SIZE }).map((_, r) =>
                Array.from({ length: GRID_SIZE }).map((_, c) => {
                  const val = STATIC_GRID[r][c];
                  const isPath = path.some((pt) => pt.r === r && pt.c === c);
                  const isStart = path[0].r === r && path[0].c === c;
                  const isEnd = path[path.length - 1].r === r && path[path.length - 1].c === c;

                  let cellClass = 'bg-slate-900/40';
                  let cellContent = null;

                  if (val === 1) {
                    // Obstacle/Wall
                    cellClass = 'bg-slate-800/20 border border-slate-700/10';
                  } else if (isStart) {
                    // Lobby Start
                    cellClass = 'bg-indigo-600/30 border border-indigo-400/40 relative flex items-center justify-center';
                    cellContent = (
                      <span className="text-[8px] font-black text-indigo-300 tracking-tighter uppercase scale-90">LOBBY</span>
                    );
                  } else if (isEnd) {
                    // Destination Target
                    cellClass = 'bg-rose-500/30 border border-rose-400/40 relative flex items-center justify-center animate-pulse';
                    cellContent = (
                      <span className="text-[8px] font-black text-rose-300 tracking-tighter uppercase scale-90">{targetLabel}</span>
                    );
                  } else if (isPath) {
                    // Highlight path nodes under SVG line
                    cellClass = 'bg-sky-500/5';
                  }

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`rounded-sm transition-all duration-300 ${cellClass}`}
                    >
                      {cellContent}
                    </div>
                  );
                })
              )}
            </div>

            {/* SVG Glowing Path overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none p-1">
              {/* Path glow backdrop */}
              <path
                d={svgPathString}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-20"
              />
              {/* Animated dotted guide line */}
              <path
                d={svgPathString}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8,8"
                className="animate-wayfinding-flow"
              />
            </svg>

            {/* Start Pin Pulse */}
            <div
              className="absolute pointer-events-none w-3 h-3 bg-indigo-500 rounded-full border border-white shadow-lg shadow-indigo-500/50"
              style={{
                left: `calc(${(path[0].c * 10) + 5}% - 6px)`,
                top: `calc(${(path[0].r * 10) + 5}% - 6px)`,
              }}
            />

            {/* End Pin Pulse */}
            <div
              className="absolute pointer-events-none w-4.5 h-4.5 bg-rose-500 rounded-full border-2 border-white shadow-lg shadow-rose-500/50 animate-bounce flex items-center justify-center"
              style={{
                left: `calc(${(path[path.length - 1].c * 10) + 5}% - 9px)`,
                top: `calc(${(path[path.length - 1].r * 10) + 5}% - 9px)`,
              }}
            >
              <MapPin className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </div>

        {/* Right Side: Step-by-Step Directions */}
        <div className="w-full md:w-[350px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white tracking-tight">Indoor Directions</h3>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-widest">Destination</span>
              <h2 className="text-xl font-black text-white leading-tight">{targetName}</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Starting point: Waiting Lobby Desk</p>
            </div>

            {/* Direction steps */}
            <div className="mt-8 space-y-6">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-4 transition-all duration-300 ${
                      isActive ? 'opacity-100 translate-x-1' : 'opacity-40'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border transition-all ${
                        isActive
                          ? 'bg-sky-500/10 border-sky-400/30 text-sky-400 shadow-md shadow-sky-500/10 scale-105'
                          : 'bg-slate-900/40 border-white/[0.04] text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <p className={`text-xs font-bold leading-relaxed ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.04] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Navigation status</p>
              <p className="text-xs font-extrabold text-emerald-400">Route map compiled successfully</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
