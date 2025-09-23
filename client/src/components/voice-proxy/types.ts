export interface ServerStatus {
  whisperAvailable: boolean
  ollamaAvailable: boolean
  ttsAvailable: boolean
  blackHoleInstalled: boolean
  realtimeActive: boolean
}

export interface TextProcessedMessage {
  type: 'textProcessed'
  result: {
    improvedText: string
  }
}

export interface ChunkProcessedMessage {
  type: 'chunkProcessed'
  data: unknown
}

export interface ErrorMessage {
  type: 'error'
  message: string
}

export interface RealTimeMessage {
  type: 'realTimeStarted' | 'realTimeStopped'
}

export type WebSocketMessage = TextProcessedMessage | ChunkProcessedMessage | ErrorMessage | RealTimeMessage

export const API_BASE_URL = 'http://localhost:3000'
export const WS_URL = 'ws://localhost:3000'