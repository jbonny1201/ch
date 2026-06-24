// Kid-friendly synthesizer and speech sound effect generator
class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Play a cheerful bubble pop sound
  playPop() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  }

  // Play an arcade catch/point score sound
  playCatch() {
    try {
      this.init();
      if (!this.ctx) return;
      
      // Fun upbeat 2-tone jump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.setValueAtTime(900, this.ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {
      console.warn(e);
    }
  }

  // Play a success chime for level up or truck state restore
  playChime() {
    try {
      this.init();
      if (!this.ctx) return;
      
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + index * 0.07);
        
        gain.gain.setValueAtTime(0, this.ctx!.currentTime + index * 0.07);
        gain.gain.linearRampToValueAtTime(0.12, this.ctx!.currentTime + index * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx!.currentTime + index * 0.07 + 0.3);
        
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + index * 0.07);
        osc.stop(this.ctx!.currentTime + index * 0.07 + 0.35);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Play game-over fail / bad sound
  playFail() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.41);
    } catch (e) {
      console.warn(e);
    }
  }

  // Korean Speech Synthesis (TTS) for accessibility & kid instruction
  speak(text: string) {
    try {
      if (!window.speechSynthesis) return;
      // Cancel any ongoing speeches
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.rate = 1.05; // Slightly cheerful speed
      utterance.pitch = 1.25; // Cheerful high-pitch for children's app
      
      // Find Korean voice if available
      const voices = window.speechSynthesis.getVoices();
      const kvoice = voices.find(v => v.lang.includes("ko") || v.lang.includes("KR"));
      if (kvoice) {
        utterance.voice = kvoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech Synthesis failed:", e);
    }
  }
}

export const sounds = new SoundManager();
