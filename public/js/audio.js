// audio.js - Web Speech Synthesis (en-US) + Web Audio API FX Synthesizer

class AudioManager {
  constructor() {
    this.muted = false;
    this.ctx = null;
    this.speechSynth = window.speechSynthesis;
    this.selectedVoice = null;
    this.initAudioContext();
    this.initVoices();
  }

  initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.ctx = new AudioContext();
    }
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initVoices() {
    if (!this.speechSynth) return;

    const setBestVoice = () => {
      const voices = this.speechSynth.getVoices();
      // Procura uma voz em-US amigável e natural
      const usVoices = voices.filter(v => v.lang === 'en-US' || v.lang.startsWith('en'));
      const friendlyVoices = usVoices.filter(v => 
        v.name.includes('Natural') || 
        v.name.includes('Google') || 
        v.name.includes('Samantha') || 
        v.name.includes('Zira') ||
        v.name.includes('Jenny')
      );
      this.selectedVoice = friendlyVoices[0] || usVoices[0] || voices[0] || null;

      // Procura uma voz em pt-BR acolhedora para o guia infantil
      const ptVoices = voices.filter(v => v.lang === 'pt-BR' || v.lang.startsWith('pt'));
      this.selectedVoicePt = ptVoices.find(v => 
        v.name.includes('Natural') || 
        v.name.includes('Google') || 
        v.name.includes('Luciana') || 
        v.name.includes('Francisca') ||
        v.name.includes('Maria')
      ) || ptVoices[0] || null;
    };

    setBestVoice();
    if (this.speechSynth.onvoiceschanged !== undefined) {
      this.speechSynth.onvoiceschanged = setBestVoice;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.speechSynth) {
      this.speechSynth.cancel();
    }
    return this.muted;
  }

  // Síntese de voz em inglês nativo (en-US)
  speak(text, rate = 0.9, pitch = 1.15) {
    if (this.muted || !this.speechSynth) return;

    this.speechSynth.cancel(); // cancela falas pendentes para não acumular atraso

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate; // fala pausada e clara para crianças
    utterance.pitch = pitch; // tom alegre e simpático
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    // Mostra balão visual de aprendizado na tela
    this.showWordBubble(text);

    // Watchdog anti-stall para Safari / Chrome móvel
    utterance.onend = () => {
      clearTimeout(this.speechWatchdog);
    };
    utterance.onerror = () => {
      clearTimeout(this.speechWatchdog);
    };

    clearTimeout(this.speechWatchdog);
    this.speechWatchdog = setTimeout(() => {
      if (this.speechSynth && this.speechSynth.speaking) {
        this.speechSynth.resume();
      }
    }, 4000);

    this.speechSynth.speak(utterance);
  }

  // Síntese de voz em português brasileiro para orientações e guia infantil
  speakPt(text, rate = 0.95, pitch = 1.15) {
    if (this.muted || !this.speechSynth) return;

    this.speechSynth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = rate; // fala natural, pausada e acolhedora
    utterance.pitch = pitch; // tom alegre e simpático
    if (this.selectedVoicePt) {
      utterance.voice = this.selectedVoicePt;
    }

    this.showWordBubble(text);

    utterance.onend = () => { clearTimeout(this.speechWatchdog); };
    utterance.onerror = () => { clearTimeout(this.speechWatchdog); };

    clearTimeout(this.speechWatchdog);
    this.speechWatchdog = setTimeout(() => {
      if (this.speechSynth && this.speechSynth.speaking) {
        this.speechSynth.resume();
      }
    }, 4000);

    this.speechSynth.speak(utterance);
  }

  showWordBubble(text) {
    const bubble = document.getElementById('word-bubble');
    if (!bubble) return;
    bubble.textContent = `🗣️ "${text}"`;
    bubble.classList.add('show');
    clearTimeout(this.bubbleTimeout);
    this.bubbleTimeout = setTimeout(() => {
      bubble.classList.remove('show');
    }, 1800);
  }

  // ================= EFEITOS SONOROS NATIVOS (WEB AUDIO API) =================

  // Som de pulo (mola)
  playJump() {
    if (this.muted || !this.ctx) return;
    this.resumeContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Som de coleta de item (estrela / moeda)
  playCollect() {
    if (this.muted || !this.ctx) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const playTone = (freq, start, dur) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    playTone(987.77, now, 0.12);        // B5
    playTone(1318.51, now + 0.08, 0.25); // E6
  }

  // Som de acerto da cor correta (arpeggio alegre de triunfo)
  playSuccess() {
    if (this.muted || !this.ctx) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.3, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.09 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.2);
    });
  }

  // Som suave de "tente novamente" (não frustrante)
  playTryAgain() {
    if (this.muted || !this.ctx) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Fanfarra triunfal do portal de vitória
  playFanfare() {
    if (this.muted || !this.ctx) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.15, t: 0.00 }, // C5
      { f: 523.25, d: 0.15, t: 0.18 }, // C5
      { f: 523.25, d: 0.15, t: 0.36 }, // C5
      { f: 659.25, d: 0.40, t: 0.54 }, // E5
      { f: 587.33, d: 0.20, t: 0.96 }, // D5
      { f: 783.99, d: 0.60, t: 1.18 }  // G5
    ];

    melody.forEach(item => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.f, now + item.t);
      gain.gain.setValueAtTime(0.35, now + item.t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + item.t + item.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + item.t);
      osc.stop(now + item.t + item.d);
    });
  }

  // Som alegre de coleta de moedas (+Coins)
  playCoin() {
    if (this.muted || !this.ctx) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Som triunfal de Level Up
  playLevelUp() {
    if (this.muted || !this.ctx) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    arpeggio.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.3, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  }

  // Som comemorativo do Desafio Diário
  playDailyComplete() {
    if (this.muted || !this.ctx) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const notes = [659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.28, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  }
}

window.audioManager = new AudioManager();
