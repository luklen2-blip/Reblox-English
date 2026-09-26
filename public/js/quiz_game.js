// quiz_game.js - Mini-Jogo Educativo: Quiz de Voz e Memória Auditiva em Inglês

class VoiceQuizManager {
  constructor() {
    this.modal = null;
    this.currentQuestion = null;
    this.score = 0;
    this.totalAnswered = 0;
    this.consecutiveWins = 0;

    this.vocabPool = [
      { word: 'Jump', emoji: '🦘', hint: 'Pular' },
      { word: 'Walk', emoji: '👟', hint: 'Andar' },
      { word: 'Blue', emoji: '🟦', hint: 'Azul' },
      { word: 'Red', emoji: '🟥', hint: 'Vermelho' },
      { word: 'Star', emoji: '⭐', hint: 'Estrela' },
      { word: 'Lion', emoji: '🦁', hint: 'Leão' },
      { word: 'Elephant', emoji: '🐘', hint: 'Elefante' },
      { word: 'Monkey', emoji: '🐒', hint: 'Macaco' },
      { word: 'Banana', emoji: '🍌', hint: 'Banana' },
      { word: 'Apple', emoji: '🍎', hint: 'Maçã' },
      { word: 'Milk', emoji: '🥛', hint: 'Leite' },
      { word: 'Bread', emoji: '🍞', hint: 'Pão' },
      { word: 'Rocket', emoji: '🚀', hint: 'Foguete' },
      { word: 'Moon', emoji: '🌙', hint: 'Lua' },
      { word: 'Planet', emoji: '🪐', hint: 'Planeta' }
    ];

    this.init();
  }

  init() {
    this.modal = document.getElementById('quiz-modal');
  }

  open() {
    this.modal = this.modal || document.getElementById('quiz-modal');
    if (!this.modal) return;

    this.modal.classList.add('active');
    this.modal.style.display = 'flex';
    this.startNewRound();

    if (window.audioManager) {
      window.audioManager.playCollect();
    }
  }

  close() {
    this.modal = this.modal || document.getElementById('quiz-modal');
    if (this.modal) {
      this.modal.classList.remove('active');
      this.modal.style.display = 'none';
    }
  }

  startNewRound() {
    // Escolhe a palavra-alvo
    const targetIdx = Math.floor(Math.random() * this.vocabPool.length);
    const target = this.vocabPool[targetIdx];

    // Escolhe 2 opções erradas distintas
    const wrongOptions = this.vocabPool
      .filter((_, idx) => idx !== targetIdx)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    // Embaralha as 3 opções
    const options = [target, ...wrongOptions].sort(() => 0.5 - Math.random());
    this.currentQuestion = { target, options };

    this.renderQuestion();

    // Pronuncia a palavra para a criança ouvir
    setTimeout(() => {
      this.speakTarget();
    }, 400);
  }

  speakTarget() {
    if (window.audioManager && this.currentQuestion) {
      window.audioManager.speak(`Listen: ${this.currentQuestion.target.word}!`);
    }
  }

  renderQuestion() {
    const wordTitle = document.getElementById('quiz-target-word');
    const optionsGrid = document.getElementById('quiz-options-container');
    const scoreVal = document.getElementById('quiz-score-val');
    const feedbackBox = document.getElementById('quiz-feedback-box');

    if (scoreVal) scoreVal.textContent = `${this.score}`;
    if (feedbackBox) {
      feedbackBox.className = 'quiz-feedback-box';
      feedbackBox.textContent = 'Ouça com atenção e escolha a imagem certa!';
    }

    if (wordTitle) {
      wordTitle.textContent = `"${this.currentQuestion.target.word.toUpperCase()}"`;
    }

    if (optionsGrid) {
      optionsGrid.innerHTML = '';
      this.currentQuestion.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-card';
        btn.innerHTML = `
          <span class="quiz-opt-emoji">${opt.emoji}</span>
          <span class="quiz-opt-word">${opt.word}</span>
          <span class="quiz-opt-hint">${opt.hint}</span>
        `;
        btn.addEventListener('click', () => {
          this.handleAnswer(opt.word === this.currentQuestion.target.word, opt.word);
        });
        optionsGrid.appendChild(btn);
      });
    }
  }

  handleAnswer(isCorrect, selectedWord) {
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const targetWord = this.currentQuestion.target.word;

    this.totalAnswered++;

    if (isCorrect) {
      this.score += 10;
      this.consecutiveWins++;

      if (feedbackBox) {
        feedbackBox.className = 'quiz-feedback-box correct';
        feedbackBox.textContent = `🎉 EXCELLENT! You got it right! (+10 🪙 +25 XP)`;
      }

      if (window.audioManager) {
        window.audioManager.playCollect();
        window.audioManager.speak(`Great job! ${targetWord}!`);
      }

      if (window.gameStateManager) {
        window.gameStateManager.addCoins(10);
        window.gameStateManager.addXp(25);
        window.gameStateManager.recordWordAttempt(targetWord, true);

        if (this.consecutiveWins >= 3) {
          window.gameStateManager.unlockBadge('quiz_champion');
        }
      }

      if (typeof confetti === 'function') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
      }

      setTimeout(() => {
        this.startNewRound();
      }, 1500);

    } else {
      this.consecutiveWins = 0;

      if (feedbackBox) {
        feedbackBox.className = 'quiz-feedback-box wrong';
        feedbackBox.textContent = `💡 Good try! A resposta certa era "${targetWord}".`;
      }

      if (window.audioManager) {
        window.audioManager.playTryAgain();
        window.audioManager.speak(`Good try! The word is ${targetWord}.`);
      }

      if (window.gameStateManager) {
        window.gameStateManager.recordWordAttempt(targetWord, false);
      }

      setTimeout(() => {
        this.startNewRound();
      }, 2000);
    }
  }

  listenWithMic() {
    if (!this.currentQuestion) return;
    const targetWord = this.currentQuestion.target.word;

    if (window.kidSpeech) {
      window.kidSpeech.listenForWord(targetWord, (spoken) => {
        this.handleAnswer(true, spoken);
      });
    }
  }
}

// Instanciação e helpers globais
window.VoiceQuizManager = VoiceQuizManager;
window.quizManager = new VoiceQuizManager();
window.openQuizModal = () => window.quizManager.open();
window.closeQuizModal = () => window.quizManager.close();
