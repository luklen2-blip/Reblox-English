// world.js - Cenário 3D, Iluminação, Nuvens e Plataformas do "Rainbow Obby"

class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.platforms = [];
    this.clouds = [];
    this.animatedObjects = [];
    this.addedObjects = [];

    this.setupAtmosphere();
    this.createClouds();
    this.buildRainbowObby();
  }

  setupAtmosphere() {
    // Fundo azul céu de desenho animado
    this.scene.background = new THREE.Color(0x5ec8f8);
    this.scene.fog = new THREE.Fog(0x5ec8f8, 40, 180);

    // Luz hemisférica vibrante
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x86efac, 0.75);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // Luz solar quente
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 0.85);
    sunLight.position.set(30, 60, 20);
    sunLight.castShadow = true;
    this.scene.add(sunLight);

    // Luz de preenchimento suave
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.35);
    fillLight.position.set(-25, 30, -20);
    this.scene.add(fillLight);

    this.lights = [hemiLight, sunLight, fillLight];
  }

  // Nuvens 3D fofinhas em blocos volumétricos
  createClouds() {
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92
    });

    for (let i = 0; i < 22; i++) {
      const cloudGroup = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 4);

      for (let j = 0; j < numPuffs; j++) {
        const sx = 4 + Math.random() * 4;
        const sy = 2 + Math.random() * 2;
        const sz = 4 + Math.random() * 4;
        const puffGeo = new THREE.BoxGeometry(sx, sy, sz);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (j - numPuffs / 2) * 3,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 3
        );
        cloudGroup.add(puff);
      }

      cloudGroup.position.set(
        (Math.random() - 0.5) * 220,
        15 + Math.random() * 30,
        -120 + (Math.random() - 0.5) * 160
      );

      cloudGroup.userData = { speed: 0.5 + Math.random() * 0.8 };
      this.clouds.push(cloudGroup);
      this.scene.add(cloudGroup);
    }
  }

  // Cria uma plataforma em formato de bloco limpo com borda arredondada/chanfrada
  addPlatform(x, y, z, width, height, depth, colorHex, options = {}) {
    const mat = new THREE.MeshLambertMaterial({
      color: colorHex,
      emissive: options.emissive || 0x000000
    });

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    // Contorno estético de borda superior
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false });
    const topCapGeo = new THREE.BoxGeometry(width * 1.02, 0.1, depth * 1.02);
    const topCap = new THREE.Mesh(topCapGeo, new THREE.MeshLambertMaterial({
      color: colorHex,
      emissive: 0x111111
    }));
    topCap.position.set(0, height / 2 + 0.05, 0);
    mesh.add(topCap);

    // Bounding Box 3D para colisão precisa
    const box = new THREE.Box3();
    box.setFromObject(mesh);

    const platformObj = {
      mesh,
      box,
      onStep: options.onStep || null,
      id: options.id || null
    };

    this.platforms.push(platformObj);
    return platformObj;
  }

  buildRainbowObby() {
    // ================= 1. PLATAFORMA DE INÍCIO SEGURA =================
    this.startPlatform = this.addPlatform(0, 0, 0, 10, 1.5, 10, 0x10b981, { id: 'start' });

    // Placa 3D estilizada "START!" na plataforma inicial
    this.createStartBanner();

    // ================= 2. TRECHO 1: PULOS (JUMPING STONES) =================
    // Plataformas flutuantes coloridas do arco-íris com alturas gradualmente ascendentes
    const stoneConfigs = [
      { x: 0, y: 0.6, z: -9, w: 3.2, h: 1.0, d: 3.2, c: 0xef4444 },   // Red
      { x: 2.2, y: 1.4, z: -15, w: 2.8, h: 1.0, d: 2.8, c: 0xf97316 }, // Orange
      { x: -2.0, y: 2.2, z: -21, w: 2.8, h: 1.0, d: 2.8, c: 0xfacc15 }, // Yellow
      { x: 1.8, y: 3.0, z: -27, w: 2.8, h: 1.0, d: 2.8, c: 0x22c55e }, // Green
      { x: 0, y: 3.8, z: -33, w: 3.2, h: 1.0, d: 3.2, c: 0x06b6d4 }    // Cyan
    ];

    stoneConfigs.forEach((cfg, i) => {
      this.addPlatform(cfg.x, cfg.y, cfg.z, cfg.w, cfg.h, cfg.d, cfg.c, {
        id: `stone_${i + 1}`
      });
    });

    // ================= 3. TRECHO 2: CHECKPOINT E DESAFIO DAS CORES =================
    // Plataforma do Desafio das Cores
    this.colorPlatform = this.addPlatform(0, 4.4, -44, 14, 1.5, 12, 0x6366f1, {
      id: 'checkpoint_colors'
    });

    // Portão mágico / barreira luminosa
    this.createColorChallengeBarrier();

    // Os 3 blocos coloridos do desafio: RED, BLUE, GREEN
    this.createColorBlocks();

    // ================= 4. TRECHO 3: CAMINHO DOS COLECIONÁVEIS =================
    // Ponte / blocos que levam ao portal
    const bridgeConfigs = [
      { x: 0, y: 5.2, z: -57, w: 4.0, h: 1.0, d: 8, c: 0xa855f7 },
      { x: 0, y: 6.2, z: -69, w: 4.0, h: 1.0, d: 10, c: 0xec4899 },
      { x: 0, y: 7.2, z: -81, w: 4.0, h: 1.0, d: 8, c: 0x3b82f6 }
    ];

    this.bridgePlatforms = [];
    bridgeConfigs.forEach(cfg => {
      const p = this.addPlatform(cfg.x, cfg.y, cfg.z, cfg.w, cfg.h, cfg.d, cfg.c);
      this.bridgePlatforms.push(p);
    });

    // ================= 5. PLATAFORMA FINAL DO PORTAL =================
    this.finishPlatform = this.addPlatform(0, 8.0, -94, 14, 1.5, 14, 0xf59e0b, {
      id: 'finish'
    });
  }

  createStartBanner() {
    const bannerGroup = new THREE.Group();
    // Postes laterais
    const postMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 4);
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-3.5, 2.5, -4);
    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(3.5, 2.5, -4);
    bannerGroup.add(leftPost);
    bannerGroup.add(rightPost);

    // Faixa com texto desenhado em Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f59e0b';
    ctx.roundRect ? ctx.roundRect(10, 10, 492, 108, 20) : ctx.fillRect(10, 10, 492, 108);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌈 START! WELCOME!', 256, 64);

    const bannerTex = new THREE.CanvasTexture(canvas);
    const bannerMat = new THREE.MeshLambertMaterial({ map: bannerTex });
    const bannerGeo = new THREE.BoxGeometry(7, 1.6, 0.2);
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(0, 4.0, -4);
    bannerGroup.add(bannerMesh);

    this.startBanner = bannerGroup;
    this.scene.add(bannerGroup);
  }

  createColorChallengeBarrier() {
    this.barrierGroup = new THREE.Group();

    // Postes de cristal luminosos
    const pillarGeo = new THREE.CylinderGeometry(0.35, 0.45, 5, 8);
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8 });
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-5.5, 7.0, -49);
    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(5.5, 7.0, -49);
    this.barrierGroup.add(leftPillar);
    this.barrierGroup.add(rightPillar);

    // Campo de força translúcido que some ao acertar a cor
    const forceFieldGeo = new THREE.BoxGeometry(11, 4, 0.4);
    this.forceFieldMat = new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      emissive: 0x0284c7
    });
    this.forceFieldMesh = new THREE.Mesh(forceFieldGeo, this.forceFieldMat);
    this.forceFieldMesh.position.set(0, 7.0, -49);
    this.barrierGroup.add(this.forceFieldMesh);

    this.scene.add(this.barrierGroup);
  }

  createColorBlocks() {
    // 3 Blocos chamativos no chão: RED, BLUE, GREEN
    const colors = [
      { id: 'RED', label: 'RED', hex: 0xef4444, x: -3.8 },
      { id: 'BLUE', label: 'BLUE', hex: 0x3b82f6, x: 0 },
      { id: 'GREEN', label: 'GREEN', hex: 0x22c55e, x: 3.8 }
    ];

    this.colorBlockObjects = [];

    colors.forEach(c => {
      // Bloco no chão
      const blockGeo = new THREE.BoxGeometry(3.0, 0.5, 3.0);
      const blockMat = new THREE.MeshLambertMaterial({
        color: c.hex,
        emissive: 0x222222
      });
      const blockMesh = new THREE.Mesh(blockGeo, blockMat);
      blockMesh.position.set(c.x, 5.2, -43);
      this.scene.add(blockMesh);

      // Texto de identificação da cor
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.label, 128, 64);

      const labelTex = new THREE.CanvasTexture(canvas);
      const labelGeo = new THREE.PlaneGeometry(2.4, 1.2);
      const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.rotation.x = -Math.PI / 2;
      labelMesh.position.set(0, 0.26, 0);
      blockMesh.add(labelMesh);

      // Box de colisão
      const box = new THREE.Box3();
      box.setFromObject(blockMesh);

      const colorBlockItem = {
        id: c.id,
        mesh: blockMesh,
        box,
        baseY: 5.2,
        colorHex: c.hex,
        onStep: (player) => {
          if (window.challengesManager) {
            window.challengesManager.handleColorStep(c.id, blockMesh);
          }
        }
      };

      this.platforms.push(colorBlockItem);
      this.colorBlockObjects.push(colorBlockItem);
    });
  }

  // Abre o portão mágico quando a criança acerta a cor BLUE
  unlockBarrier() {
    if (!this.forceFieldMesh) return;
    // Animação de desvanecer o campo de força
    let opacity = 0.7;
    const fadeInterval = setInterval(() => {
      opacity -= 0.05;
      if (opacity <= 0) {
        clearInterval(fadeInterval);
        this.forceFieldMesh.visible = false;
      } else {
        this.forceFieldMat.opacity = opacity;
      }
    }, 30);
  }

  update(delta) {
    // Anima as nuvens flutuando lentamente pelo céu
    for (const cloud of this.clouds) {
      cloud.position.x += cloud.userData.speed * delta;
      if (cloud.position.x > 120) {
        cloud.position.x = -120;
      }
    }

    // Atualiza bounding boxes se houver plataformas dinâmicas
    for (const p of this.platforms) {
      if (p.mesh && p.isDynamic) {
        p.box.setFromObject(p.mesh);
      }
    }
  }

  dispose() {
    for (const p of this.platforms) {
      if (p.mesh) this.scene.remove(p.mesh);
    }
    for (const c of this.clouds) {
      this.scene.remove(c);
    }
    if (this.startBanner) this.scene.remove(this.startBanner);
    if (this.barrierGroup) this.scene.remove(this.barrierGroup);
    if (this.lights) {
      this.lights.forEach(l => this.scene.remove(l));
    }
    this.platforms = [];
    this.clouds = [];
  }
}

window.WorldManager = WorldManager;
