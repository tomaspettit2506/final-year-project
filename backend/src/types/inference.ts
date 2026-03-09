export type PlayerColor = 'white' | 'black';

export interface BoardStatePayload {
  fen: string;
  moves?: string[];
  playerColor?: PlayerColor;
  moveNumber?: number;
}

export interface PredictRequestBody {
  boardState: BoardStatePayload;
  topK?: number;
  requestId?: string;
}

export interface ModelPrediction {
  bestMove: string;
  confidence: number;
  topMoves: Array<{
    move: string;
    score: number;
  }>;
}

export interface ModelInfo {
  name: string;
  version: string;
  source?: string;
}

export interface ModelInferResponse {
  requestId: string;
  prediction: ModelPrediction;
  model: ModelInfo;
  latencyMs?: number;
}

export interface PredictSuccessResponse extends ModelInferResponse {
  source: 'model-service';
  latencyMs: number;
}

export interface PredictErrorResponse {
  error: string;
  code: 'VALIDATION_ERROR' | 'MODEL_TIMEOUT' | 'MODEL_UPSTREAM_ERROR' | 'MODEL_BAD_RESPONSE';
  requestId?: string;
  details?: string;
}
