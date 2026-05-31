// hexsweeper_utils.ts — Hex geometry and shared types/constants

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AxialCoord {
    q: number;
    r: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface Cell {
    q: number;
    r: number;
    mine: boolean;
    revealed: boolean;
    flagged: boolean;
    adjacentMines: number;
}

export interface DifficultyConfig {
    rings: number;
    mines: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const DIFFICULTY_CONFIG: Record<number, DifficultyConfig> = {
    1:  { rings: 3, mines: 6  },
    2:  { rings: 3, mines: 9  },
    3:  { rings: 4, mines: 14 },
    4:  { rings: 4, mines: 18 },
    5:  { rings: 4, mines: 22 },
    6:  { rings: 5, mines: 30 },
    7:  { rings: 5, mines: 38 },
    8:  { rings: 5, mines: 46 },
    9:  { rings: 6, mines: 58 },
    10: { rings: 6, mines: 72 },
};

export const HEX_SIZE = 28; // px center-to-vertex

export const COLORS = {
    cellDefault:  '#ede9e3',
    cellHover:    '#e8dbc4',
    cellRevealed: '#ffffff',
    cellMine:     '#c0392b',
    cellFlag:     '#92b775',
    border:       '#ede9e3',
    borderDark:   '#133215',
    text:         '#133215',
    // index 0 unused; indices 1–8 map to adjacentMines values
    numbers: ['', '#2980b9', '#27ae60', '#c0392b', '#1a5276', '#7b241c', '#148f77', '#1c2833', '#7f8c8d'] as string[],
    mineText: '#ffffff',
};

// ---------------------------------------------------------------------------
// Hex math
// ---------------------------------------------------------------------------

export function hexKey(q: number, r: number): string {
    return `${q},${r}`;
}

export function hexToPixel(q: number, r: number, size: number, cx: number, cy: number): Point {
    return {
        x: size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r) + cx,
        y: size * (1.5 * r) + cy,
    };
}

export function pixelToHex(px: number, py: number, size: number, cx: number, cy: number): AxialCoord {
    const x = (px - cx) / size;
    const y = (py - cy) / size;
    const q = (Math.sqrt(3) / 3) * x - (1 / 3) * y;
    const r = (2 / 3) * y;
    return hexRound(q, r);
}

function hexRound(q: number, r: number): AxialCoord {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);
    const dq = Math.abs(rq - q);
    const dr = Math.abs(rr - r);
    const ds = Math.abs(rs - s);
    if (dq > dr && dq > ds) {
        rq = -rr - rs;
    } else if (dr > ds) {
        rr = -rq - rs;
    }
    return { q: rq, r: rr };
}

export function hexNeighbors(q: number, r: number): AxialCoord[] {
    const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
    return dirs.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
}

export function hexesInRadius(rings: number): AxialCoord[] {
    const cells: AxialCoord[] = [];
    for (let q = -rings; q <= rings; q++) {
        const r1 = Math.max(-rings, -q - rings);
        const r2 = Math.min(rings, -q + rings);
        for (let r = r1; r <= r2; r++) {
            cells.push({ q, r });
        }
    }
    return cells;
}

// ---------------------------------------------------------------------------
// Canvas geometry
// ---------------------------------------------------------------------------

export function hexCorners(cx: number, cy: number, size: number): Point[] {
    const pts: Point[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i - 30);
        pts.push({ x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) });
    }
    return pts;
}

export function canvasSizeForRings(rings: number, size: number): { w: number; h: number } {
    const extent = size * (Math.sqrt(3) * rings + (Math.sqrt(3) / 2) * rings) + size * 2;
    const w = Math.ceil(extent * 2 + size * 2);
    const h = Math.ceil(size * (1.5 * rings * 2 + 2) + size * 2);
    return { w, h };
}