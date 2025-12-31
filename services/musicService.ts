import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';
const client = new GoogleGenAI({ 
  apiKey: API_KEY,
  apiVersion: "v1alpha" 
});

class MusicManager {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private session: any = null;
  private nextStartTime: number = 0;
  private isPlaying: boolean = false;
  private initialized: boolean = false;
  private connectPromise: Promise<void> | null = null;
  
  private lastMood: string = 'Peaceful';
  private lastSetting: string = 'Unknown';

  constructor() {
    if (typeof window !== 'undefined') {
      const initAudioOnInteraction = async () => {
        if (!this.initialized) return;
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
          try {
            await this.audioContext.resume();
            console.log("AudioContext resumed via user interaction");
          } catch (e) {
            return; // Try again on next interaction
          }
        }
        
        if (this.isPlaying && this.session) {
            try {
                await this.session.play();
            } catch (e) {}
        }
        
        window.removeEventListener('click', initAudioOnInteraction);
        window.removeEventListener('touchstart', initAudioOnInteraction);
        window.removeEventListener('keydown', initAudioOnInteraction);
      };
      window.addEventListener('click', initAudioOnInteraction);
      window.addEventListener('touchstart', initAudioOnInteraction);
      window.addEventListener('keydown', initAudioOnInteraction);
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.nextStartTime = this.audioContext.currentTime;
      this.initialized = true;
    }
    
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {}
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode) {
      const val = Math.max(0.0001, volume);
      this.gainNode.gain.setTargetAtTime(val, this.audioContext?.currentTime || 0, 0.1);
    }
  }

  public async connect(): Promise<void> {
    if (this.session) return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = (async () => {
      try {
        console.log("Connecting to Lyria RealTime...");
        this.session = await (client as any).live.music.connect({
          model: "models/lyria-realtime-exp",
          callbacks: {
            onmessage: (message: any) => {
              console.log("Lyria message received:", message);
              if (message.serverContent?.audioChunks) {
                for (const chunk of message.serverContent.audioChunks) {
                  this.handleAudioChunk(chunk.data);
                }
              }
            },
            onerror: (error: any) => {
                console.error("Lyria error event:", error);
                this.session = null;
            },
            onclose: (event: any) => {
              console.log("Lyria connection closed event:", event);
              this.session = null;
              this.isPlaying = false;
            },
          },
        });

        // 1. Set Initial Prompts
        const prompt = `East Asian lo-fi hip hop, ${this.lastMood} mood, location: ${this.lastSetting}, chill beats, traditional instruments`;
        await this.session.setWeightedPrompts({
          weightedPrompts: [
            { text: prompt, weight: 1.0 },
          ],
        });

        // 2. Set Generation Config
        await this.session.setMusicGenerationConfig({
          musicGenerationConfig: {
            bpm: 80,
            temperature: 1.0,
          },
        });

        // 3. Start Playback if enabled
        if (this.isPlaying) {
          console.log("Sending initial play command...");
          await this.session.play();
        }
        
        console.log("Lyria handshake complete");
      } catch (error) {
        console.error("Failed to connect to Lyria:", error);
        this.session = null;
        throw error;
      } finally {
        this.connectPromise = null;
      }
    })();

    return this.connectPromise;
  }

  private handleAudioChunk(base64Data: string) {
    if (!this.audioContext || !this.gainNode) return;

    try {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768.0;
        }

        const audioBuffer = this.audioContext.createBuffer(1, float32.length, 44100);
        const channelData = audioBuffer.getChannelData(0);
        
        // Simple DC Offset removal and clamping
        let lastSample = 0;
        for (let i = 0; i < float32.length; i++) {
            // Very simple high-pass filter to remove DC offset (buzzing)
            const sample = float32[i];
            const filtered = sample - lastSample + 0.995 * lastSample;
            lastSample = sample;
            // Clamp to prevent digital clipping
            channelData[i] = Math.max(-1, Math.min(1, filtered));
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Use a per-chunk gain node to prevent clicks at boundaries
        const chunkGain = this.audioContext.createGain();
        source.connect(chunkGain);
        chunkGain.connect(this.gainNode);

        const now = this.audioContext.currentTime;
        
        // If we are lagging behind, reset to now
        if (this.nextStartTime < now) {
            this.nextStartTime = now + 0.05; // Small buffer
        }

        const startTime = this.nextStartTime;
        
        // Simple fade-in/out to reduce clicks
        const fadeTime = 0.005; 
        chunkGain.gain.setValueAtTime(0, startTime);
        chunkGain.gain.linearRampToValueAtTime(1, startTime + fadeTime);
        chunkGain.gain.setValueAtTime(1, startTime + audioBuffer.duration - fadeTime);
        chunkGain.gain.linearRampToValueAtTime(0, startTime + audioBuffer.duration);

        source.start(startTime);
        this.nextStartTime = startTime + audioBuffer.duration;
    } catch (e) {
        console.error("Error decoding audio chunk", e);
    }
  }

  public async updateBGM(mood: string, setting: string) {
    this.lastMood = mood;
    this.lastSetting = setting;

    if (!this.session) return;

    const prompt = `East Asian lo-fi hip hop, ${mood} mood, location: ${setting}, 80bpm, chill atmospheric beats, traditional Asian instruments mixed with modern ambient pads`;
    
    try {
        console.log("Updating Lyria prompt:", prompt);
        await this.session.setWeightedPrompts({
          weightedPrompts: [
            { text: prompt, weight: 1.0 },
          ],
        });
    } catch (e) {
        console.error("Failed to update Lyria prompt", e);
    }
  }

  public async stop() {
    if (this.session) {
      try {
        await this.session.stop();
      } catch (e) {}
      this.isPlaying = false;
    }
    if (this.audioContext) {
      try {
        await this.audioContext.suspend();
      } catch (e) {}
    }
  }

  public async start() {
    await this.ensureAudioContext();
    this.isPlaying = true;
    if (this.session) {
      try {
        await this.session.play();
      } catch (e) {
          console.error("Failed to start Lyria playback", e);
      }
    }
  }
}

export const musicService = new MusicManager();