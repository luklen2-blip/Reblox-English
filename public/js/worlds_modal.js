// worlds_modal.js - Gerenciador Independente do Modal de Seleção de Mundos

class WorldsModalManager {
  constructor() {
    this.modal = null;
    this.init();
  }

  init() {
    this.modal = document.getElementById('worlds-modal');
    this.bindEvents();
  }

  isVIPUnlocked() {
    return (window.userGameState && window.userGameState.isProUnlocked === true) ||
           (window.gameStateManager && window.gameStateManager.state && window.gameStateManager.state.isProUnlocked === true) ||
           localStorage.getItem('roblox_english_obby_unlocked') === 'true';
  }

  open() {
    this.modal = this.modal || document.getElementById('worlds-modal');
    if (!this.modal) return;

    // Atualiza status e botões dos Mundos 2, 3 e 4 de acordo com o Acesso Vitalício
    const isVIP = this.isVIPUnlocked();

    const worldNames = { 2: 'Safari', 3: 'Cozinha', 4: 'Espaço' };
    [2, 3, 4].forEach(worldNum => {
      const tag = document.getElementById(`world-${worldNum}-status-tag`);
      const btn = document.getElementById(`btn-play-world-${worldNum}`);
      if (tag) {
        tag.textContent = isVIP ? 'LIBERADO 👑' : '🔒 VIP VITALÍCIO';
        tag.className = isVIP ? 'world-card-tag world-tag-free' : 'world-card-tag world-tag-vip';
      }
      if (btn) {
        btn.textContent = isVIP ? `Explorar ${worldNames[worldNum]}` : '🔒 Desbloquear (R$ 19,90)';
        btn.className = isVIP ? 'btn-play-world' : 'btn-play-world btn-play-locked';
      }
    });

    // Destaca qual mundo está ativo
    const currentId = (window.gameApp && window.gameApp.currentWorldId) || 1;
    const card1 = document.getElementById('select-world-1-card');
    const card2 = document.getElementById('select-world-2-card');
    const card3 = document.getElementById('select-world-3-card');
    const card4 = document.getElementById('select-world-4-card');
    if (card1) card1.classList.toggle('active-world', currentId === 1);
    if (card2) card2.classList.toggle('active-world', currentId === 2);
    if (card3) card3.classList.toggle('active-world', currentId === 3);
    if (card4) card4.classList.toggle('active-world', currentId === 4);

    this.modal.classList.add('active');
    this.modal.style.display = 'flex';

    if (window.audioManager) {
      window.audioManager.playCollect();
    }
  }

  close() {
    this.modal = this.modal || document.getElementById('worlds-modal');
    if (this.modal) {
      this.modal.classList.remove('active');
      this.modal.style.display = 'none';
    }
  }

  selectWorld(id) {
    const isVIP = this.isVIPUnlocked();

    // Trava de Segurança Comercial: Mundos 2, 3 e 4 exigem Acesso Vitalício
    if (id > 1 && !isVIP) {
      console.warn(`🔒 Mundo ${id} bloqueado: requer Acesso Vitalício (R$ 19,90).`);
      this.close();
      if (window.audioManager) {
        window.audioManager.playTryAgain();
        window.audioManager.speak("Unlock all worlds with Lifetime Pro!");
      }
      const victoryModal = document.getElementById('victory-modal');
      if (victoryModal) victoryModal.classList.add('active');
      return;
    }

    console.log(`🌍 WorldsModalManager: Alternando para Mundo ${id}...`);
    this.close();

    if (window.gameApp && typeof window.gameApp.switchWorld === 'function') {
      window.gameApp.switchWorld(id);
    } else {
      console.warn('GameApp ainda não pronto, aguardando...');
      setTimeout(() => {
        if (window.gameApp && typeof window.gameApp.switchWorld === 'function') {
          window.gameApp.switchWorld(id);
        }
      }, 300);
    }
  }

  bindEvents() {
    // Delegação de eventos no nível document para nunca falhar
    document.addEventListener('click', (e) => {
      // 1. Abrir Modal pelo botão do HUD ou pelo badge
      if (e.target.closest('#worlds-btn') || e.target.closest('#current-world-badge')) {
        e.preventDefault();
        e.stopPropagation();
        this.open();
        return;
      }

      // 2. Fechar modal pelo botão ✕
      if (e.target.closest('#close-worlds-modal-btn')) {
        e.preventDefault();
        e.stopPropagation();
        this.close();
        return;
      }

      // 3. Clicar em World 1
      if (e.target.closest('#btn-play-world-1') || e.target.closest('#select-world-1-card')) {
        e.preventDefault();
        e.stopPropagation();
        this.selectWorld(1);
        return;
      }

      // 4. Clicar em World 2 (Safari)
      if (e.target.closest('#btn-play-world-2') || e.target.closest('#select-world-2-card')) {
        e.preventDefault();
        e.stopPropagation();
        this.selectWorld(2);
        return;
      }

      // 5. Clicar em World 3 (Kitchen)
      if (e.target.closest('#btn-play-world-3') || e.target.closest('#select-world-3-card')) {
        e.preventDefault();
        e.stopPropagation();
        this.selectWorld(3);
        return;
      }

      // 6. Clicar em World 4 (Space)
      if (e.target.closest('#btn-play-world-4') || e.target.closest('#select-world-4-card')) {
        e.preventDefault();
        e.stopPropagation();
        this.selectWorld(4);
        return;
      }

      // 7. Fechar ao clicar no fundo escuro
      const modal = document.getElementById('worlds-modal');
      if (modal && e.target === modal) {
        this.close();
        return;
      }
    });
  }
}

// Inicializa imediatamente
window.worldsModal = new WorldsModalManager();
window.openWorldsModal = () => window.worldsModal.open();
window.closeWorldsModal = () => window.worldsModal.close();
window.switchWorld = (id) => window.worldsModal.selectWorld(id);
