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
  ]
};

class GameStateManager {
  constructor() {
    this.storageKey = 'roblox_english_obby_state';
    this.state = this.loadState();
    window.userGameState = this.state;

    // Sincroniza retrocompatibilidade com chaves legadas
    this.syncLegacyKeys();

    // Renderiza vocabulário no modal dos pais se o DOM já estiver pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.renderParentsVocab());
    } else {
      this.renderParentsVocab();
    }

    // Busca atualização na nuvem em segundo plano
    this.syncWithBackend();
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
            : [...DEFAULT_GAME_STATE.wordsMastered]
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
      wordsMastered: [...DEFAULT_GAME_STATE.wordsMastered]
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
}

// Instanciação imediata do gerenciador central
window.GameStateManager = GameStateManager;
window.gameStateManager = new GameStateManager();
window.userGameState = window.gameStateManager.state;
