// portal.js - Portal Dourado de Fim de Fase, Congelamento do Boneco e Trava de Conversão

class PortalManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.activated = false;

    this.position = new THREE.Vector3(0, 11.0, -94);
    this.createGoldenPortalMesh();
  }

  createGoldenPortalMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // 1. Anel externo dourado reluzente (Golden Portal)
    const ringGeo = new THREE.TorusGeometry(2.7, 0.38, 16, 36);
    const ringMat = new THREE.MeshLambertMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706
    });
    this.outerRing = new THREE.Mesh(ringGeo, ringMat);
    this.group.add(this.outerRing);

    // 2. Anel intermediário dourado claro
    const innerRingGeo = new THREE.TorusGeometry(2.1, 0.18, 14, 32);
    const innerRingMat = new THREE.MeshLambertMaterial({
      color: 0xfef08a,
      emissive: 0xeab308
    });
    this.innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    this.group.add(this.innerRing);

    // 3. Vórtice espiral dourado e místico
    const vortexGeo = new THREE.CircleGeometry(2.0, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#fef08a');
    grad.addColorStop(0.6, '#f59e0b');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const vortexTex = new THREE.CanvasTexture(canvas);
    const vortexMat = new THREE.MeshBasicMaterial({
      map: vortexTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    this.vortex = new THREE.Mesh(vortexGeo, vortexMat);
    this.group.add(this.vortex);

    // Luz pontual dourada emanando do portal
    const portalLight = new THREE.PointLight(0xfbbf24, 2.5, 18);
    this.group.add(portalLight);

    this.scene.add(this.group);
  }

  update(delta) {
    if (!this.group) return;

    // Rotação contínua dos anéis do portal
    this.outerRing.rotation.z += 0.9 * delta;
    this.innerRing.rotation.z -= 1.5 * delta;
    this.vortex.rotation.z += 2.0 * delta;

    // Checa colisão com o jogador
    if (!this.activated) {
      const dist = this.player.position.distanceTo(this.position);
      if (dist < 2.6) {
        this.triggerVictory();
      }
    }
  }

  triggerVictory() {
    this.activated = true;

    // Checa se o usuário já possui acesso vitalício salvo
    const isUnlocked = (window.userGameState && window.userGameState.isProUnlocked) ||
                       localStorage.getItem('roblox_english_obby_unlocked') === 'true';

    // 1. Áudio e comemoração
    if (window.audioManager) {
      window.audioManager.playFanfare();
      window.audioManager.speak("Level 1 Complete! Excellent job!");
    }

    // Recompensas da Fase 2 para conclusão do Mundo 1
    if (window.gameStateManager) {
      window.gameStateManager.addCoins(50);
      window.gameStateManager.addXp(100);
      window.gameStateManager.unlockBadge('world1_complete');
    }

    // 2. Disparo imediato de confetes coloridos
    this.fireConfetti();

    if (isUnlocked) {
      // Usuário VIP: não trava o jogo, libera transição suave para o Mundo 2
      if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
        window.gameApp.setWordHighlight('WARPING TO WORLD 2! 🦁', 'Carregando Safari dos Animais...');
      }
      setTimeout(() => {
        if (window.gameApp && typeof window.gameApp.switchWorld === 'function') {
          window.gameApp.switchWorld(2);
        }
        this.activated = false;
      }, 1500);
      return;
    }

    // 3. Trava de Conversão: CONGELA O BONECO
    this.player.isFrozen = true;

    // 4. Abre o UnlockModal voltado aos pais atualizando as palavras aprendidas
    setTimeout(() => {
      if (window.gameStateManager) {
        window.gameStateManager.renderParentsVocab();
      }
      const modal = document.getElementById('victory-modal');
      if (modal) {
        modal.classList.add('active');
      }
    }, 900);
  }

  fireConfetti() {
    if (typeof confetti === 'function') {
      const count = 220;
      const defaults = { origin: { y: 0.7 } };

      const fire = (particleRatio, opts) => {
        confetti(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio)
        }));
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } else {
      this.domConfettiFallback();
    }
  }

  domConfettiFallback() {
    const colors = ['#facc15', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('div');
      p.style.position = 'fixed';
      p.style.top = '-20px';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.width = (8 + Math.random() * 8) + 'px';
      p.style.height = (12 + Math.random() * 12) + 'px';
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.zIndex = '999';
      p.style.borderRadius = '3px';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      p.style.transition = 'top 3s ease-in, transform 3s ease-out, opacity 3s ease-in';
      document.body.appendChild(p);

      setTimeout(() => {
        p.style.top = '105vh';
        p.style.transform = `rotate(${Math.random() * 720}deg) scale(0.6)`;
        p.style.opacity = '0';
      }, 50);

      setTimeout(() => {
        p.remove();
      }, 3500);
    }
  }

  dispose() {
    if (this.group) {
      this.scene.remove(this.group);
    }
  }
}

window.PortalManager = PortalManager;
