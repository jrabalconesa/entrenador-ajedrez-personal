export type EngineScore = {
  type: 'cp' | 'mate';
  value: number;
};

export type StockfishLine = {
  bestMove: string;
  depth?: number;
  pv?: string[];
  score?: EngineScore;
};

export type StockfishAnalyzeOptions = {
  depth?: number;
  movetimeMs?: number;
  timeoutMs?: number;
  workerUrl?: string;
};

type PendingAnalysis = {
  fen: string;
  resolve: (line: StockfishLine) => void;
  reject: (error: Error) => void;
  timer: number;
  latest: Partial<StockfishLine>;
};

const DEFAULT_TIMEOUT_MS = 3500;
const DEFAULT_MOVETIME_MS = 350;

export function getDefaultStockfishWorkerUrl(): string {
  return `${import.meta.env.BASE_URL}stockfish/stockfish.js`;
}

export function parseStockfishInfo(line: string): Partial<StockfishLine> {
  if (!line.startsWith('info ')) return {};

  const parts = line.split(/\s+/);
  const depthIndex = parts.indexOf('depth');
  const scoreIndex = parts.indexOf('score');
  const pvIndex = parts.indexOf('pv');
  const parsed: Partial<StockfishLine> = {};

  if (depthIndex >= 0 && parts[depthIndex + 1]) {
    const depth = Number(parts[depthIndex + 1]);
    if (Number.isFinite(depth)) parsed.depth = depth;
  }

  if (scoreIndex >= 0 && parts[scoreIndex + 1] && parts[scoreIndex + 2]) {
    const value = Number(parts[scoreIndex + 2]);
    if (Number.isFinite(value) && (parts[scoreIndex + 1] === 'cp' || parts[scoreIndex + 1] === 'mate')) {
      parsed.score = { type: parts[scoreIndex + 1] as EngineScore['type'], value };
    }
  }

  if (pvIndex >= 0 && parts[pvIndex + 1]) {
    parsed.pv = parts.slice(pvIndex + 1);
  }

  return parsed;
}

export function parseBestMove(line: string): string | null {
  if (!line.startsWith('bestmove ')) return null;
  const [, bestMove] = line.split(/\s+/);
  return bestMove && bestMove !== '(none)' ? bestMove : null;
}

export function normalizeUciMove(move: string): string {
  return move.trim().toLowerCase();
}

export class StockfishClient {
  private worker: Worker | null = null;
  private pending: PendingAnalysis | null = null;
  private ready = false;

  constructor(private readonly workerUrl = getDefaultStockfishWorkerUrl()) {}

  async analyzeFen(fen: string, options: StockfishAnalyzeOptions = {}): Promise<StockfishLine> {
    const worker = await this.getWorker(options.timeoutMs);

    if (this.pending) {
      this.pending.reject(new Error('Ya hay un análisis de motor en curso.'));
      window.clearTimeout(this.pending.timer);
      this.pending = null;
    }

    return new Promise<StockfishLine>((resolve, reject) => {
      const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const timer = window.setTimeout(() => {
        this.pending = null;
        reject(new Error('Stockfish tardó demasiado en responder.'));
      }, timeoutMs);

      this.pending = { fen, resolve, reject, timer, latest: {} };
      worker.postMessage('ucinewgame');
      worker.postMessage(`position fen ${fen}`);
      if (options.depth) {
        worker.postMessage(`go depth ${options.depth}`);
      } else {
        worker.postMessage(`go movetime ${options.movetimeMs ?? DEFAULT_MOVETIME_MS}`);
      }
    });
  }

  dispose() {
    if (this.pending) {
      window.clearTimeout(this.pending.timer);
      this.pending.reject(new Error('Motor detenido.'));
      this.pending = null;
    }
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
  }

  private async getWorker(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Worker> {
    if (typeof Worker === 'undefined') throw new Error('Este navegador no permite cargar Stockfish.');
    if (this.worker && this.ready) return this.worker;

    this.worker = new Worker(this.workerUrl);
    this.worker.onmessage = (event: MessageEvent<string>) => this.handleMessage(String(event.data));
    this.worker.onerror = () => {
      const error = new Error('No se pudo cargar Stockfish.');
      if (this.pending) {
        window.clearTimeout(this.pending.timer);
        this.pending.reject(error);
        this.pending = null;
      }
      this.dispose();
    };

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Stockfish no respondió al iniciar.')), timeoutMs);
      const previousHandler = this.worker?.onmessage ?? null;
      if (!this.worker) return reject(new Error('No se pudo crear el motor.'));
      this.worker.onmessage = (event: MessageEvent<string>) => {
        const message = String(event.data);
        if (message === 'uciok') {
          window.clearTimeout(timer);
          this.ready = true;
          this.worker!.onmessage = previousHandler;
          resolve();
        }
      };
      this.worker.postMessage('uci');
    });

    return this.worker;
  }

  private handleMessage(message: string) {
    if (!this.pending) return;

    const bestMove = parseBestMove(message);
    if (bestMove) {
      window.clearTimeout(this.pending.timer);
      const result = { ...this.pending.latest, bestMove };
      this.pending.resolve(result);
      this.pending = null;
      return;
    }

    const parsed = parseStockfishInfo(message);
    this.pending.latest = { ...this.pending.latest, ...parsed };
  }
}
