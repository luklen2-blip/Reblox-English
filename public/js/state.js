// state.js - Gerenciador Central de Estado do Jogo (userGameState)
// Persistência local no navegador e sincronização com nuvem

const DEFAULT_GAME_STATE = {
  isProUnlocked: false,       // Vira true após confirmação do PIX de R$ 19,90
  currentWorld: 1,            // Nível desbloqueado atual
  selectedSkin: 'default',    // ID da roupinha em uso
  collectedStars: 3,          // Progresso de recompensas
  wordsMastered: [            // Histórico para exibir aos pais
    'Walk', 
    'Jump', 
    'Blue', 
    'Red', 
    'Star'
  ],
  // Fase 2: Gamificação e Aprendizagem Contextual
  xp: 150,
  level: 1,
  coins: 30,
  badges: ['first_word'],
  wordStats: {
    'Walk': { attempts: 2, correct: 2, wrong: 0 },
    'Jump': { attempts: 2, correct: 2, wrong: 0 },
    'Blue': { attempts: 2, correct: 2, wrong: 0 },
    'Red': { attempts: 2, correct: 1, wrong: 1 },
    'Star': { attempts: 2, correct: 2, wrong: 0 }
  },
  streak: 1,
  lastActiveDate: new Date().toISOString().slice(0, 10),
  learningTimeSeconds: 120,
  dailyChallenge: {
    id: 'daily_colors_1',
    title: 'Find 3 Colors in English',
    targetCount: 3,
    progress: 1,
    completed: false,
    rewardCoins: 25,
    rewardXp: 50
  }
};

