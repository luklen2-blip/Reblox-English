// main.js - Inicialização, Câmera em 3ª Pessoa, Gestão Multi-Mundo e Loop Principal

class GameApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    this.activeWord = "JUMP";
    this.sectionAnnounced = {};
    this.currentWorldId = 1;

    this.initThree();
    this.initGameSystems();
    this.initUIButtons();
    this.setupResize();
    this.checkOrientation();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Boas-vindas inicial amigável
    this.setWordHighlight('JUMP! 🦘', 'Salte pelas plataformas flutuantes');
    setTimeout(() => {
      if (window.audioManager) {
        window.audioManager.speak("Welcome to Rainbow Obby! Let's learn English! Jump forward!");
      }
    }, 1000);
  }

  initThree() {
    this.scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 400);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  initGameSystems() {
    // 1. Cenário e mapa Rainbow Obby (Mundo 1)
    this.world = new WorldManager(this.scene);
    window.worldManager = this.world;

    // 2. Personagem estilo bloco Roblox
    this.player = new Player(this.scene);
    window.player = this.player;

    // 3. Desafio das Cores e Coletáveis do Mundo 1
    this.challenges = new ChallengesManager(this.scene, this.player, this.world);
    window.challengesManager = this.challenges;

    // 4. Portal Dourado Final do Mundo 1
    this.portal = new PortalManager(this.scene, this.player);
    window.portalManager = this.portal;

    // Vetores de interpolação da câmera em 3ª pessoa
    this.currentCameraPos = new THREE.Vector3(0, 5, 8);
    this.currentLookAt = new THREE.Vector3(0, 2, 0);
  }

  // Alterna dinamicamente entre os mundos 3D
  switchWorld(worldId) {
    const modal = document.getElementById('worlds-modal');
    if (modal) modal.classList.remove('active');

    if (worldId === 2) {
      const isUnlocked = localStorage.getItem('roblox_english_obby_unlocked') === 'true';

      // Limpa Mundo 1
      if (this.world) { this.world.dispose(); this.world = null; }
      if (this.challenges) { this.challenges.dispose(); this.challenges = null; }
      if (this.portal) { this.portal.dispose(); this.portal = null; }
      if (this.world2) { this.world2.dispose(); this.world2 = null; }

      // Constrói Mundo 2: Animal Safari
      this.currentWorldId = 2;
      this.world2 = new World2SafariManager(this.scene, this.player);
      window.world2Manager = this.world2;

      // Reseta posição do jogador para o início do Safari
      this.player.position.set(0, 3.5, 0);
      this.player.checkpoint.set(0, 3.5, 0);
      this.player.velocity.set(0, 0, 0);
      this.player.mesh.position.copy(this.player.position);
      this.player.isFrozen = false;
      this.sectionAnnounced = {};

      // Atualiza HUD para Safari
      this.setWordHighlight('LION! 🦁', 'Explore o Safari e encontre o Leão!');
      const counterEl = document.getElementById('collectibles-counter');
      if (counterEl) counterEl.textContent = '0/3';

      if (window.audioManager) {
        window.audioManager.speak("Welcome to Animal Safari! Look for the Lion!");
      }
    } else {
      // Retorna para Mundo 1: Rainbow Obby
      if (this.world2) { this.world2.dispose(); this.world2 = null; }
      if (this.world) { this.world.dispose(); this.world = null; }
      if (this.challenges) { this.challenges.dispose(); this.challenges = null; }
      if (this.portal) { this.portal.dispose(); this.portal = null; }

      this.currentWorldId = 1;
      this.world = new WorldManager(this.scene);
      this.challenges = new ChallengesManager(this.scene, this.player, this.world);
      this.portal = new PortalManager(this.scene, this.player);
      window.worldManager = this.world;
      window.challengesManager = this.challenges;
      window.portalManager = this.portal;

      this.player.position.set(0, 3.5, 0);
      this.player.checkpoint.set(0, 3.5, 0);
      this.player.velocity.set(0, 0, 0);
      this.player.mesh.position.copy(this.player.position);
      this.player.isFrozen = false;
      this.sectionAnnounced = {};

      this.setWordHighlight('JUMP! 🦘', 'Salte pelas plataformas flutuantes');
      const counterEl = document.getElementById('collectibles-counter');
      if (counterEl) counterEl.textContent = '0/3';

      if (window.audioManager) {
        window.audioManager.speak("Rainbow Obby! Jump forward!");
      }
    }
  }

  // Atualiza o HUD com a palavra em destaque e subtexto de missão
  setWordHighlight(word, subtext = '') {
    this.activeWord = word.replace(/[!⭐🟦🦘🌀🦁🐘🐒🍌]/g, '').trim();

    const wordEl = document.getElementById('current-word');
    const subtextEl = document.getElementById('mission-subtext');

    if (wordEl) {
      wordEl.textContent = word;
      wordEl.style.transform = 'scale(1.15)';
      setTimeout(() => { wordEl.style.transform = 'scale(1)'; }, 250);
    }
    if (subtextEl && subtext) {
      subtextEl.textContent = subtext;
    }
  }

  initUIButtons() {
    // 1. Botão de Áudio (Mudo / Som)
    const audioBtn = document.getElementById('mute-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = window.audioManager.toggleMute();
        audioBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // 2. Botão para ouvir a pronúncia novamente
    const repeatBtn = document.getElementById('repeat-word-btn');
    if (repeatBtn) {
      repeatBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.audioManager) {
          const cleanWord = this.activeWord || "Jump";
          window.audioManager.speak(cleanWord);
        }
      });
    }

    // 3. Botão de Falar no Microfone (Speech-to-Text)
    const speakBtn = document.getElementById('hud-speak-btn');
    if (speakBtn) {
      speakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.kidSpeech) {
          window.kidSpeech.listenForWord(this.activeWord, (spoken) => {
            console.log('✅ Reconhecido com sucesso:', spoken);
          });
        }
      });
    }

    // 4. Modal de Seleção de Mundos
    const worldsBtn = document.getElementById('worlds-btn');
    const worldsModal = document.getElementById('worlds-modal');
    const closeWorldsBtn = document.getElementById('close-worlds-modal-btn');
    const playWorld1Btn = document.getElementById('btn-play-world-1');
    const playWorld2Btn = document.getElementById('btn-play-world-2');

    if (worldsBtn && worldsModal) {
      worldsBtn.addEventListener('click', () => {
        // Atualiza status do Mundo 2 se VIP
        const isVIP = localStorage.getItem('roblox_english_obby_unlocked') === 'true';
        const tag = document.getElementById('world-2-status-tag');
        if (tag) {
          tag.textContent = isVIP ? 'LIBERADO 👑' : 'VIP VITALÍCIO 👑';
          tag.className = isVIP ? 'world-card-tag world-tag-free' : 'world-card-tag world-tag-vip';
        }

        // Destaca qual mundo está ativo
        const card1 = document.getElementById('select-world-1-card');
        const card2 = document.getElementById('select-world-2-card');
        if (card1 && card2) {
          if (this.currentWorldId === 1) {
            card1.classList.add('active-world');
            card2.classList.remove('active-world');
          } else {
            card2.classList.add('active-world');
            card1.classList.remove('active-world');
          }
        }

        worldsModal.classList.add('active');
      });
    }

    if (closeWorldsBtn && worldsModal) {
      closeWorldsBtn.addEventListener('click', () => {
        worldsModal.classList.remove('active');
      });
    }

    if (playWorld1Btn) {
      playWorld1Btn.addEventListener('click', () => {
        this.switchWorld(1);
      });
    }

    if (playWorld2Btn) {
      playWorld2Btn.addEventListener('click', () => {
        const isVIP = localStorage.getItem('roblox_english_obby_unlocked') === 'true';
        if (!isVIP) {
          // Se não for VIP, permite explorar e abre o modal de desbloqueio para incentivo
          this.switchWorld(2);
          setTimeout(() => {
            if (window.audioManager) {
              window.audioManager.speak("Welcome to Safari Park! Explore the animals!");
            }
          }, 800);
        } else {
          this.switchWorld(2);
        }
      });
    }

    // 5. Clique no card de palavra
    const wordCard = document.getElementById('word-card');
    if (wordCard) {
      wordCard.addEventListener('click', () => {
        if (window.audioManager) {
          window.audioManager.speak(this.activeWord || "Jump");
        }
      });
    }

    // 6. Botão de Tela Cheia
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          fullscreenBtn.textContent = '🗗';
        } else {
          document.exitFullscreen().catch(() => {});
          fullscreenBtn.textContent = '⛶';
        }
      });
    }

    // 7. Botão de Respawn manual
    const resetBtn = document.getElementById('respawn-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.player.respawn();
      });
    }

    // 8. Fechar aviso de orientação paisagem no mobile
    const dismissRotateBtn = document.getElementById('dismiss-rotate-hint');
    if (dismissRotateBtn) {
      dismissRotateBtn.addEventListener('click', () => {
        const overlay = document.getElementById('rotate-hint-overlay');
        if (overlay) overlay.classList.remove('show-hint');
        this.rotateDismissed = true;
      });
    }
  }

  checkOrientation() {
    if (this.rotateDismissed) return;
    const isMobile = window.inputManager && window.inputManager.isMobile;
    const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth < 800;

    const overlay = document.getElementById('rotate-hint-overlay');
    if (overlay) {
      if (isMobile && isPortrait) {
        overlay.classList.add('show-hint');
      } else {
        overlay.classList.remove('show-hint');
      }
    }
  }

  setupResize() {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      if (window.inputManager) {
        const isMob = window.inputManager.detectMobile();
        if (isMob) {
          document.body.classList.add('mobile-active');
        } else {
          document.body.classList.remove('mobile-active');
        }
      }

      this.checkOrientation();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
  }

  updateCamera(delta) {
    const pPos = this.player.position;
    const rot = window.inputManager.cameraRotation;

    const distance = 7.0;
    const height = 2.2;

    const targetCamX = pPos.x + Math.sin(rot.yaw) * Math.cos(rot.pitch) * distance;
    const targetCamY = pPos.y + Math.sin(rot.pitch) * distance + height;
    const targetCamZ = pPos.z + Math.cos(rot.yaw) * Math.cos(rot.pitch) * distance;

    const targetPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);

    const lerpFactor = Math.min(1, 10 * delta);
    this.currentCameraPos.lerp(targetPos, lerpFactor);

    const targetLook = new THREE.Vector3(pPos.x, pPos.y + 1.2, pPos.z);
    this.currentLookAt.lerp(targetLook, lerpFactor);

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookAt);
  }

  checkSectionTriggers() {
    const z = this.player.position.z;

    if (this.currentWorldId === 1) {
      // Trecho 1: Salto guiado
      if (z > -35 && !this.sectionAnnounced['sec1']) {
        this.sectionAnnounced['sec1'] = true;
        this.setWordHighlight('JUMP! 🦘', 'Salte pelas plataformas flutuantes');
      }

      // Trecho 2: Desafio das cores
      if (z <= -35 && z > -48 && this.challenges && !this.challenges.colorChallengeCompleted && !this.sectionAnnounced['sec2']) {
        this.sectionAnnounced['sec2'] = true;
        this.setWordHighlight('STEP ON BLUE! 🟦', 'Pise no bloco azul para abrir caminho');
        if (window.audioManager) {
          window.audioManager.speak('Step on BLUE!');
        }
      }

      // Trecho 3: Coletáveis (Estrelas)
      if (z <= -48 && this.challenges && this.challenges.collectedCount < 3 && !this.sectionAnnounced['sec3']) {
        this.sectionAnnounced['sec3'] = true;
        this.setWordHighlight('STAR! ⭐', 'Colete as 3 estrelas douradas (One, Two, Three)');
      }
    } else if (this.currentWorldId === 2) {
      // Mundo 2 - Animal Safari Gatilhos
      // Leão
      if (z <= -28 && z > -55 && !this.sectionAnnounced['safari_lion']) {
        this.sectionAnnounced['safari_lion'] = true;
        this.setWordHighlight('LION! 🦁', 'Aperte SPEAK e diga: "LION"!');
        if (window.audioManager) {
          window.audioManager.speak('Look, the Lion! Can you roar like a lion? Roar!');
        }
      }

      // Elefante
      if (z <= -55 && z > -90 && !this.sectionAnnounced['safari_elephant']) {
        this.sectionAnnounced['safari_elephant'] = true;
        this.setWordHighlight('ELEPHANT! 🐘', 'Aperte SPEAK e diga: "ELEPHANT"!');
        if (window.audioManager) {
          window.audioManager.speak('Look at the big gentle Elephant! Say Elephant!');
        }
      }

      // Macaco
      if (z <= -90 && !this.sectionAnnounced['safari_monkey']) {
        this.sectionAnnounced['safari_monkey'] = true;
        this.setWordHighlight('MONKEY! 🐒', 'Aperte SPEAK e diga: "MONKEY"!');
        if (window.audioManager) {
          window.audioManager.speak('The Monkey loves bananas! Say Monkey!');
        }
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Obtém plataformas do mundo ativo
    let currentPlatforms = [];
    if (this.currentWorldId === 1 && this.world) {
      currentPlatforms = this.world.platforms;
    } else if (this.currentWorldId === 2 && this.world2) {
      currentPlatforms = this.world2.platforms;
    }

    // 1. Atualiza o jogador com colisões do mundo ativo
    if (this.player && window.inputManager) {
      this.player.update(
        delta,
        window.inputManager,
        window.inputManager.cameraRotation,
        currentPlatforms
      );
    }

    // 2. Atualiza a câmera
    this.updateCamera(delta);

    // 3. Atualiza os sistemas do mundo ativo
    if (this.currentWorldId === 1) {
      if (this.world) this.world.update(delta);
      if (this.challenges) this.challenges.update(delta);
      if (this.portal) this.portal.update(delta);
    } else if (this.currentWorldId === 2) {
      if (this.world2) this.world2.update(delta);
    }

    this.checkSectionTriggers();

    // 4. Renderiza o frame 3D
    this.renderer.render(this.scene, this.camera);
  }
}

// Inicializa quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});
