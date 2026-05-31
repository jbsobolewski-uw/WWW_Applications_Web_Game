// hexsweeper_main.ts — Game engine, renderer, and controller

import {
    type AxialCoord,
    type Cell,
    type Point,
    DIFFICULTY_CONFIG,
    HEX_SIZE,
    COLORS,
    hexKey,
    hexToPixel,
    pixelToHex,
    hexNeighbors,
    hexesInRadius,
    hexCorners,
    canvasSizeForRings,
} from './hexsweeper_utils.js';

// ---------------------------------------------------------------------------
// HexMinesweeper — game logic
// ---------------------------------------------------------------------------

class HexMinesweeper {
    readonly rings: number;
    readonly totalMines: number;
    readonly totalSafe: number;
    readonly cells: Map<string, Cell>;

    gameOver: boolean = false;
    won: boolean = false;
    started: boolean = false;
    flagCount: number = 0;
    revealedCount: number = 0;       // counts only safe cells revealed
    elapsed: number = 0;

    private startTime: number = 0;

    constructor(difficulty: number) {
        const cfg = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG[5]!;
        this.rings = cfg.rings;
        this.totalMines = cfg.mines;

        this.cells = new Map<string, Cell>();
        const allHexes = hexesInRadius(this.rings);
        this.totalSafe = allHexes.length - this.totalMines;

        for (const { q, r } of allHexes) {
            this.cells.set(hexKey(q, r), {
                q, r,
                mine: false,
                revealed: false,
                flagged: false,
                adjacentMines: 0,
            });
        }
    }

    // ---- Mine placement (deferred to first click) --------------------------

    private _placeMines(safeQ: number, safeR: number): void {
        // Build exclusion zone: clicked cell + all its neighbours
        const safeSet = new Set<string>();
        safeSet.add(hexKey(safeQ, safeR));
        for (const n of hexNeighbors(safeQ, safeR)) {
            safeSet.add(hexKey(n.q, n.r));
        }

        // Shuffle eligible candidates, take first N as mines
        const candidates = [...this.cells.keys()].filter(k => !safeSet.has(k));
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = candidates[i]!;
            candidates[i] = candidates[j]!;
            candidates[j] = tmp;
        }
        const mineKeys = candidates.slice(0, this.totalMines);
        for (const k of mineKeys) {
            this.cells.get(k)!.mine = true;
        }

        // Compute adjacency for every non-mine cell
        for (const [, cell] of this.cells) {
            if (cell.mine) continue;
            let count = 0;
            for (const n of hexNeighbors(cell.q, cell.r)) {
                const nc = this.cells.get(hexKey(n.q, n.r));
                if (nc?.mine) count++;
            }
            cell.adjacentMines = count;
        }
    }

    // ---- Public API --------------------------------------------------------

    reveal(q: number, r: number): void {
        if (this.gameOver || this.won) return;
        const cell = this.cells.get(hexKey(q, r));
        if (!cell || cell.revealed || cell.flagged) return;

        if (!this.started) {
            this.started = true;
            this.startTime = Date.now();
            this._placeMines(q, r);
        }

        this._floodReveal(q, r);
        this._checkWin();
    }

    toggleFlag(q: number, r: number): void {
        if (this.gameOver || this.won) return;
        const cell = this.cells.get(hexKey(q, r));
        if (!cell || cell.revealed) return;
        cell.flagged = !cell.flagged;
        this.flagCount += cell.flagged ? 1 : -1;
    }

    getElapsed(): number {
        if (!this.started) return 0;
        if (this.gameOver || this.won) return this.elapsed;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    // ---- Internals ---------------------------------------------------------

    private _floodReveal(q: number, r: number): void {
        const stack: AxialCoord[] = [{ q, r }];

        while (stack.length > 0) {
            const coord = stack.pop()!;
            const key = hexKey(coord.q, coord.r);
            const cell = this.cells.get(key);
            if (!cell || cell.revealed || cell.flagged) continue;

            cell.revealed = true;

            if (cell.mine) {
                // Hit a mine — game over; do NOT count it toward revealedCount
                this.gameOver = true;
                this.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                this._exposeAllMines();
                return;
            }

            // Only safe cells contribute to the win counter
            this.revealedCount++;

            if (cell.adjacentMines === 0) {
                for (const n of hexNeighbors(coord.q, coord.r)) {
                    if (this.cells.has(hexKey(n.q, n.r))) {
                        stack.push(n);
                    }
                }
            }
        }
    }

    private _exposeAllMines(): void {
        for (const [, cell] of this.cells) {
            if (cell.mine) cell.revealed = true;
        }
    }

    private _checkWin(): void {
        // Win condition: every safe cell has been revealed
        // Flagging is not required; mines never count toward revealedCount
        if (this.revealedCount >= this.totalSafe) {
            this.won = true;
            this.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        }
    }
}

