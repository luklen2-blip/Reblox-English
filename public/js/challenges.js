// challenges.js - Lógica do Trecho 2 (Desafio das Cores com Respawn Suave) e Trecho 3 (3 Estrelas Douradas: One, Two, Three)

class ChallengesManager {
  constructor(scene, player, world) {
    this.scene = scene;
    this.player = player;
    this.world = world;

    this.colorChallengeCompleted = false;
    this.lastWrongTime = 0;

    this.collectibles = [];
    this.collectedCount = 0;
    this.totalCollectibles = 3;

    this.initCollectibles();
  }

  // Gera geometria 3D de Estrela de 5 pontas reluzente
  createStarGeometry(radius, depth) {
    const shape = new THREE.Shape();
    const points = 5;
    const innerRadius = radius * 0.45;

    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? radius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: depth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  // Trecho 3: 3 Estrelas Douradas Flutuantes com contagem "One, Two, Three"
  initCollectibles() {
    const starConfigs = [
      { id: 'STAR_1', numWord: 'ONE', spoken: 'Star! One!', z: -58, y: 6.8 },
      { id: 'STAR_2', numWord: 'TWO', spoken: 'Star! Two!', z: -69, y: 7.8 },
      { id: 'STAR_3', numWord: 'THREE', spoken: 'Star! Three!', z: -81, y: 8.8 }
    ];

    starConfigs.forEach(cfg => {
      const starGeo = this.createStarGeometry(0.85, 0.35);
      const starMat = new THREE.MeshLambertMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706
      });
      const starMesh = new THREE.Mesh(starGeo, starMat);
      starMesh.position.set(0, cfg.y, cfg.z);
      this.scene.add(starMesh);

      // Partícula de brilho suave na estrela
      const glowGeo = new THREE.SphereGeometry(1.2, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.25,
        wireframe: true
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      starMesh.add(glowMesh);

      this.collectibles.push({
        id: cfg.id,
        numberWord: cfg.numWord,
        spokenWord: cfg.spoken,
        mesh: starMesh,
        baseY: cfg.y,
        collected: false,
        rotSpeed: 2.2
      });
    });
  }

  // Trecho 2: Plataformas Coloridas Dinâmicas
  handleColorStep(colorId, mesh) {
    if (this.colorChallengeCompleted) return;

    if (colorId === 'BLUE') {
      this.colorChallengeCompleted = true;

      // Adiciona palavra dominada ao estado do jogo
      if (window.gameStateManager) {
        window.gameStateManager.addMasteredWord('Blue');
      }

      // Efeito sonoro alegre e fala comemorativa
      if (window.audioManager) {
        window.audioManager.playSuccess();
        window.audioManager.speak('BLUE! Great job! The bridge is open!');
      }

      // Brilho intenso no bloco azul
      mesh.material.emissive.setHex(0x38bdf8);

      // Desbloqueia o portão no mundo 3D
      this.world.unlockBarrier();

      // Atualiza o Checkpoint do personagem para a plataforma de cores
      this.player.setCheckpoint(new THREE.Vector3(0, 5.5, -44));

      // Atualiza HUD para BLUE
      if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
        window.gameApp.setWordHighlight('BLUE! 🟦', 'Você acertou a cor azul!');
        setTimeout(() => {
          window.gameApp.setWordHighlight('STAR! ⭐', 'Colete as 3 estrelas douradas!');
        }, 2200);
      }
    } else {
      // PISOU NO ERRADO: Reinicia o trecho 2 suavemente (teleporte suave para o início do trecho 2)
      if (window.gameStateManager) {
        window.gameStateManager.addMasteredWord('Red');
      }

      const now = Date.now();
      if (now - this.lastWrongTime > 1200) {
        this.lastWrongTime = now;

        if (window.audioManager) {
          window.audioManager.playTryAgain();
          window.audioManager.speak('Oops! Step on BLUE!');
        }

        // Teleporte suave para o início da plataforma do Trecho 2
        this.player.position.set(0, 5.5, -39);
        this.player.velocity.set(0, 0, 0);
        this.player.mesh.position.copy(this.player.position);

        if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
          window.gameApp.setWordHighlight('STEP ON BLUE!', 'Pise no bloco azul!');
        }
      }
    }
  }

  update(delta) {
    const time = Date.now() * 0.003;

    for (const item of this.collectibles) {
      if (item.collected) continue;

      // Animação de rotação e flutuação suave
      item.mesh.rotation.y += item.rotSpeed * delta;
      item.mesh.position.y = item.baseY + Math.sin(time * 2 + item.baseY) * 0.25;

      // Colisão com o jogador
      const dist = this.player.position.distanceTo(item.mesh.position);
      if (dist < 1.8) {
        this.collectItem(item);
      }
    }
  }

  collectItem(item) {
    item.collected = true;
    this.collectedCount++;

    // Desvanece e remove do 3D
    this.scene.remove(item.mesh);

    // Efeito sonoro e pronúncia imediata ("Star!", "One, Two, Three!")
    if (window.audioManager) {
      window.audioManager.playCollect();
      window.audioManager.speak(item.spokenWord);
    }

    // Atualiza estado central
    if (window.gameStateManager) {
      window.gameStateManager.addStar(1);
      window.gameStateManager.addMasteredWord('Star');
    }

    // Atualiza HUD superior em destaque com a palavra e contador
    if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
      window.gameApp.setWordHighlight(
        `${item.numberWord}! ⭐`,
        `Estrela ${this.collectedCount} de 3 coletada!`
      );
    }

    const counterEl = document.getElementById('collectibles-counter');
    if (counterEl) {
      counterEl.textContent = `${this.collectedCount}/${this.totalCollectibles}`;
      counterEl.style.transform = 'scale(1.3)';
      setTimeout(() => {
        counterEl.style.transform = 'scale(1)';
      }, 300);
    }

    // Se coletou todas as 3 estrelas douradas
    if (this.collectedCount >= this.totalCollectibles) {
      setTimeout(() => {
        if (window.audioManager) {
          window.audioManager.speak('Three stars! Go to the Golden Portal!');
        }
        if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
          window.gameApp.setWordHighlight(
            'GOLDEN PORTAL 🌀',
            'Atravesse o portal dourado final!'
          );
        }
      }, 1400);
    }
  }

  dispose() {
    for (const item of this.collectibles) {
      if (item.mesh) {
        this.scene.remove(item.mesh);
      }
    }
    this.collectibles = [];
  }
}

window.ChallengesManager = ChallengesManager;
