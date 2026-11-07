// kid_guide.js - Camada de Orientação Infantil Interativa (UX Guiada Sem Bloqueios)
// Ensina crianças pequenas a andar, pular, explorar, coletar, ouvir, identificar e falar inglês durante o jogo.

class KidGuideManager {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.hasMoved = false;
    this.hasJumped = false;
    this.tutorialStar = null;
    this.completed = localStorage.getItem('roblox_english_obby_kid_guide_done') === 'true';

    this.initDOM();
    this.bindGlobalEvents();
  }

  initDOM() {
    // Container principal flutuante do Guia Infantil
    let container = document.getElementById('kid-guide-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'kid-guide-container';
      container.className = 'kid-guide-container';
      container.innerHTML = `
        <div class="kid-guide-card" id="kid-guide-card">
          <button class="kid-guide-close-btn" id="kid-guide-close-btn" title="Fechar guia">✕</button>
          <div class="kid-guide-badge" id="kid-guide-badge">👋</div>
          <div class="kid-guide-content">
            <h3 class="kid-guide-title" id="kid-guide-title">Oi! Vamos brincar?</h3>
            <p class="kid-guide-desc" id="kid-guide-desc">Vamos aprender inglês brincando!</p>
            <div class="kid-guide-dynamic-area" id="kid-guide-dynamic-area"></div>
          </div>
          <div class="kid-guide-actions" id="kid-guide-actions">
            <button class="kid-guide-btn kid-guide-btn-primary" id="kid-guide-action-btn">▶️ VAMOS!</button>
          </div>
        </div>
        <div class="kid-guide-pointer" id="kid-guide-pointer" style="display:none;">👇</div>
      `;
      document.body.appendChild(container);
    }
    this.container = container;
    this.card = document.getElementById('kid-guide-card');
    this.titleEl = document.getElementById('kid-guide-title');
    this.descEl = document.getElementById('kid-guide-desc');
    this.badgeEl = document.getElementById('kid-guide-badge');
    this.dynamicArea = document.getElementById('kid-guide-dynamic-area');
    this.actionsEl = document.getElementById('kid-guide-actions');
    this.actionBtn = document.getElementById('kid-guide-action-btn');
    this.closeBtn = document.getElementById('kid-guide-close-btn');
    this.pointerEl = document.getElementById('kid-guide-pointer');

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }
  }

  bindGlobalEvents() {
    // Detecta primeiro movimento do jogador
    window.addEventListener('keydown', (e) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        this.handlePlayerMove();
      }
      if (e.code === 'Space') {
        this.handlePlayerJump();
      }
    });

    // Detecta touch no joystick mobile
    const joystickZone = document.getElementById('joystick-zone');
    if (joystickZone) {
      joystickZone.addEventListener('touchmove', () => {
        this.handlePlayerMove();
      });
    }

    // Detecta clique no botão de pulo mobile
    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', () => {
        this.handlePlayerJump();
      });
    }
  }

  // Inicia o guia (auto no primeiro acesso ao Mundo 1, ou manual pelo botão 🐣)
  startGuide(force = false) {
    if (!force && this.completed) return;
    this.isActive = true;
    this.currentStep = 1;
    this.container.classList.add('active');
    this.showStep1();
  }

  close() {
    this.isActive = false;
    this.currentStep = 0;
    this.removeHighlights();
    this.removePlayerBeacon();
    if (this.container) {
      this.container.classList.remove('active');
    }
    if (this.pointerEl) {
      this.pointerEl.style.display = 'none';
      this.pointerEl.className = 'kid-guide-pointer';
    }
    if (this.exploreWatcher) {
      clearInterval(this.exploreWatcher);
      this.exploreWatcher = null;
    }
    if (this.starCollider) {
      clearInterval(this.starCollider);
      this.starCollider = null;
    }
    if (this.tutorialStar && this.tutorialStar.parent) {
      this.tutorialStar.parent.remove(this.tutorialStar);
      this.tutorialStar = null;
    }
  }

  speakPt(text, onEnd = null) {
    if (window.audioManager && typeof window.audioManager.speakPt === 'function') {
      window.audioManager.speakPt(text, onEnd);
    } else if (window.audioManager && typeof window.audioManager.speak === 'function') {
      window.audioManager.speak(text, onEnd);
    } else if (typeof onEnd === 'function') {
      onEnd();
    }
  }

  speakEn(text, onEnd = null) {
    if (window.audioManager && typeof window.audioManager.speak === 'function') {
      window.audioManager.speak(text, onEnd);
    } else if (typeof onEnd === 'function') {
      onEnd();
    }
  }

  removeHighlights() {
    document.querySelectorAll('.kid-highlight-target').forEach(el => {
      el.classList.remove('kid-highlight-target');
    });
  }

  createPlayerBeacon() {
    this.removePlayerBeacon();
    if (typeof THREE === 'undefined' || !window.player || !window.gameApp || !window.gameApp.scene) return;
    try {
      const ringGeo = new THREE.RingGeometry(1.4, 2.0, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      this.playerBeacon = new THREE.Mesh(ringGeo, ringMat);
      this.playerBeacon.position.set(window.player.position.x, 0.15, window.player.position.z);
      window.gameApp.scene.add(this.playerBeacon);
    } catch (e) {
      console.warn('Beacon creation skipped:', e.message);
    }
  }

  removePlayerBeacon() {
    if (this.playerBeacon && this.playerBeacon.parent) {
      this.playerBeacon.parent.remove(this.playerBeacon);
      this.playerBeacon = null;
    }
  }

  // =========================================================================
  // ETAPA 1 — APRESENTAÇÃO
  // =========================================================================
  showStep1() {
    this.currentStep = 1;
    this.badgeEl.textContent = '👋';
    this.titleEl.textContent = 'Oi! Vamos brincar?';
    this.descEl.textContent = '👋 Oi! Vamos brincar?';
    this.dynamicArea.innerHTML = '';
    this.actionsEl.style.display = 'none';

    if (this.pointerEl) {
      this.pointerEl.style.display = 'none';
    }

    this.speakPt('Oi! Vamos brincar?', () => {
      setTimeout(() => {
        if (this.currentStep !== 1) return;
        this.titleEl.textContent = 'Vamos brincar?';
        this.descEl.textContent = '🎮 Vamos aprender inglês brincando!';
        this.actionsEl.style.display = 'flex';
        this.actionsEl.innerHTML = `<button class="kid-guide-btn kid-guide-btn-primary" id="kid-guide-action-btn">▶️ VAMOS!</button>`;

        const actionBtn = document.getElementById('kid-guide-action-btn');
        if (actionBtn) {
          actionBtn.onclick = () => {
            if (window.audioManager) window.audioManager.resumeContext();
            this.showStep2();
          };
        }

        this.speakPt('Vamos aprender inglês brincando!');
      }, 400);
    });

    // Fallback de segurança se o navegador bloquear síntese de voz antes do primeiro toque
    setTimeout(() => {
      if (this.currentStep === 1 && this.actionsEl.style.display === 'none') {
        this.descEl.textContent = '🎮 Vamos aprender inglês brincando!';
        this.actionsEl.style.display = 'flex';
        this.actionsEl.innerHTML = `<button class="kid-guide-btn kid-guide-btn-primary" id="kid-guide-action-btn">▶️ VAMOS!</button>`;
        const actionBtn = document.getElementById('kid-guide-action-btn');
        if (actionBtn) {
          actionBtn.onclick = () => {
            if (window.audioManager) window.audioManager.resumeContext();
            this.showStep2();
          };
        }
      }
    }, 2800);
  }

  // =========================================================================
  // ETAPA 2 — MOVIMENTAR O BONECO
  // =========================================================================
  showStep2() {
    this.currentStep = 2;
    this.hasMoved = false;
    this.badgeEl.textContent = '🕹️';
    this.titleEl.textContent = 'Mova seu boneco!';

    const isMobile = window.inputManager && window.inputManager.isMobile;

    // Destaca o personagem com anel luminoso no chão 3D
    this.createPlayerBeacon();

    if (isMobile) {
      this.descEl.textContent = '👆 Arraste o controle para andar!';
      this.dynamicArea.innerHTML = `
        <div class="kid-guide-visual-control">
          <div class="kid-control-icon-circle pulse-fast">🕹️</div>
          <span>Arraste com o dedo no controle da esquerda</span>
        </div>
      `;
      const joystickZone = document.getElementById('joystick-zone');
      if (joystickZone) joystickZone.classList.add('kid-highlight-target');

      if (this.pointerEl) {
        this.pointerEl.style.display = 'block';
        this.pointerEl.className = 'kid-guide-pointer pointer-joystick';
        this.pointerEl.innerHTML = '👇 Mexa o controle!';
      }
    } else {
      this.descEl.textContent = 'Use as teclas com setas ou W A S D para andar!';
      this.dynamicArea.innerHTML = `
        <div class="kid-guide-keys-display">
          <div class="kid-key-row"><span class="kid-key-cap">⬆️ W</span></div>
          <div class="kid-key-row">
            <span class="kid-key-cap">⬅️ A</span>
            <span class="kid-key-cap">⬇️ S</span>
            <span class="kid-key-cap">➡️ D</span>
          </div>
        </div>
      `;

      if (this.pointerEl) {
        this.pointerEl.style.display = 'block';
        this.pointerEl.className = 'kid-guide-pointer pointer-keys';
        this.pointerEl.innerHTML = '👇 Use as teclas ou setas!';
      }
    }

    this.actionsEl.style.display = 'none';

    setTimeout(() => {
      this.speakPt('Mova seu boneco!');
    }, 200);
  }

  handlePlayerMove() {
    if (this.currentStep !== 2 || this.hasMoved) return;
    this.hasMoved = true;
    this.removeHighlights();
    this.removePlayerBeacon();
    if (this.pointerEl) this.pointerEl.style.display = 'none';

    this.badgeEl.textContent = '⭐';
    this.titleEl.textContent = 'Muito bem!';
    this.descEl.textContent = 'Você aprendeu a mover seu boneco!';
    this.dynamicArea.innerHTML = '<div class="kid-star-burst">🌟🌟🌟</div>';

    if (window.audioManager) window.audioManager.playCollect();
    this.speakPt('Muito bem!');

    setTimeout(() => {
      this.showStep3();
    }, 1400);
  }

  // =========================================================================
  // ETAPA 3 — PULAR
  // =========================================================================
  showStep3() {
    this.currentStep = 3;
    this.hasJumped = false;
    this.badgeEl.textContent = '🦘';
    this.titleEl.textContent = 'Agora dê um pulo!';

    const isMobile = window.inputManager && window.inputManager.isMobile;

    if (isMobile) {
      this.descEl.textContent = '👆 Toque no botão grande PULE!';
      this.dynamicArea.innerHTML = `
        <div class="kid-guide-visual-control">
          <div class="kid-control-icon-circle pulse-fast">🚀</div>
          <span>Toque no botão de pulo da direita</span>
        </div>
      `;
      const jumpBtn = document.getElementById('jump-btn');
      if (jumpBtn) jumpBtn.classList.add('kid-highlight-target');

      if (this.pointerEl) {
        this.pointerEl.style.display = 'block';
        this.pointerEl.className = 'kid-guide-pointer pointer-jump';
        this.pointerEl.innerHTML = '👇 Toque em PULE!';
      }
    } else {
      this.descEl.textContent = 'Aperte a barra de ESPAÇO para saltar!';
      this.dynamicArea.innerHTML = `
        <div class="kid-guide-keys-display">
          <div class="kid-key-spacebar pulse-fast">␣ ESPAÇO (PULE!)</div>
        </div>
      `;

      if (this.pointerEl) {
        this.pointerEl.style.display = 'block';
        this.pointerEl.className = 'kid-guide-pointer pointer-keys';
        this.pointerEl.innerHTML = '👇 Aperte a barra de ESPAÇO!';
      }
    }

    this.actionsEl.style.display = 'none';

    setTimeout(() => {
      this.speakPt('Agora dê um pulo!');
    }, 200);
  }

  handlePlayerJump() {
    if (this.currentStep !== 3 || this.hasJumped) return;
    this.hasJumped = true;
    this.removeHighlights();
    if (this.pointerEl) this.pointerEl.style.display = 'none';

    this.badgeEl.textContent = '🎉';
    this.titleEl.textContent = 'Isso aí!';
    this.descEl.textContent = 'Salto perfeito!';
    this.dynamicArea.innerHTML = '<div class="kid-star-burst">🦘✨</div>';

    if (window.audioManager) window.audioManager.playJump();
    this.speakPt('Isso aí!');

    setTimeout(() => {
      this.showStep4();
    }, 1400);
  }

  // =========================================================================
  // ETAPA 4 — EXPLORAR
  // =========================================================================
  showStep4() {
    this.currentStep = 4;
    this.badgeEl.textContent = '🔍';
    this.titleEl.textContent = 'Vamos explorar a ilha!';
    this.descEl.textContent = 'Siga a seta pelo caminho colorido!';
    this.dynamicArea.innerHTML = `
      <div class="kid-guide-explore-arrow">
        <span class="explore-animated-arrow">➡️ 🌈 ➡️</span>
      </div>
    `;
    this.actionsEl.style.display = 'flex';
    this.actionsEl.innerHTML = `<button class="kid-guide-btn kid-guide-btn-primary" id="kid-guide-explore-btn">▶️ ANDAR EM FRENTE</button>`;

    if (this.pointerEl) {
      this.pointerEl.style.display = 'block';
      this.pointerEl.className = 'kid-guide-pointer pointer-forward';
      this.pointerEl.innerHTML = '👉 SIGA EM FRENTE! 🌈';
    }

    const exploreBtn = document.getElementById('kid-guide-explore-btn');
    if (exploreBtn) {
      exploreBtn.onclick = () => {
        this.showStep5();
      };
    }

    setTimeout(() => {
      this.speakPt('Vamos explorar a ilha! Siga a seta!');
    }, 200);

    // Avança se o jogador caminhar para frente no mapa
    if (this.exploreWatcher) clearInterval(this.exploreWatcher);
    this.exploreWatcher = setInterval(() => {
      if (window.player && window.player.position.z < -10) {
        clearInterval(this.exploreWatcher);
        this.exploreWatcher = null;
        this.showStep5();
      }
    }, 300);
  }

  // =========================================================================
  // ETAPA 5 — PRIMEIRA COLETA (ESTRELA)
  // =========================================================================
  showStep5() {
    if (this.exploreWatcher) {
      clearInterval(this.exploreWatcher);
      this.exploreWatcher = null;
    }
    this.currentStep = 5;
    this.badgeEl.textContent = '⭐';
    this.titleEl.textContent = 'Chegue perto para pegar!';
    this.descEl.textContent = 'Toque na estrela dourada que brilha!';
    this.dynamicArea.innerHTML = `
      <div class="kid-guide-star-preview pulse-fast">
        <span style="font-size: 38px;">⭐</span>
        <span style="font-weight: 800; color: #fbbf24;">ESTRELA DOURADA</span>
      </div>
    `;

    if (this.pointerEl) {
      this.pointerEl.style.display = 'block';
      this.pointerEl.className = 'kid-guide-pointer pointer-star';
      this.pointerEl.innerHTML = '⭐ PEGUE A ESTRELA!';
    }

    this.spawnTutorialStar();

    this.actionsEl.style.display = 'flex';
    this.actionsEl.innerHTML = `<button class="kid-guide-btn kid-guide-btn-primary" id="kid-guide-collect-btn">⭐ PEGAR AGORA</button>`;
    const collectBtn = document.getElementById('kid-guide-collect-btn');
    if (collectBtn) {
      collectBtn.onclick = () => {
        this.handleStarCollected();
      };
    }

    setTimeout(() => {
      this.speakPt('Chegue perto para pegar!');
    }, 200);
  }

  spawnTutorialStar() {
    if (this.tutorialStar || !window.gameApp || !window.gameApp.scene) return;
    const scene = window.gameApp.scene;

    const starGroup = new THREE.Group();
    const geom = new THREE.OctahedronGeometry(1.0, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      metalness: 0.2,
      roughness: 0.1
    });
    const starMesh = new THREE.Mesh(geom, mat);
    starGroup.add(starMesh);

    // Posiciona logo à frente da largada
    starGroup.position.set(0, 3.8, -14);
    scene.add(starGroup);
    this.tutorialStar = starGroup;

    // Checagem de colisão contínua
    if (this.starCollider) clearInterval(this.starCollider);
    this.starCollider = setInterval(() => {
      if (!this.tutorialStar || !window.player) {
        clearInterval(this.starCollider);
        this.starCollider = null;
        return;
      }
      const dist = window.player.position.distanceTo(this.tutorialStar.position);
      if (dist < 2.5) {
        clearInterval(this.starCollider);
        this.starCollider = null;
        this.handleStarCollected();
      }
    }, 100);
  }

  handleStarCollected() {
    if (this.starCollider) {
      clearInterval(this.starCollider);
      this.starCollider = null;
    }
    if (this.tutorialStar && this.tutorialStar.parent) {
      this.tutorialStar.parent.remove(this.tutorialStar);
      this.tutorialStar = null;
    }
    if (this.pointerEl) this.pointerEl.style.display = 'none';

    if (window.confetti) {
      window.confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    }
    if (window.audioManager) window.audioManager.playCollect();

    this.badgeEl.textContent = '🌟';
    this.titleEl.textContent = 'Você conseguiu!';
    this.descEl.textContent = 'Primeira estrela coletada com sucesso!';
    this.dynamicArea.innerHTML = '<div class="kid-star-burst">⭐ ONE! ⭐</div>';

    this.speakPt('Você conseguiu!');

    setTimeout(() => {
      this.showStep6();
    }, 1400);
  }

  // =========================================================================
  // ETAPA 6 — PRIMEIRO CONTATO COM INGLÊS (APPLE)
  // =========================================================================
  showStep6() {
    this.currentStep = 6;
    this.badgeEl.textContent = '🍎';
    this.titleEl.textContent = 'Ouça com atenção!';
    this.descEl.textContent = 'Maçã em inglês se diz APPLE!';
    this.dynamicArea.innerHTML = `
      <div class="kid-word-spotlight">
        <div class="kid-spotlight-icon">🍎</div>
        <div class="kid-spotlight-word">APPLE</div>
        <button class="kid-listen-btn" id="kid-speak-word-btn">🔊 Ouvir "APPLE"</button>
      </div>
    `;

    if (this.pointerEl) this.pointerEl.style.display = 'none';

    this.actionsEl.style.display = 'flex';
    this.actionsEl.innerHTML = `<button class="kid-guide-btn kid-guide-btn-primary" id="kid-guide-next-btn">▶️ CONTINUAR</button>`;

    const speakBtn = document.getElementById('kid-speak-word-btn');
    if (speakBtn) {
      speakBtn.onclick = () => {
        this.speakEn('Apple');
      };
    }

    const nextBtn = document.getElementById('kid-guide-next-btn');
    if (nextBtn) {
      nextBtn.onclick = () => {
        this.showStep7();
      };
    }

    setTimeout(() => {
      this.speakPt('Ouça com atenção!', () => {
        setTimeout(() => {
          this.speakEn('Apple', () => {
            setTimeout(() => {
              this.speakPt('Maçã em inglês é Apple!');
            }, 300);
          });
        }, 300);
      });
    }, 200);
  }

  // =========================================================================
  // ETAPA 7 — IDENTIFICAR (ENCONTRE O ELEMENTO CORRETO)
  // =========================================================================
  showStep7() {
    this.currentStep = 7;
    this.badgeEl.textContent = '🎯';
    this.titleEl.textContent = 'Qual é APPLE?';
    this.descEl.textContent = 'Toque na fruta que se chama APPLE:';
    this.dynamicArea.innerHTML = `
      <div class="kid-quiz-cards-row">
        <button class="kid-quiz-choice-card" data-correct="true">
          <span class="choice-emoji">🍎</span>
          <span class="choice-name">APPLE</span>
        </button>
        <button class="kid-quiz-choice-card" data-correct="false">
          <span class="choice-emoji">🍌</span>
          <span class="choice-name">BANANA</span>
        </button>
        <button class="kid-quiz-choice-card" data-correct="false">
          <span class="choice-emoji">🥛</span>
          <span class="choice-name">MILK</span>
        </button>
      </div>
      <div id="kid-quiz-feedback" class="kid-feedback-text"></div>
    `;

    if (this.pointerEl) this.pointerEl.style.display = 'none';
    this.actionsEl.style.display = 'none';

    setTimeout(() => {
      this.speakPt('Qual é Apple?');
    }, 200);

    const cards = this.dynamicArea.querySelectorAll('.kid-quiz-choice-card');
    cards.forEach(card => {
      card.onclick = () => {
        const isCorrect = card.getAttribute('data-correct') === 'true';
        const feedbackEl = document.getElementById('kid-quiz-feedback');

        if (isCorrect) {
          card.classList.add('card-correct');
          if (feedbackEl) feedbackEl.innerHTML = '🎉 <b>Isso! Você acertou!</b>';
          if (window.audioManager) window.audioManager.playCollect();
          if (window.confetti) window.confetti({ particleCount: 30, spread: 50 });
          this.speakPt('Isso! Muito bem!');

          setTimeout(() => {
            this.showStep8();
          }, 1400);
        } else {
          card.classList.add('card-shake');
          setTimeout(() => card.classList.remove('card-shake'), 600);
          if (feedbackEl) feedbackEl.innerHTML = '😊 <b>Quase! Tente de novo!</b>';
          if (window.audioManager && typeof window.audioManager.playTryAgain === 'function') {
            window.audioManager.playTryAgain();
          }
          this.speakPt('Quase! Tente de novo.');
        }
      };
    });
  }

  // =========================================================================
  // ETAPA 8 — ENSINAR O VOICE QUIZ (FALAR NO MICROFONE)
  // =========================================================================
  showStep8() {
    this.currentStep = 8;
    this.badgeEl.textContent = '🎤';
    this.titleEl.textContent = 'Agora é sua vez!';
    this.descEl.textContent = 'Aperte o microfone e diga APPLE!';
    this.dynamicArea.innerHTML = `
      <div class="kid-mic-hero-box">
        <div class="kid-mic-big-circle pulse-fast">🎤</div>
        <div class="kid-mic-word-tag">Fale: <b>APPLE</b> 🍎</div>
        <div class="kid-mic-controls">
          <button class="kid-guide-btn kid-guide-btn-mic" id="kid-mic-trigger-btn">
            🎤 TOQUE PARA FALAR
          </button>
          <button class="kid-guide-btn kid-guide-btn-subtle" id="kid-mic-skip-btn">
            ⭐ Ou toque aqui para acertar
          </button>
        </div>
        <div id="kid-voice-result" class="kid-voice-result"></div>
      </div>
    `;

    if (this.pointerEl) this.pointerEl.style.display = 'none';
    this.actionsEl.style.display = 'none';

    setTimeout(() => {
      this.speakPt('Agora aperte o microfone e diga: Apple!');
    }, 200);

    const triggerBtn = document.getElementById('kid-mic-trigger-btn');
    const skipBtn = document.getElementById('kid-mic-skip-btn');
    const resultEl = document.getElementById('kid-voice-result');

    const handleSuccess = () => {
      if (triggerBtn) triggerBtn.disabled = true;
      if (skipBtn) skipBtn.disabled = true;

      // Recompensas oficiais preservadas (+25 XP, +10 Moedas)
      if (window.gameStateManager) {
        window.gameStateManager.addXp(25);
        window.gameStateManager.addCoins(10);
        window.gameStateManager.recordWordAttempt('Apple', true);
      }

      if (window.audioManager) {
        window.audioManager.playFanfare();
      }
      if (window.confetti) {
        window.confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });
      }

      if (resultEl) {
        resultEl.innerHTML = `
          <div class="kid-reward-banner">
            🎉 <b>ACERTOU!</b><br>
            ⭐ +25 XP &nbsp;•&nbsp; 🪙 +10 Moedas
          </div>
        `;
      }

      this.speakPt('Parabéns! Você ganhou suas primeiras moedas!');

      // Salva conclusão do tutorial
      this.completed = true;
      localStorage.setItem('roblox_english_obby_kid_guide_done', 'true');
      if (window.gameStateManager && window.gameStateManager.state) {
        window.gameStateManager.state.kidGuideDone = true;
        window.gameStateManager.save();
      }

      setTimeout(() => {
        this.showCompletedScreen();
      }, 2400);
    };

    if (triggerBtn) {
      triggerBtn.onclick = () => {
        if (window.kidSpeech && typeof window.kidSpeech.listenForWord === 'function') {
          triggerBtn.textContent = '👂 Ouvindo sua voz... Fale: APPLE!';
          window.kidSpeech.listenForWord('Apple', (spokenWord) => {
            const isMatch = spokenWord.toLowerCase().includes('apple') || spokenWord.toLowerCase().includes('aple');
            if (isMatch) {
              handleSuccess();
            } else {
              triggerBtn.textContent = '🎤 Tentar Falar Novamente';
              if (resultEl) resultEl.innerHTML = '😊 <b>Quase! Vamos ouvir de novo!</b>';
              this.speakPt('Quase! Vamos ouvir de novo.');
              setTimeout(() => this.speakEn('Apple'), 1200);
            }
          });
        } else {
          // Se não houver suporte a microfone no navegador, conclui com êxito
          handleSuccess();
        }
      };
    }

    if (skipBtn) {
      skipBtn.onclick = () => {
        handleSuccess();
      };
    }
  }

  // =========================================================================
  // CONCLUSÃO CELEBRATIVA
  // =========================================================================
  showCompletedScreen() {
    this.badgeEl.textContent = '🏆';
    this.titleEl.textContent = 'Parabéns, Pequeno Aventureiro!';
    this.descEl.textContent = 'Você já sabe andar, pular, coletar e falar inglês!';
    this.dynamicArea.innerHTML = `
      <div class="kid-completion-box">
        <p>Agora continue sua aventura pelo arco-íris, pise nas cores e explore todos os mundos!</p>
        <div class="kid-ready-badge">🚀 VOCÊ ESTÁ PRONTO!</div>
      </div>
    `;
    this.actionsEl.style.display = 'flex';
    this.actionsEl.innerHTML = `<button class="kid-guide-btn kid-guide-btn-primary" id="kid-guide-finish-btn">🎮 JOGAR AGORA!</button>`;

    const finishBtn = document.getElementById('kid-guide-finish-btn');
    if (finishBtn) {
      finishBtn.onclick = () => {
        this.close();
      };
    }

    setTimeout(() => {
      this.speakPt('Você está pronto! Boa aventura!');
    }, 400);
  }
}

// Inicializa globalmente quando o DOM estiver pronto
window.KidGuideManager = KidGuideManager;

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.kidGuide) {
      window.kidGuide = new KidGuideManager();
      // No primeiro acesso (não concluído), inicia automaticamente após 1.5s
      const isDone = localStorage.getItem('roblox_english_obby_kid_guide_done') === 'true';
      if (!isDone) {
        setTimeout(() => {
          if (window.kidGuide && (!window.gameApp || window.gameApp.currentWorldId === 1)) {
            window.kidGuide.startGuide(false);
          }
        }, 1500);
      }
    }
  });
}
