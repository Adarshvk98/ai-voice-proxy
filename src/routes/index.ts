import { Express, Request, Response } from 'express';
import { AIVoiceProxyOrchestrator } from '../services/AIVoiceProxyOrchestrator';

export function setupRoutes(app: Express, aiVoiceProxy: AIVoiceProxyOrchestrator): void {
  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    const state = aiVoiceProxy.getState();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      aiVoiceProxy: {
        isListening: state.isListening,
        isProcessing: state.isProcessing,
        currentVoiceId: state.currentVoiceId
      }
    });
  });

  // API info endpoint
  app.get('/api', (req: Request, res: Response) => {
    res.json({
      name: 'AI Voice Proxy Server',
      version: '1.0.0',
      description: 'A real-time AI voice proxy that improves your speech using local AI and voice cloning',
      features: [
        'Real-time speech recognition (Whisper)',
        'AI text improvement (Ollama)',
        'Voice cloning and synthesis (Coqui TTS)',
        'Virtual microphone output (BlackHole)',
        'WebSocket real-time communication'
      ],
      endpoints: {
        '/health': 'GET - Health check and status',
        '/api': 'GET - API information',
        '/status': 'GET - AI Voice Proxy status',
        '/devices': 'GET - Available audio devices',
        '/process-text': 'POST - Process text input',
        'ws://': 'WebSocket - Real-time voice proxy control'
      }
    });
  });

  // Status endpoint
  app.get('/status', (req: Request, res: Response) => {
    const state = aiVoiceProxy.getState();
    res.json({
      state,
      audioDevices: aiVoiceProxy.getAudioDevices()
    });
  });

  // Available audio devices
  app.get('/devices', (req: Request, res: Response) => {
    const devices = aiVoiceProxy.getAudioDevices();
    res.json(devices);
  });

  // Process text input (non-real-time)
  app.post('/process-text', async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, outputToVirtualMic = false } = req.body;
      
      if (!text) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      const result = await aiVoiceProxy.processText(text);
      
      if (outputToVirtualMic) {
        aiVoiceProxy.playToVirtualMic(result.audioBuffer);
      }

      res.json({
        success: true,
        originalText: text,
        improvedText: result.improvedText,
        audioGenerated: true,
        audioSize: result.audioBuffer.length,
        playedToVirtualMic: outputToVirtualMic
      });
    } catch (error) {
      console.error('Text processing error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Processing failed' 
      });
    }
  });

  // Start real-time mode
  app.post('/realtime/start', async (req: Request, res: Response) => {
    try {
      await aiVoiceProxy.startRealTimeMode();
      res.json({ success: true, message: 'Real-time mode started' });
    } catch (error) {
      console.error('Failed to start real-time mode:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to start real-time mode' 
      });
    }
  });

  // Stop real-time mode
  app.post('/realtime/stop', (req: Request, res: Response) => {
    try {
      aiVoiceProxy.stopRealTimeMode();
      res.json({ success: true, message: 'Real-time mode stopped' });
    } catch (error) {
      console.error('Failed to stop real-time mode:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to stop real-time mode' 
      });
    }
  });

  // Clone voice endpoint
  app.post('/voice/clone', async (req: Request, res: Response): Promise<void> => {
    try {
      const { samplePath, voiceName } = req.body;
      
      if (!samplePath || !voiceName) {
        res.status(400).json({ 
          error: 'samplePath and voiceName are required' 
        });
        return;
      }

      const voiceId = await aiVoiceProxy.cloneVoice(samplePath, voiceName);
      
      res.json({
        success: true,
        voiceId,
        voiceName,
        message: 'Voice cloned successfully'
      });
    } catch (error) {
      console.error('Voice cloning error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Voice cloning failed' 
      });
    }
  });

  // Default route
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'AI Voice Proxy Server is running',
      description: 'A real-time AI voice proxy for improving speech in video calls',
      instructions: [
        '1. Clone your voice using POST /voice/clone',
        '2. Start real-time mode with POST /realtime/start',
        '3. Configure BlackHole as your microphone in Teams/Slack/Zoom',
        '4. Speak normally - your improved voice will be transmitted',
        '5. Connect via WebSocket for real-time control and monitoring'
      ],
      api: '/api for detailed information',
      status: '/status for current state'
    });
  });
}