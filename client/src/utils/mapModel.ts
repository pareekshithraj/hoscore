// Shared spatial model for the hospital map. This is the single source of truth
// used by the map builder, the live simulator, patient wayfinding, and the
// public share page — so everything renders and pathfinds identically and the
// data round-trips cleanly to the backend HospitalMap model (and the app).

export type AreaType =
  | 'empty'
  | 'wall'
  | 'corridor'
  | 'lobby'
  | 'reception'
  | 'ward-a'
  | 'ward-b'
  | 'icu'
  | 'emergency'
  | 'pharmacy'
  | 'lab'
  | 'radiology'
  | 'ot'
  | 'cafeteria'
  | 'admin'
  | 'toilet'
  | 'elevator'
  | 'stairs';

export interface AreaMeta {
  label: string;
  short: string;
  color: string;
  walkable: boolean; // pathfinding may traverse this cell
}

export const AREA_CONFIG: Record<AreaType, AreaMeta> = {
  empty:      { label: 'Empty',        short: '',     color: 'transparent', walkable: false },
  wall:       { label: 'Wall',         short: '',     color: '#334155',     walkable: false },
  corridor:   { label: 'Corridor',     short: '',     color: '#475569',     walkable: true  },
  lobby:      { label: 'Lobby',        short: 'LBY',  color: '#64748b',     walkable: true  },
  reception:  { label: 'Reception',    short: 'REC',  color: '#3b82f6',     walkable: true  },
  'ward-a':   { label: 'Ward A',       short: 'WA',   color: '#10b981',     walkable: true  },
  'ward-b':   { label: 'Ward B',       short: 'WB',   color: '#22c55e',     walkable: true  },
  icu:        { label: 'ICU',          short: 'ICU',  color: '#a855f7',     walkable: true  },
  emergency:  { label: 'Emergency',    short: 'ER',   color: '#ef4444',     walkable: true  },
  pharmacy:   { label: 'Pharmacy',     short: 'PHR',  color: '#06b6d4',     walkable: true  },
  lab:        { label: 'Laboratory',   short: 'LAB',  color: '#f59e0b',     walkable: true  },
  radiology:  { label: 'Radiology',    short: 'RAD',  color: '#ec4899',     walkable: true  },
  ot:         { label: 'OT / Surgery', short: 'OT',   color: '#f43f5e',     walkable: true  },
  cafeteria:  { label: 'Cafeteria',    short: 'CAF',  color: '#84cc16',     walkable: true  },
  admin:      { label: 'Admin Office', short: 'ADM',  color: '#8b5cf6',     walkable: true  },
  toilet:     { label: 'Restroom',     short: 'WC',   color: '#0ea5e9',     walkable: true  },
  elevator:   { label: 'Elevator',     short: 'ELV',  color: '#eab308',     walkable: true  },
  stairs:     { label: 'Stairs',       short: 'STR',  color: '#f97316',     walkable: true  },
};

export type AnchorKind = 'room' | 'bed' | 'entrance' | 'poi';

export interface Cell { r: number; c: number; }

export interface Anchor {
  id: string;
  kind: AnchorKind;
  cell: Cell;
  label: string;
  roomId?: string;   // links a cell to a real Room record
  bedId?: string;    // links a cell to a real Bed record
  zone?: AreaType;   // for POIs like pharmacy/lab entrances
}

export interface RoomBlock {
  id: string;
  name: string;
  type: AreaType;
  x: number; // column index 0..cols-1
  y: number; // row index 0..rows-1
  w: number; // width in cells
  h: number; // height in cells
  doorSide?: 'north' | 'south' | 'east' | 'west';
  roomId?: string; // database Room ID link
}

export interface Floor {
  id: string;
  label: string;
  index: number;
  cells: AreaType[][]; // rows x cols
  anchors: Anchor[];
  rooms?: RoomBlock[];
}

export interface HospitalMapDoc {
  id?: string;
  hospitalId?: string;
  name: string;
  cols: number;
  rows: number;
  floors: Floor[];
  isPublished: boolean;
  version?: number;
}

// ---- factory helpers ----

export function blankGrid(rows: number, cols: number): AreaType[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 'corridor' as AreaType));
}