// ---------------------------------------------------------------------------
// HexRenderer — canvas drawing
// ---------------------------------------------------------------------------

class HexRenderer {
    readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly game: HexMinesweeper;
    private readonly size: number;
    private readonly cx: number;
    private readonly cy: number;

    hoveredKey: string | null = null;

    constructor(canvas: HTMLCanvasElement, game: HexMinesweeper) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context from canvas');
        this.ctx = ctx;
        this.game = game;
        this.size = HEX_SIZE;

        const { w, h } = canvasSizeForRings(game.rings, this.size);
        this.cx = w / 2;
        this.cy = h / 2;
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
    }

    render(): void {
        const { ctx } = this;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const [key, cell] of this.game.cells) {
            let fill = COLORS.cellDefault;
            let stroke = COLORS.border;
            let strokeWidth = 1;

            if (
                key === this.hoveredKey &&
                !cell.revealed &&
                !cell.flagged &&
                !this.game.gameOver &&
                !this.game.won
            ) {
                fill = COLORS.cellHover;
            }

            if (cell.flagged) {
                fill = COLORS.cellFlag;
                stroke = COLORS.borderDark;
            } else if (cell.revealed) {
                if (cell.mine) {
                    fill = COLORS.cellMine;
                    stroke = COLORS.borderDark;
                    strokeWidth = 1.5;
                } else {
                    fill = COLORS.cellRevealed;
                    stroke = COLORS.border;
                }
            }

            this._drawHex(cell.q, cell.r, fill, stroke, strokeWidth);

            if (cell.revealed && !cell.mine && cell.adjacentMines > 0) {
                const col = COLORS.numbers[cell.adjacentMines] ?? COLORS.text;
                this._drawText(cell.q, cell.r, String(cell.adjacentMines), col, 13);
            } else if (cell.revealed && cell.mine) {
                this._drawText(cell.q, cell.r, '✕', COLORS.mineText, 13);
            } else if (cell.flagged) {
                this._drawText(cell.q, cell.r, '⚑', COLORS.text, 13);
            }
        }
    }

    getCellAtPixel(px: number, py: number): AxialCoord {
        return pixelToHex(px, py, this.size, this.cx, this.cy);
    }

    // ---- Private -----------------------------------------------------------

    private _drawHex(q: number, r: number, fill: string, stroke: string, strokeWidth: number): void {
        const center: Point = hexToPixel(q, r, this.size, this.cx, this.cy);
        const corners = hexCorners(center.x, center.y, this.size - 1.5);
        const { ctx } = this;

        ctx.beginPath();
        ctx.moveTo(corners[0]!.x, corners[0]!.y);
        for (let i = 1; i < 6; i++) {
            ctx.lineTo(corners[i]!.x, corners[i]!.y);
        }
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }

    private _drawText(q: number, r: number, text: string, color: string, fontSize: number): void {
        const { x, y } = hexToPixel(q, r, this.size, this.cx, this.cy);
        const { ctx } = this;
        ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }
}

// ---------------------------------------------------------------------------
// GameController — wires DOM to engine and renderer
// ---------------------------------------------------------------------------

class GameController {
    private readonly canvas: HTMLCanvasElement;
    private readonly diffSelect: HTMLSelectElement;
    private readonly newGameBtn: HTMLButtonElement;
    private readonly statusEl: HTMLElement;
    private readonly statMines: HTMLElement;
    private readonly statFlagged: HTMLElement;
    private readonly statTime: HTMLElement;

    private game!: HexMinesweeper;
    private renderer!: HexRenderer;
    private timerHandle: ReturnType<typeof setInterval> | null = null;

