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

    // Trava de Segurança Comercial: Mundos 2, 3 e 4 são exclusivos para Acesso Vitalício (VIP Pro)
    const isUnlocked = (window.userGameState && window.userGameState.isProUnlocked === true) ||
                       (window.gameStateManager && window.gameStateManager.state && window.gameStateManager.state.isProUnlocked === true) ||
                       localStorage.getItem('roblox_english_obby_unlocked') === 'true';

    if (worldId > 1 && !isUnlocked) {
      console.warn(`🔒 Mundo ${worldId} bloqueado: requer Acesso Vitalício (R$ 19,90).`);
      if (window.audioManager) {
        window.audioManager.playTryAgain();
        window.audioManager.speak("Unlock all worlds with Lifetime Pro!");
      }
      const victoryModal = document.getElementById('victory-modal');
      if (victoryModal) victoryModal.classList.add('active');
      return;
    }

    if (window.gameStateManager) {
      window.gameStateManager.setWorld(worldId);
    }

    if (worldId === 4) {
      // Limpa mundos anteriores
      if (this.world) { this.world.dispose(); this.world = null; }
      if (this.challenges) { this.challenges.dispose(); this.challenges = null; }
      if (this.portal) { this.portal.dispose(); this.portal = null; }
      if (this.world2) { this.world2.dispose(); this.world2 = null; }
      if (this.world3) { this.world3.dispose(); this.world3 = null; }
      if (this.world4) { this.world4.dispose(); this.world4 = null; }

      // Constrói Mundo 4: Space Adventure
      this.currentWorldId = 4;
      this.world4 = new World4SpaceManager(this.scene, this.player);
      window.world4Manager = this.world4;

      // Gravidade lunar / pulo espacial mais alto
      if (this.player) this.player.jumpForce = 16.5;

      // Reseta posição do jogador para o início da Base Espacial
      this.player.position.set(0, 3.5, 0);
      this.player.setCheckpoint(new THREE.Vector3(0, 3.5, 0));
      this.player.velocity.set(0, 0, 0);
      this.player.mesh.position.copy(this.player.position);
      this.player.isFrozen = false;
      this.sectionAnnounced = {};

      // Atualiza badge de mundo ativo no HUD
      const worldBadge = document.getElementById('current-world-badge');
      if (worldBadge) {
        worldBadge.textContent = '🚀 MUNDO 4: SPACE';
        worldBadge.className = 'current-world-badge space-badge';
      }

      // Atualiza HUD para Space
      this.setWordHighlight('ROCKET! 🚀', 'Explore o Espaço e alcance o Foguete!');
      const counterEl = document.getElementById('collectibles-counter');
      if (counterEl) counterEl.textContent = '0/3';

      if (window.audioManager) {
        window.audioManager.speak("Welcome to Space Adventure! Look for the Rocket!");
      }
    } else if (worldId === 3) {
      if (this.player) this.player.jumpForce = 14.0;
      // Limpa mundos anteriores
      if (this.world) { this.world.dispose(); this.world = null; }
      if (this.challenges) { this.challenges.dispose(); this.challenges = null; }
      if (this.portal) { this.portal.dispose(); this.portal = null; }
      if (this.world2) { this.world2.dispose(); this.world2 = null; }
      if (this.world3) { this.world3.dispose(); this.world3 = null; }
      if (this.world4) { this.world4.dispose(); this.world4 = null; }

      // Constrói Mundo 3: Kitchen & Fruits
      this.currentWorldId = 3;
      this.world3 = new World3KitchenManager(this.scene, this.player);
      window.world3Manager = this.world3;

      // Reseta posição do jogador para o início da Cozinha
      this.player.position.set(0, 3.5, 0);
      this.player.setCheckpoint(new THREE.Vector3(0, 3.5, 0));
      this.player.velocity.set(0, 0, 0);
      this.player.mesh.position.copy(this.player.position);
      this.player.isFrozen = false;
      this.sectionAnnounced = {};

      // Atualiza badge de mundo ativo no HUD
      const worldBadge = document.getElementById('current-world-badge');
      if (worldBadge) {
        worldBadge.textContent = '🍳 MUNDO 3: KITCHEN';
        worldBadge.className = 'current-world-badge kitchen-badge';
      }

      // Atualiza HUD para Kitchen
      this.setWordHighlight('APPLE! 🍎', 'Explore a Cozinha e encontre a Maçã!');
      const counterEl = document.getElementById('collectibles-counter');
      if (counterEl) counterEl.textContent = '0/3';

      if (window.audioManager) {
        window.audioManager.speak("Welcome to Kitchen and Fruits! Look for the Apple!");
      }
    } else if (worldId === 2) {
      if (this.player) this.player.jumpForce = 14.0;
      const isUnlocked = (window.userGameState && window.userGameState.isProUnlocked) ||
                         localStorage.getItem('roblox_english_obby_unlocked') === 'true';

      // Limpa outros mundos
      if (this.world) { this.world.dispose(); this.world = null; }
      if (this.challenges) { this.challenges.dispose(); this.challenges = null; }
      if (this.portal) { this.portal.dispose(); this.portal = null; }
      if (this.world2) { this.world2.dispose(); this.world2 = null; }
      if (this.world3) { this.world3.dispose(); this.world3 = null; }
      if (this.world4) { this.world4.dispose(); this.world4 = null; }

      // Constrói Mundo 2: Animal Safari
      this.currentWorldId = 2;
      this.world2 = new World2SafariManager(this.scene, this.player);
      window.world2Manager = this.world2;

      // Reseta posição do jogador para o início do Safari
      this.player.position.set(0, 3.5, 0);
      this.player.setCheckpoint(new THREE.Vector3(0, 3.5, 0));
      this.player.velocity.set(0, 0, 0);
      this.player.mesh.position.copy(this.player.position);
      this.player.isFrozen = false;
      this.sectionAnnounced = {};

      // Atualiza badge de mundo ativo no HUD
      const worldBadge = document.getElementById('current-world-badge');
      if (worldBadge) {
        worldBadge.textContent = '🦁 MUNDO 2: SAFARI';
        worldBadge.className = 'current-world-badge safari-badge';
      }

      // Atualiza HUD para Safari
      this.setWordHighlight('LION! 🦁', 'Explore o Safari e encontre o Leão!');
      const counterEl = document.getElementById('collectibles-counter');
      if (counterEl) counterEl.textContent = '0/3';

      if (window.audioManager) {
        window.audioManager.speak("Welcome to Animal Safari! Look for the Lion!");
      }
    } else {
      // Retorna para Mundo 1: Rainbow Obby
      if (this.player) this.player.jumpForce = 14.0;
      if (this.world4) { this.world4.dispose(); this.world4 = null; }
      if (this.world3) { this.world3.dispose(); this.world3 = null; }
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
      this.player.setCheckpoint(new THREE.Vector3(0, 3.5, 0));
      this.player.velocity.set(0, 0, 0);
      this.player.mesh.position.copy(this.player.position);
      this.player.isFrozen = false;
      this.sectionAnnounced = {};

      // Atualiza badge de mundo ativo no HUD
      const worldBadge = document.getElementById('current-world-badge');
      if (worldBadge) {
        worldBadge.textContent = '🌈 MUNDO 1: RAINBOW';
        worldBadge.className = 'current-world-badge rainbow-badge';
      }

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
    const card1 = document.getElementById('select-world-1-card');
    const card2 = document.getElementById('select-world-2-card');

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

    if (worldsModal) {
      worldsModal.addEventListener('click', (e) => {
        if (e.target === worldsModal) {
          worldsModal.classList.remove('active');
        }
      });
    }

    const selectWorld1 = (e) => {
      if (e) e.stopPropagation();
      console.log('🌈 Selecionando World 1: Rainbow Bridge...');
      this.switchWorld(1);
    };

    const selectWorld2 = (e) => {
      if (e) e.stopPropagation();
      console.log('🦁 Selecionando World 2: Animal Safari...');
      this.switchWorld(2);
    };

    if (playWorld1Btn) playWorld1Btn.addEventListener('click', selectWorld1);
    if (card1) {
      card1.style.cursor = 'pointer';
      card1.addEventListener('click', selectWorld1);
    }

    if (playWorld2Btn) playWorld2Btn.addEventListener('click', selectWorld2);
    if (card2) {
      card2.style.cursor = 'pointer';
      card2.addEventListener('click', selectWorld2);
    }

    // Badge clicável no HUD para abrir o modal de mundos rapidamente
    const worldBadge = document.getElementById('current-world-badge');
    if (worldBadge && worldsBtn) {
      worldBadge.style.cursor = 'pointer';
      worldBadge.addEventListener('click', () => {
        worldsBtn.click();
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
        if (window.gameStateManager) window.gameStateManager.addMasteredWord('Jump');
      }

      // Trecho 2: Desafio das cores
      if (z <= -35 && z > -48 && this.challenges && !this.challenges.colorChallengeCompleted && !this.sectionAnnounced['sec2']) {
        this.sectionAnnounced['sec2'] = true;
        this.setWordHighlight('STEP ON BLUE! 🟦', 'Pise no bloco azul para abrir caminho');
        if (window.audioManager) {
          window.audioManager.speak('Step on BLUE!');
        }
        if (window.gameStateManager) window.gameStateManager.addMasteredWord('Blue');
      }

      // Trecho 3: Coletáveis (Estrelas)
      if (z <= -48 && this.challenges && this.challenges.collectedCount < 3 && !this.sectionAnnounced['sec3']) {
        this.sectionAnnounced['sec3'] = true;
        this.setWordHighlight('STAR! ⭐', 'Colete as 3 estrelas douradas (One, Two, Three)');
        if (window.gameStateManager) window.gameStateManager.addMasteredWord('Star');
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
        if (window.gameStateManager) window.gameStateManager.addMasteredWord('Lion');
      }

      // Elefante
      if (z <= -55 && z > -90 && !this.sectionAnnounced['safari_elephant']) {
        this.sectionAnnounced['safari_elephant'] = true;
        this.setWordHighlight('ELEPHANT! 🐘', 'Aperte SPEAK e diga: "ELEPHANT"!');
        if (window.audioManager) {
          window.audioManager.speak('Look at the big gentle Elephant! Say Elephant!');
        }
        if (window.gameStateManager) window.gameStateManager.addMasteredWord('Elephant');
      }

      // Macaco
      if (z <= -90 && !this.sectionAnnounced['safari_monkey']) {
        this.sectionAnnounced['safari_monkey'] = true;
        this.setWordHighlight('MONKEY! 🐒', 'Aperte SPEAK e diga: "MONKEY"!');
        if (window.audioManager) {
          window.audioManager.speak('The Monkey loves bananas! Say Monkey!');
        }
        if (window.gameStateManager) window.gameStateManager.addMasteredWord('Monkey');
      }
    } else if (this.currentWorldId === 3) {
      // Mundo 3 - Kitchen & Fruits Gatilhos
      // Maçã
      if (z <= -30 && z > -65 && !this.sectionAnnounced['kitchen_apple']) {
        this.sectionAnnounced['kitchen_apple'] = true;
        this.setWordHighlight('APPLE! 🍎', 'Aperte SPEAK e diga: "APPLE"!');
        if (window.audioManager) {
          window.audioManager.speak('Look at the red Apple! Delicious Apple! Say Apple!');
        }
        if (window.gameStateManager) window.gameStateManager.addMasteredWord('Apple');
      }

      // Leite
      if (z <= -65 && z > -100 && !this.sectionAnnounced['kitchen_milk']) {
        this.sectionAnnounced['kitchen_milk'] = true;
        this.setWordHighlight('MILK! 🥛', 'Aperte SPEAK e diga: "MILK"!');
        if (window.audioManager) {
          window.audioManager.speak('Fresh cold Milk! Say Milk!');
        }
        if (window.gameStateManager) window.gameStateManager.addMasteredWord('Milk');
      }

      // Pão
      if (z <= -100 && !this.sectionAnnounced['kitchen_bread']) {
        this.sectionAnnounced['kitchen_bread'] = true;
        this.setWordHighlight('BREAD! 🍞', 'Aperte SPEAK e diga: "BREAD"!');
        if (window.audioManager) {
          window.audioManager.speak('Warm toasted Bread! Say Bread!');
        }
        if (window.gameStateManager) window.gameStateManager.addMasteredWord('Bread');
      }
    } else if (this.currentWorldId === 4) {
      // Mundo 4 - Space Adventure Gatilhos
      // Foguete
      if (z <= -30 && z > -65 && !this.sectionAnnounced['space_rocket']) {
        this.sectionAnnounced['space_rocket'] = true;
        this.setWordHighlight('ROCKET! 🚀', 'Aperte SPEAK e diga: "ROCKET"!');
        if (window.audioManager) {
          window.audioManager.speak('Look at the giant Rocket! Blast off! Say Rocket!');
        }
        if (window.gameStateManager) window.gameStateManager.addMasteredWord('Rocket');
      }

      // Lua
      if (z <= -65 && z > -100 && !this.sectionAnnounced['space_moon']) {
        this.sectionAnnounced['space_moon'] = true;
        this.setWordHighlight('MOON! 🌙', 'Aperte SPEAK e diga: "MOON"!');
        if (window.audioManager) {
          window.audioManager.speak('The shining yellow Moon! Say Moon!');
        }
        if (window.gameStateManager) window.gameStateManager.addMasteredWord('Moon');
      }

      // Planeta
      if (z <= -100 && !this.sectionAnnounced['space_planet']) {
        this.sectionAnnounced['space_planet'] = true;
        this.setWordHighlight('PLANET! 🪐', 'Aperte SPEAK e diga: "PLANET"!');
        if (window.audioManager) {
          window.audioManager.speak('A giant ringed Planet! Say Planet!');
        }
        if (window.gameStateManager) window.gameStateManager.addMasteredWord('Planet');
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
    } else if (this.currentWorldId === 3 && this.world3) {
      currentPlatforms = this.world3.platforms;
    } else if (this.currentWorldId === 4 && this.world4) {
      currentPlatforms = this.world4.platforms;
    }

    // 1. Atualiza o jogador com colisões do mundo ativo
    if (this.player && window.inputManager) {
      const isMoving = Math.hypot(window.inputManager.inputVector.x, window.inputManager.inputVector.z) > 0.1;
      if (isMoving && window.gameStateManager && !this.hasRecordedWalk) {
        this.hasRecordedWalk = true;
        window.gameStateManager.addMasteredWord('Walk');
      }

      if (isMoving && window.kidGuide && window.kidGuide.isActive && window.kidGuide.currentStep === 2) {
        window.kidGuide.handlePlayerMove();
      }
      if (window.inputManager.jump && window.kidGuide && window.kidGuide.isActive && window.kidGuide.currentStep === 3) {
        window.kidGuide.handlePlayerJump();
      }

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
    } else if (this.currentWorldId === 3) {
      if (this.world3) this.world3.update(delta);
    } else if (this.currentWorldId === 4) {
      if (this.world4) this.world4.update(delta);
    }

    this.checkSectionTriggers();

    // 4. Renderiza o frame 3D
    this.renderer.render(this.scene, this.camera);
  }
}

// Inicialização resiliente e infalível
function bootGame() {
  if (!window.gameApp) {
    window.gameApp = new GameApp();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}

// Acessibilidade: Tecla ESC fecha qualquer modal ou sobreposição ativa
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.code === 'Escape') {
    if (window.quizManager) window.quizManager.close();
    if (window.worldsModal) window.worldsModal.close();
    if (window.skinManager) window.skinManager.close();
    if (typeof window.closeStudentDashboard === 'function') window.closeStudentDashboard();
    if (typeof window.closeParentsDashboard === 'function') window.closeParentsDashboard();
    if (window.kidSpeech) window.kidSpeech.stopListening();
    if (window.kidGuide) window.kidGuide.close();
    const unlockModal = document.getElementById('unlock-modal');
    if (unlockModal) unlockModal.classList.remove('active');
    const victoryModal = document.getElementById('victory-modal');
    if (victoryModal) victoryModal.classList.remove('active');
  }
});
