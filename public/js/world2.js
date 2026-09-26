// world2.js - Mundo 2: "Animal Safari 3D" (Savana, Animais em Blocos Three.js e Vocabulário)

class World2SafariManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.platforms = [];
    this.animals = [];
    this.collectibles = [];
    this.collectedCount = 0;
    this.totalCollectibles = 3;
    this.clouds = [];
    this.environmentGroup = new THREE.Group();
    this.scene.add(this.environmentGroup);

    this.setupSavannaAtmosphere();
    this.buildSafariMap();
  }

  setupSavannaAtmosphere() {
    // Céu ensolarado e aconchegante de savana
    this.scene.background = new THREE.Color(0xfde68a); // Âmbar / sol da savana
    this.scene.fog = new THREE.Fog(0xfde68a, 45, 190);

    // Iluminação quente de Safari
    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x15803d, 0.8);
    hemiLight.position.set(0, 50, 0);
    this.environmentGroup.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfef08a, 0.95);
    sunLight.position.set(25, 60, 20);
    sunLight.castShadow = true;
    this.environmentGroup.add(sunLight);

    // Cria nuvens suaves douradas
    this.createSavannaClouds();
  }

  createSavannaClouds() {
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.88
    });

    for (let i = 0; i < 18; i++) {
      const cloudGroup = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 3);

      for (let j = 0; j < numPuffs; j++) {
        const sx = 4 + Math.random() * 4;
        const sy = 2 + Math.random() * 2;
        const sz = 4 + Math.random() * 4;
        const puff = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), cloudMat);
        puff.position.set(
          (j - numPuffs / 2) * 3,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 3
        );
        cloudGroup.add(puff);
      }

      cloudGroup.position.set(
        (Math.random() - 0.5) * 220,
        18 + Math.random() * 25,
        -110 + (Math.random() - 0.5) * 160
      );
      cloudGroup.userData = { speed: 0.4 + Math.random() * 0.7 };
      this.clouds.push(cloudGroup);
      this.environmentGroup.add(cloudGroup);
    }
  }

  addPlatform(x, y, z, width, height, depth, colorHex, options = {}) {
    const mat = new THREE.MeshLambertMaterial({
      color: colorHex,
      emissive: options.emissive || 0x000000
    });

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.environmentGroup.add(mesh);

    // Capa de topo estético (grama ou madeira)
    const topCapGeo = new THREE.BoxGeometry(width * 1.02, 0.12, depth * 1.02);
    const topCapMat = new THREE.MeshLambertMaterial({
      color: options.topColor || colorHex,
      emissive: 0x111111
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

  buildSafariMap() {
    // 1. PLATAFORMA DE INÍCIO SEGURA (Acampamento Safari)
    this.startPlatform = this.addPlatform(0, 0, 0, 11, 1.5, 11, 0x15803d, {
      topColor: 0x22c55e,
      id: 'safari_start'
    });
    this.createSafariBanner();

    // 2. TRECHO 1: TRILHA DOS PULOS SELVAGENS (Rumo ao Leão)
    const stones = [
      { x: 0, y: 0.7, z: -9, w: 3.2, h: 1.0, d: 3.2, c: 0xd97706 },   // Terracota
      { x: -2.4, y: 1.5, z: -15, w: 3.0, h: 1.0, d: 3.0, c: 0xb45309 },// Madeira
      { x: 2.2, y: 2.3, z: -21, w: 3.0, h: 1.0, d: 3.0, c: 0x16a34a }, // Folhagem
      { x: 0, y: 3.1, z: -27, w: 3.4, h: 1.0, d: 3.4, c: 0xeab308 }    // Dourado
    ];
    stones.forEach((s, idx) => {
      this.addPlatform(s.x, s.y, s.z, s.w, s.h, s.d, s.c, {
        topColor: 0x84cc16,
        id: `safari_stone_${idx + 1}`
      });
    });

    // 3. ILHA DO LEÃO (LION PLATFORM)
    this.lionPlatform = this.addPlatform(0, 4.0, -38, 14, 1.5, 12, 0xd97706, {
      topColor: 0xca8a04,
      id: 'lion_platform'
    });
    this.createLionModel(0, 5.5, -40);

    // 4. TRECHO 2: PONTE DE PEDRAS D'ÁGUA (Rumo ao Elefante)
    const waterStones = [
      { x: -2.5, y: 4.8, z: -49, w: 3.2, h: 1.0, d: 3.2, c: 0x0284c7 }, // Água
      { x: 2.5, y: 5.6, z: -56, w: 3.2, h: 1.0, d: 3.2, c: 0x0ea5e9 },
      { x: 0, y: 6.4, z: -63, w: 3.4, h: 1.0, d: 3.4, c: 0x38bdf8 }
    ];
    waterStones.forEach((s, idx) => {
      this.addPlatform(s.x, s.y, s.z, s.w, s.h, s.d, s.c, {
        topColor: 0x7dd3fc,
        id: `water_stone_${idx + 1}`
      });
    });

    // 5. ILHA DO ELEFANTE (ELEPHANT PLATFORM)
    this.elephantPlatform = this.addPlatform(0, 7.2, -75, 15, 1.5, 13, 0x64748b, {
      topColor: 0x94a3b8,
      id: 'elephant_platform'
    });
    this.createElephantModel(0, 8.7, -77);

    // 6. TRECHO 3: COPAS DAS ÁRVORES E CIPÓS (Rumo ao Macaco)
    const treeStones = [
      { x: 2.2, y: 8.0, z: -87, w: 3.4, h: 1.0, d: 3.4, c: 0x15803d },
      { x: -2.2, y: 8.8, z: -94, w: 3.4, h: 1.0, d: 3.4, c: 0x16a34a },
      { x: 0, y: 9.6, z: -101, w: 3.6, h: 1.0, d: 3.6, c: 0x22c55e }
    ];
    treeStones.forEach((s, idx) => {
      this.addPlatform(s.x, s.y, s.z, s.w, s.h, s.d, s.c, {
        topColor: 0x86efac,
        id: `tree_stone_${idx + 1}`
      });
    });

    // 7. ILHA DO MACACO (MONKEY PLATFORM)
    this.monkeyPlatform = this.addPlatform(0, 10.4, -112, 14, 1.5, 12, 0x78350f, {
      topColor: 0x92400e,
      id: 'monkey_platform'
    });
    this.createMonkeyModel(0, 12.0, -114);

    // 8. PLATAFORMA FINAL DO PORTAL DO SAFARI
    this.safariFinishPlatform = this.addPlatform(0, 11.2, -126, 14, 1.5, 14, 0xf59e0b, {
      topColor: 0xfef08a,
      id: 'safari_finish'
    });
    this.createSafariPortal(0, 14.2, -126);

    // 9. COLETÁVEIS: 3 BANANAS DOURADAS
    this.initBananas();
  }

  createSafariBanner() {
    const bannerGroup = new THREE.Group();

    // Postes rústicos de madeira
    const postMat = new THREE.MeshLambertMaterial({ color: 0x5a2d0c });
    const postGeo = new THREE.CylinderGeometry(0.18, 0.2, 4.2);
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-3.5, 2.5, -4);
    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(3.5, 2.5, -4);
    bannerGroup.add(leftPost);
    bannerGroup.add(rightPost);

    // Faixa Canvas estilizada
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#16a34a';
    ctx.roundRect ? ctx.roundRect(10, 10, 492, 108, 20) : ctx.fillRect(10, 10, 492, 108);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦁 WORLD 2: ANIMAL SAFARI', 256, 64);

    const bannerTex = new THREE.CanvasTexture(canvas);
    const bannerMat = new THREE.MeshLambertMaterial({ map: bannerTex });
    const bannerMesh = new THREE.Mesh(new THREE.BoxGeometry(7, 1.6, 0.2), bannerMat);
    bannerMesh.position.set(0, 4.2, -4);
    bannerGroup.add(bannerMesh);

    this.environmentGroup.add(bannerGroup);
  }

  // ================= 3D ANIMAIS PROCEDURAIS ESTILO ROBLOX =================

  // 1. LEÃO 3D (LION 🦁)
  createLionModel(x, y, z) {
    const lionGroup = new THREE.Group();
    lionGroup.position.set(x, y, z);

    const goldMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const maneMat = new THREE.MeshLambertMaterial({ color: 0x9a3412 });
    const faceMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x18181b });

    // Corpo
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.3, 2.4), goldMat);
    body.position.set(0, 0, 0);
    lionGroup.add(body);

    // 4 Patas
    const legGeo = new THREE.BoxGeometry(0.5, 0.9, 0.5);
    const flLeg = new THREE.Mesh(legGeo, goldMat); flLeg.position.set(-0.7, -0.9, 0.8);
    const frLeg = new THREE.Mesh(legGeo, goldMat); frLeg.position.set(0.7, -0.9, 0.8);
    const blLeg = new THREE.Mesh(legGeo, goldMat); blLeg.position.set(-0.7, -0.9, -0.8);
    const brLeg = new THREE.Mesh(legGeo, goldMat); brLeg.position.set(0.7, -0.9, -0.8);
    lionGroup.add(flLeg, frLeg, blLeg, brLeg);

    // Juba em blocos
    const mane = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.9, 1.2), maneMat);
    mane.position.set(0, 1.0, 1.1);
    lionGroup.add(mane);

    // Cabeça
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), goldMat);
    head.position.set(0, 1.0, 1.4);
    lionGroup.add(head);

    // Focinho
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.4), faceMat);
    snout.position.set(0, 0.85, 2.0);
    lionGroup.add(snout);

    // Nariz
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.1), darkMat);
    nose.position.set(0, 0.95, 2.22);
    lionGroup.add(nose);

    // Olhos
    const eyeGeo = new THREE.BoxGeometry(0.18, 0.18, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, darkMat); leftEye.position.set(-0.35, 1.15, 2.02);
    const rightEye = new THREE.Mesh(eyeGeo, darkMat); rightEye.position.set(0.35, 1.15, 2.02);
    lionGroup.add(leftEye, rightEye);

    // Cauda
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2), goldMat);
    tail.rotation.x = -Math.PI / 4;
    tail.position.set(0, 0.4, -1.5);
    lionGroup.add(tail);

    lionGroup.userData = {
      id: 'LION',
      name: 'LION',
      word: 'LION! 🦁',
      spoken: 'LION! The King of the Jungle! Roar like a lion!',
      targetPos: lionGroup.position,
      baseY: y,
      bobOffset: 0
    };

    this.animals.push(lionGroup);
    this.environmentGroup.add(lionGroup);
  }

  // 2. ELEFANTE 3D (ELEPHANT 🐘)
  createElephantModel(x, y, z) {
    const elephantGroup = new THREE.Group();
    elephantGroup.position.set(x, y, z);

    const greyMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const innerEarMat = new THREE.MeshLambertMaterial({ color: 0xfecdd3 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    // Corpo Robusto
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 3.2), greyMat);
    body.position.set(0, 0, 0);
    elephantGroup.add(body);

    // 4 Patas Grossas
    const legGeo = new THREE.BoxGeometry(0.7, 1.2, 0.7);
    const flLeg = new THREE.Mesh(legGeo, greyMat); flLeg.position.set(-0.9, -1.2, 1.1);
    const frLeg = new THREE.Mesh(legGeo, greyMat); frLeg.position.set(0.9, -1.2, 1.1);
    const blLeg = new THREE.Mesh(legGeo, greyMat); blLeg.position.set(-0.9, -1.2, -1.1);
    const brLeg = new THREE.Mesh(legGeo, greyMat); brLeg.position.set(0.9, -1.2, -1.1);
    elephantGroup.add(flLeg, frLeg, blLeg, brLeg);

    // Cabeça
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 1.5), greyMat);
    head.position.set(0, 0.8, 1.8);
    elephantGroup.add(head);

    // Grandes Orelhas Floppy
    const earGeo = new THREE.BoxGeometry(0.12, 1.4, 1.2);
    const leftEar = new THREE.Mesh(earGeo, greyMat); leftEar.position.set(-1.1, 0.9, 1.7);
    const rightEar = new THREE.Mesh(earGeo, greyMat); rightEar.position.set(1.1, 0.9, 1.7);
    elephantGroup.add(leftEar, rightEar);

    // Tromba Curva
    const trunk1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), greyMat);
    trunk1.position.set(0, 0.2, 2.6);
    const trunk2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.4), greyMat);
    trunk2.position.set(0, 0.5, 3.0);
    trunk2.rotation.x = -Math.PI / 4;
    elephantGroup.add(trunk1, trunk2);

    // Olhos
    const eyeGeo = new THREE.BoxGeometry(0.18, 0.18, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, darkMat); leftEye.position.set(-0.5, 1.0, 2.56);
    const rightEye = new THREE.Mesh(eyeGeo, darkMat); rightEye.position.set(0.5, 1.0, 2.56);
    elephantGroup.add(leftEye, rightEye);

    elephantGroup.userData = {
      id: 'ELEPHANT',
      name: 'ELEPHANT',
      word: 'ELEPHANT! 🐘',
      spoken: 'ELEPHANT! The big gentle elephant! Say Elephant!',
      baseY: y,
      bobOffset: 1.5
    };

    this.animals.push(elephantGroup);
    this.environmentGroup.add(elephantGroup);
  }

  // 3. MACACO 3D (MONKEY 🐒)
  createMonkeyModel(x, y, z) {
    const monkeyGroup = new THREE.Group();
    monkeyGroup.position.set(x, y, z);

    const brownMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const faceMat = new THREE.MeshLambertMaterial({ color: 0xfed7aa });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x1c1917 });
    const yellowMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0xca8a04 });

    // Corpo
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.0), brownMat);
    body.position.set(0, 0, 0);
    monkeyGroup.add(body);

    // Cabeça
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 1.0), brownMat);
    head.position.set(0, 1.1, 0.1);
    monkeyGroup.add(head);

    // Rosto pêssego
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.1), faceMat);
    face.position.set(0, 1.05, 0.62);
    monkeyGroup.add(face);

    // Olhinhos
    const eyeGeo = new THREE.BoxGeometry(0.14, 0.14, 0.04);
    const leftEye = new THREE.Mesh(eyeGeo, darkMat); leftEye.position.set(-0.25, 1.15, 0.68);
    const rightEye = new THREE.Mesh(eyeGeo, darkMat); rightEye.position.set(0.25, 1.15, 0.68);
    monkeyGroup.add(leftEye, rightEye);

    // Orelhas redondas
    const earGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 12);
    const leftEar = new THREE.Mesh(earGeo, faceMat);
    leftEar.rotation.z = Math.PI / 2;
    leftEar.position.set(-0.65, 1.1, 0.1);
    const rightEar = new THREE.Mesh(earGeo, faceMat);
    rightEar.rotation.z = Math.PI / 2;
    rightEar.position.set(0.65, 1.1, 0.1);
    monkeyGroup.add(leftEar, rightEar);

    // Banana na mão do macaco
    const bananaGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8);
    const banana = new THREE.Mesh(bananaGeo, yellowMat);
    banana.rotation.z = Math.PI / 3;
    banana.position.set(0.6, 0.2, 0.6);
    monkeyGroup.add(banana);

    // Cauda longa curvada
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4), brownMat);
    tail.rotation.x = -Math.PI / 3;
    tail.position.set(0, -0.2, -0.7);
    monkeyGroup.add(tail);

    monkeyGroup.userData = {
      id: 'MONKEY',
      name: 'MONKEY',
      word: 'MONKEY! 🐒',
      spoken: 'MONKEY! Monkeys love bananas! Say Monkey!',
      baseY: y,
      bobOffset: 3.0
    };

    this.animals.push(monkeyGroup);
    this.environmentGroup.add(monkeyGroup);
  }

  // ================= 3 BANANAS COLETÁVEIS (BANANAS DOURADAS) =================
  initBananas() {
    const configs = [
      { id: 'BANANA_1', numWord: 'ONE', spoken: 'Banana! One!', z: -27, y: 4.8 },
      { id: 'BANANA_2', numWord: 'TWO', spoken: 'Banana! Two!', z: -63, y: 8.2 },
      { id: 'BANANA_3', numWord: 'THREE', spoken: 'Banana! Three!', z: -101, y: 11.2 }
    ];

    configs.forEach(cfg => {
      const bananaGroup = new THREE.Group();
      bananaGroup.position.set(0, cfg.y, cfg.z);

      // Banana curvada em arco cúbico
      const bananaMat = new THREE.MeshLambertMaterial({
        color: 0xfacc15,
        emissive: 0xeab308
      });

      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), bananaMat);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.6, 0.32), bananaMat);
      b2.position.set(0.15, 0.5, 0);
      b2.rotation.z = -0.3;
      const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.6, 0.32), bananaMat);
      b3.position.set(-0.15, -0.5, 0);
      b3.rotation.z = -0.3;

      bananaGroup.add(b1, b2, b3);

      // Aura brilhante ao redor
      const glowGeo = new THREE.SphereGeometry(1.1, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.25,
        wireframe: true
      });
      bananaGroup.add(new THREE.Mesh(glowGeo, glowMat));

      this.environmentGroup.add(bananaGroup);

      this.collectibles.push({
        id: cfg.id,
        numberWord: cfg.numWord,
        spokenWord: cfg.spoken,
        mesh: bananaGroup,
        baseY: cfg.y,
        collected: false,
        rotSpeed: 2.5
      });
    });
  }

  // ================= PORTAL DO SAFARI =================
  createSafariPortal(x, y, z) {
    this.portalGroup = new THREE.Group();
    this.portalGroup.position.set(x, y, z);

    // Anel esmeralda e dourado
    const ringGeo = new THREE.TorusGeometry(2.6, 0.35, 16, 36);
    const ringMat = new THREE.MeshLambertMaterial({
      color: 0x10b981,
      emissive: 0x047857
    });
    this.portalRing = new THREE.Mesh(ringGeo, ringMat);
    this.portalGroup.add(this.portalRing);

    // Vórtice verde esmeralda
    const vortexGeo = new THREE.CircleGeometry(2.1, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#a7f3d0');
    grad.addColorStop(0.8, '#10b981');
    grad.addColorStop(1, '#064e3b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const vortexTex = new THREE.CanvasTexture(canvas);
    const vortexMat = new THREE.MeshBasicMaterial({
      map: vortexTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    this.portalVortex = new THREE.Mesh(vortexGeo, vortexMat);
    this.portalGroup.add(this.portalVortex);

    const light = new THREE.PointLight(0x34d399, 2.5, 20);
    this.portalGroup.add(light);

    this.environmentGroup.add(this.portalGroup);
  }

  update(delta) {
    const time = Date.now() * 0.003;

    // 1. Animação das nuvens
    for (const cloud of this.clouds) {
      cloud.position.x += cloud.userData.speed * delta;
      if (cloud.position.x > 120) cloud.position.x = -120;
    }

    // 2. Animação dos animais (respiração e saltinho curioso)
    for (const animal of this.animals) {
      const bob = Math.sin(time * 2.5 + animal.userData.bobOffset) * 0.12;
      animal.position.y = animal.userData.baseY + bob;

      // Se o jogador estiver muito perto do animal, ele gira suavemente para olhar o boneco
      if (this.player && this.player.position) {
        const dist = this.player.position.distanceTo(animal.position);
        if (dist < 8.0) {
          animal.lookAt(this.player.position.x, animal.position.y, this.player.position.z);
        }
      }
    }

    // 3. Animação e Coleta de Bananas Douradas
    for (const item of this.collectibles) {
      if (item.collected) continue;

      item.mesh.rotation.y += item.rotSpeed * delta;
      item.mesh.position.y = item.baseY + Math.sin(time * 2 + item.baseY) * 0.25;

      if (this.player && this.player.position) {
        const dist = this.player.position.distanceTo(item.mesh.position);
        if (dist < 2.0) {
          this.collectBanana(item);
        }
      }
    }

    // 4. Animação do portal do Safari
    if (this.portalRing) this.portalRing.rotation.z += 1.2 * delta;
    if (this.portalVortex) this.portalVortex.rotation.z -= 1.8 * delta;

    // Checa vitória no portal do Safari
    if (this.portalGroup && this.player && !this.safariVictoryTriggered) {
      const dist = this.player.position.distanceTo(this.portalGroup.position);
      if (dist < 2.8) {
        this.triggerSafariVictory();
      }
    }
  }

  collectBanana(item) {
    item.collected = true;
    this.collectedCount++;
    this.environmentGroup.remove(item.mesh);

    if (window.gameStateManager) {
      window.gameStateManager.addStar(1);
      window.gameStateManager.recordWordAttempt('Banana', true);
      window.gameStateManager.addCoins(5);
      window.gameStateManager.addXp(15);
    }

    if (window.audioManager) {
      window.audioManager.playCollect();
      window.audioManager.speak(item.spokenWord);
    }

    if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
      window.gameApp.setWordHighlight(
        `BANANA ${item.numberWord}! 🍌 (+5 🪙 +15 XP)`,
        `Banana ${this.collectedCount} de 3 coletada!`
      );
    }

    const counterEl = document.getElementById('collectibles-counter');
    if (counterEl) {
      counterEl.textContent = `${this.collectedCount}/${this.totalCollectibles}`;
      counterEl.style.transform = 'scale(1.3)';
      setTimeout(() => { counterEl.style.transform = 'scale(1)'; }, 300);
    }
  }

  triggerSafariVictory() {
    this.safariVictoryTriggered = true;

    if (window.gameStateManager) {
      window.gameStateManager.recordWordAttempt('Lion', true);
      window.gameStateManager.recordWordAttempt('Elephant', true);
      window.gameStateManager.recordWordAttempt('Monkey', true);
      window.gameStateManager.recordWordAttempt('Banana', true);
      window.gameStateManager.addCoins(50);
      window.gameStateManager.addXp(150);
      window.gameStateManager.unlockBadge('animal_master');
      window.gameStateManager.unlockBadge('world2_complete');
    }

    if (window.audioManager) {
      window.audioManager.playFanfare();
      window.audioManager.speak('Safari World Complete! You are a Safari Master!');
    }

    if (typeof confetti === 'function') {
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
    }

    if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
      window.gameApp.setWordHighlight('SAFARI CHAMPION! 🦁👑', 'Parabéns! Você completou o Mundo 2!');
    }

    setTimeout(() => {
      alert("🎉 PARABÉNS! SAFARI WORLD COMPLETO! 🦁🐘🐒\n\nVocê aprendeu as palavras LION, ELEPHANT, MONKEY e BANANA!");
      this.safariVictoryTriggered = false;
    }, 1200);
  }

  // Remove todos os elementos da cena ao alternar de mundo
  dispose() {
    this.scene.remove(this.environmentGroup);
    this.platforms = [];
    this.animals = [];
    this.collectibles = [];
    this.clouds = [];
  }
}

window.World2SafariManager = World2SafariManager;
