import { Router, Request, Response as ExpressResponse } from 'express';
import {
  BoardStatePayload,
  ModelInferResponse,
  PredictErrorResponse,
  PredictRequestBody,
  PredictSuccessResponse
} from '../types/inference';

const router = Router();

const DEFAULT_MODEL_INFER_URL = 'http://localhost:9000/infer';
const DEFAULT_MODEL_TIMEOUT_MS = 6000;

function resolveModelInferUrl(): string {
  const configured = process.env.MODEL_URL?.trim();
  if (!configured) return DEFAULT_MODEL_INFER_URL;
  if (configured.endsWith('/infer')) return configured;
  return `${configured.replace(/\/$/, '')}/infer`;
}

function resolveModelTimeoutMs(): number {
  const raw = process.env.MODEL_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MODEL_TIMEOUT_MS;
  return Math.round(parsed);
}

function getRequestId(req: Pick<Request, 'header'>): string {
  const fromHeader = req.header('x-request-id');
  if (typeof fromHeader === 'string' && fromHeader.trim().length > 0) {
    return fromHeader.trim();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseRequestId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

function parseTopK(value: unknown): number | undefined {
  if (typeof value === 'undefined') return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value)) return undefined;
  if (value < 1 || value > 10) return undefined;
  return value;
}

function sanitizeBoardState(value: unknown): BoardStatePayload | null {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Partial<BoardStatePayload>;
  const fen = typeof raw.fen === 'string' ? raw.fen.trim() : '';
  if (!fen) return null;

  const moves = Array.isArray(raw.moves)
    ? raw.moves.filter((move): move is string => typeof move === 'string' && move.trim().length > 0)
    : undefined;

  const playerColor = raw.playerColor === 'white' || raw.playerColor === 'black' ? raw.playerColor : undefined;

  const moveNumber =
    typeof raw.moveNumber === 'number' && Number.isFinite(raw.moveNumber) && raw.moveNumber >= 0
      ? Math.floor(raw.moveNumber)
      : undefined;

  return {
    fen,
    ...(moves ? { moves } : {}),
    ...(playerColor ? { playerColor } : {}),
    ...(typeof moveNumber === 'number' ? { moveNumber } : {})
  };
}

function isModelInferResponse(value: unknown): value is ModelInferResponse {
  if (!value || typeof value !== 'object') return false;

  const payload = value as Partial<ModelInferResponse>;
  const prediction = payload.prediction as ModelInferResponse['prediction'] | undefined;
  const model = payload.model as ModelInferResponse['model'] | undefined;

  if (typeof payload.requestId !== 'string' || payload.requestId.length === 0) return false;
  if (!prediction || typeof prediction !== 'object') return false;
  if (typeof prediction.bestMove !== 'string' || prediction.bestMove.length === 0) return false;
  if (typeof prediction.confidence !== 'number' || !Number.isFinite(prediction.confidence)) return false;
  if (!Array.isArray(prediction.topMoves)) return false;
  if (!model || typeof model !== 'object') return false;
  if (typeof model.name !== 'string' || model.name.length === 0) return false;
  if (typeof model.version !== 'string' || model.version.length === 0) return false;

  return true;
}

router.post('/', async (req: Request<unknown, unknown, Partial<PredictRequestBody>>, res: ExpressResponse<PredictSuccessResponse | PredictErrorResponse>) => {
  const requestId = parseRequestId(req.body?.requestId) ?? getRequestId(req);
  const boardState = sanitizeBoardState(req.body?.boardState);
  const topK = parseTopK(req.body?.topK);

  if (!boardState) {
    return res.status(400).json({
      error: 'Invalid request body. boardState.fen is required.',
      code: 'VALIDATION_ERROR',
      requestId
    });
  }

  if (typeof req.body?.topK !== 'undefined' && typeof topK === 'undefined') {
    return res.status(400).json({
      error: 'Invalid topK. It must be an integer between 1 and 10.',
      code: 'VALIDATION_ERROR',
      requestId
    });
  }

  const modelInferUrl = resolveModelInferUrl();
  const modelTimeoutMs = resolveModelTimeoutMs();
  const startedAt = Date.now();

  const payload: PredictRequestBody = {
    boardState,
    requestId,
    ...(typeof topK === 'number' ? { topK } : {})
  };

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), modelTimeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    const modelApiKey = process.env.MODEL_API_KEY?.trim();
    if (modelApiKey) {
      headers['x-model-api-key'] = modelApiKey;
    }

    const response = await fetch(modelInferUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      const upstreamBody = await response.text();
      console.error(
        `[predict] upstream error requestId=${requestId} status=${response.status} body=${upstreamBody}`
      );

      return res.status(502).json({
        error: 'Model service request failed.',
        code: 'MODEL_UPSTREAM_ERROR',
        requestId,
        details: `Upstream status: ${response.status}`
      });
    }

    const upstreamPayload = (await response.json()) as unknown;
    if (!isModelInferResponse(upstreamPayload)) {
      return res.status(502).json({
        error: 'Model service returned an unexpected response format.',
        code: 'MODEL_BAD_RESPONSE',
        requestId
      });
    }

    const latencyMs = Date.now() - startedAt;

    console.log(`[predict] requestId=${requestId} modelLatencyMs=${latencyMs}`);

    return res.status(200).json({
      ...upstreamPayload,
      requestId,
      source: 'model-service',
      latencyMs
    });
  } catch (error) {
    const didTimeout = controller.signal.aborted;

    if (didTimeout) {
      console.error(`[predict] timeout requestId=${requestId} timeoutMs=${modelTimeoutMs}`);
      return res.status(504).json({
        error: 'Model service request timed out.',
        code: 'MODEL_TIMEOUT',
        requestId,
        details: `Timeout after ${modelTimeoutMs}ms`
      });
    }

    const details = error instanceof Error ? error.message : String(error);
    console.error(`[predict] upstream call failed requestId=${requestId} error=${details}`);

    return res.status(502).json({
      error: 'Failed to contact model service.',
      code: 'MODEL_UPSTREAM_ERROR',
      requestId,
      details
    });
  } finally {
    clearTimeout(timeoutHandle);
  }
});

export default router;