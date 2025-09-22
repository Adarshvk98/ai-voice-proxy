import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { AIVoiceProxyOrchestrator, AIVoiceProxyConfig } from './services/AIVoiceProxyOrchestrator';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// AI Voice Proxy configuration
const voiceProxyConfig: AIVoiceProxyConfig = {
  whisper: {
    model: process.env.WHISPER_MODEL || 'base.en',
    language: process.env.WHISPER_LANGUAGE || 'en',
    serviceUrl: process.env.WHISPER_SERVICE_URL,
  },
  ollama: {
    model: process.env.OLLAMA_MODEL || 'llama3',
    baseUrl: process.env.OLLAMA_BASE_URL,
  },
  tts: {
    serviceUrl: process.env.TTS_SERVICE_URL || 'http://localhost:5002',
    model: process.env.TTS_MODEL,
    voiceId: process.env.TTS_VOICE_ID,
  },
  audio: {
    sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '16000'),
    channels: parseInt(process.env.AUDIO_CHANNELS || '1'),
    bitDepth: parseInt(process.env.AUDIO_BIT_DEPTH || '16'),
    inputDevice: process.env.AUDIO_INPUT_DEVICE,
    outputDevice: process.env.AUDIO_OUTPUT_DEVICE || 'BlackHole 2ch',
  },
  realtime: {
    enabled: process.env.REALTIME_ENABLED === 'true',
    chunkDuration: parseInt(process.env.REALTIME_CHUNK_DURATION || '3'),
    silenceThreshold: parseFloat(process.env.REALTIME_SILENCE_THRESHOLD || '0.01'),
  },
};

// Initialize AI Voice Proxy
const aiVoiceProxy = new AIVoiceProxyOrchestrator(voiceProxyConfig);

// Setup routes
setupRoutes(app, aiVoiceProxy);

// WebSocket handling for real-time communication
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'startRealTime':
          await aiVoiceProxy.startRealTimeMode();
          ws.send(JSON.stringify({ type: 'realTimeStarted', success: true }));
          break;
          
        case 'stopRealTime':
          aiVoiceProxy.stopRealTimeMode();
          ws.send(JSON.stringify({ type: 'realTimeStopped', success: true }));
          break;
          
        case 'processText':
          const textResult = await aiVoiceProxy.processText(message.text);
          ws.send(JSON.stringify({ 
            type: 'textProcessed', 
            result: textResult 
          }));
          break;
          
        case 'cloneVoice':
          const voiceId = await aiVoiceProxy.cloneVoice(message.samplePath, message.voiceName);
          ws.send(JSON.stringify({ 
            type: 'voiceCloned', 
            voiceId 
          }));
          break;
          
        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// AI Voice Proxy event handlers
aiVoiceProxy.on('initialized', () => {
  console.log('AI Voice Proxy initialized successfully');
});

aiVoiceProxy.on('chunkProcessed', (data) => {
  console.log(`Processed chunk: "${data.transcript}" -> "${data.improvedText}"`);
  
  // Broadcast to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: 'chunkProcessed',
        data,
      }));
    }
  });
});

aiVoiceProxy.on('error', (error) => {
  console.error('AI Voice Proxy error:', error);
  
  // Broadcast error to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: 'error',
        message: error.message,
      }));
    }
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`AI Voice Proxy Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
  
  // Initialize the AI Voice Proxy
  try {
    await aiVoiceProxy.initialize();
  } catch (error) {
    console.error('Failed to initialize AI Voice Proxy:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  aiVoiceProxy.stopRealTimeMode();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server, wss, aiVoiceProxy };