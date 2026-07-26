import { useMemo } from 'react';
import { AREA_CONFIG, type AreaType, type Anchor, type Cell, type RoomBlock } from '../../utils/mapModel';
import { MapPin, DoorOpen, Bed, HeartPulse, Stethoscope, Pill, Activity, Syringe, Building2 } from 'lucide-react';

export interface Marker {
  cell: Cell;
  label?: string;
  kind?: 'you' | 'destination' | 'patient' | 'staff';
  pulse?: boolean;
}

export interface FreehandStroke {
  id: string;
  points: { x: number; y: number }[];
  color?: string;
  width?: number;
}

interface MapCanvasProps {
  cells: AreaType[][];
  anchors?: Anchor[];
  roomBlocks?: RoomBlock[];
  selectedRoomId?: string | null;
  onSelectRoom?: (id: string) => void;
  path?: Cell[];              // highlighted route
  markers?: Marker[];         // live pins (you-are-here, destination, patients)
  heat?: Record<string, number>; // "r,c" -> intensity 0..1 for heatmap overlay
  editing?: boolean;
  onCellClick?: (r: number, c: number) => void;
  onCellPaint?: (r: number, c: number) => void; // fired on mouse drag while editing
  onCellHover?: (r: number, c: number) => void;
  selectionRect?: { r1: number; c1: number; r2: number; c2: number } | null;
  freeformBox?: { x1: number; y1: number; x2: number; y2: number } | null;
  freehandStrokes?: FreehandStroke[];
  activeStroke?: { x: number; y: number }[] | null;
  wallPreview?: { r1: number; c1: number; r2: number; c2: number } | null;
  showAnchorLabels?: boolean;
  className?: string;
}

const markerColor: Record<NonNullable<Marker['kind']>, string> = {
  you: '#38bdf8',
  destination: '#f43f5e',
  patient: '#10b981',
  staff: '#a855f7',
};

const getRoomIcon = (type: AreaType) => {
  switch (type) {
    case 'ward-a': case 'ward-b': case 'icu': return Bed;
    case 'emergency': return HeartPulse;
    case 'ot': return Stethoscope;
    case 'pharmacy': return Syringe;
    case 'lab': case 'radiology': return Activity;
    default: return Building2;
  }
};

