import { EventEmitter } from 'events';
import chalk from 'chalk';
import { WhisperService } from './WhisperService';
import { OllamaService } from './OllamaService';
import { TTSService } from './TTSService';
import { AudioService } from './AudioService';
import { writeFileSync } from 'fs';

export interface AIVoiceProxyConfig {
  whisper: {
    model?: string;
    language?: string;
    serviceUrl?: string;
  };
  ollama: {
    model?: string;
    baseUrl?: string;
  };
  tts: {
    serviceUrl?: string;
    model?: string;
    voiceId?: string;
  };
  audio: {
    sampleRate?: number;
    channels?: number;
    bitDepth?: number;
    inputDevice?: string;
    outputDevice?: string;
  };
  realtime?: {
    enabled: boolean;
    chunkDuration?: number; // seconds
    silenceThreshold?: number;
  };
}

export interface ProcessingState {
  isListening: boolean;
  isProcessing: boolean;
  lastTranscript: string;
  lastImprovedText: string;
  currentVoiceId?: string;
}

export class AIVoiceProxyOrchestrator extends EventEmitter {
  private whisperService: WhisperService;
  private ollamaService: OllamaService;
  private ttsService: TTSService;
  private audioService: AudioService;
  private state: ProcessingState;
  private config: AIVoiceProxyConfig;
  private audioBuffer: Buffer[] = [];
  private isRealTimeMode: boolean = false;

  constructor(config: AIVoiceProxyConfig) {
    super();
    this.config = config;
    
    // Initialize services
    this.whisperService = new WhisperService(config.whisper);
    this.ollamaService = new OllamaService(config.ollama);
    this.ttsService = new TTSService(config.tts);
    this.audioService = new AudioService(config.audio);

    this.state = {
      isListening: false,
      isProcessing: false,
      lastTranscript: '',
      lastImprovedText: '',
      currentVoiceId: config.tts.voiceId,
    };

    this.setupAudioHandlers();
  }

  /**
   * Initialize the AI Voice Proxy system
   */
  async initialize(): Promise<void> {
    try {
      console.log(chalk.cyan('🔄 ') + chalk.bold('Initializing AI Voice Proxy...'));
      
      // Check if all services are available
      const [whisperAvailable, ollamaAvailable, ttsAvailable] = await Promise.all([
        this.whisperService.isAvailable(),
        this.ollamaService.isAvailable(),
        this.ttsService.isAvailable(),
      ]);

      if (!whisperAvailable) {
        console.warn(chalk.yellow('⚠️  Whisper service not available. Install with: ') + chalk.cyan('pip install openai-whisper'));
      } else {
        console.log(chalk.green('✅ Whisper service ready'));
      }

      if (!ollamaAvailable) {
        console.warn(chalk.yellow('⚠️  Ollama not available. Install from: ') + chalk.blue.underline('https://ollama.ai'));
        await this.ollamaService.installModel();
      } else {
        console.log(chalk.green('✅ Ollama service ready'));
      }

      if (!ttsAvailable) {
        console.warn(chalk.yellow('⚠️  TTS service not available. Please start the TTS server.'));
      } else {
        console.log(chalk.green('✅ TTS service ready'));
      }

      // Check BlackHole installation
      if (!this.audioService.isBlackHoleInstalled()) {
        console.warn(chalk.yellow('⚠️  BlackHole not detected. Install from: ') + chalk.blue.underline('https://github.com/ExistentialAudio/BlackHole'));
      } else {
        console.log(chalk.green('✅ BlackHole audio driver ready'));
      }

      console.log(chalk.green('🎯 ') + chalk.bold.green('AI Voice Proxy initialization complete'));
      this.emit('initialized');
    } catch (error) {
      console.error(chalk.red('❌ Initialization error:'), error);
      this.emit('error', error);
    }
  }

