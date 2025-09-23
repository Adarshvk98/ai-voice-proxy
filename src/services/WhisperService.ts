import axios from 'axios';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';
import path from 'path';

export interface WhisperConfig {
  model?: string;
  language?: string;
  serviceUrl?: string;
}

export class WhisperService {
  private model: string;
  private language: string;
  private serviceUrl: string;
  private isLocal: boolean;

  constructor(config: WhisperConfig) {
    this.model = config.model || 'base.en';
    this.language = config.language || 'en';
    this.serviceUrl = config.serviceUrl || 'http://localhost:9000';
    this.isLocal = !config.serviceUrl;
  }

  /**
   * Transcribe audio file to text
   */
  async transcribeAudio(audioFilePath: string): Promise<string> {
    try {
      if (this.isLocal) {
        return await this.transcribeWithCLI(audioFilePath);
      } else {
        return await this.transcribeWithAPI(audioFilePath);
      }
    } catch (error) {
      console.error(chalk.red('❌ Whisper: Audio transcription error:'), error);
      throw error;
    }
  }

  /**
   * Transcribe using local Whisper CLI
   */
  private async transcribeWithCLI(audioFilePath: string): Promise<string> {
    try {
      // Check if whisper is available
      if (!this.isWhisperInstalled()) {
        throw new Error('Whisper is not installed. Please install it using: pip install openai-whisper');
      }

      // Use virtual environment whisper if available, otherwise system PATH
      const venvWhisperPath = path.join(process.cwd(), '.venv/bin/whisper');
      const whisperCommand = existsSync(venvWhisperPath) ? venvWhisperPath : 'whisper';
      
      const command = `${whisperCommand} "${audioFilePath}" --model ${this.model} --language ${this.language} --output_format txt --output_dir /tmp`;
      const output = execSync(command, { encoding: 'utf8' });
      
      // Read the generated transcript file
      const baseName = path.basename(audioFilePath, path.extname(audioFilePath));
      const transcriptPath = `/tmp/${baseName}.txt`;
      
      if (existsSync(transcriptPath)) {
        const transcript = readFileSync(transcriptPath, 'utf8');
        return transcript.trim();
      }
      
      return '';
    } catch (error) {
      console.error(chalk.red('❌ Whisper: CLI transcription error:'), error);
      throw error;
    }
  }

  /**
   * Transcribe using Whisper API server
   */
  private async transcribeWithAPI(audioFilePath: string): Promise<string> {
    try {
      const audioData = readFileSync(audioFilePath);
      const formData = new FormData();
      formData.append('audio', new Blob([audioData]), path.basename(audioFilePath));
      formData.append('model', this.model);
      formData.append('language', this.language);

      const response = await axios.post(`${this.serviceUrl}/v1/audio/transcriptions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      return response.data.text || '';
    } catch (error) {
      console.error(chalk.red('❌ Whisper: API transcription error:'), error);
      throw error;
    }
  }

  /**
   * Transcribe audio buffer directly
   */
  async transcribeBuffer(audioBuffer: Buffer, format: string = 'wav'): Promise<string> {
    try {
      const tempFilePath = `/tmp/temp_audio_${Date.now()}.${format}`;
      writeFileSync(tempFilePath, audioBuffer);
      
      const result = await this.transcribeAudio(tempFilePath);
      
      // Clean up temp file
      try {
        execSync(`rm "${tempFilePath}"`);
      } catch {
        // Ignore cleanup errors
      }
      
      return result;
    } catch (error) {
      console.error(chalk.red('❌ Whisper: Buffer transcription error:'), error);
      throw error;
    }
  }

  /**
   * Check if Whisper is installed locally
   */
  private isWhisperInstalled(): boolean {
    try {
      // Try virtual environment first, then system PATH
      const venvPath = path.join(process.cwd(), '.venv/bin/whisper');
      if (existsSync(venvPath)) {
        execSync(`${venvPath} --help`, { stdio: 'ignore' });
        return true;
      }
      // Fallback to system PATH
      execSync('whisper --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if the service is available
   */
  async isAvailable(): Promise<boolean> {
    if (this.isLocal) {
      return this.isWhisperInstalled();
    } else {
      try {
        await axios.get(`${this.serviceUrl}/health`, { timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Real-time transcription for streaming audio
   */
  async startRealtimeTranscription(onTranscript: (text: string) => void): Promise<void> {
    // This would implement streaming transcription
    // For now, we'll use a polling approach with temporary files
    console.log(chalk.cyan('🔄 Whisper: Real-time transcription started'));
    
    // Implementation would involve:
    // 1. Continuous audio capture
    // 2. Chunked transcription
    // 3. Streaming results via callback
  }
}