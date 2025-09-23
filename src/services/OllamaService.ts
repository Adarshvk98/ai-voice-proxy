import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';
import path from 'path';

export interface OllamaConfig {
  model?: string;
  baseUrl?: string;
}

export class OllamaService {
  private model: string;
  private baseUrl: string;

  constructor(config: OllamaConfig) {
    this.model = config.model || 'llama3';
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  /**
   * Rephrase and improve the input text using Ollama
   */
  async rephraseText(input: string): Promise<string> {
    try {
      const prompt = `Please rephrase the following text to make it clearer, more professional, and better structured while maintaining the original meaning: "${input}"`;
      
      // Use ollama CLI for local execution
      const command = `echo '${prompt.replace(/'/g, "'\\''")}' | ollama run ${this.model}`;
      const output = execSync(command, { encoding: 'utf8', timeout: 10000 });
      
      return output.trim() || input;
    } catch (error) {
      console.error(chalk.red('❌ Ollama: Text rephrasing error:'), error);
      return input; // Fallback to original text
    }
  }

  /**
   * Check if Ollama is available and the model is installed
   */
  async isAvailable(): Promise<boolean> {
    try {
      execSync('ollama --version', { stdio: 'ignore' });
      
      // Check if model is available
      const models = execSync('ollama list', { encoding: 'utf8' });
      return models.includes(this.model);
    } catch {
      return false;
    }
  }

  /**
   * Install the specified model if not available
   */
  async installModel(): Promise<void> {
    try {
      console.log(chalk.cyan('📦 Ollama: Installing model ') + chalk.yellow(this.model) + chalk.cyan('...'));
      execSync(`ollama pull ${this.model}`, { stdio: 'inherit' });
      console.log(chalk.green('✅ Ollama: Model ') + chalk.yellow(this.model) + chalk.green(' installed successfully'));
    } catch (error) {
      console.error(chalk.red(`❌ Ollama: Failed to install model ${this.model}:`), error);
      throw error;
    }
  }

  /**
   * Generate a response for general text processing
   */
  async generateResponse(prompt: string): Promise<string> {
    try {
      const command = `echo '${prompt.replace(/'/g, "'\\''")}' | ollama run ${this.model}`;
      const output = execSync(command, { encoding: 'utf8', timeout: 15000 });
      
      return output.trim();
    } catch (error) {
      console.error(chalk.red('❌ Ollama: Response generation error:'), error);
      throw error;
    }
  }
}