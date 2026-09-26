// world4.js - Mundo 4: "Space Adventure 3D" (Aventura Espacial, Planetas, Gravidade e Vocabulário)

class World4SpaceManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.platforms = [];
    this.spaceObjects = [];
    this.collectibles = [];
    this.collectedCount = 0;
    this.totalCollectibles = 3;
    this.environmentGroup = new THREE.Group();
    this.scene.add(this.environmentGroup);

    this.setupSpaceAtmosphere();
    this.buildSpaceMap();
  }

  setupSpaceAtmosphere() {
    // Espaço cósmico profundo
    this.scene.background = new THREE.Color(0x030712); // Preto-azulado cósmico
    this.scene.fog = new THREE.Fog(0x030712, 50, 220);

    // Iluminação cósmica (luz fria e distante)
    const hemiLight = new THREE.HemisphereLight(0x818cf8, 0x0f172a, 0.7);
    hemiLight.position.set(0, 50, 0);
    this.environmentGroup.add(hemiLight);

    const cosmicLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    cosmicLight.position.set(20, 60, 20);
    cosmicLight.castShadow = true;
    this.environmentGroup.add(cosmicLight);

    // Campo de estrelas cintilantes 3D
    this.createStarField();
    this.createCosmicNebula();
  }

  createStarField() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 350;
      starPositions[i + 1] = 5 + Math.random() * 120;
      starPositions[i + 2] = -70 + (Math.random() - 0.5) * 250;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0.95
    });

    this.starPoints = new THREE.Points(starGeo, starMat);
    this.environmentGroup.add(this.starPoints);
  }

  createCosmicNebula() {
    const nebMat = new THREE.MeshLambertMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.18
    });

    for (let i = 0; i < 8; i++) {
      const neb = new THREE.Mesh(new THREE.BoxGeometry(22, 14, 22), nebMat);
      neb.position.set(
        (Math.random() - 0.5) * 140,
        15 + Math.random() * 30,
        -70 + (Math.random() - 0.5) * 140
      );
      this.environmentGroup.add(neb);
    }
  }

  addPlatform(x, y, z, width, height, depth, colorHex, options = {}) {
    const mat = new THREE.MeshLambertMaterial({
      color: colorHex,
      emissive: options.emissive || 0x0f172a
    });

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.environmentGroup.add(mesh);

    // Capa de topo estético (grade tecnológica ou cristal lunar)
    const topCapGeo = new THREE.BoxGeometry(width * 1.02, 0.12, depth * 1.02);
    const topCapMat = new THREE.MeshLambertMaterial({
      color: options.topColor || colorHex,
      emissive: 0x1e1b4b
    });
    const topCap = new THREE.Mesh(topCapGeo, topCapMat);
    topCap.position.set(0, height / 2 + 0.06, 0);
    mesh.add(topCap);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(width, height, depth)
    );

    const platformObj = {
      mesh,
      box,
      onStep: options.onStep || null,
      id: options.id || null
    };

    this.platforms.push(platformObj);
    return platformObj;
  }

  buildSpaceMap() {
    // 1. BASE DE LANÇAMENTO ESPACIAL (Platform 1)
    this.startPlatform = this.addPlatform(0, 0, 0, 11, 1.5, 11, 0x1e293b, {
      topColor: 0x38bdf8,
      id: 'space_start'
    });
    this.createSpaceBanner();

    // 2. TRECHO 1: TRILHA DE ASTEROIDES LUNARES (Rumo ao Foguete)
    const asteroids = [
      { x: 0, y: 0.9, z: -9, w: 3.2, h: 1.0, d: 3.2, c: 0x475569 },
      { x: -2.6, y: 1.8, z: -16, w: 3.0, h: 1.0, d: 3.0, c: 0x334155 },
      { x: 2.4, y: 2.7, z: -23, w: 3.0, h: 1.0, d: 3.0, c: 0x475569 },
      { x: 0, y: 3.6, z: -30, w: 3.4, h: 1.0, d: 3.4, c: 0x64748b }
    ];
    asteroids.forEach((a, idx) => {
      this.addPlatform(a.x, a.y, a.z, a.w, a.h, a.d, a.c, {
        topColor: 0x94a3b8,
        id: `asteroid_${idx + 1}`
      });
    });

    // 3. ILHA DO FOGUETE GIGANTE (ROCKET ISLAND)
    this.rocketPlatform = this.addPlatform(0, 4.6, -42, 14, 1.5, 13, 0x1e1b4b, {
      topColor: 0x6366f1,
      id: 'rocket_platform'
    });
    this.createGiantRocket(0, 6.4, -44);

    // 4. TRECHO 2: PONTES DE CRISTAIS ESTELARES (Rumo à Lua)
    const crystals = [
      { x: -2.6, y: 5.5, z: -53, w: 3.2, h: 0.9, d: 3.2, c: 0x0284c7 },
      { x: 2.6, y: 6.4, z: -60, w: 3.2, h: 0.9, d: 3.2, c: 0x06b6d4 },
      { x: 0, y: 7.3, z: -67, w: 3.4, h: 0.9, d: 3.4, c: 0x38bdf8 }
    ];
    crystals.forEach((c, idx) => {
      this.addPlatform(c.x, c.y, c.z, c.w, c.h, c.d, c.c, {
        topColor: 0x7dd3fc,
        id: `crystal_${idx + 1}`
      });
    });

    // 5. ILHA DA LUA BRILHANTE (MOON ISLAND)
    this.moonPlatform = this.addPlatform(0, 8.2, -80, 15, 1.5, 13, 0xca8a04, {
      topColor: 0xfacc15,
      id: 'moon_platform'
    });
    this.createGiantMoon(0, 10.2, -82);

    // 6. TRECHO 3: ANÉIS E METEOROS CÓSMICOS (Rumo ao Planeta)
    const meteors = [
      { x: 2.4, y: 9.1, z: -92, w: 3.3, h: 0.9, d: 3.3, c: 0x8b5cf6 },
      { x: -2.4, y: 10.0, z: -99, w: 3.3, h: 0.9, d: 3.3, c: 0xa855f7 },
      { x: 0, y: 10.9, z: -106, w: 3.5, h: 0.9, d: 3.5, c: 0xc084fc }
    ];
    meteors.forEach((m, idx) => {
      this.addPlatform(m.x, m.y, m.z, m.w, m.h, m.d, m.c, {
        topColor: 0xe9d5ff,
        id: `meteor_${idx + 1}`
      });
    });

    // 7. ILHA DO PLANETA SATURNO (PLANET ISLAND)
    this.planetPlatform = this.addPlatform(0, 11.8, -118, 14, 1.5, 13, 0x064e3b, {
      topColor: 0x10b981,
      id: 'planet_island'
    });
    this.createGiantPlanet(0, 14.0, -120);

    // 8. PLATAFORMA FINAL DO PORTAL ESTELAR (VITÓRIA ESPACIAL)
    this.spaceFinishPlatform = this.addPlatform(0, 12.6, -132, 14, 1.5, 14, 0x4f46e5, {
      topColor: 0x818cf8,
      id: 'space_finish'
    });
    this.createSpacePortal(0, 15.6, -132);

    // 9. COLETÁVEIS: 3 CRISTAIS ESPACIAIS (ROCKET, MOON, PLANET)
    this.initSpaceCollectibles();
  }

  createSpaceBanner() {
    const bannerGroup = new THREE.Group();

    // Postes tecnológicos de metal espacial
    const postMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const postGeo = new THREE.CylinderGeometry(0.18, 0.2, 4.2);
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-3.5, 2.5, -4);
    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(3.5, 2.5, -4);
    bannerGroup.add(leftPost);
    bannerGroup.add(rightPost);

    // Faixa Canvas estilizada espacial
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4f46e5'; // Índigo cósmico
    ctx.roundRect ? ctx.roundRect(10, 10, 492, 108, 20) : ctx.fillRect(10, 10, 492, 108);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚀 WORLD 4: SPACE ADVENTURE', 256, 64);

    const bannerTex = new THREE.CanvasTexture(canvas);
    const bannerMat = new THREE.MeshLambertMaterial({ map: bannerTex });
    const bannerMesh = new THREE.Mesh(new THREE.BoxGeometry(7, 1.6, 0.2), bannerMat);
    bannerMesh.position.set(0, 4.2, -4);
    bannerGroup.add(bannerMesh);

    this.environmentGroup.add(bannerGroup);
  }

  // ================= MODELOS 3D ESPACIAIS ESTILO ROBLOX =================

  // 1. FOGUETE 3D GIGANTE (ROCKET 🚀)
  createGiantRocket(x, y, z) {
    const rocketGroup = new THREE.Group();
    rocketGroup.position.set(x, y, z);

    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
    const redMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    // Corpo cilíndrico / cúbico
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 3.2, 8), whiteMat);
    rocketGroup.add(body);

    // Ponta do foguete (Nose cone vermelho)
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.6, 8), redMat);
    nose.position.set(0, 2.4, 0);
    rocketGroup.add(nose);

    // Janela redonda de escotilha
    const windowMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12), darkMat);
    windowMesh.rotation.x = Math.PI / 2;
    windowMesh.position.set(0, 0.6, 0.95);
    rocketGroup.add(windowMesh);

    // 4 Asas / Aletas inferiores
    const finGeo = new THREE.BoxGeometry(0.2, 1.0, 0.8);
    const f1 = new THREE.Mesh(finGeo, redMat); f1.position.set(1.1, -1.0, 0);
    const f2 = new THREE.Mesh(finGeo, redMat); f2.position.set(-1.1, -1.0, 0);
    const f3 = new THREE.Mesh(finGeo, redMat); f3.position.set(0, -1.0, 1.1); f3.rotation.y = Math.PI / 2;
    const f4 = new THREE.Mesh(finGeo, redMat); f4.position.set(0, -1.0, -1.1); f4.rotation.y = Math.PI / 2;
    rocketGroup.add(f1, f2, f3, f4);

    // Chama do propulsor
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 8), flameMat);
    flame.rotation.x = Math.PI;
    flame.position.set(0, -2.2, 0);
    rocketGroup.add(flame);

    rocketGroup.userData = {
      id: 'ROCKET',
      name: 'ROCKET',
      word: 'ROCKET! 🚀',
      spoken: 'ROCKET! Ready for blast off! Say Rocket!',
      baseY: y,
      bobOffset: 0
    };

    this.spaceObjects.push(rocketGroup);
    this.environmentGroup.add(rocketGroup);
  }

  // 2. LUA 3D COM CRATERAS (MOON 🌙)
  createGiantMoon(x, y, z) {
    const moonGroup = new THREE.Group();
    moonGroup.position.set(x, y, z);

    const moonMat = new THREE.MeshLambertMaterial({ color: 0xfef08a, emissive: 0xca8a04 });
    const craterMat = new THREE.MeshLambertMaterial({ color: 0xeab308 });

    // Corpo lunar esférico estilizado
    const moonSphere = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 12), moonMat);
    moonGroup.add(moonSphere);

    // Crateras em blocos
    const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8), craterMat);
    c1.position.set(0.6, 0.6, 1.6);
    c1.rotation.x = Math.PI / 3;

    const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8), craterMat);
    c2.position.set(-0.7, -0.4, 1.5);
    c2.rotation.y = -Math.PI / 4;

    moonGroup.add(c1, c2);

    moonGroup.userData = {
      id: 'MOON',
      name: 'MOON',
      word: 'MOON! 🌙',
      spoken: 'MOON! The shining yellow Moon! Say Moon!',
      baseY: y,
      bobOffset: 1.5
    };

    this.spaceObjects.push(moonGroup);
    this.environmentGroup.add(moonGroup);
  }

  // 3. PLANETA GIGANTE COM ANÉIS (PLANET 🪐)
  createGiantPlanet(x, y, z) {
    const planetGroup = new THREE.Group();
    planetGroup.position.set(x, y, z);

    const planetMat = new THREE.MeshLambertMaterial({ color: 0x10b981, emissive: 0x064e3b });
    const ringMat = new THREE.MeshLambertMaterial({
      color: 0x34d399,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    // Planeta esfera
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.7, 14, 14), planetMat);
    planetGroup.add(sphere);

    // Anel planetário inclinado
    const ringGeo = new THREE.RingGeometry(2.3, 3.4, 24);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.6;
    planetGroup.add(ring);

    planetGroup.userData = {
      id: 'PLANET',
      name: 'PLANET',
      word: 'PLANET! 🪐',
      spoken: 'PLANET! A giant ringed planet! Say Planet!',
      baseY: y,
      bobOffset: 3.0
    };

    this.spaceObjects.push(planetGroup);
    this.environmentGroup.add(planetGroup);
  }

  // ================= 3 CRISTAIS ESPACIAIS COLETÁVEIS =================
  initSpaceCollectibles() {
    const configs = [
      { id: 'SPACE_ROCKET', word: 'ROCKET', spoken: 'Rocket! Zoom into space!', z: -30, y: 5.2, color: 0xef4444 },
      { id: 'SPACE_MOON', word: 'MOON', spoken: 'Moon! The beautiful Moon!', z: -67, y: 8.8, color: 0xfacc15 },
      { id: 'SPACE_PLANET', word: 'PLANET', spoken: 'Planet! Explore the Planet!', z: -106, y: 12.4, color: 0x38bdf8 }
    ];

    configs.forEach(cfg => {
      const itemGroup = new THREE.Group();
      itemGroup.position.set(0, cfg.y, cfg.z);

      const mat = new THREE.MeshLambertMaterial({
        color: cfg.color,
        emissive: cfg.color
      });

      // Cristal em octaedro
      const octa = new THREE.Mesh(new THREE.OctahedronGeometry(0.85), mat);
      itemGroup.add(octa);

      // Aura brilhante estelar
      const glowGeo = new THREE.SphereGeometry(1.2, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x818cf8,
        transparent: true,
        opacity: 0.35,
        wireframe: true
      });
      itemGroup.add(new THREE.Mesh(glowGeo, glowMat));

      this.environmentGroup.add(itemGroup);

      this.collectibles.push({
        id: cfg.id,
        spaceWord: cfg.word,
        spokenWord: cfg.spoken,
        mesh: itemGroup,
        baseY: cfg.y,
        collected: false,
        rotSpeed: 2.4
      });
    });
  }

  // ================= PORTAL ESPACIAL ESTELAR =================
  createSpacePortal(x, y, z) {
    this.portalGroup = new THREE.Group();
    this.portalGroup.position.set(x, y, z);

    // Anel cósmico índigo e ciano
    const ringGeo = new THREE.TorusGeometry(2.6, 0.35, 16, 36);
    const ringMat = new THREE.MeshLambertMaterial({
      color: 0x6366f1,
      emissive: 0x4338ca
    });
    this.portalRing = new THREE.Mesh(ringGeo, ringMat);
    this.portalGroup.add(this.portalRing);

    // Vórtice estelar cósmico
    const vortexGeo = new THREE.CircleGeometry(2.1, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#a5b4fc');
    grad.addColorStop(0.7, '#6366f1');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const vortexTex = new THREE.CanvasTexture(canvas);
    const vortexMat = new THREE.MeshBasicMaterial({
      map: vortexTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.94
    });
    this.portalVortex = new THREE.Mesh(vortexGeo, vortexMat);
    this.portalGroup.add(this.portalVortex);

    const light = new THREE.PointLight(0x818cf8, 2.8, 22);
    this.portalGroup.add(light);

    this.environmentGroup.add(this.portalGroup);
  }

  update(delta) {
    const time = Date.now() * 0.003;

    // 1. Rotação suave do campo de estrelas
    if (this.starPoints) {
      this.starPoints.rotation.y += 0.04 * delta;
    }

    // 2. Animação dos corpos espaciais
    for (const obj of this.spaceObjects) {
      const bob = Math.sin(time * 2.2 + obj.userData.bobOffset) * 0.15;
      obj.position.y = obj.userData.baseY + bob;
      obj.rotation.y += 0.4 * delta;

      if (this.player && this.player.position) {
        const dist = this.player.position.distanceTo(obj.position);
        if (dist < 8.0) {
          obj.lookAt(this.player.position.x, obj.position.y, this.player.position.z);
        }
      }
    }

    // 3. Coleta de Cristais Espaciais
    for (const item of this.collectibles) {
      if (item.collected) continue;

      item.mesh.rotation.y += item.rotSpeed * delta;
      item.mesh.rotation.x += item.rotSpeed * 0.5 * delta;
      item.mesh.position.y = item.baseY + Math.sin(time * 2.2 + item.baseY) * 0.25;

      if (this.player && this.player.position) {
        const dist = this.player.position.distanceTo(item.mesh.position);
        if (dist < 2.0) {
          this.collectSpaceItem(item);
        }
      }
    }

    // 4. Rotação do portal cósmico
    if (this.portalRing) this.portalRing.rotation.z += 1.4 * delta;
    if (this.portalVortex) this.portalVortex.rotation.z -= 2.0 * delta;

    // Vitória no portal
    if (this.portalGroup && this.player && !this.spaceVictoryTriggered) {
      const dist = this.player.position.distanceTo(this.portalGroup.position);
      if (dist < 2.8) {
        this.triggerSpaceVictory();
      }
    }
  }

  collectSpaceItem(item) {
    item.collected = true;
    this.collectedCount++;
    this.environmentGroup.remove(item.mesh);

    if (window.gameStateManager) {
      window.gameStateManager.addStar(1);
      window.gameStateManager.recordWordAttempt(item.spaceWord, true);
      window.gameStateManager.addCoins(8);
      window.gameStateManager.addXp(25);
    }

    if (window.audioManager) {
      window.audioManager.playCollect();
      window.audioManager.speak(item.spokenWord);
    }

    if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
      window.gameApp.setWordHighlight(
        `${item.spaceWord}! 🚀 (+8 🪙 +25 XP)`,
        `Cristal Espacial ${this.collectedCount} de 3 coletado!`
      );
    }

    const counterEl = document.getElementById('collectibles-counter');
    if (counterEl) {
      counterEl.textContent = `${this.collectedCount}/${this.totalCollectibles}`;
      counterEl.style.transform = 'scale(1.3)';
      setTimeout(() => { counterEl.style.transform = 'scale(1)'; }, 300);
    }
  }

  triggerSpaceVictory() {
    this.spaceVictoryTriggered = true;

    if (window.gameStateManager) {
      window.gameStateManager.recordWordAttempt('Rocket', true);
      window.gameStateManager.recordWordAttempt('Moon', true);
      window.gameStateManager.recordWordAttempt('Planet', true);
      window.gameStateManager.addCoins(75);
      window.gameStateManager.addXp(200);
      window.gameStateManager.unlockBadge('space_master');
      window.gameStateManager.unlockBadge('world4_complete');
    }

    if (window.audioManager) {
      window.audioManager.playFanfare();
      window.audioManager.speak('Space Adventure Complete! You are a Cosmic Hero!');
    }

    if (typeof confetti === 'function') {
      confetti({ particleCount: 250, spread: 100, origin: { y: 0.6 } });
    }

    if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
      window.gameApp.setWordHighlight('COSMIC HERO! 🚀👑', 'Parabéns! Você completou o Mundo 4!');
    }

    setTimeout(() => {
      // Reposiciona o jogador suavemente para a plataforma inicial
      if (this.player) {
        this.player.position.set(0, 3.5, 0);
        this.player.velocity.set(0, 0, 0);
        if (this.player.mesh) this.player.mesh.position.copy(this.player.position);
      }
      // Mantém a trava ativa durante esta sessão para impedir re-disparos e duplicação de moedas/XP
      this.spaceVictoryTriggered = true;
    }, 1200);
  }

  dispose() {
    if (this.environmentGroup) {
      this.environmentGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
          }
        }
      });
      this.scene.remove(this.environmentGroup);
    }
    this.platforms = [];
    this.spaceObjects = [];
    this.collectibles = [];
  }
}

window.World4SpaceManager = World4SpaceManager;
