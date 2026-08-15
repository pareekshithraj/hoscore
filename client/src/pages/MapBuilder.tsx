import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Save, Undo2, Redo2, Plus, Trash2, Layers, Globe, Lock, DoorOpen,
  MapPin, Loader2, Grid3x3, Building2, Copy, Download, Upload,
  MousePointer, Eraser, ZoomIn, ZoomOut, RotateCcw,
  Navigation, CheckCircle2, Sliders, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, LayoutGrid, Sparkles, Maximize2, Minimize2,
  PenTool, ShieldCheck, Bed, BoxSelect, Eye, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { MapCanvas } from '../components/map/MapCanvas';
import {
  AREA_CONFIG, emptyFloor, emptyMap, normaliseFloor, findPath,
  syncRoomBlocksToGrid, bakeMapForSave, findEmptyPlacement, mapRoomTypeToArea,
  isFloorEmpty, roomsOverlap, type AreaType, type Anchor, type Floor,
  type HospitalMapDoc, type Cell, type RoomBlock
} from '../utils/mapModel';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState } from '../components/ui/LoadingState';

type DrawTool = 'select_room' | 'draw_box' | 'wall_draw' | 'paint' | 'anchor' | 'erase' | 'wayfinding_test';

const CLINICAL_ZONES: AreaType[] = ['emergency', 'icu', 'ward-a', 'ward-b', 'ot', 'radiology', 'lab', 'pharmacy'];
const CIRCULATION_ZONES: AreaType[] = ['corridor', 'lobby', 'reception', 'elevator', 'stairs', 'toilet', 'cafeteria'];
const STRUCTURAL_ZONES: AreaType[] = ['wall', 'admin', 'empty'];

const ROOM_PRESETS: { name: string; type: AreaType; w: number; h: number; doorSide: 'north' | 'south' | 'east' | 'west' }[] = [
  { name: 'Emergency ER', type: 'emergency', w: 6, h: 5, doorSide: 'south' },
  { name: 'ICU Unit', type: 'icu', w: 6, h: 5, doorSide: 'south' },
  { name: 'Inpatient Ward A', type: 'ward-a', w: 8, h: 6, doorSide: 'east' },
  { name: 'Operation Theatre', type: 'ot', w: 6, h: 6, doorSide: 'west' },
  { name: 'Radiology & Scan', type: 'radiology', w: 6, h: 5, doorSide: 'west' },
  { name: 'Pathology Lab', type: 'lab', w: 6, h: 4, doorSide: 'south' },
  { name: 'Pharmacy Counter', type: 'pharmacy', w: 5, h: 4, doorSide: 'north' },
  { name: 'Main Reception', type: 'reception', w: 8, h: 4, doorSide: 'north' },
  { name: 'Cafeteria & Lounge', type: 'cafeteria', w: 6, h: 6, doorSide: 'north' },
  { name: 'Elevator Shaft', type: 'elevator', w: 3, h: 3, doorSide: 'north' },
];

interface RoomLite {
  id: string;
  name: string;
  type?: string;
  roomType?: string;
  beds?: { id: string; bedNumber: string; status?: string }[];
}

interface BedLite {
  id: string;
  bedNumber: string;
  status: string;
  roomId?: string;
  room?: { id: string; name: string };
}