class GameStateManager {
  constructor() {
    this.storageKey = 'roblox_english_obby_state';
    this.state = this.loadState();
    window.userGameState = this.state;

    // Sincroniza retrocompatibilidade com chaves legadas
    this.syncLegacyKeys();

    // Renderiza vocabulário no modal dos pais e HUD se o DOM já estiver pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.renderParentsVocab();
        this.updateGamificationUI();
      });
    } else {
      this.renderParentsVocab();
      this.updateGamificationUI();
    }

    // Busca atualização na nuvem em segundo plano
    this.syncWithBackend();

    // Inicia contador de tempo de aprendizado em segundo plano
    setInterval(() => {
      this.state.learningTimeSeconds = (this.state.learningTimeSeconds || 0) + 10;
      if (this.state.learningTimeSeconds % 60 === 0) {
        this.save();
      }
    }, 10000);
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          isProUnlocked: typeof parsed.isProUnlocked === 'boolean' ? parsed.isProUnlocked : (localStorage.getItem('roblox_english_obby_unlocked') === 'true'),
          currentWorld: typeof parsed.currentWorld === 'number' ? parsed.currentWorld : 1,
          selectedSkin: parsed.selectedSkin || localStorage.getItem('roblox_english_obby_skin') || 'default',
          collectedStars: typeof parsed.collectedStars === 'number' ? parsed.collectedStars : DEFAULT_GAME_STATE.collectedStars,
          wordsMastered: Array.isArray(parsed.wordsMastered) && parsed.wordsMastered.length > 0
            ? parsed.wordsMastered
            : [...DEFAULT_GAME_STATE.wordsMastered],
          xp: typeof parsed.xp === 'number' ? parsed.xp : DEFAULT_GAME_STATE.xp,
          level: typeof parsed.level === 'number' ? parsed.level : DEFAULT_GAME_STATE.level,
          coins: typeof parsed.coins === 'number' ? parsed.coins : DEFAULT_GAME_STATE.coins,
          badges: Array.isArray(parsed.badges) ? parsed.badges : [...DEFAULT_GAME_STATE.badges],
          wordStats: (parsed.wordStats && typeof parsed.wordStats === 'object') ? parsed.wordStats : { ...DEFAULT_GAME_STATE.wordStats },
          streak: typeof parsed.streak === 'number' ? parsed.streak : 1,
          lastActiveDate: parsed.lastActiveDate || DEFAULT_GAME_STATE.lastActiveDate,
          learningTimeSeconds: typeof parsed.learningTimeSeconds === 'number' ? parsed.learningTimeSeconds : 0,
          dailyChallenge: (parsed.dailyChallenge && typeof parsed.dailyChallenge === 'object') ? parsed.dailyChallenge : { ...DEFAULT_GAME_STATE.dailyChallenge }
        };
      }
    } catch (e) {
      console.warn('Erro ao carregar estado do jogo, usando padrão:', e);
    }

    // Checa chaves legadas se não houver o objeto central ainda
    const legacyUnlocked = localStorage.getItem('roblox_english_obby_unlocked') === 'true';
    const legacySkin = localStorage.getItem('roblox_english_obby_skin') || 'default';

    return {
      ...DEFAULT_GAME_STATE,
      isProUnlocked: legacyUnlocked,
      selectedSkin: legacySkin,
      wordsMastered: [...DEFAULT_GAME_STATE.wordsMastered],
      wordStats: { ...DEFAULT_GAME_STATE.wordStats },
      badges: [...DEFAULT_GAME_STATE.badges],
      dailyChallenge: { ...DEFAULT_GAME_STATE.dailyChallenge }
    };
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      // Sincroniza chaves legadas para compatibilidade universal
      localStorage.setItem('roblox_english_obby_unlocked', String(this.state.isProUnlocked));
      localStorage.setItem('roblox_english_obby_skin', this.state.selectedSkin);
      window.userGameState = this.state;
    } catch (e) {
      console.warn('Erro ao salvar estado no localStorage:', e);
    }
  }

  syncLegacyKeys() {
    if (this.state.isProUnlocked) {
      localStorage.setItem('roblox_english_obby_unlocked', 'true');
    }
    if (this.state.selectedSkin) {
      localStorage.setItem('roblox_english_obby_skin', this.state.selectedSkin);
    }
  }

  async syncWithBackend() {
    try {
      const res = await fetch('/api/user/state');
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          if (data.state.isProUnlocked && !this.state.isProUnlocked) {
            this.state.isProUnlocked = true;
          }
          if (Array.isArray(data.state.wordsMastered)) {
            data.state.wordsMastered.forEach(w => this.addMasteredWord(w, false));
          }
          this.save();
          this.renderParentsVocab();
        }
      }
    } catch (e) {
      // Backend offline ou local, continua normalmente
    }
  }

  async pushToBackend() {
    try {
      await fetch('/api/user/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: this.state })
      });
    } catch (e) {}
  }

  // 1. Liberação do Pro após pagamento PIX
  unlockPro() {
    this.state.isProUnlocked = true;
    this.save();
    this.pushToBackend();

    // Atualiza badges da UI
    const vipEl = document.getElementById('vip-badge');
    if (vipEl) vipEl.style.display = 'block';

    const tag = document.getElementById('world-2-status-tag');
    if (tag) {
      tag.textContent = 'LIBERADO 👑';
      tag.className = 'world-card-tag world-tag-free';
    }

    if (window.skinManager) {
      window.skinManager.renderSkinGrid();
    }
  }

  // 2. Mudança de Mundo Atual
  setWorld(worldId) {
    this.state.currentWorld = worldId;
    this.save();
  }

  // 3. Mudança de Skin / Roupinha
  setSkin(skinId) {
    this.state.selectedSkin = skinId;
    this.save();
  }

  // 4. Progresso de Estrelas / Coletáveis
  addStar(count = 1) {
    this.state.collectedStars += count;
    this.save();
    this.updateStarUI();
  }

  setStars(count) {
    this.state.collectedStars = count;
    this.save();
    this.updateStarUI();
  }

  updateStarUI() {
    const starCountEl = document.getElementById('collectibles-counter');
    if (starCountEl) {
      starCountEl.textContent = `${this.state.collectedStars}`;
    }
  }

  // 5. Adiciona Palavra Dominada (com histórico para os pais)
  addMasteredWord(rawWord, saveNow = true) {
    if (!rawWord) return;
    const cleanWord = rawWord.replace(/[!⭐🟦🦘🌀🦁🐘🐒🍌]/g, '').trim();
    if (!cleanWord) return;

    // Formata capitalizada (ex: "Jump", "Blue")
    const formatted = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();

    if (!this.state.wordsMastered.includes(formatted)) {
      this.state.wordsMastered.push(formatted);
      if (saveNow) {
        this.save();
        this.pushToBackend();
        this.renderParentsVocab();
      }
    }
  }

  // Renderiza a lista interativa de palavras aprendidas na Área dos Pais
  renderParentsVocab() {
    const container = document.getElementById('vocab-tags-container') || document.querySelector('.vocab-tags');
    if (!container) return;

    const emojiMap = {
      'Walk': '👟',
      'Jump': '🦘',
      'Blue': '🟦',
      'Red': '🟥',
      'Star': '⭐',
      'One': '1️⃣',
      'Two': '2️⃣',
      'Three': '3️⃣',
      'Lion': '🦁',
      'Elephant': '🐘',
      'Monkey': '🐒',
      'Banana': '🍌',
      'Green': '🟩',
      'Orange': '🟧',
      'Yellow': '🟨'
    };

    container.innerHTML = '';

    this.state.wordsMastered.forEach(word => {
      const emoji = emojiMap[word] || '✨';
      const tag = document.createElement('div');
      tag.className = 'vocab-tag';
      tag.setAttribute('data-word', `${word}!`);
      tag.innerHTML = `${emoji} ${word.toUpperCase()} <span>🔊</span>`;

      tag.addEventListener('click', () => {
        if (window.audioManager) {
          window.audioManager.speak(`${word}! Good job!`);
        }
      });

      container.appendChild(tag);
    });

    // Atualiza subtítulo do modal com contagem real
    const count = this.state.wordsMastered.length;
    const subtitleEl = document.querySelector('.modal-subtitle');
    if (subtitleEl) {
      subtitleEl.innerHTML = `✨ You are awesome! <b>${count} palavras</b> aprendidas!`;
    }

    const titleVocab = document.querySelector('.vocab-title');
    if (titleVocab) {
      titleVocab.textContent = `${count} Palavras Dominadas (Toque para ouvir):`;
    }
  }

  // ================= MÉTODOS DA FASE 2: GAMIFICAÇÃO E APRENDIZAGEM ATIVA =================

  calculateLevel(xp) {
    if (xp >= 3000) return 6;
    if (xp >= 1800) return 5;
    if (xp >= 1000) return 4;
    if (xp >= 500) return 3;
    if (xp >= 200) return 2;
    return 1;
  }

  getLevelThresholds(level) {
    const limits = {
      1: { currentBase: 0, nextGoal: 200 },
      2: { currentBase: 200, nextGoal: 500 },
      3: { currentBase: 500, nextGoal: 1000 },
      4: { currentBase: 1000, nextGoal: 1800 },
      5: { currentBase: 1800, nextGoal: 3000 },
      6: { currentBase: 3000, nextGoal: 5000 }
    };
    return limits[level] || { currentBase: 0, nextGoal: 200 };
  }

  addXp(amount = 10) {
    const oldLevel = this.state.level || 1;
    this.state.xp = (this.state.xp || 0) + amount;
    const newLevel = this.calculateLevel(this.state.xp);
    this.state.level = newLevel;

    if (newLevel > oldLevel) {
      if (window.audioManager) {
        window.audioManager.playLevelUp();
        window.audioManager.speak(`Level up! You reached Level ${newLevel}! Awesome!`);
      }
      if (typeof confetti === 'function') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      }
      this.showCelebrationBanner(`🎉 LEVEL UP! NÍVEL ${newLevel}!`, `Você conquistou novos poderes no Roblox English!`);
    }

    this.save();
    this.updateGamificationUI();
  }

  addCoins(amount = 5) {
    this.state.coins = (this.state.coins || 0) + amount;
    if (window.audioManager) {
      window.audioManager.playCoin();
    }
    this.save();
    this.updateGamificationUI();
  }

  recordWordAttempt(rawWord, isCorrect) {
    if (!rawWord) return;
    const cleanWord = rawWord.replace(/[!⭐🟦🦘🌀🦁🐘🐒🍌🍞🥛🍎🍏]/g, '').trim();
    if (!cleanWord) return;
    const word = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();

    if (!this.state.wordStats) this.state.wordStats = {};
    if (!this.state.wordStats[word]) {
      this.state.wordStats[word] = { attempts: 0, correct: 0, wrong: 0 };
    }

    this.state.wordStats[word].attempts++;
    if (isCorrect) {
      this.state.wordStats[word].correct++;
      this.addMasteredWord(word);
      this.addXp(25);
      this.addCoins(5);
      this.updateDailyChallenge('word_correct');
      if (this.state.wordsMastered.length >= 1) this.unlockBadge('first_word');
      if (this.state.wordsMastered.length >= 10) this.unlockBadge('ten_words');
    } else {
      this.state.wordStats[word].wrong++;
    }

    this.save();
    this.updateGamificationUI();
  }

  unlockBadge(badgeId) {
    if (!this.state.badges) this.state.badges = [];
    if (!this.state.badges.includes(badgeId)) {
      this.state.badges.push(badgeId);
      this.addXp(50);
      this.addCoins(20);
      this.save();
      this.updateGamificationUI();

      const badgeNames = {
        'first_word': '🏆 Primeira Palavra!',
        'ten_words': '🏆 10 Palavras Aprendidas!',
        'animal_master': '🦁 Mestre dos Animais!',
        'color_master': '🌈 Mestre das Cores!',
        'seven_streak': '🔥 7 Dias de Atividade!',
        'world1_complete': '⭐ Rainbow Bridge Vencido!',
        'world2_complete': '🦁 Safari Vencido!',
        'world3_complete': '🍎 Kitchen & Fruits Vencido!'
      };
      const title = badgeNames[badgeId] || '🏆 Nova Conquista!';
      this.showCelebrationBanner(title, 'Conquista desbloqueada com sucesso!');
    }
  }

  getWordsToReview() {
    if (!this.state.wordStats) return [];
    return Object.entries(this.state.wordStats)
      .filter(([_, stats]) => (stats.wrong > 0) || (stats.correct === 0 && stats.attempts > 0))
      .sort((a, b) => b[1].wrong - a[1].wrong)
      .map(([word, stats]) => ({
        word,
        wrong: stats.wrong,
        correct: stats.correct,
        attempts: stats.attempts
      }));
  }

  getAccuracy() {
    if (!this.state.wordStats) return 100;
    let totalCorrect = 0;
    let totalAttempts = 0;
    for (const stats of Object.values(this.state.wordStats)) {
      totalCorrect += (stats.correct || 0);
      totalAttempts += (stats.attempts || 0);
    }
    if (totalAttempts === 0) return 100;
    return Math.round((totalCorrect / totalAttempts) * 100);
  }

  updateDailyChallenge(actionType, count = 1) {
    if (!this.state.dailyChallenge) return;
    if (this.state.dailyChallenge.completed) return;

    this.state.dailyChallenge.progress = Math.min(
      this.state.dailyChallenge.targetCount,
      (this.state.dailyChallenge.progress || 0) + count
    );

    if (this.state.dailyChallenge.progress >= this.state.dailyChallenge.targetCount) {
      this.state.dailyChallenge.completed = true;
      const rCoins = this.state.dailyChallenge.rewardCoins || 25;
      const rXp = this.state.dailyChallenge.rewardXp || 50;
      this.addCoins(rCoins);
      this.addXp(rXp);
      this.showCelebrationBanner('🎯 DESAFIO DO DIA CONCLUÍDO!', `+${rCoins} Moedas e +${rXp} XP ganhos!`);
      if (window.audioManager) {
        window.audioManager.playDailyComplete();
      }
    }
    this.save();
    this.updateGamificationUI();
  }

  showCelebrationBanner(title, subtitle) {
    let banner = document.getElementById('gamification-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'gamification-banner';
      banner.className = 'gamification-banner';
      document.body.appendChild(banner);
    }
    banner.innerHTML = `<div class="banner-title">${title}</div><div class="banner-sub">${subtitle}</div>`;
    banner.classList.add('show-banner');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      banner.classList.remove('show-banner');
    }, 3200);
  }

  updateGamificationUI() {
    const levelEl = document.getElementById('hud-level-val');
    const coinsEl = document.getElementById('hud-coins-val');
    const xpBar = document.getElementById('hud-xp-fill');
    const xpText = document.getElementById('hud-xp-text');

    const level = this.state.level || 1;
    const xp = this.state.xp || 0;
    const coins = this.state.coins || 0;
    const thresholds = this.getLevelThresholds(level);

    if (levelEl) levelEl.textContent = `LV ${level}`;
    if (coinsEl) coinsEl.textContent = `${coins}`;

    const progressInLevel = Math.max(0, xp - thresholds.currentBase);
    const neededInLevel = Math.max(1, thresholds.nextGoal - thresholds.currentBase);
    const pct = Math.min(100, Math.round((progressInLevel / neededInLevel) * 100));

    if (xpBar) xpBar.style.width = `${pct}%`;
    if (xpText) xpText.textContent = `${xp}/${thresholds.nextGoal} XP (${pct}%)`;

    // Atualiza painéis se abertos
    const studentModal = document.getElementById('student-dashboard-modal');
    if (studentModal && studentModal.classList.contains('active')) {
      this.renderStudentDashboard();
    }
    const parentsModal = document.getElementById('parents-dashboard-modal');
    if (parentsModal && parentsModal.classList.contains('active')) {
      this.renderParentsDashboard();
    }
  }

  renderStudentDashboard() {
    const modal = document.getElementById('student-dashboard-modal');
    if (!modal) return;

    // Nível, XP, Moedas
    const levelVal = document.getElementById('dash-student-level');
    const coinsVal = document.getElementById('dash-student-coins');
    const xpVal = document.getElementById('dash-student-xp');
    if (levelVal) levelVal.textContent = `Level ${this.state.level || 1}`;
    if (coinsVal) coinsVal.textContent = `${this.state.coins || 0}`;
    if (xpVal) xpVal.textContent = `${this.state.xp || 0} XP`;

    // Desafio Diário
    const dailyTitle = document.getElementById('daily-challenge-title');
    const dailyProg = document.getElementById('daily-challenge-progress-bar');
    const dailyText = document.getElementById('daily-challenge-text');
    const daily = this.state.dailyChallenge || { title: 'Find 3 Colors in English', progress: 0, targetCount: 3 };

    if (dailyTitle) dailyTitle.textContent = daily.title;
    const dailyPct = Math.min(100, Math.round(((daily.progress || 0) / (daily.targetCount || 1)) * 100));
    if (dailyProg) dailyProg.style.width = `${dailyPct}%`;
    if (dailyText) dailyText.textContent = daily.completed ? 'COMPLETO! ✓ (+25 🪙 +50 XP)' : `${daily.progress || 0}/${daily.targetCount} (${dailyPct}%)`;

    // Badges / Conquistas
    const badgesContainer = document.getElementById('student-badges-grid');
    if (badgesContainer) {
      const allBadges = [
        { id: 'first_word', title: 'First Word', desc: '1ª palavra dominada', icon: '⭐' },
        { id: 'ten_words', title: '10 Words', desc: '10 palavras aprendidas', icon: '📚' },
        { id: 'color_master', title: 'Color Master', desc: 'Dominou as cores', icon: '🌈' },
        { id: 'animal_master', title: 'Animal Master', desc: 'Dominou os animais', icon: '🦁' },
        { id: 'kitchen_master', title: 'Master Chef', desc: 'Dominou a cozinha', icon: '🍳' },
        { id: 'world1_complete', title: 'Rainbow Bridge', desc: 'Venceu o Mundo 1', icon: '🏆' },
        { id: 'world2_complete', title: 'Safari Hero', desc: 'Venceu o Mundo 2', icon: '🌍' },
        { id: 'world3_complete', title: 'Kitchen Star', desc: 'Venceu o Mundo 3', icon: '🍎' }
      ];

      badgesContainer.innerHTML = '';
      allBadges.forEach(b => {
        const unlocked = (this.state.badges || []).includes(b.id);
        const card = document.createElement('div');
        card.className = `badge-item-card ${unlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
          <div class="badge-icon">${b.icon}</div>
          <div class="badge-info">
            <div class="badge-name">${b.title}</div>
            <div class="badge-desc">${b.desc}</div>
            <span class="badge-state-tag">${unlocked ? 'DESBLOQUEADO ✓' : 'BLOQUEADO 🔒'}</span>
          </div>
        `;
        badgesContainer.appendChild(card);
      });
    }

    // Palavras para Revisar
    const reviewContainer = document.getElementById('student-words-to-review');
    if (reviewContainer) {
      const wordsToReview = this.getWordsToReview();
      reviewContainer.innerHTML = '';
      if (wordsToReview.length === 0) {
        reviewContainer.innerHTML = '<div class="no-review-msg">🎉 Excelente! Nenhuma palavra pendente de reforço. Continue jogando!</div>';
      } else {
        wordsToReview.slice(0, 6).forEach(item => {
          const pill = document.createElement('div');
          pill.className = 'review-word-pill';
          pill.innerHTML = `<span>${item.word}</span> <span class="review-err-badge">${item.wrong} erro${item.wrong > 1 ? 's' : ''}</span> <span>🔊</span>`;
          pill.addEventListener('click', () => {
            if (window.audioManager) {
              window.audioManager.speak(`Listen: ${item.word}! You can do it!`);
            }
          });
          reviewContainer.appendChild(pill);
        });
      }
    }
  }

  renderParentsDashboard() {
    const wordsCountEl = document.getElementById('parents-total-words');
    const accuracyEl = document.getElementById('parents-accuracy-pct');
    const levelEl = document.getElementById('parents-current-level');
    const timeEl = document.getElementById('parents-time-spent');
    const adviceEl = document.getElementById('parents-pedagogical-advice');
    const reviewListEl = document.getElementById('parents-words-review-list');

    const totalWords = (this.state.wordsMastered || []).length;
    const accuracy = this.getAccuracy();
    const totalSecs = this.state.learningTimeSeconds || 0;
    const mins = Math.floor(totalSecs / 60);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    const timeStr = hrs > 0 ? `${hrs}h ${remMins}min` : `${mins} minutos`;

    if (wordsCountEl) wordsCountEl.textContent = `${totalWords}`;
    if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
    if (levelEl) levelEl.textContent = `Nível ${this.state.level || 1}`;
    if (timeEl) timeEl.textContent = timeStr;

    // Mensagem de apoio pedagógico aos pais
    if (adviceEl) {
      if (totalWords >= 8) {
        adviceEl.innerHTML = '🌟 <b>Ótimo ritmo:</b> Seu filho está expandindo o vocabulário ativamente com cores, números e animais. Incentive-o a usar o microfone (botão SPEAK) para treinar a fala sem timidez!';
      } else {
        adviceEl.innerHTML = '🌱 <b>Primeiros passos:</b> Seu filho está começando a associar cores e ações em inglês com saltos e desafios visuais. Sessões de 10 a 15 minutos diárias são ideais!';
      }
    }

    // Lista de palavras para reforço aos pais
    if (reviewListEl) {
      const reviewList = this.getWordsToReview();
      reviewListEl.innerHTML = '';
      if (reviewList.length === 0) {
        reviewListEl.innerHTML = '<li style="color: #10b981;">✓ Nenhuma palavra com dificuldade registrada. Desempenho excelente!</li>';
      } else {
        reviewList.slice(0, 5).forEach(r => {
          const li = document.createElement('li');
          li.innerHTML = `<b>${r.word}</b> — ${r.correct} acerto(s) e ${r.wrong} tentativa(s) a reforçar`;
          reviewListEl.appendChild(li);
        });
      }
    }
  }
}

// Instanciação imediata do gerenciador central
window.GameStateManager = GameStateManager;
window.gameStateManager = new GameStateManager();
window.userGameState = window.gameStateManager.state;

window.openStudentDashboard = function() {
  const m = document.getElementById('student-dashboard-modal');
  if (m) {
    m.classList.add('active');
    m.style.display = 'flex';
    if (window.gameStateManager) window.gameStateManager.renderStudentDashboard();
    if (window.audioManager) window.audioManager.playCollect();
  }
};

window.closeStudentDashboard = function() {
  const m = document.getElementById('student-dashboard-modal');
  if (m) {
    m.classList.remove('active');
    m.style.display = 'none';
  }
};

window.openParentsDashboard = function() {
  const m = document.getElementById('parents-dashboard-modal');
  if (m) {
    m.classList.add('active');
    m.style.display = 'flex';
    if (window.gameStateManager) window.gameStateManager.renderParentsDashboard();
    if (window.audioManager) window.audioManager.playCollect();
  }
};

window.closeParentsDashboard = function() {
  const m = document.getElementById('parents-dashboard-modal');
  if (m) {
    m.classList.remove('active');
    m.style.display = 'none';
  }
};