export const MapCanvas = ({
  cells,
  anchors = [],
  roomBlocks = [],
  selectedRoomId,
  onSelectRoom,
  path = [],
  markers = [],
  heat,
  editing = false,
  onCellClick,
  onCellPaint,
  onCellHover,
  selectionRect,
  freeformBox,
  freehandStrokes = [],
  activeStroke = [],
  wallPreview,
  showAnchorLabels = true,
  className = '',
}: MapCanvasProps) => {
  const rows = cells.length;
  const cols = cells[0]?.length ?? 0;

  const pathSet = useMemo(() => new Set(path.map((p) => `${p.r},${p.c}`)), [path]);
  const anchorByCell = useMemo(() => {
    const m = new Map<string, Anchor>();
    anchors.forEach((a) => m.set(`${a.cell.r},${a.cell.c}`, a));
    return m;
  }, [anchors]);

  const inSelectionRect = (r: number, c: number) => {
    if (!selectionRect) return false;
    const minR = Math.min(selectionRect.r1, selectionRect.r2);
    const maxR = Math.max(selectionRect.r1, selectionRect.r2);
    const minC = Math.min(selectionRect.c1, selectionRect.c2);
    const maxC = Math.max(selectionRect.c1, selectionRect.c2);
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  };

  const svgPath = useMemo(() => {
    if (path.length < 2) return '';
    return path
      .map((p, i) => {
        const x = ((p.c + 0.5) / cols) * 100;
        const y = ((p.r + 0.5) / rows) * 100;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [path, cols, rows]);

  return (
    <div className={`relative aspect-square w-full ${className}`}>
      <div
        className="grid h-full w-full overflow-hidden rounded-xl border border-slate-700/50 dark:border-white/10 bg-slate-950 bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] dark:bg-[#020617] dark:bg-[radial-gradient(#475569_1.5px,transparent_1.5px)] [background-size:24px_24px] shadow-2xl"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
      >
        {cells.map((row, r) =>
          row.map((cell, c) => {
            const cfg = AREA_CONFIG[cell] ?? AREA_CONFIG.empty;
            const isEmpty = cell === 'empty';
            const onPath = pathSet.has(`${r},${c}`);
            const anchor = anchorByCell.get(`${r},${c}`);
            const heatVal = heat?.[`${r},${c}`] ?? 0;
            const isSelected = inSelectionRect(r, c);
            return (
              <div
                key={`${r}-${c}`}
                onMouseDown={(e) => {
                  if (editing) {
                    onCellClick?.(r, c);
                    if (e.buttons === 1) onCellPaint?.(r, c);
                  }
                }}
                onMouseEnter={(e) => {
                  if (editing) {
                    onCellHover?.(r, c);
                    if (e.buttons === 1) onCellPaint?.(r, c);
                  }
                }}
                className={`relative flex items-center justify-center transition-all select-none ${
                  editing ? 'cursor-crosshair hover:bg-cyan-500/20' : ''
                } ${
                  isEmpty
                    ? 'border-none bg-transparent'
                    : 'border border-slate-700/60 dark:border-white/10'
                } ${
                  isSelected ? 'ring-2 ring-cyan-400 bg-cyan-500/30 border-cyan-400 z-10' : ''
                }`}
                style={!isEmpty && !isSelected ? { backgroundColor: `${cfg.color}35` } : undefined}
              >
                {heatVal > 0 && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundColor: `rgba(239,68,68,${Math.min(heatVal, 1) * 0.55})` }}
                  />
                )}
                {onPath && <div className="pointer-events-none absolute inset-0 bg-blue-500/30 dark:bg-sky-400/30" />}
                {anchor?.kind === 'entrance' && (
                  <DoorOpen className="pointer-events-none h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300 font-bold" />
                )}
                {!isEmpty && cfg.short && !anchor && (
                  <span className="pointer-events-none select-none text-[6px] font-black uppercase tracking-tighter text-slate-700 dark:text-white/40">
                    {cfg.short}
                  </span>
                )}
                {showAnchorLabels && anchor && anchor.kind !== 'entrance' && (
                  <span className="pointer-events-none absolute -top-0.5 left-0 right-0 truncate px-0.5 text-center text-[6px] font-extrabold text-slate-900 dark:text-white">
                    {anchor.label}
                  </span>
                )}
              </div>
            );
          }),
        )}
      </div>

      {/* Vector Architectural Room Blocks Layer */}
      {roomBlocks.map((rb) => {
        const isSelected = selectedRoomId === rb.id;
        const cfg = AREA_CONFIG[rb.type] ?? AREA_CONFIG.empty;
        const RoomIcon = getRoomIcon(rb.type);

        const leftPct = (rb.x / cols) * 100;
        const topPct = (rb.y / rows) * 100;
        const widthPct = (rb.w / cols) * 100;
        const heightPct = (rb.h / rows) * 100;

        return (
          <div
            key={rb.id}
            onClick={(e) => {
              if (editing) {
                e.stopPropagation();
                onSelectRoom?.(rb.id);
              }
            }}
            className={`absolute flex flex-col justify-between p-1.5 rounded-lg border-2 transition-all select-none shadow-md ${
              editing ? 'cursor-pointer hover:brightness-125' : ''
            } ${
              isSelected
                ? 'ring-4 ring-blue-500 border-blue-500 z-30 shadow-2xl scale-[1.01]'
                : 'border-slate-800/80 dark:border-slate-200/80 z-20'
            }`}
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
              backgroundColor: `${cfg.color}35`,
            }}
          >
            {/* Header & Dimension Badge */}
            <div className="flex items-center justify-between gap-1 overflow-hidden">
              <div className="flex items-center gap-1 min-w-0">
                <RoomIcon className="h-3 w-3 flex-shrink-0 text-slate-800 dark:text-white" />
                <span className="truncate text-[10px] font-black tracking-tight text-slate-900 dark:text-white uppercase drop-shadow-sm">
                  {rb.name}
                </span>
              </div>
              <span className="hidden sm:inline-block flex-shrink-0 rounded bg-slate-900/80 px-1 py-0.5 text-[8px] font-mono font-bold text-sky-300">
                {rb.w * 2}m × {rb.h * 2}m
              </span>
            </div>

            {/* Center Visual & Furniture Icon */}
            <div className="flex items-center justify-center opacity-40">
              <RoomIcon className="h-5 w-5 text-slate-900 dark:text-white" />
            </div>

            {/* Door Indicator Notch */}
            {rb.doorSide && (
              <div
                className={`absolute flex items-center justify-center bg-emerald-500 text-white rounded-full p-0.5 shadow-md ${
                  rb.doorSide === 'north' ? '-top-2 left-1/2 -translate-x-1/2' : ''
                } ${
                  rb.doorSide === 'south' ? '-bottom-2 left-1/2 -translate-x-1/2' : ''
                } ${
                  rb.doorSide === 'west' ? '-left-2 top-1/2 -translate-y-1/2' : ''
                } ${
                  rb.doorSide === 'east' ? '-right-2 top-1/2 -translate-y-1/2' : ''
                }`}
                title={`Doorway (${rb.doorSide})`}
              >
                <DoorOpen className="h-2.5 w-2.5" />
              </div>
            )}
          </div>
        );
      })}

      {/* Route line */}
      {svgPath && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={svgPath} fill="none" stroke="#0ea5e9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="opacity-25" />
          <path
            d={svgPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3,3"
            className="animate-wayfinding-flow"
          />
        </svg>
      )}

      {/* Drawable Wall Preview Line (with 90° Ortho Snap) */}
      {wallPreview && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full z-40" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line
            x1={((wallPreview.c1 + 0.5) / cols) * 100}
            y1={((wallPreview.r1 + 0.5) / rows) * 100}
            x2={((wallPreview.c2 + 0.5) / cols) * 100}
            y2={((wallPreview.r2 + 0.5) / rows) * 100}
            stroke="#06b6d4"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="animate-pulse drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
          />
          <line
            x1={((wallPreview.c1 + 0.5) / cols) * 100}
            y1={((wallPreview.r1 + 0.5) / rows) * 100}
            x2={((wallPreview.c2 + 0.5) / cols) * 100}
            y2={((wallPreview.r2 + 0.5) / rows) * 100}
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="2,2"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Wall Distance Tooltip Badge */}
      {wallPreview && (
        <div
          className="pointer-events-none absolute z-50 rounded-full bg-cyan-600/90 px-2 py-1 text-[9px] font-mono font-bold text-white shadow-xl backdrop-blur-sm border border-cyan-300 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(((wallPreview.c1 + wallPreview.c2) / 2 + 0.5) / cols) * 100}%`,
            top: `${(((wallPreview.r1 + wallPreview.r2) / 2 + 0.5) / rows) * 100}%`,
          }}
        >
          {(Math.hypot(wallPreview.r2 - wallPreview.r1, wallPreview.c2 - wallPreview.c1) * 2).toFixed(1)}m Wall · 90° Snap
        </div>
      )}

      {/* Interactive Box Drawing Vector Preview */}
      {freeformBox ? (
        <>
          <div
            className="pointer-events-none absolute z-40 rounded-xl border-2 border-cyan-400 bg-cyan-500/25 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse"
            style={{
              left: `${(Math.min(freeformBox.x1, freeformBox.x2) / cols) * 100}%`,
              top: `${(Math.min(freeformBox.y1, freeformBox.y2) / rows) * 100}%`,
              width: `${(Math.abs(freeformBox.x2 - freeformBox.x1) / cols) * 100}%`,
              height: `${(Math.abs(freeformBox.y2 - freeformBox.y1) / rows) * 100}%`,
            }}
          />
          <div
            className="pointer-events-none absolute z-50 rounded-full bg-cyan-600/90 px-3 py-1 text-[10px] font-mono font-bold text-white shadow-xl backdrop-blur-sm border border-cyan-300 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(((freeformBox.x1 + freeformBox.x2) / 2) / cols) * 100}%`,
              top: `${(((freeformBox.y1 + freeformBox.y2) / 2) / rows) * 100}%`,
            }}
          >
            {(Math.abs(freeformBox.x2 - freeformBox.x1) * 2).toFixed(1)}m × {(Math.abs(freeformBox.y2 - freeformBox.y1) * 2).toFixed(1)}m Room Box
          </div>
        </>
      ) : selectionRect ? (
        <>
          <div
            className="pointer-events-none absolute z-40 rounded-xl border-2 border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse"
            style={{
              left: `${(Math.min(selectionRect.c1, selectionRect.c2) / cols) * 100}%`,
              top: `${(Math.min(selectionRect.r1, selectionRect.r2) / rows) * 100}%`,
              width: `${((Math.abs(selectionRect.c2 - selectionRect.c1) + 1) / cols) * 100}%`,
              height: `${((Math.abs(selectionRect.r2 - selectionRect.r1) + 1) / rows) * 100}%`,
            }}
          />
          <div
            className="pointer-events-none absolute z-50 rounded-full bg-cyan-600/90 px-2.5 py-1 text-[10px] font-mono font-bold text-white shadow-xl backdrop-blur-sm border border-cyan-300 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(((selectionRect.c1 + selectionRect.c2) / 2 + 0.5) / cols) * 100}%`,
              top: `${(((selectionRect.r1 + selectionRect.r2) / 2 + 0.5) / rows) * 100}%`,
            }}
          >
            {(Math.abs(selectionRect.c2 - selectionRect.c1) + 1) * 2}m × {(Math.abs(selectionRect.r2 - selectionRect.r1) + 1) * 2}m Room Box
          </div>
        </>
      ) : null}

      {/* SVG Layer for Freehand Paint App Vector Strokes */}
      {(freehandStrokes.length > 0 || (activeStroke && activeStroke.length > 0)) && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full z-30" viewBox={`0 0 ${cols} ${rows}`} preserveAspectRatio="none">
          {freehandStrokes.map((s) => {
            if (!s.points || s.points.length < 2) return null;
            const d = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            return (
              <path
                key={s.id}
                d={d}
                fill="none"
                stroke={s.color || '#38bdf8'}
                strokeWidth={s.width || 0.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          {activeStroke && activeStroke.length >= 2 && (
            <path
              d={activeStroke.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth={0.45}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse drop-shadow-[0_0_8px_#06b6d4]"
            />
          )}
        </svg>
      )}

      {/* Live markers */}
      {markers.map((m, i) => {
        const color = markerColor[m.kind ?? 'you'];
        return (
          <div
            key={i}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${((m.cell.c + 0.5) / cols) * 100}%`, top: `${((m.cell.r + 0.5) / rows) * 100}%` }}
          >
            <div className="relative flex flex-col items-center">
              {m.pulse && (
                <span
                  className="absolute h-4 w-4 animate-ping rounded-full opacity-60"
                  style={{ backgroundColor: color }}
                />
              )}
              <MapPin className="h-3.5 w-3.5 drop-shadow" style={{ color }} fill={color} />
              {m.label && (
                <span
                  className="mt-0.5 whitespace-nowrap rounded px-1 text-[7px] font-bold text-white"
                  style={{ backgroundColor: `${color}cc` }}
                >
                  {m.label}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