  /**
   * Clone voice using a sample audio file
   */
  async cloneVoice(sampleAudioPath: string, voiceName: string): Promise<string> {
    try {
      console.log(chalk.cyan('🎭 Voice Cloning: Processing sample from ') + chalk.yellow(sampleAudioPath));
      const voiceId = await this.ttsService.cloneVoice({
        sampleAudioPath,
        voiceName,
      });
      
      this.state.currentVoiceId = voiceId;
      this.ttsService.setVoiceId(voiceId);
      
      console.log(chalk.green('🎉 Voice Cloning: Voice cloned successfully! Voice ID: ') + chalk.yellow(voiceId));
      this.emit('voiceCloned', { voiceId, voiceName });
      
      return voiceId;
    } catch (error) {
      console.error(chalk.red('❌ Voice Cloning: Error occurred:'), error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Start real-time voice proxy mode
   */
  async startRealTimeMode(): Promise<void> {
    if (this.isRealTimeMode) {
      console.warn(chalk.yellow('⚠️  Real-time mode already active'));
      return;
    }

    try {
      this.isRealTimeMode = true;
      console.log(chalk.cyan('🎙️  Starting real-time voice proxy mode...'));
      
      // Start listening to microphone
      this.audioService.startRecording();
      this.state.isListening = true;
      
      console.log(chalk.green('🔴 Real-time mode active. Speak into the microphone.'));
      this.emit('realTimeModeStarted');
    } catch (error) {
      console.error(chalk.red('❌ Error starting real-time mode:'), error);
      this.emit('error', error);
    }
  }

  /**
   * Stop real-time voice proxy mode
   */
  stopRealTimeMode(): void {
    if (!this.isRealTimeMode) {
      return;
    }

    this.isRealTimeMode = false;
    this.audioService.stopRecording();
    this.state.isListening = false;
    this.audioBuffer = [];
    
    console.log(chalk.blue('🛑 Real-time mode stopped'));
    this.emit('realTimeModeStopped');
  }

  /**
   * Process a single text input (non-real-time mode)
   */
  async processText(text: string): Promise<{ improvedText: string; audioBuffer: Buffer }> {
    try {
      this.state.isProcessing = true;
      this.emit('processingStarted', { type: 'text', input: text });

      // Improve text with Ollama
      console.log(chalk.cyan('🤖 Processing: Improving text with AI...'));
      const improvedText = await this.ollamaService.rephraseText(text);
      this.state.lastImprovedText = improvedText;
      
      console.log(chalk.yellow('📝 Original: ') + chalk.gray(text));
      console.log(chalk.green('✨ Improved: ') + chalk.white(improvedText));

      // Generate speech
      console.log(chalk.cyan('🗣️  Processing: Generating speech...'));
      const audioBuffer = await this.ttsService.synthesizeText(improvedText);

      this.state.isProcessing = false;
      this.emit('processingComplete', { improvedText, audioBuffer });

      return { improvedText, audioBuffer };
    } catch (error) {
      this.state.isProcessing = false;
      console.error(chalk.red('❌ Processing: Text processing error:'), error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Process audio file (non-real-time mode)
   */
  async processAudioFile(audioFilePath: string): Promise<{ transcript: string; improvedText: string; audioBuffer: Buffer }> {
    try {
      this.state.isProcessing = true;
      this.emit('processingStarted', { type: 'audio', input: audioFilePath });

      // Transcribe audio
      console.log('Transcribing audio...');
      const transcript = await this.whisperService.transcribeAudio(audioFilePath);
      this.state.lastTranscript = transcript;
      
      if (!transcript.trim()) {
        throw new Error('No speech detected in audio');
      }

      console.log(`Transcript: ${transcript}`);

      // Process the transcript
      const result = await this.processText(transcript);

      this.state.isProcessing = false;
      return {
        transcript,
        improvedText: result.improvedText,
        audioBuffer: result.audioBuffer,
      };
    } catch (error) {
      this.state.isProcessing = false;
      console.error('Audio processing error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Play processed audio to virtual microphone
   */
  playToVirtualMic(audioBuffer: Buffer): void {
    try {
      this.audioService.streamToVirtualMic(audioBuffer);
      this.emit('audioPlayed', { size: audioBuffer.length });
    } catch (error) {
      console.error('Virtual mic playback error:', error);
      this.emit('error', error);
    }
  }

  /**
   * Get current processing state
   */
  getState(): ProcessingState {
    return { ...this.state };
  }

  /**
   * Get available audio devices
   */
  getAudioDevices(): { input: string[]; output: string[] } {
    return this.audioService.listAudioDevices();
  }

  /**
   * Get service availability status
   */
  async getServiceStatus(): Promise<{
    whisperAvailable: boolean;
    ollamaAvailable: boolean;
    ttsAvailable: boolean;
    blackHoleInstalled: boolean;
    realtimeActive: boolean;
  }> {
    const [whisperAvailable, ollamaAvailable, ttsAvailable] = await Promise.all([
      this.whisperService.isAvailable(),
      this.ollamaService.isAvailable(),
      this.ttsService.isAvailable(),
    ]);

    return {
      whisperAvailable,
      ollamaAvailable,
      ttsAvailable,
      blackHoleInstalled: this.audioService.isBlackHoleInstalled(),
      realtimeActive: this.isRealTimeMode,
    };
  }

  /**
   * Setup audio event handlers for real-time processing
   */
  private setupAudioHandlers(): void {
    this.audioService.on('audioData', (data: Buffer) => {
      if (!this.isRealTimeMode) return;

      this.audioBuffer.push(data);
      
      // Process chunks based on duration or buffer size
      const chunkDuration = this.config.realtime?.chunkDuration || 3; // seconds
      const sampleRate = this.config.audio.sampleRate || 16000;
      const expectedChunkSize = sampleRate * chunkDuration * 2; // 16-bit samples

      const totalBufferSize = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
      
      if (totalBufferSize >= expectedChunkSize) {
        this.processAudioChunk();
      }
    });

    this.audioService.on('error', (error: Error) => {
      this.emit('error', error);
    });

    this.audioService.on('recordingStopped', () => {
      if (this.audioBuffer.length > 0) {
        this.processAudioChunk();
      }
    });
  }

  /**
   * Process accumulated audio buffer in real-time
   */
  private async processAudioChunk(): Promise<void> {
    if (this.audioBuffer.length === 0 || this.state.isProcessing) {
      return;
    }

    try {
      // Combine audio buffers
      const combinedBuffer = Buffer.concat(this.audioBuffer);
      this.audioBuffer = [];

      // Convert to WAV format
      const wavBuffer = this.audioService.toWav(combinedBuffer);
      
      // Save temporary file for processing
      const tempFile = `/tmp/audio_chunk_${Date.now()}.wav`;
      writeFileSync(tempFile, wavBuffer);

      // Process the audio chunk
      const result = await this.processAudioFile(tempFile);
      
      // Play the result to virtual microphone
      this.playToVirtualMic(result.audioBuffer);

      this.emit('chunkProcessed', {
        transcript: result.transcript,
        improvedText: result.improvedText,
        audioSize: result.audioBuffer.length,
      });

      // Clean up temp file
      setTimeout(() => {
        try {
          require('fs').unlinkSync(tempFile);
        } catch {
          // Ignore cleanup errors
        }
      }, 1000);

    } catch (error) {
      console.error('Audio chunk processing error:', error);
      this.emit('error', error);
    }
  }
}