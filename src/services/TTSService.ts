import axios from 'axios';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';
import path from 'path';

export interface TTSConfig {
  serviceUrl?: string;
  model?: string;
  voiceId?: string;
  speed?: number;
  pitch?: number;
}

export interface VoiceCloneConfig {
  sampleAudioPath: string;
  voiceName: string;
  model?: string;
}

export class TTSService {
  private serviceUrl: string;
  private model: string;
  private voiceId: string;
  private speed: number;
  private pitch: number;
  private useLocalTTS: boolean;

  constructor(config: TTSConfig) {
    this.serviceUrl = config.serviceUrl || 'http://localhost:5002';
    this.model = config.model || 'tts_models/en/ljspeech/tacotron2-DDC';
    this.voiceId = config.voiceId || 'default';
    this.speed = config.speed || 1.0;
    this.pitch = config.pitch || 1.0;
    this.useLocalTTS = !config.serviceUrl; // Use local if no service URL provided
  }

  /**
   * Synthesize speech from text
   */
  async synthesizeText(text: string, outputPath?: string): Promise<Buffer> {
    try {
      if (this.useLocalTTS) {
        return await this.synthesizeWithLocalTTS(text, outputPath);
      } else {
        return await this.synthesizeWithRemoteTTS(text, outputPath);
      }
    } catch (error) {
      console.error(chalk.red('❌ TTS: Speech synthesis error:'), error);
      throw error;
    }
  }

  /**
   * Synthesize using local macOS TTS (say command)
   */
  private async synthesizeWithLocalTTS(text: string, outputPath?: string): Promise<Buffer> {
    try {
      const tempPath = outputPath || `/tmp/tts_${Date.now()}.aiff`;
      
      // Use macOS built-in 'say' command
      const command = `say "${text.replace(/"/g, '\\"')}" -o "${tempPath}"`;
      execSync(command);
      
      if (existsSync(tempPath)) {
        const audioBuffer = readFileSync(tempPath);
        
        // Clean up temp file if we created it
        if (!outputPath) {
          try {
            execSync(`rm "${tempPath}"`);
          } catch {
            // Ignore cleanup errors
          }
        }
        
        return audioBuffer;
      }
      
      throw new Error('Failed to generate audio file');
    } catch (error) {
      console.error(chalk.red('❌ TTS: Local synthesis error:'), error);
      throw error;
    }
  }

  /**
   * Synthesize using remote TTS service
   */
  private async synthesizeWithRemoteTTS(text: string, outputPath?: string): Promise<Buffer> {
    try {
      const response = await axios.post(`${this.serviceUrl}/api/tts`, {
        text,
        model_name: this.model,
        speaker_id: this.voiceId,
        speed: this.speed,
        pitch: this.pitch,
      }, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const audioBuffer = Buffer.from(response.data);
      
      if (outputPath) {
        writeFileSync(outputPath, audioBuffer);
      }
      
      return audioBuffer;
    } catch (error) {
      console.error(chalk.red('❌ TTS: Remote synthesis error:'), error);
      throw error;
    }
  }

  /**
   * Clone a voice using sample audio
   */
  async cloneVoice(config: VoiceCloneConfig): Promise<string> {
    try {
      if (!existsSync(config.sampleAudioPath)) {
        throw new Error(`Sample audio file not found: ${config.sampleAudioPath}`);
      }

      const audioData = readFileSync(config.sampleAudioPath);
      const formData = new FormData();
      formData.append('audio', new Blob([audioData]), path.basename(config.sampleAudioPath));
      formData.append('voice_name', config.voiceName);
      
      if (config.model) {
        formData.append('model', config.model);
      }

      const response = await axios.post(`${this.serviceUrl}/api/voice/clone`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Voice cloning can take time
      });

      const voiceId = response.data.voice_id;
      this.voiceId = voiceId;
      
      console.log(chalk.green('🎭 TTS: Voice cloned successfully! Voice ID: ') + chalk.yellow(voiceId));
      return voiceId;
    } catch (error) {
      console.error(chalk.red('❌ TTS: Voice cloning error:'), error);
      throw error;
    }
  }

  /**
   * List available voices
   */
  async listVoices(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.serviceUrl}/api/voices`);
      return response.data.voices || [];
    } catch (error) {
      console.error(chalk.red('❌ TTS: Error listing voices:'), error);
      return [];
    }
  }

  /**
   * Check if TTS service is available
   */
  async isAvailable(): Promise<boolean> {
    if (this.useLocalTTS) {
      // Check if macOS 'say' command is available
      try {
        execSync('which say', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    } else {
      // Check remote TTS service
      try {
        await axios.get(`${this.serviceUrl}/health`, { timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Set the voice ID for synthesis
   */
  setVoiceId(voiceId: string): void {
    this.voiceId = voiceId;
  }

  /**
   * Get current voice ID
   */
  getVoiceId(): string {
    return this.voiceId;
  }

  /**
   * Stream TTS synthesis for real-time use
   */
  async streamSynthesis(text: string, onChunk: (chunk: Buffer) => void): Promise<void> {
    try {
      const response = await axios.post(`${this.serviceUrl}/api/tts/stream`, {
        text,
        model_name: this.model,
        speaker_id: this.voiceId,
        speed: this.speed,
        pitch: this.pitch,
      }, {
        responseType: 'stream',
        timeout: 30000,
      });

      response.data.on('data', (chunk: Buffer) => {
        onChunk(chunk);
      });

      response.data.on('end', () => {
        console.log(chalk.green('✅ TTS: Streaming completed'));
      });

      response.data.on('error', (error: Error) => {
        console.error(chalk.red('❌ TTS: Streaming error:'), error);
      });
    } catch (error) {
      console.error(chalk.red('❌ TTS: Streaming error:'), error);
      throw error;
    }
  }

  /**
   * Alternative: Use local TTS with espeak (fallback)
   */
  async synthesizeWithEspeak(text: string, outputPath: string): Promise<void> {
    try {
      const command = `espeak "${text}" -w "${outputPath}" -s 150 -p 50`;
      execSync(command);
      console.log(chalk.green('🔊 TTS: Audio synthesized with espeak: ') + chalk.cyan(outputPath));
    } catch (error) {
      console.error(chalk.red('❌ TTS: Espeak synthesis error:'), error);
      throw error;
    }
  }
}