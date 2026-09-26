// speech_recognition.js - Reconhecimento de Voz Infantil (Speech-to-Text) com Web Speech API

class KidSpeechRecognition {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.targetWord = '';
    this.onSuccessCallback = null;

    this.initRecognition();
    this.initOverlay();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateListeningUI(true);
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        this.handleSpeechResult(transcript);
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition warning/error:', event.error);
        this.stopListening();
        this.showSpeechFeedback('try_again', 'Good try! Tente falar de novo! 🎤');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateListeningUI(false);
      };
    } else {
      console.log('SpeechRecognition API not available in this browser. Fallback active.');
    }
  }

  initOverlay() {
    // Cria indicador visual dinâmico de escuta se não existir
    if (!document.getElementById('speech-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'speech-overlay';
      overlay.className = 'speech-overlay';
      overlay.innerHTML = `
        <div class="speech-box">
          <button class="speech-close-btn" id="speech-close-btn">✕</button>
          <div class="speech-mic-circle pulsing">
            <span class="speech-mic-icon">🎤</span>
          </div>
          <div class="speech-title" id="speech-status-title">Listening...</div>
          <div class="speech-target-word" id="speech-target-display">"LION"</div>
          <div class="speech-instruction" id="speech-instruction-txt">Diga a palavra em inglês no microfone!</div>
          <div class="speech-fallback-btn-row">
            <button class="speech-listen-repeat-btn" id="speech-listen-target-btn">🔊 Ouvir como fala</button>
            <button class="speech-pass-btn" id="speech-pass-btn">⭐ Eu disse!</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Eventos dos botões do overlay
      document.getElementById('speech-close-btn').addEventListener('click', () => this.stopListening());
      document.getElementById('speech-listen-target-btn').addEventListener('click', () => {
        if (window.audioManager && this.targetWord) {
          window.audioManager.speak(this.targetWord);
        }
      });
      document.getElementById('speech-pass-btn').addEventListener('click', () => {
        this.triggerSuccess(this.targetWord);
        this.stopListening();
      });
    }
  }

  listenForWord(word, onSuccess) {
    this.targetWord = (word || '').replace(/[!⭐🟦🦘🌀🦁🐘🐒🍌]/g, '').trim().toUpperCase();
    this.onSuccessCallback = onSuccess;

    const overlay = document.getElementById('speech-overlay');
    const targetDisplay = document.getElementById('speech-target-display');
    const title = document.getElementById('speech-status-title');
    const instruction = document.getElementById('speech-instruction-txt');

    if (targetDisplay) targetDisplay.textContent = `"${this.targetWord}"`;
    if (title) title.textContent = "Listening...";
    if (instruction) instruction.textContent = `Diga "${this.targetWord}" no microfone!`;

    if (overlay) overlay.classList.add('active');

    if (this.recognition) {
      try {
        this.recognition.abort();
        this.recognition.start();
      } catch (err) {
        console.warn('Recognition start exception:', err);
        this.updateListeningUI(true);
      }
    } else {
      // Fallback gracioso: ativa UI interativa amigável
      this.updateListeningUI(true);
      if (window.audioManager) {
        window.audioManager.speak(`Say: ${this.targetWord}`);
      }
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    const overlay = document.getElementById('speech-overlay');
    if (overlay) overlay.classList.remove('active');
    this.updateListeningUI(false);
  }

  updateListeningUI(isListening) {
    const speakBtn = document.getElementById('hud-speak-btn');
    if (speakBtn) {
      if (isListening) {
        speakBtn.classList.add('mic-active');
        speakBtn.innerHTML = '🔴 <span class="pronounce-txt">LISTENING...</span>';
      } else {
        speakBtn.classList.remove('mic-active');
        speakBtn.innerHTML = '🎤 <span class="pronounce-txt">SPEAK</span>';
      }
    }
  }

  // Correspondência flexível e tolerante para pronúncia infantil
  handleSpeechResult(spoken) {
    console.log(`🎤 Criança falou: "${spoken}" | Alvo esperado: "${this.targetWord}"`);
    const cleanTarget = this.targetWord.toLowerCase();

    // Dicionário de variantes fonéticas e aproximações infantis comuns
    const phoneticMap = {
      'jump': ['jump', 'jamp', 'jonp', 'djump', 'jum', 'pular'],
      'blue': ['blue', 'bloo', 'blu', 'blew', 'azul'],
      'star': ['star', 'sta', 'stor', 'estrela'],
      'one': ['one', 'wan', 'won', 'um'],
      'two': ['two', 'tu', 'too', 'to', 'dois'],
      'three': ['three', 'tree', 'tri', 'free', 'tres'],
      'lion': ['lion', 'laion', 'layon', 'lyon', 'leao'],
      'elephant': ['elephant', 'elefant', 'elefan', 'eli-fant', 'elefante'],
      'monkey': ['monkey', 'monki', 'munkey', 'manki', 'macaco'],
      'banana': ['banana', 'banan']
    };

    const validVariants = phoneticMap[cleanTarget] || [cleanTarget];
    const isMatch = validVariants.some(v => spoken.includes(v)) || spoken.includes(cleanTarget);

    if (isMatch) {
      this.triggerSuccess(this.targetWord);
      this.stopListening();
    } else {
      this.showSpeechFeedback('try_again', `Você falou: "${spoken}". Tente de novo! 🎤`);
      if (window.audioManager) {
        window.audioManager.playTryAgain();
        window.audioManager.speak(`Good try! Say: ${this.targetWord}`);
      }
    }
  }

  triggerSuccess(word) {
    // Feedback sonoro e comemoração
    if (window.audioManager) {
      window.audioManager.playSuccess();
      window.audioManager.speak(`Awesome! Perfect pronunciation! ${word}!`);
    }

    // Efeito de confetes
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Feedback no HUD
    if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
      window.gameApp.setWordHighlight(`⭐ PERFECT! ${word}! ⭐`, 'Excelente pronúncia em inglês!');
    }

    // Executa callback se houver
    if (typeof this.onSuccessCallback === 'function') {
      this.onSuccessCallback(word);
    }
  }

  showSpeechFeedback(type, message) {
    const instruction = document.getElementById('speech-instruction-txt');
    if (instruction) {
      instruction.textContent = message;
      instruction.style.color = type === 'try_again' ? '#fbbf24' : '#10b981';
      setTimeout(() => {
        if (instruction) {
          instruction.textContent = `Diga "${this.targetWord}" no microfone!`;
          instruction.style.color = '#94a3b8';
        }
      }, 2500);
    }
  }
}

window.KidSpeechRecognition = KidSpeechRecognition;
window.kidSpeech = new KidSpeechRecognition();