export const ROOM_TYPE_TO_AREA: Record<string, AreaType> = {
  icu: 'icu',
  emergency: 'emergency',
  er: 'emergency',
  ot: 'ot',
  surgery: 'ot',
  theatre: 'ot',
  radiology: 'radiology',
  lab: 'lab',
  laboratory: 'lab',
  pharmacy: 'pharmacy',
  reception: 'reception',
  cafeteria: 'cafeteria',
  ward: 'ward-a',
  'ward a': 'ward-a',
  'ward-a': 'ward-a',
  'ward b': 'ward-b',
  'ward-b': 'ward-b',
  general: 'ward-a',
  private: 'ward-b',
};

export function mapRoomTypeToArea(raw?: string | null): AreaType {
  if (!raw) return 'ward-a';
  return ROOM_TYPE_TO_AREA[raw.trim().toLowerCase()] || 'ward-a';
}

function stampRoom(cells: AreaType[][], r: RoomBlock, rows: number, cols: number) {
  const minY = Math.max(0, Math.min(rows - 1, r.y));
  const maxY = Math.max(0, Math.min(rows - 1, r.y + r.h - 1));
  const minX = Math.max(0, Math.min(cols - 1, r.x));
  const maxX = Math.max(0, Math.min(cols - 1, r.x + r.w - 1));
  const midX = Math.floor((minX + maxX) / 2);
  const midY = Math.floor((minY + maxY) / 2);

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const isEdgeY = py === minY || py === maxY;
      const isEdgeX = px === minX || px === maxX;
      let isDoor = false;
      if (r.doorSide === 'north' && py === minY && px === midX) isDoor = true;
      if (r.doorSide === 'south' && py === maxY && px === midX) isDoor = true;
      if (r.doorSide === 'west' && px === minX && py === midY) isDoor = true;
      if (r.doorSide === 'east' && px === maxX && py === midY) isDoor = true;

      if (isDoor) cells[py][px] = 'corridor';
      else if (isEdgeY || isEdgeX) cells[py][px] = 'wall';
      else cells[py][px] = r.type;
    }
  }
}

/** Overlay room blocks onto existing painted cells. Does not wipe corridors/walls outside rooms. */
export function syncRoomBlocksToGrid(floor: Floor, rows: number, cols: number): Floor {
  if (!floor.rooms || floor.rooms.length === 0) return normaliseFloor(floor, rows, cols);

  const base = normaliseFloor(floor, rows, cols);
  const cells = base.cells.map((row) => [...row]);
  floor.rooms.forEach((r) => stampRoom(cells, r, rows, cols));
  return { ...base, cells, rooms: floor.rooms };
}

/** Bake room geometry into cells so consumers that only read `cells` (wayfinding, Android) match the builder. */
export function bakeMapForSave(doc: HospitalMapDoc): HospitalMapDoc {
  return {
    ...doc,
    floors: doc.floors.map((f) => syncRoomBlocksToGrid(f, doc.rows, doc.cols)),
  };
}

