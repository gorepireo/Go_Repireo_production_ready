/**
 * Voice Guidance Service for Turn-by-Turn Delivery Navigation.
 * Uses the Web SpeechSynthesis API with deduplication, voice queue management,
 * and mute state control. Safe for SSR.
 */

class VoiceGuidanceService {
  private muted: boolean = false;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private minIntervalMs: number = 8000; // Do not repeat identical instruction within 8 seconds

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted && this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public speak(text: string, force: boolean = false): void {
    if (!this.isSupported() || this.muted) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    const now = Date.now();
    if (!force && trimmed === this.lastSpokenText && now - this.lastSpokenTime < this.minIntervalMs) {
      return;
    }

    try {
      // Cancel previous utterance to avoid long speech queues lagging behind fast driving
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.rate = 1.05; // Slightly brisk, clear delivery tone
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => (v.lang.startsWith('en') && v.name.includes('Google')) || v.name.includes('Natural')
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferred) {
        utterance.voice = preferred;
      }

      this.lastSpokenText = trimmed;
      this.lastSpokenTime = now;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[VoiceGuidance] Failed to speak instruction:', err);
    }
  }

  public stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceGuidance = new VoiceGuidanceService();
