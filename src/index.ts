import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { networkInterfaces } from 'os';
import { AIVoiceProxyOrchestrator, AIVoiceProxyConfig } from './services/AIVoiceProxyOrchestrator';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Helper function to get network addresses
function getNetworkAddresses(): string[] {
  const addresses: string[] = [];
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  
  return addresses;
}

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
    serviceUrl: process.env.TTS_SERVICE_URL, // Don't provide fallback - let TTSService decide
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
  console.log(chalk.green('🔗 WebSocket client connected'));
  
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
      console.error(chalk.red('❌ WebSocket error:'), error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  });
  
  ws.on('close', () => {
    console.log(chalk.yellow('🔌 WebSocket client disconnected'));
  });
});

// AI Voice Proxy event handlers
aiVoiceProxy.on('initialized', () => {
  console.log(chalk.green('🎉 AI Voice Proxy initialized successfully!'));
  console.log(chalk.cyan('📝 Ready to process voice and text requests\n'));
});

aiVoiceProxy.on('chunkProcessed', (data) => {
  console.log(chalk.cyan('🎤 ') + chalk.green('Processed chunk: ') + 
    chalk.yellow(`"${data.transcript}"`) + chalk.green(' → ') + 
    chalk.blue(`"${data.improvedText}"`));
  
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
  console.error(chalk.red('❌ AI Voice Proxy error:'), error);
  
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
  const networkAddresses = getNetworkAddresses();
  
  console.log('\n' + chalk.cyan('🚀 ') + chalk.bold.green('AI Voice Proxy Server Successfully Started!'));
  console.log(chalk.cyan('📍 Local: ') + chalk.blue.underline(`http://localhost:${PORT}`));
  
  if (networkAddresses.length > 0) {
    console.log(chalk.cyan('🌐 Network: ') + chalk.blue.underline(`http://${networkAddresses[0]}:${PORT}`));
    if (networkAddresses.length > 1) {
      networkAddresses.slice(1).forEach(addr => {
        console.log(chalk.cyan('         ') + chalk.blue.underline(`http://${addr}:${PORT}`));
      });
    }
  }
  
  console.log(chalk.cyan('🔌 Port: ') + chalk.yellow(PORT));
  console.log(chalk.cyan('🌐 WebSocket: ') + chalk.green('✅ Ready for connections'));
  console.log(chalk.gray('━'.repeat(60)));
  
  // Initialize the AI Voice Proxy
  try {
    await aiVoiceProxy.initialize();
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize AI Voice Proxy:'), error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(chalk.yellow('⚠️  SIGTERM received, shutting down gracefully...'));
  aiVoiceProxy.stopRealTimeMode();
  server.close(() => {
    console.log(chalk.green('✅ Server closed successfully'));
    process.exit(0);
  });
});

export { app, server, wss, aiVoiceProxy };