export function roomsOverlap(a: RoomBlock, b: RoomBlock): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function findEmptyPlacement(
  rooms: RoomBlock[],
  w: number,
  h: number,
  cols: number,
  rows: number,
): { x: number; y: number } {
  const candidate: RoomBlock = { id: 'tmp', name: '', type: 'ward-a', x: 1, y: 1, w, h };
  for (let y = 0; y <= rows - h; y++) {
    for (let x = 0; x <= cols - w; x++) {
      candidate.x = x;
      candidate.y = y;
      if (!rooms.some((r) => roomsOverlap(r, candidate))) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

export function isFloorEmpty(floor: Floor): boolean {
  const hasRooms = (floor.rooms?.length ?? 0) > 0;
  const hasAnchors = (floor.anchors?.length ?? 0) > 0;
  const painted = floor.cells?.some((row) => row.some((c) => c !== 'empty' && c !== 'corridor'));
  return !hasRooms && !hasAnchors && !painted;
}

export function emptyFloor(index: number, rows: number, cols: number): Floor {
  return {
    id: `f${index}-${Math.random().toString(36).slice(2, 8)}`,
    label: index === 0 ? 'Ground Floor' : `Floor ${index}`,
    index,
    cells: Array.from({ length: rows }, () => Array.from({ length: cols }, () => 'empty' as AreaType)),
    anchors: [],
    rooms: [],
  };
}

export function emptyMap(): HospitalMapDoc {
  return { name: 'Main Building', cols: 20, rows: 14, floors: [emptyFloor(0, 14, 20)], isPublished: false };
}

// Normalise a floor's grid so it always matches rows x cols (handles resize and
// backend docs saved at a different size).
export function normaliseFloor(floor: Floor, rows: number, cols: number): Floor {
  const cells = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => floor.cells?.[r]?.[c] ?? ('empty' as AreaType)),
  );
  return { ...floor, cells };
}

// ---- A* pathfinding across walkable cells (4-directional) ----

export function findPath(grid: AreaType[][], start: Cell, goal: Cell): Cell[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const walkable = (r: number, c: number) =>
    r >= 0 && r < rows && c >= 0 && c < cols && AREA_CONFIG[grid[r][c]]?.walkable;

  // Goal/start might sit on a room cell (walkable) — if not walkable, bail.
  if (!walkable(start.r, start.c) || !walkable(goal.r, goal.c)) {
    // Try to snap goal to the nearest walkable neighbour (rooms often border corridors).
    const snapped = nearestWalkable(grid, goal);
    if (!snapped) return [];
    goal = snapped;
    if (!walkable(start.r, start.c)) {
      const s = nearestWalkable(grid, start);
      if (!s) return [];
      start = s;
    }
  }

  const key = (r: number, c: number) => `${r},${c}`;
  const open: Cell[] = [start];
  const cameFrom = new Map<string, Cell>();
  const g = new Map<string, number>([[key(start.r, start.c), 0]]);
  const h = (r: number, c: number) => Math.abs(r - goal.r) + Math.abs(c - goal.c);
  const f = new Map<string, number>([[key(start.r, start.c), h(start.r, start.c)]]);

  while (open.length) {
    // pop lowest f
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      if ((f.get(key(open[i].r, open[i].c)) ?? Infinity) < (f.get(key(open[bi].r, open[bi].c)) ?? Infinity)) bi = i;
    }
    const cur = open.splice(bi, 1)[0];
    if (cur.r === goal.r && cur.c === goal.c) {
      const path = [cur];
      let k = key(cur.r, cur.c);
      while (cameFrom.has(k)) {
        const p = cameFrom.get(k)!;
        path.unshift(p);
        k = key(p.r, p.c);
      }
      return path;
    }
    const neighbours = [
      { r: cur.r - 1, c: cur.c }, { r: cur.r + 1, c: cur.c },
      { r: cur.r, c: cur.c - 1 }, { r: cur.r, c: cur.c + 1 },
    ];
    for (const n of neighbours) {
      if (!walkable(n.r, n.c)) continue;
      const tentative = (g.get(key(cur.r, cur.c)) ?? Infinity) + 1;
      const nk = key(n.r, n.c);
      if (tentative < (g.get(nk) ?? Infinity)) {
        cameFrom.set(nk, cur);
        g.set(nk, tentative);
        f.set(nk, tentative + h(n.r, n.c));
        if (!open.some((o) => o.r === n.r && o.c === n.c)) open.push(n);
      }
    }
  }
  return [];
}

function nearestWalkable(grid: AreaType[][], cell: Cell): Cell | null {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  for (let radius = 0; radius <= Math.max(rows, cols); radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const r = cell.r + dr;
        const c = cell.c + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols && AREA_CONFIG[grid[r][c]]?.walkable) {
          return { r, c };
        }
      }
    }
  }
  return null;
}

// Turn a path into short human directions for the wayfinding step list.
export function pathToDirections(path: Cell[], destinationLabel: string): string[] {
  if (path.length < 2) return [`Arrive at ${destinationLabel}.`];
  const steps: string[] = ['Start at the entrance / lobby.'];
  const dirName = (a: Cell, b: Cell) => {
    if (b.r < a.r) return 'up (north)';
    if (b.r > a.r) return 'down (south)';
    if (b.c > a.c) return 'right (east)';
    return 'left (west)';
  };
  let run = 1;
  let dir = dirName(path[0], path[1]);
  for (let i = 1; i < path.length - 1; i++) {
    const nextDir = dirName(path[i], path[i + 1]);
    if (nextDir === dir) {
      run++;
    } else {
      steps.push(`Head ${dir} for ${run} step${run > 1 ? 's' : ''}, then turn.`);
      dir = nextDir;
      run = 1;
    }
  }
  steps.push(`Continue ${dir} for ${run} step${run > 1 ? 's' : ''}.`);
  steps.push(`Arrive at ${destinationLabel}.`);
  return steps;
}
