// skins.js - Guarda-Roupa e Loja de Skins do Avatar (SkinShopModal)

const SKINS = [
  { id: 'default', name: 'Original Blue', color: '#3b82f6', isPro: false, hat: '🧢', hatType: 'cap' },
  { id: 'fire', name: 'Fire Hero', color: '#ef4444', isPro: true, hat: '🔥', hatType: 'fire' },
  { id: 'astronaut', name: 'Astro Kid', color: '#e2e8f0', isPro: true, hat: '🚀', hatType: 'astro' },
  { id: 'gold', name: 'Golden King', color: '#eab308', isPro: true, hat: '👑', hatType: 'crown' },
  { id: 'ninja', name: 'Shadow Ninja', color: '#18181b', isPro: true, hat: '🥷', hatType: 'ninja' },
  { id: 'dino', name: 'Baby Dino', color: '#22c55e', isPro: true, hat: '🦖', hatType: 'dino' },
];

window.SKINS = SKINS;

class SkinManager {
  constructor() {
    this.skins = SKINS;
    this.currentSkinId = (window.userGameState && window.userGameState.selectedSkin) ||
                         localStorage.getItem('roblox_english_obby_skin') || 'default';
    this.modal = document.getElementById('skin-shop-modal');

    this.initEventListeners();
    this.renderSkinGrid();
  }

  get isProUnlocked() {
    return (window.userGameState && window.userGameState.isProUnlocked) ||
           localStorage.getItem('roblox_english_obby_unlocked') === 'true' ||
           (window.pixCheckout && window.pixCheckout.isUnlocked);
  }

  getCurrentSkin() {
    return this.skins.find(s => s.id === this.currentSkinId) || this.skins[0];
  }

  initEventListeners() {
    // Botão no HUD superior para abrir o guarda-roupa
    const shopBtn = document.getElementById('skin-shop-btn');
    if (shopBtn) {
      shopBtn.addEventListener('click', () => {
        this.open();
      });
    }

    // Botão fechar modal e Fechamento via Fundo/Escape
    const closeBtn = document.getElementById('close-skin-shop-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.close();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        this.close();
      }
    });

    // Botão CTA para destravar Pro dentro do modal
    const unlockProBtn = document.getElementById('skin-modal-unlock-pro');
    if (unlockProBtn) {
      unlockProBtn.addEventListener('click', () => {
        this.close();
        const victoryModal = document.getElementById('victory-modal');
        if (victoryModal) victoryModal.classList.add('active');
      });
    }
  }

  open() {
    if (this.modal) {
      this.renderSkinGrid();
      this.modal.classList.add('active');
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.remove('active');
    }
  }

  selectSkin(skin) {
    if (skin.isPro && !this.isProUnlocked) {
      this.close();
      if (window.audioManager) {
        window.audioManager.playTryAgain();
        window.audioManager.speak("Unlock all skins with Pro!");
      }
      const victoryModal = document.getElementById('victory-modal');
      if (victoryModal) victoryModal.classList.add('active');
      return;
    }

    this.currentSkinId = skin.id;
    if (window.gameStateManager) {
      window.gameStateManager.setSkin(skin.id);
    } else {
      localStorage.setItem('roblox_english_obby_skin', skin.id);
    }

    // Aplica no personagem 3D
    if (window.player && typeof window.player.applySkin === 'function') {
      window.player.applySkin(skin);
    }

    // Som e voz em inglês
    if (window.audioManager) {
      window.audioManager.playCollect();
      window.audioManager.speak(`Awesome! ${skin.name}!`);
    }

    this.renderSkinGrid();
  }

  renderSkinGrid() {
    const gridEl = document.getElementById('skin-grid');
    const ctaBtn = document.getElementById('skin-modal-unlock-pro');
    if (!gridEl) return;

    const isPro = this.isProUnlocked;
    if (ctaBtn) {
      ctaBtn.style.display = isPro ? 'none' : 'block';
    }

    gridEl.innerHTML = '';

    this.skins.forEach(skin => {
      const isSelected = this.currentSkinId === skin.id;
      const isLocked = skin.isPro && !isPro;

      const card = document.createElement('div');
      card.className = `skin-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`;
      
      card.innerHTML = `
        <div class="skin-preview-box" style="background-color: ${skin.color}">
          <span class="skin-emoji">${skin.hat || '🙂'}</span>
          ${isLocked ? '<div class="skin-lock-overlay">🔒</div>' : ''}
        </div>
        <div class="skin-info">
          <div class="skin-name">${skin.name}</div>
          <div class="skin-status">
            ${skin.isPro ? (isPro ? 'Liberado' : 'Pro (R$ 19,90)') : 'Grátis'}
          </div>
        </div>
        ${isSelected ? '<span class="skin-in-use-badge">EM USO</span>' : ''}
      `;

      card.addEventListener('click', () => {
        this.selectSkin(skin);
      });

      gridEl.appendChild(card);
    });
  }
}

window.skinManager = new SkinManager();