    constructor() {
        this.canvas     = this._getEl<HTMLCanvasElement>('hex-canvas');
        this.diffSelect = this._getEl<HTMLSelectElement>('game-difficulty');
        this.newGameBtn = this._getEl<HTMLButtonElement>('new-game-btn');
        this.statusEl   = this._getEl<HTMLElement>('game-status');
        this.statMines   = this._getEl<HTMLElement>('stat-mines');
        this.statFlagged = this._getEl<HTMLElement>('stat-flagged');
        this.statTime    = this._getEl<HTMLElement>('stat-time');

        // Sync difficulty from URL query param
        const params = new URLSearchParams(window.location.search);
        const urlDiff = parseInt(params.get('difficulty') ?? '', 10);
        if (urlDiff >= 1 && urlDiff <= 10) {
            this.diffSelect.value = String(urlDiff);
        }

        this.diffSelect.addEventListener('change', () => {
            const url = new URL(window.location.href);
            url.searchParams.set('difficulty', this.diffSelect.value);
            window.history.replaceState({}, '', url.toString());
            this.startGame();
        });

        this.newGameBtn.addEventListener('click', () => { this.startGame(); });

        this.canvas.addEventListener('click',       (e) => { this._onClick(e); });
        this.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); this._onRightClick(e); });
        this.canvas.addEventListener('mousemove',   (e) => { this._onMouseMove(e); });
        this.canvas.addEventListener('mouseleave',  ()  => {
            this.renderer.hoveredKey = null;
            this.renderer.render();
        });

        this.startGame();
    }

    startGame(): void {
        if (this.timerHandle !== null) {
            clearInterval(this.timerHandle);
            this.timerHandle = null;
        }

        const diff = parseInt(this.diffSelect.value, 10) || 5;
        this.game = new HexMinesweeper(diff);
        this.renderer = new HexRenderer(this.canvas, this.game);
        this.renderer.render();
        this._updateStats();
        this.statusEl.textContent = '';
        this.statusEl.className = '';

        this.timerHandle = setInterval(() => {
            this.statTime.textContent = String(this.game.getElapsed());
            if (this.game.gameOver || this.game.won) {
                clearInterval(this.timerHandle!);
                this.timerHandle = null;
            }
        }, 500);
    }

    // ---- Event handlers ----------------------------------------------------

    private _onClick(e: MouseEvent): void {
        const { x, y } = this._canvasPos(e);
        const { q, r } = this.renderer.getCellAtPixel(x, y);
        if (!this.game.cells.has(hexKey(q, r))) return;
        this.game.reveal(q, r);
        this.renderer.render();
        this._updateStats();
        this._checkEndState();
    }

    private _onRightClick(e: MouseEvent): void {
        const { x, y } = this._canvasPos(e);
        const { q, r } = this.renderer.getCellAtPixel(x, y);
        if (!this.game.cells.has(hexKey(q, r))) return;
        this.game.toggleFlag(q, r);
        this.renderer.render();
        this._updateStats();
    }

    private _onMouseMove(e: MouseEvent): void {
        if (this.game.gameOver || this.game.won) return;
        const { x, y } = this._canvasPos(e);
        const { q, r } = this.renderer.getCellAtPixel(x, y);
        const key = hexKey(q, r);
        if (this.renderer.hoveredKey !== key) {
            this.renderer.hoveredKey = this.game.cells.has(key) ? key : null;
            this.renderer.render();
        }
    }

    // ---- Helpers -----------------------------------------------------------

    private _canvasPos(e: MouseEvent): Point {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }

    private _updateStats(): void {
        this.statMines.textContent   = String(this.game.totalMines);
        this.statFlagged.textContent = String(this.game.flagCount);
        this.statTime.textContent    = String(this.game.getElapsed());
    }

    private _checkEndState(): void {
        if (this.game.won) {
            this.statusEl.textContent = `Cleared in ${this.game.elapsed}s`;
            this.statusEl.className = 'won';
        } else if (this.game.gameOver) {
            this.statusEl.textContent = 'Game over.';
            this.statusEl.className = 'lost';
        }
    }

    private _getEl<T extends Element>(id: string): T {
        const el = document.getElementById(id) as T | null;
        if (!el) throw new Error(`Element #${id} not found`);
        return el;
    }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    new GameController();
});