export const MapBuilder = () => {
  const [doc, setDoc] = useState<HospitalMapDoc>(emptyMap());
  const [floorIdx, setFloorIdx] = useState(0);
  const [activeTool, setActiveTool] = useState<DrawTool>('select_room');
  const [selectedArea, setSelectedArea] = useState<AreaType>('ward-a');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [anchorKind, setAnchorKind] = useState<Anchor['kind']>('room');
  const [history, setHistory] = useState<HospitalMapDoc[]>([]);
  const [future, setFuture] = useState<HospitalMapDoc[]>([]);
  const [rooms, setRooms] = useState<RoomLite[]>([]);
  const [beds, setBeds] = useState<BedLite[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [previewOccupancy, setPreviewOccupancy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Fullscreen Studio State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Wall & Box Drawing (with 90° Ortho Snap & Freehand Vector Strokes)
  const [wallStart, setWallStart] = useState<Cell | null>(null);
  const [dragBoxStart, setDragBoxStart] = useState<Cell | null>(null);
  const [hoverCell, setHoverCell] = useState<Cell | null>(null);
  const [pendingAnchor, setPendingAnchor] = useState<{ r: number; c: number; kind: Anchor['kind'] } | null>(null);

  // Freehand Paint App Vector Strokes
  const [freehandStrokes, setFreehandStrokes] = useState<{ id: string; points: { x: number; y: number }[]; color?: string; width?: number }[]>([]);
  const [activeStroke, setActiveStroke] = useState<{ x: number; y: number }[] | null>(null);

  // Viewport Zoom Scale (80% - 150%)
  const [zoomScale, setZoomScale] = useState(100);

  // Wayfinding Test Mode State
  const [testStart, setTestStart] = useState<Cell | null>(null);
  const [testEnd, setTestEnd] = useState<Cell | null>(null);

  // Grid Settings Modal
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [newCols, setNewCols] = useState(20);
  const [newRows, setNewRows] = useState(20);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/map').catch(() => null),
      api.get('/rooms').catch(() => []),
      api.get('/beds').catch(() => []),
      api.get('/map/positions').catch(() => []),
    ]).then(([map, rms, bds, pos]) => {
      if (!mounted) return;
      if (map && Array.isArray(map.floors) && map.floors.length) {
        const normalised: HospitalMapDoc = {
          ...map,
          floors: map.floors.map((f: Floor) => normaliseFloor(f, map.rows, map.cols)),
        };
        setDoc(normalised);
        setNewCols(map.cols || 20);
        setNewRows(map.rows || 20);
        const first = normalised.floors[0];
        setShowGuide(isFloorEmpty(first));
      } else {
        setShowGuide(true);
      }
      setRooms(Array.isArray(rms) ? rms : []);
      setBeds(Array.isArray(bds) ? bds : []);
      setPositions(Array.isArray(pos) ? pos : []);
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-29), JSON.parse(JSON.stringify(doc))]);
    setFuture([]);
    setDirty(true);
  }, [doc]);

  const mutateFloor = useCallback((fn: (f: Floor) => Floor) => {
    setDoc((prev) => {
      const floors = prev.floors.map((f, i) => (i === floorIdx ? fn(f) : f));
      return { ...prev, floors };
    });
  }, [floorIdx]);

  const floor = useMemo(() => {
    const raw = doc.floors[floorIdx] || doc.floors[0];
    return syncRoomBlocksToGrid(raw, doc.rows, doc.cols);
  }, [doc, floorIdx]);

  const selectedRoom = useMemo(() => {
    return floor.rooms?.find((r) => r.id === selectedRoomId) || null;
  }, [floor.rooms, selectedRoomId]);

  const addPresetRoom = useCallback((preset: typeof ROOM_PRESETS[0]) => {
    pushHistory();
    const existing = floor.rooms || [];
    const spot = findEmptyPlacement(existing, preset.w, preset.h, doc.cols, doc.rows);
    const newBlock: RoomBlock = {
      id: `rb-${Math.random().toString(36).slice(2, 8)}`,
      name: preset.name,
      type: preset.type,
      x: spot.x,
      y: spot.y,
      w: preset.w,
      h: preset.h,
      doorSide: preset.doorSide,
    };
    mutateFloor((f) => ({
      ...f,
      rooms: [...(f.rooms || []), newBlock],
    }));
    setSelectedRoomId(newBlock.id);
    setActiveTool('select_room');
    setDirty(true);
    setShowGuide(false);
    setStatus(`Added architectural room: ${preset.name}`);
  }, [pushHistory, mutateFloor, floor.rooms, doc.cols, doc.rows]);

  const updateSelectedRoom = useCallback((updates: Partial<RoomBlock>) => {
    if (!selectedRoomId) return;
    pushHistory();
    mutateFloor((f) => ({
      ...f,
      rooms: (f.rooms || []).map((r) => (r.id === selectedRoomId ? { ...r, ...updates } : r)),
    }));
    setDirty(true);
  }, [selectedRoomId, pushHistory, mutateFloor]);

  const deleteSelectedRoom = useCallback(() => {
    if (!selectedRoomId) return;
    pushHistory();
    mutateFloor((f) => ({
      ...f,
      rooms: (f.rooms || []).filter((r) => r.id !== selectedRoomId),
    }));
    setSelectedRoomId(null);
    setDirty(true);
    setStatus('Room block removed from floor plan');
  }, [selectedRoomId, pushHistory, mutateFloor]);

  const moveSelectedRoom = useCallback((dx: number, dy: number) => {
    if (!selectedRoomId) return;
    pushHistory();
    mutateFloor((f) => ({
      ...f,
      rooms: (f.rooms || []).map((r) => {
        if (r.id !== selectedRoomId) return r;
        const newX = Math.max(0, Math.min(doc.cols - r.w, r.x + dx));
        const newY = Math.max(0, Math.min(doc.rows - r.h, r.y + dy));
        return { ...r, x: newX, y: newY };
      }),
    }));
    setDirty(true);
  }, [selectedRoomId, doc.cols, doc.rows, pushHistory, mutateFloor]);

  const liveMoveRoom = useCallback((id: string, x: number, y: number) => {
    mutateFloor((f) => ({
      ...f,
      rooms: (f.rooms || []).map((r) => {
        if (r.id !== id) return r;
        const newX = Math.max(0, Math.min(doc.cols - r.w, x));
        const newY = Math.max(0, Math.min(doc.rows - r.h, y));
        return { ...r, x: newX, y: newY };
      }),
    }));
    setDirty(true);
  }, [mutateFloor, doc.cols, doc.rows]);

  const liveResizeRoom = useCallback((id: string, w: number, h: number) => {
    mutateFloor((f) => ({
      ...f,
      rooms: (f.rooms || []).map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          w: Math.max(2, Math.min(doc.cols - r.x, w)),
          h: Math.max(2, Math.min(doc.rows - r.y, h)),
        };
      }),
    }));
    setDirty(true);
  }, [mutateFloor, doc.cols, doc.rows]);

  const overlappingIds = useMemo(() => {
    const list = floor.rooms || [];
    const ids = new Set<string>();
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (roomsOverlap(list[i], list[j])) {
          ids.add(list[i].id);
          ids.add(list[j].id);
        }
      }
    }
    return ids;
  }, [floor.rooms]);

  const getOrthoSnappedCell = useCallback((start: Cell, curr: Cell): Cell => {
    const dr = Math.abs(curr.r - start.r);
    const dc = Math.abs(curr.c - start.c);
    if (dr >= dc) {
      return { r: curr.r, c: start.c };
    } else {
      return { r: start.r, c: curr.c };
    }
  }, []);

  const wallPreview = useMemo(() => {
    if (activeTool === 'wall_draw' && wallStart && hoverCell) {
      const end = getOrthoSnappedCell(wallStart, hoverCell);
      return { r1: wallStart.r, c1: wallStart.c, r2: end.r, c2: end.c };
    }
    return null;
  }, [activeTool, wallStart, hoverCell, getOrthoSnappedCell]);

  const selectionRect = useMemo(() => {
    if (activeTool === 'draw_box' && dragBoxStart && hoverCell) {
      return { r1: dragBoxStart.r, c1: dragBoxStart.c, r2: hoverCell.r, c2: hoverCell.c };
    }
    return null;
  }, [activeTool, dragBoxStart, hoverCell]);

  const placeRegisteredRoom = useCallback((dbRoom: RoomLite) => {
    pushHistory();
    const existing = floor.rooms?.find((r) => r.roomId === dbRoom.id);
    if (existing) {
      setSelectedRoomId(existing.id);
      setActiveTool('select_room');
      setStatus(`Room "${dbRoom.name}" is already placed on floor map — selected.`);
      return;
    }

    const mappedType: AreaType = mapRoomTypeToArea(dbRoom.type || dbRoom.roomType);

    const existingRooms = floor.rooms || [];
    const spot = findEmptyPlacement(existingRooms, 6, 5, doc.cols, doc.rows);
    const newBlock: RoomBlock = {
      id: `rb-${Math.random().toString(36).slice(2, 8)}`,
      name: dbRoom.name,
      type: mappedType,
      x: spot.x,
      y: spot.y,
      w: 6,
      h: 5,
      doorSide: 'south',
      roomId: dbRoom.id,
    };

    mutateFloor((f) => ({
      ...f,
      rooms: [...(f.rooms || []), newBlock],
    }));
    setSelectedRoomId(newBlock.id);
    setActiveTool('select_room');
    setDirty(true);
    setShowGuide(false);
    setStatus(`Placed registered hospital room: "${dbRoom.name}"`);
  }, [floor.rooms, pushHistory, mutateFloor, doc.cols, doc.rows]);

  // Handle cell click / drag actions
  const handleCellClick = useCallback((r: number, c: number) => {
    if (activeTool === 'wayfinding_test') {
      if (!testStart || (testStart && testEnd)) {
        setTestStart({ r, c });
        setTestEnd(null);
      } else {
        setTestEnd({ r, c });
      }
      return;
    }

    if (activeTool === 'anchor') {
      setPendingAnchor({ r, c, kind: anchorKind });
      return;
    }

    if (activeTool === 'wall_draw') {
      if (!wallStart) {
        setWallStart({ r, c });
      } else {
        const end = getOrthoSnappedCell(wallStart, { r, c });
        pushHistory();
        const minR = Math.min(wallStart.r, end.r);
        const maxR = Math.max(wallStart.r, end.r);
        const minC = Math.min(wallStart.c, end.c);
        const maxC = Math.max(wallStart.c, end.c);

        mutateFloor((f) => {
          const cells = f.cells.map((row) => [...row]);
          for (let rowIdx = minR; rowIdx <= maxR; rowIdx++) {
            for (let colIdx = minC; colIdx <= maxC; colIdx++) {
              cells[rowIdx][colIdx] = 'wall';
            }
          }
          return { ...f, cells };
        });
        setWallStart(null);
        setDirty(true);
        setStatus('Drew straight architectural wall segment with 90° Ortho Lock');
      }
      return;
    }

    if (activeTool === 'draw_box') {
      if (!dragBoxStart) {
        setDragBoxStart({ r, c });
      } else {
        pushHistory();
        const minR = Math.min(dragBoxStart.r, r);
        const maxR = Math.max(dragBoxStart.r, r);
        const minC = Math.min(dragBoxStart.c, c);
        const maxC = Math.max(dragBoxStart.c, c);

        const newBlock: RoomBlock = {
          id: `rb-${Math.random().toString(36).slice(2, 8)}`,
          name: 'Custom Room Box',
          type: selectedArea,
          x: minC,
          y: minR,
          w: maxC - minC + 1,
          h: maxR - minR + 1,
          doorSide: 'south',
        };

        mutateFloor((f) => ({
          ...f,
          rooms: [...(f.rooms || []), newBlock],
        }));
        setSelectedRoomId(newBlock.id);
        setDragBoxStart(null);
        setActiveTool('select_room');
        setDirty(true);
        setStatus('Custom room box drawn! Inspect, resize, or reassign its room type in the Inspector.');
      }
      return;
    }

    // Single Cell Paint or Erase
    pushHistory();
    const areaToApply: AreaType = activeTool === 'erase' ? 'empty' : selectedArea;
    mutateFloor((f) => {
      const cells = f.cells.map((row) => [...row]);
      cells[r][c] = areaToApply;
      return { ...f, cells };
    });
    setDirty(true);
  }, [activeTool, anchorKind, selectedArea, wallStart, testStart, testEnd, pushHistory, mutateFloor, getOrthoSnappedCell]);

  const paintCell = useCallback((r: number, c: number) => {
    if (activeTool === 'paint' || activeTool === 'erase' || activeTool === 'wall_draw') {
      const areaToApply: AreaType = activeTool === 'erase' ? 'empty' : activeTool === 'wall_draw' ? 'wall' : selectedArea;
      mutateFloor((f) => {
        if (f.cells[r]?.[c] === areaToApply) return f;
        const cells = f.cells.map((row) => [...row]);
        cells[r][c] = areaToApply;
        return { ...f, cells };
      });
      setDirty(true);
    }
  }, [activeTool, selectedArea, mutateFloor]);

  const commitAnchor = useCallback((label: string, roomId?: string, bedId?: string) => {
    if (!pendingAnchor) return;
    pushHistory();
    const anchor: Anchor = {
      id: `a-${Math.random().toString(36).slice(2, 9)}`,
      kind: pendingAnchor.kind,
      cell: { r: pendingAnchor.r, c: pendingAnchor.c },
      label: label || (pendingAnchor.kind === 'entrance' ? 'Entrance' : 'Landmark'),
      roomId,
      bedId,
    };
    mutateFloor((f) => ({
      ...f,
      anchors: [...f.anchors.filter((a) => !(a.cell.r === anchor.cell.r && a.cell.c === anchor.cell.c)), anchor],
    }));
    setPendingAnchor(null);
    setDirty(true);
  }, [pendingAnchor, pushHistory, mutateFloor]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [JSON.parse(JSON.stringify(doc)), ...f].slice(0, 30));
      setDoc(prev);
      setDirty(true);
      return h.slice(0, -1);
    });
  }, [doc]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setHistory((h) => [...h.slice(-29), JSON.parse(JSON.stringify(doc))]);
      setDoc(next);
      setDirty(true);
      return f.slice(1);
    });
  }, [doc]);

  const addFloor = () => {
    pushHistory();
    setDoc((prev) => {
      const floors = [...prev.floors, emptyFloor(prev.floors.length, prev.rows, prev.cols)];
      return { ...prev, floors };
    });
    setFloorIdx(doc.floors.length);
  };

  const renameFloor = (label: string) => {
    mutateFloor((f) => ({ ...f, label }));
    setDirty(true);
  };

  const duplicateFloor = () => {
    pushHistory();
    setDoc((prev) => {
      const current = prev.floors[floorIdx];
      const newFloor: Floor = {
        id: `f${prev.floors.length}-${Math.random().toString(36).slice(2, 8)}`,
        label: `${current.label} (Copy)`,
        index: prev.floors.length,
        cells: JSON.parse(JSON.stringify(current.cells)),
        anchors: JSON.parse(JSON.stringify(current.anchors)),
        rooms: JSON.parse(JSON.stringify(current.rooms || [])),
      };
      return { ...prev, floors: [...prev.floors, newFloor] };
    });
    setFloorIdx(doc.floors.length);
    setStatus('Floor layout duplicated cleanly!');
  };

  const removeFloor = () => {
    if (doc.floors.length <= 1) return;
    pushHistory();
    setDoc((prev) => ({ ...prev, floors: prev.floors.filter((_, i) => i !== floorIdx) }));
    setFloorIdx(Math.max(0, floorIdx - 1));
  };

  const clearCurrentFloorGrid = () => {
    if (!window.confirm('Are you sure you want to completely wipe & reset this floor plan? This removes all walls, rooms, and anchors.')) return;
    pushHistory();
    mutateFloor((f) => ({
      ...f,
      cells: Array.from({ length: doc.rows }, () => Array.from({ length: doc.cols }, () => 'empty' as AreaType)),
      anchors: [],
      rooms: [],
    }));
    setSelectedRoomId(null);
    setTestStart(null);
    setTestEnd(null);
    setWallStart(null);
    setFreehandStrokes([]);
    setActiveStroke(null);
    setDirty(true);
    setShowGuide(true);
    setStatus('Floor plan completely wiped & reset.');
  };

  const applyGridResolution = () => {
    pushHistory();
    setDoc((prev) => ({
      ...prev,
      rows: newRows,
      cols: newCols,
      floors: prev.floors.map((f) => normaliseFloor(f, newRows, newCols)),
    }));
    setIsGridModalOpen(false);
    setDirty(true);
    setStatus(`Updated map grid to ${newCols}×${newRows}`);
  };

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const baked = bakeMapForSave(doc);
      const saved = await api.put('/map', {
        name: baked.name,
        cols: baked.cols,
        rows: baked.rows,
        floors: baked.floors,
        isPublished: baked.isPublished,
      });
      setDoc((d) => ({ ...baked, id: saved.id, version: saved.version }));
      setDirty(false);
      setStatus('Map saved. Patients and the mobile app now see this floor plan.');
    } catch (e: any) {
      setStatus(e?.message || 'Save failed');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  const exportMapJson = () => {
    const jsonStr = JSON.stringify(bakeMapForSave(doc), null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoscore_hospital_map_v${doc.version ?? 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMapJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed?.floors)) throw new Error('Invalid map file');
        pushHistory();
        const cols = Number(parsed.cols) || doc.cols;
        const rows = Number(parsed.rows) || doc.rows;
        setDoc({
          name: parsed.name || 'Imported Building',
          cols,
          rows,
          isPublished: Boolean(parsed.isPublished),
          floors: parsed.floors.map((f: Floor) => normaliseFloor(f, rows, cols)),
        });
        setNewCols(cols);
        setNewRows(rows);
        setFloorIdx(0);
        setDirty(true);
        setShowGuide(false);
        setStatus('Imported floor plan JSON');
      } catch {
        setStatus('Could not import that file. Use a Hoscore map JSON export.');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty && !saving) save();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        setWallStart(null);
        setDragBoxStart(null);
        setPendingAnchor(null);
        setActiveTool('select_room');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty, saving, undo, redo]);

  const occupancyMarkers = useMemo(() => {
    if (!previewOccupancy) return [];
    const markers: { cell: Cell; label?: string; kind: 'patient' | 'staff'; pulse?: boolean }[] = [];
    positions
      .filter((p) => p.floorId === floor.id)
      .forEach((p) => {
        markers.push({
          cell: { r: p.cellR, c: p.cellC },
          label: p.label || 'Live',
          kind: p.subjectType === 'STAFF' ? 'staff' : 'patient',
          pulse: true,
        });
      });
    const occupied = beds.filter((b) => String(b.status).toUpperCase().includes('OCCUPIED'));
    occupied.forEach((b) => {
      const anchor = floor.anchors.find((a) => a.bedId === b.id);
      if (anchor) {
        markers.push({ cell: anchor.cell, label: `Bed ${b.bedNumber}`, kind: 'patient' });
        return;
      }
      const roomBlock = (floor.rooms || []).find((r) => r.roomId === b.roomId || r.roomId === b.room?.id);
      if (roomBlock) {
        markers.push({
          cell: { r: roomBlock.y + Math.floor(roomBlock.h / 2), c: roomBlock.x + Math.floor(roomBlock.w / 2) },
          label: `Bed ${b.bedNumber}`,
          kind: 'patient',
        });
      }
    });
    return markers;
  }, [previewOccupancy, positions, beds, floor]);

  const occupancyHeat = useMemo(() => {
    if (!previewOccupancy) return undefined;
    const heat: Record<string, number> = {};
    occupancyMarkers.forEach((m) => {
      const k = `${m.cell.r},${m.cell.c}`;
      heat[k] = Math.min(1, (heat[k] || 0) + 0.45);
    });
    return heat;
  }, [previewOccupancy, occupancyMarkers]);

  // Test Wayfinding Route Calculation
  const testWayfindingPath = useMemo(() => {
    if (!testStart || !testEnd || !floor) return [];
    return findPath(floor.cells, testStart, testEnd);
  }, [floor, testStart, testEnd]);

  const anchorCount = useMemo(() => doc.floors.reduce((n, f) => n + f.anchors.length, 0), [doc.floors]);

  if (loading) {
    return <LoadingState label="Loading CAD Hospital Map Builder..." />;
  }

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-[var(--main-bg)] p-4 h-screen w-screen overflow-hidden flex flex-col justify-between space-y-4' : 'space-y-6'}>
      <PageHeader
        title="Hospital Map Builder"
        subtitle="Place rooms, draw corridors, test a route, then publish for patients and staff."
        icon={<Grid3x3 className="w-5 h-5 text-blue-500" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                isFullscreen
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-sky-300 shadow-md'
                  : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--inner-bg)]'
              }`}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Studio'}
            </button>
            <button
              onClick={() => { setDoc((d) => ({ ...d, isPublished: !d.isPublished })); setDirty(true); }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                doc.isPublished
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                  : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-muted)]'
              }`}
            >
              {doc.isPublished ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {doc.isPublished ? 'Published' : 'Private'}
            </button>
            <button
              onClick={() => setPreviewOccupancy((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                previewOccupancy
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-600'
                  : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--inner-bg)]'
              }`}
            >
              <Eye className="h-4 w-4" /> {previewOccupancy ? 'Occupancy on' : 'Preview occupancy'}
            </button>
            <button
              onClick={() => setIsGridModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--inner-bg)] transition-all cursor-pointer"
            >
              <Sliders className="h-4 w-4 text-[var(--text-muted)]" /> Grid ({doc.cols}×{doc.rows})
            </button>
            <button
              onClick={exportMapJson}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--inner-bg)] transition-all cursor-pointer"
              title="Export Floor Plan JSON"
            >
              <Download className="h-4 w-4 text-[var(--text-muted)]" /> Export
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--inner-bg)] transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4 text-[var(--text-muted)]" /> Import
            </button>
            <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importMapJson(f); e.target.value = ''; }} />
            <button
              onClick={undo}
              disabled={!history.length}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3.5 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--inner-bg)] transition-all cursor-pointer disabled:opacity-40"
            >
              <Undo2 className="h-4 w-4 text-[var(--text-muted)]" /> Undo
            </button>
            <button
              onClick={redo}
              disabled={!future.length}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3.5 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--inner-bg)] transition-all cursor-pointer disabled:opacity-40"
            >
              <Redo2 className="h-4 w-4 text-[var(--text-muted)]" /> Redo
            </button>
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : dirty ? 'Save Studio Plan' : 'Saved'}
            </button>
          </div>
        }
      />

      {status && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs font-bold text-blue-600 dark:text-sky-300 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4" />
          {status}
        </div>
      )}

      {/* Main Studio CAD Workspace */}
      <div className={`grid grid-cols-1 gap-6 ${isFullscreen ? 'flex-1 lg:grid-cols-[320px_1fr_300px] overflow-hidden' : 'lg:grid-cols-[300px_1fr_280px]'}`}>
        {/* Left: Architectural Tool Palette & Registered Rooms */}
        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Building name</label>
            <input
              value={doc.name}
              onChange={(e) => { setDoc((d) => ({ ...d, name: e.target.value })); setDirty(true); }}
              className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)]"
            />
          </div>
          {/* Drawing Tools Selector */}
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">CAD Editor Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setActiveTool('select_room'); setWallStart(null); setDragBoxStart(null); }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                  activeTool === 'select_room'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[var(--inner-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <MousePointer className="w-4 h-4" /> Select Room
              </button>
              <button
                onClick={() => { setActiveTool('draw_box'); setWallStart(null); setDragBoxStart(null); }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                  activeTool === 'draw_box'
                    ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-400/50'
                    : 'bg-[var(--inner-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <BoxSelect className="w-4 h-4 text-cyan-400" /> Draw Box
              </button>
              <button
                onClick={() => { setActiveTool('wall_draw'); setWallStart(null); }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                  activeTool === 'wall_draw'
                    ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-400/50'
                    : 'bg-[var(--inner-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <PenTool className="w-4 h-4 text-cyan-400" /> Draw Walls
              </button>
              <button
                onClick={() => { setActiveTool('paint'); setWallStart(null); }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                  activeTool === 'paint'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[var(--inner-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" /> Tile Brush
              </button>
              <button
                onClick={() => { setActiveTool('anchor'); setWallStart(null); }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                  activeTool === 'anchor'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[var(--inner-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <MapPin className="w-4 h-4" /> Anchor Pin
              </button>
              <button
                onClick={() => { setActiveTool('erase'); setWallStart(null); }}
                className={`col-span-2 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                  activeTool === 'erase'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-[var(--inner-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Eraser className="w-4 h-4" /> Eraser
              </button>
            </div>

            <button
              onClick={() => {
                setActiveTool('wayfinding_test');
                setTestStart(null);
                setTestEnd(null);
              }}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer border ${
                activeTool === 'wayfinding_test'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                  : 'border-[var(--card-border)] bg-[var(--inner-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Navigation className="w-4 h-4 text-emerald-500" /> Test Wayfinding Route
            </button>
          </div>

          {(activeTool === 'paint' || activeTool === 'draw_box' || activeTool === 'erase') && (
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Zone palette</h3>
              {[
                { label: 'Clinical', zones: CLINICAL_ZONES },
                { label: 'Circulation', zones: CIRCULATION_ZONES },
                { label: 'Structure', zones: STRUCTURAL_ZONES },
              ].map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.zones.map((z) => {
                      const cfg = AREA_CONFIG[z];
                      const active = selectedArea === z;
                      return (
                        <button
                          key={z}
                          onClick={() => { setSelectedArea(z); if (activeTool === 'erase') setActiveTool('paint'); }}
                          className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold cursor-pointer ${
                            active ? 'border-blue-500 bg-blue-500/10 text-[var(--text-primary)]' : 'border-[var(--card-border)] text-[var(--text-secondary)]'
                          }`}
                        >
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cfg.color === 'transparent' ? '#94a3b8' : cfg.color }} />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Registered Hospital Rooms & Wards Tray */}
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Hospital Registered Rooms
              </h3>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                {rooms.filter(r => floor.rooms?.some(fr => fr.roomId === r.id)).length}/{rooms.length} Placed
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-semibold">
              Official hospital rooms from database. Click to place on map:
            </p>
            <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {rooms.length === 0 ? (
                <p className="text-xs italic text-[var(--text-muted)] p-2">No registered rooms found in hospital database.</p>
              ) : (
                rooms.map((r) => {
                  const isPlaced = floor.rooms?.some((fr) => fr.roomId === r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => placeRegisteredRoom(r)}
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        isPlaced
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                          : 'border-[var(--card-border)] bg-[var(--inner-bg)] text-[var(--text-primary)] hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
                        <span className="truncate">{r.name}</span>
                      </div>
                      <span className="flex-shrink-0 text-[10px] font-bold">
                        {isPlaced ? '✓ Placed' : '+ Place'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Preset Architectural Room Blocks */}
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm space-y-3">
            <h3 className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <span>Spawn Room Blocks</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-semibold">
              Click any architectural preset to spawn a custom-dimension room box on your floor plan:
            </p>
            <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {ROOM_PRESETS.map((preset) => {
                const cfg = AREA_CONFIG[preset.type];
                return (
                  <button
                    key={preset.name}
                    onClick={() => addPresetRoom(preset)}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-blue-500/50 hover:bg-blue-500/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-3 w-3 rounded-md flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                      <span className="truncate">{preset.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] group-hover:text-blue-500">
                      {preset.w * 2}m × {preset.h * 2}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anchor Tool Selector */}
          {activeTool === 'anchor' && (
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Anchor Types</h3>
              {([
                { k: 'room' as const, icon: Building2, label: 'Room (link record)' },
                { k: 'bed' as const, icon: MapPin, label: 'Bed (link record)' },
                { k: 'entrance' as const, icon: DoorOpen, label: 'Main Entrance' },
                { k: 'poi' as const, icon: MapPin, label: 'Point of Interest' },
              ]).map(({ k, icon: Icon, label }) => (
                <button
                  key={k}
                  onClick={() => setAnchorKind(k)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                    anchorKind === k
                      ? 'bg-blue-500/15 text-blue-600 dark:text-sky-300 border border-blue-500/30'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--inner-bg)]'
                  }`}
                >
                  <Icon className="h-4 w-4 text-blue-500" /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: CAD Map Viewport Canvas & Zoom Bar */}
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-sm space-y-4">
          {/* Viewport Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--inner-bg)] p-2 rounded-xl border border-[var(--card-border)]">
            <div className="flex items-center gap-1.5 flex-wrap">
              {doc.floors.map((f, i) => (
                i === floorIdx ? (
                  <input
                    key={f.id}
                    value={f.label}
                    onChange={(e) => renameFloor(e.target.value)}
                    className="rounded-lg bg-[var(--card-bg)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] w-32 border border-blue-500/40"
                  />
                ) : (
                  <button
                    key={f.id}
                    onClick={() => setFloorIdx(i)}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {f.label}
                  </button>
                )
              ))}
              <button
                onClick={addFloor}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] rounded-lg cursor-pointer transition-colors"
                title="Add new floor"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={duplicateFloor}
                className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                title="Duplicate current floor layout"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              {doc.floors.length > 1 && (
                <button
                  onClick={removeFloor}
                  className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                  title="Remove floor"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Viewport Zoom Controls */}
              <div className="flex items-center gap-1 border-l border-[var(--card-border)] pl-2">
                <button
                  onClick={() => setZoomScale((z) => Math.max(70, z - 10))}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-[11px] font-mono font-bold text-[var(--text-primary)] w-10 text-center">
                  {zoomScale}%
                </span>
                <button
                  onClick={() => setZoomScale((z) => Math.min(150, z + 10))}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setZoomScale(100)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Canvas Surface (Full Length & Width) */}
          <div className="relative w-full flex-1 overflow-auto rounded-2xl border border-[var(--card-border)] bg-slate-950/80 dark:bg-black/80 p-3 shadow-inner min-h-[500px]">
            <div style={{ width: `${zoomScale}%`, minWidth: '100%' }}>
            <MapCanvas
              cells={floor.cells}
              anchors={floor.anchors}
              roomBlocks={floor.rooms}
              selectedRoomId={selectedRoomId}
              onSelectRoom={(id) => { setSelectedRoomId(id); setActiveTool('select_room'); }}
              wallPreview={wallPreview}
              selectionRect={selectionRect}
              freehandStrokes={freehandStrokes}
              activeStroke={activeStroke}
              editing={activeTool !== 'wayfinding_test' && !previewOccupancy}
              allowRoomDrag={activeTool === 'select_room'}
              onRoomMove={liveMoveRoom}
              onRoomResize={liveResizeRoom}
              heat={occupancyHeat}
              path={activeTool === 'wayfinding_test' ? testWayfindingPath : []}
              markers={
                activeTool === 'wayfinding_test'
                  ? [
                      ...(testStart ? [{ cell: testStart, label: 'Start (Patient)', kind: 'you' as const }] : []),
                      ...(testEnd ? [{ cell: testEnd, label: 'Destination', kind: 'destination' as const }] : []),
                    ]
                  : occupancyMarkers
              }
              onCellClick={handleCellClick}
              onCellPaint={paintCell}
              onCellHover={(r, c) => setHoverCell({ r, c })}
            />
            </div>
            {showGuide && (
              <div className="absolute inset-4 z-40 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto max-w-md rounded-2xl border border-blue-500/30 bg-slate-950/95 p-5 text-white shadow-2xl space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-black"><HelpCircle className="h-4 w-4 text-sky-400" /> First floor plan</h4>
                  <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-300 font-semibold">
                    <li>Place registered rooms from the left tray, or spawn a preset block.</li>
                    <li>Drag rooms into place. Draw corridors with the tile brush (pick Corridor in the zone palette).</li>
                    <li>Drop an Entrance anchor, then Test Wayfinding.</li>
                    <li>Turn on Preview occupancy, then Save and Publish so patients can navigate.</li>
                  </ol>
                  <button onClick={() => setShowGuide(false)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold">Got it</button>
                </div>
              </div>
            )}
          </div>

          {/* Floating CAD Telemetry & Cursor Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/95 dark:bg-black/80 text-white px-4 py-2.5 text-xs font-mono shadow-md backdrop-blur-md border border-slate-800 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sky-400">
                [R: {hoverCell ? hoverCell.r : '—'}, C: {hoverCell ? hoverCell.c : '—'}]
              </span>
              <span>
                Zone: <strong className="text-white uppercase">{hoverCell ? (AREA_CONFIG[floor.cells[hoverCell.r]?.[hoverCell.c]]?.label || 'Empty') : '—'}</strong>
              </span>
            </div>
            {activeTool === 'wall_draw' && (
              <span className="text-cyan-300 font-bold">
                {!wallStart ? 'Click start cell to draw wall' : 'Move cursor to end point (90° Ortho Snap active)'}
              </span>
            )}
            {activeTool === 'wayfinding_test' && (
              <span className="text-emerald-300 font-bold">
                {!testStart ? 'Click Start Location' : !testEnd ? 'Click Destination Location' : `Path: ${testWayfindingPath.length} steps`}
              </span>
            )}
            <span className="text-slate-400 text-[11px]">{doc.cols}×{doc.rows} Grid Scale</span>
          </div>
        </div>

        {/* Right: Architectural Room Inspector & Structure Telemetry */}
        <div className="space-y-4">
          {selectedRoom ? (
            <div className="rounded-2xl border border-blue-500/40 bg-[var(--card-bg)] p-4 shadow-lg space-y-4 ring-2 ring-blue-500/20">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Room Inspector
                </h3>
                <button onClick={() => setSelectedRoomId(null)} className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  Close
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-1">Room Title</label>
                  <input
                    type="text"
                    value={selectedRoom.name}
                    onChange={(e) => updateSelectedRoom({ name: e.target.value })}
                    className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-1">Reassign Room Category</label>
                  <select
                    value={selectedRoom.type}
                    onChange={(e) => updateSelectedRoom({ type: e.target.value as AreaType })}
                    className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] cursor-pointer"
                  >
                    {Object.entries(AREA_CONFIG).filter(([k]) => k !== 'empty').map(([k, cfg]) => (
                      <option key={k} value={k}>{cfg.label}</option>
                    ))}
                  </select>
                </div>

                {rooms.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-1">Link Registered Hospital Room</label>
                    <select
                      value={selectedRoom.roomId || ''}
                      onChange={(e) => {
                        const rId = e.target.value;
                        const matched = rooms.find((r) => r.id === rId);
                        updateSelectedRoom({ roomId: rId || undefined, name: matched ? matched.name : selectedRoom.name });
                      }}
                      className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] cursor-pointer"
                    >
                      <option value="">— Unlinked Custom Room —</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-1">Width (m)</label>
                    <input
                      type="number"
                      min={2}
                      max={40}
                      value={selectedRoom.w * 2}
                      onChange={(e) => updateSelectedRoom({ w: Math.max(1, Math.floor((parseInt(e.target.value) || 4) / 2)) })}
                      className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-1">Height (m)</label>
                    <input
                      type="number"
                      min={2}
                      max={40}
                      value={selectedRoom.h * 2}
                      onChange={(e) => updateSelectedRoom({ h: Math.max(1, Math.floor((parseInt(e.target.value) || 4) / 2)) })}
                      className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-1">Doorway Orientation</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['north', 'south', 'west', 'east'] as const).map((side) => (
                      <button
                        key={side}
                        onClick={() => updateSelectedRoom({ doorSide: side })}
                        className={`rounded-lg py-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          selectedRoom.doorSide === side
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-[var(--inner-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-1">Move Position Nudge</label>
                  <div className="flex items-center justify-center gap-2 bg-[var(--inner-bg)] p-2 rounded-xl">
                    <button onClick={() => moveSelectedRoom(-1, 0)} className="p-2 rounded-lg bg-[var(--card-bg)] hover:bg-blue-500 hover:text-white transition cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
                    <button onClick={() => moveSelectedRoom(0, -1)} className="p-2 rounded-lg bg-[var(--card-bg)] hover:bg-blue-500 hover:text-white transition cursor-pointer"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => moveSelectedRoom(0, 1)} className="p-2 rounded-lg bg-[var(--card-bg)] hover:bg-blue-500 hover:text-white transition cursor-pointer"><ArrowDown className="w-4 h-4" /></button>
                    <button onClick={() => moveSelectedRoom(1, 0)} className="p-2 rounded-lg bg-[var(--card-bg)] hover:bg-blue-500 hover:text-white transition cursor-pointer"><ArrowRight className="w-4 h-4" /></button>
                  </div>
                </div>

                <button
                  onClick={deleteSelectedRoom}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Room Block
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <MousePointer className="w-4 h-4 text-blue-500" /> Room Selector
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-semibold">
                Click any architectural room block on the canvas to inspect & resize its dimensions, adjust doorways, or nudge its position.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Layers className="h-4 w-4 text-blue-500" /> Structure Summary
            </h3>
            <dl className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Floors</dt><dd className="font-bold text-[var(--text-primary)]">{doc.floors.length}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Room Blocks</dt><dd className="font-bold text-[var(--text-primary)]">{floor.rooms?.length ?? 0}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Overlapping rooms</dt><dd className={`font-bold ${overlappingIds.size ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>{overlappingIds.size}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Map Version</dt><dd className="font-bold text-[var(--text-primary)]">v{doc.version ?? '1'}</dd></div>
            </dl>

            <button
              onClick={clearCurrentFloorGrid}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Wipe Floor Plan
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Floor Anchors ({floor.anchors.length})</h3>
            {floor.anchors.length === 0 ? (
              <p className="text-xs italic text-[var(--text-muted)]">No anchors placed on this floor yet. Pick an anchor tool to place one.</p>
            ) : (
              <ul className="max-h-64 space-y-1.5 overflow-y-auto">
                {floor.anchors.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-xl bg-[var(--inner-bg)] border border-[var(--card-border)] px-3 py-2 text-xs">
                    <span className="truncate text-[var(--text-primary)] font-semibold">
                      <span className="font-bold text-blue-600 dark:text-sky-400 capitalize">{a.kind}</span> · {a.label}
                    </span>
                    <button
                      onClick={() => { pushHistory(); mutateFloor((f) => ({ ...f, anchors: f.anchors.filter((x) => x.id !== a.id) })); }}
                      className="text-[var(--text-muted)] hover:text-rose-500 transition-colors p-1 cursor-pointer"
                      title="Remove anchor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Anchor Placement Modal */}
      {pendingAnchor ? (
        <AnchorDialog
          kind={pendingAnchor.kind}
          rooms={rooms}
          onCancel={() => setPendingAnchor(null)}
          onCommit={commitAnchor}
        />
      ) : null}

      {/* Grid Size Settings Modal */}
      {isGridModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Grid Resolution Settings</h3>
            <p className="text-xs text-[var(--text-muted)]">Adjust rows and columns to match your hospital wing dimensions.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Columns (Width)</label>
                <input
                  type="number"
                  min={10}
                  max={80}
                  value={newCols}
                  onChange={(e) => setNewCols(parseInt(e.target.value) || 20)}
                  className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Rows (Height)</label>
                <input
                  type="number"
                  min={10}
                  max={80}
                  value={newRows}
                  onChange={(e) => setNewRows(parseInt(e.target.value) || 20)}
                  className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] font-bold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsGridModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--inner-bg)]"
              >
                Cancel
              </button>
              <button
                onClick={applyGridResolution}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white shadow-md"
              >
                Apply Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AnchorDialog = ({
  kind, rooms, onCancel, onCommit,
}: {
  kind: Anchor['kind'];
  rooms: RoomLite[];
  onCancel: () => void;
  onCommit: (label: string, roomId?: string, bedId?: string) => void;
}) => {
  const [label, setLabel] = useState('');
  const [roomId, setRoomId] = useState('');
  const [bedId, setBedId] = useState('');
  const selectedRoom = rooms.find((r) => r.id === roomId);

  const submit = () => {
    let finalLabel = label;
    if (kind === 'room' && selectedRoom) finalLabel = label || selectedRoom.name;
    if (kind === 'bed' && selectedRoom) {
      const bed = selectedRoom.beds?.find((b) => b.id === bedId);
      finalLabel = label || `${selectedRoom.name} · ${bed?.bedNumber ?? 'Bed'}`;
    }
    onCommit(finalLabel, roomId || undefined, kind === 'bed' ? bedId || undefined : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-[var(--text-primary)] capitalize">Place {kind} Anchor</h3>
        <div className="space-y-3">
          {(kind === 'room' || kind === 'bed') && (
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Link Room Record</span>
              <select
                value={roomId}
                onChange={(e) => { setRoomId(e.target.value); setBedId(''); }}
                className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">— Unlinked —</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
          )}
          {kind === 'bed' && selectedRoom?.beds?.length ? (
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Link Bed Record</span>
              <select
                value={bedId}
                onChange={(e) => setBedId(e.target.value)}
                className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">— Unlinked —</option>
                {selectedRoom.beds.map((b) => <option key={b.id} value={b.id}>Bed {b.bedNumber}</option>)}
              </select>
            </label>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Label / Name</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={kind === 'entrance' ? 'Main Entrance' : 'e.g. Pharmacy'}
              className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-xs text-[var(--text-primary)] font-semibold placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </label>
        </div>
        <div className="pt-2 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--inner-bg)] transition-colors cursor-pointer">Cancel</button>
          <button onClick={submit} className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-sm">Place Anchor</button>
        </div>
      </div>
    </div>
  );
};

