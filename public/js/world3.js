// world3.js - Mundo 3: "Kitchen & Fruits 3D" (Cozinha Encantada, Alimentos e Vocabulário)

class World3KitchenManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.platforms = [];
    this.foodItems = [];
    this.collectibles = [];
    this.collectedCount = 0;
    this.totalCollectibles = 3;
    this.steamPuffs = [];
    this.environmentGroup = new THREE.Group();
    this.scene.add(this.environmentGroup);

    this.setupKitchenAtmosphere();
    this.buildKitchenMap();
  }

  setupKitchenAtmosphere() {
    // Céu e ambiente acolhedor de cozinha ensolarada
    this.scene.background = new THREE.Color(0xfef3c7); // Amarelo manteiga suave
    this.scene.fog = new THREE.Fog(0xfef3c7, 45, 190);

    // Iluminação clara e aconchegante
    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0xd97706, 0.85);
    hemiLight.position.set(0, 50, 0);
    this.environmentGroup.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 0.95);
    sunLight.position.set(20, 60, 20);
    sunLight.castShadow = true;
    this.environmentGroup.add(sunLight);

    // Partículas de aroma / vapor suave
    this.createKitchenSteam();
  }

  createKitchenSteam() {
    const steamMat = new THREE.MeshLambertMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.5
    });

    for (let i = 0; i < 15; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.8 + Math.random() * 0.8, 8, 8), steamMat);
      puff.position.set(
        (Math.random() - 0.5) * 60,
        5 + Math.random() * 25,
        -60 + (Math.random() - 0.5) * 120
      );
      puff.userData = { speedY: 0.5 + Math.random() * 0.8, baseY: puff.position.y };
      this.steamPuffs.push(puff);
      this.environmentGroup.add(puff);
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

    // Capa de topo estético (madeira de bancada ou toalha)
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

  buildKitchenMap() {
    // 1. PLATAFORMA DE INÍCIO SEGURA (Mesa de Café da Manhã)
    this.startPlatform = this.addPlatform(0, 0, 0, 11, 1.5, 11, 0xd97706, {
      topColor: 0xfbbf24,
      id: 'kitchen_start'
    });
    this.createKitchenBanner();

    // 2. TRECHO 1: TRILHA DE TORRADAS CROCANTES (BREAD / TOAST)
    const toasts = [
      { x: 0, y: 0.8, z: -9, w: 3.4, h: 0.8, d: 3.4, c: 0xb45309 },   // Pão torrado
      { x: -2.5, y: 1.6, z: -16, w: 3.2, h: 0.8, d: 3.2, c: 0x92400e }, // Borda do pão
      { x: 2.2, y: 2.4, z: -23, w: 3.2, h: 0.8, d: 3.2, c: 0xb45309 },
      { x: 0, y: 3.2, z: -30, w: 3.5, h: 0.8, d: 3.5, c: 0xd97706 }
    ];
    toasts.forEach((t, idx) => {
      this.addPlatform(t.x, t.y, t.z, t.w, t.h, t.d, t.c, {
        topColor: 0xfde68a,
        id: `toast_${idx + 1}`
      });
    });

    // 3. ILHA DAS MAÇÃS (APPLE ISLAND)
    this.applePlatform = this.addPlatform(0, 4.2, -42, 14, 1.5, 13, 0xdc2626, {
      topColor: 0xef4444,
      id: 'apple_platform'
    });
    this.createGiantApple(0, 6.0, -44);

    // 4. TRECHO 2: PRATINHOS E XÍCARAS FLUTUANTES (Rumo ao Leite)
    const dishes = [
      { x: -2.6, y: 5.0, z: -53, w: 3.2, h: 0.8, d: 3.2, c: 0x38bdf8 }, // Azul claro
      { x: 2.6, y: 5.8, z: -60, w: 3.2, h: 0.8, d: 3.2, c: 0xf472b6 },  // Rosa pastel
      { x: 0, y: 6.6, z: -67, w: 3.4, h: 0.8, d: 3.4, c: 0x4ade80 }    // Menta
    ];
    dishes.forEach((d, idx) => {
      this.addPlatform(d.x, d.y, d.z, d.w, d.h, d.d, d.c, {
        topColor: 0xffffff,
        id: `dish_${idx + 1}`
      });
    });

    // 5. ILHA DO LEITE FRESCO (MILK CARTON ISLAND)
    this.milkPlatform = this.addPlatform(0, 7.4, -80, 15, 1.5, 13, 0x0284c7, {
      topColor: 0x38bdf8,
      id: 'milk_platform'
    });
    this.createGiantMilkCarton(0, 9.2, -82);

    // 6. TRECHO 3: FATIAS DE QUEIJO E PÃO (Rumo ao Sanduíche)
    const cheeseSteps = [
      { x: 2.4, y: 8.2, z: -92, w: 3.3, h: 0.8, d: 3.3, c: 0xfacc15 }, // Queijo amarelo
      { x: -2.4, y: 9.0, z: -99, w: 3.3, h: 0.8, d: 3.3, c: 0xfbbf24 },
      { x: 0, y: 9.8, z: -106, w: 3.5, h: 0.8, d: 3.5, c: 0xf59e0b }
    ];
    cheeseSteps.forEach((c, idx) => {
      this.addPlatform(c.x, c.y, c.z, c.w, c.h, c.d, c.c, {
        topColor: 0xfef08a,
        id: `cheese_${idx + 1}`
      });
    });

    // 7. ILHA DO PÃO & SANDUÍCHE (BREAD ISLAND)
    this.breadPlatform = this.addPlatform(0, 10.6, -118, 14, 1.5, 13, 0x92400e, {
      topColor: 0xd97706,
      id: 'bread_island'
    });
    this.createGiantBread(0, 12.2, -120);

    // 8. PLATAFORMA FINAL DO PORTAL DA COZINHA (CAFÉ DA MANHÃ COMPLETO)
    this.kitchenFinishPlatform = this.addPlatform(0, 11.4, -132, 14, 1.5, 14, 0x10b981, {
      topColor: 0x34d399,
      id: 'kitchen_finish'
    });
    this.createKitchenPortal(0, 14.4, -132);

    // 9. COLETÁVEIS: 3 ITENS DE CAFÉ DA MANHÃ (MILK, APPLE, BREAD)
    this.initFoodCollectibles();
  }

  createKitchenBanner() {
    const bannerGroup = new THREE.Group();

    // Postes de talher estilizado (madeira)
    const postMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
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
    ctx.fillStyle = '#ea580c'; // Laranja aconchegante
    ctx.roundRect ? ctx.roundRect(10, 10, 492, 108, 20) : ctx.fillRect(10, 10, 492, 108);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍳 WORLD 3: KITCHEN & FRUITS', 256, 64);

    const bannerTex = new THREE.CanvasTexture(canvas);
    const bannerMat = new THREE.MeshLambertMaterial({ map: bannerTex });
    const bannerMesh = new THREE.Mesh(new THREE.BoxGeometry(7, 1.6, 0.2), bannerMat);
    bannerMesh.position.set(0, 4.2, -4);
    bannerGroup.add(bannerMesh);

    this.environmentGroup.add(bannerGroup);
  }

  // ================= MODELOS 3D EM BLOCOS ESTILO ROBLOX =================

  // 1. MAÇÃ 3D GIGANTE (APPLE 🍎)
  createGiantApple(x, y, z) {
    const appleGroup = new THREE.Group();
    appleGroup.position.set(x, y, z);

    const redMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x78350f });

    // Corpo da maçã (blocos arredondados)
    const body1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.8), redMat);
    const body2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.6), redMat);
    appleGroup.add(body1, body2);

    // Cabinho (Stem)
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8), stemMat);
    stem.position.set(0, 1.2, 0);
    stem.rotation.z = -0.2;
    appleGroup.add(stem);

    // Folha verde (Leaf)
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.3), leafMat);
    leaf.position.set(0.3, 1.4, 0);
    leaf.rotation.z = 0.4;
    appleGroup.add(leaf);

    appleGroup.userData = {
      id: 'APPLE',
      name: 'APPLE',
      word: 'APPLE! 🍎',
      spoken: 'APPLE! A delicious red apple! Say Apple!',
      baseY: y,
      bobOffset: 0
    };

    this.foodItems.push(appleGroup);
    this.environmentGroup.add(appleGroup);
  }

  // 2. CAIXINHA DE LEITE GIGANTE (MILK 🥛)
  createGiantMilkCarton(x, y, z) {
    const milkGroup = new THREE.Group();
    milkGroup.position.set(x, y, z);

    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const blueMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });

    // Caixa principal
    const cartonBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 1.6), whiteMat);
    cartonBody.position.set(0, 0, 0);
    milkGroup.add(cartonBody);

    // Faixa azul com texto
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.8, 1.62), blueMat);
    stripe.position.set(0, -0.2, 0);
    milkGroup.add(stripe);

    // Topo triangular da caixinha (Roof)
    const roofGeo = new THREE.CylinderGeometry(0.1, 1.15, 1.6, 4);
    const roof = new THREE.Mesh(roofGeo, blueMat);
    roof.rotation.y = Math.PI / 4;
    roof.rotation.z = Math.PI / 2;
    roof.position.set(0, 1.4, 0);
    milkGroup.add(roof);

    milkGroup.userData = {
      id: 'MILK',
      name: 'MILK',
      word: 'MILK! 🥛',
      spoken: 'MILK! Fresh and cold milk! Say Milk!',
      baseY: y,
      bobOffset: 1.5
    };

    this.foodItems.push(milkGroup);
    this.environmentGroup.add(milkGroup);
  }

  // 3. PÃO DE FORMA GIGANTE (BREAD 🍞)
  createGiantBread(x, y, z) {
    const breadGroup = new THREE.Group();
    breadGroup.position.set(x, y, z);

    const crustMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
    const crumbMat = new THREE.MeshLambertMaterial({ color: 0xfef3c7 });

    // Fatia de pão
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 1.4), crustMat);
    breadGroup.add(base);

    // Miolo macio
    const inside = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.25, 1.42), crumbMat);
    breadGroup.add(inside);

    // Topo fofinho arredondado
    const topCrust = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.4, 16, 1, false, 0, Math.PI), crustMat);
    topCrust.rotation.z = Math.PI / 2;
    topCrust.position.set(0, 0.7, 0);
    breadGroup.add(topCrust);

    breadGroup.userData = {
      id: 'BREAD',
      name: 'BREAD',
      word: 'BREAD! 🍞',
      spoken: 'BREAD! Warm and fresh bread! Say Bread!',
      baseY: y,
      bobOffset: 3.0
    };

    this.foodItems.push(breadGroup);
    this.environmentGroup.add(breadGroup);
  }

  // ================= 3 COLETÁVEIS (MILK, APPLE, BREAD) =================
  initFoodCollectibles() {
    const configs = [
      { id: 'FOOD_APPLE', word: 'APPLE', spoken: 'Apple! Delicious Apple!', z: -30, y: 4.8, color: 0xdc2626 },
      { id: 'FOOD_MILK', word: 'MILK', spoken: 'Milk! Fresh Cold Milk!', z: -67, y: 8.2, color: 0x38bdf8 },
      { id: 'FOOD_BREAD', word: 'BREAD', spoken: 'Bread! Warm Yummy Bread!', z: -106, y: 11.4, color: 0xf59e0b }
    ];

    configs.forEach(cfg => {
      const itemGroup = new THREE.Group();
      itemGroup.position.set(0, cfg.y, cfg.z);

      const mat = new THREE.MeshLambertMaterial({
        color: cfg.color,
        emissive: cfg.color
      });

      const icon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat);
      itemGroup.add(icon);

      // Aura brilhante
      const glowGeo = new THREE.SphereGeometry(1.1, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
      itemGroup.add(new THREE.Mesh(glowGeo, glowMat));

      this.environmentGroup.add(itemGroup);

      this.collectibles.push({
        id: cfg.id,
        foodWord: cfg.word,
        spokenWord: cfg.spoken,
        mesh: itemGroup,
        baseY: cfg.y,
        collected: false,
        rotSpeed: 2.2
      });
    });
  }

  // ================= PORTAL DA COZINHA =================
  createKitchenPortal(x, y, z) {
    this.portalGroup = new THREE.Group();
    this.portalGroup.position.set(x, y, z);

    // Anel de cobre / dourado de forno chef
    const ringGeo = new THREE.TorusGeometry(2.6, 0.35, 16, 36);
    const ringMat = new THREE.MeshLambertMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706
    });
    this.portalRing = new THREE.Mesh(ringGeo, ringMat);
    this.portalGroup.add(this.portalRing);

    // Vórtice de chef ensolarado
    const vortexGeo = new THREE.CircleGeometry(2.1, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#fed7aa');
    grad.addColorStop(0.8, '#f97316');
    grad.addColorStop(1, '#9a3412');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const vortexTex = new THREE.CanvasTexture(canvas);
    const vortexMat = new THREE.MeshBasicMaterial({
      map: vortexTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92
    });
    this.portalVortex = new THREE.Mesh(vortexGeo, vortexMat);
    this.portalGroup.add(this.portalVortex);

    const light = new THREE.PointLight(0xfb923c, 2.5, 20);
    this.portalGroup.add(light);

    this.environmentGroup.add(this.portalGroup);
  }

  update(delta) {
    const time = Date.now() * 0.003;

    // 1. Partículas de vapor flutuantes
    for (const steam of this.steamPuffs) {
      steam.position.y += steam.userData.speedY * delta * 2;
      if (steam.position.y > steam.userData.baseY + 12) {
        steam.position.y = steam.userData.baseY;
      }
    }

    // 2. Animação dos alimentos gigantes
    for (const item of this.foodItems) {
      const bob = Math.sin(time * 2.5 + item.userData.bobOffset) * 0.12;
      item.position.y = item.userData.baseY + bob;

      if (this.player && this.player.position) {
        const dist = this.player.position.distanceTo(item.position);
        if (dist < 8.0) {
          item.lookAt(this.player.position.x, item.position.y, this.player.position.z);
        }
      }
    }

    // 3. Coleta de Alimentos
    for (const item of this.collectibles) {
      if (item.collected) continue;

      item.mesh.rotation.y += item.rotSpeed * delta;
      item.mesh.position.y = item.baseY + Math.sin(time * 2 + item.baseY) * 0.25;

      if (this.player && this.player.position) {
        const dist = this.player.position.distanceTo(item.mesh.position);
        if (dist < 2.0) {
          this.collectFoodItem(item);
        }
      }
    }

    // 4. Animação do portal
    if (this.portalRing) this.portalRing.rotation.z += 1.2 * delta;
    if (this.portalVortex) this.portalVortex.rotation.z -= 1.8 * delta;

    // Checa vitória no portal da cozinha
    if (this.portalGroup && this.player && !this.kitchenVictoryTriggered) {
      const dist = this.player.position.distanceTo(this.portalGroup.position);
      if (dist < 2.8) {
        this.triggerKitchenVictory();
      }
    }
  }

  collectFoodItem(item) {
    item.collected = true;
    this.collectedCount++;
    this.environmentGroup.remove(item.mesh);

    if (window.gameStateManager) {
      window.gameStateManager.addStar(1);
      window.gameStateManager.recordWordAttempt(item.foodWord, true);
      window.gameStateManager.addCoins(5);
      window.gameStateManager.addXp(20);
    }

    if (window.audioManager) {
      window.audioManager.playCollect();
      window.audioManager.speak(item.spokenWord);
    }

    if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
      window.gameApp.setWordHighlight(
        `${item.foodWord}! (+5 🪙 +20 XP)`,
        `Alimento ${this.collectedCount} de 3 coletado!`
      );
    }

    const counterEl = document.getElementById('collectibles-counter');
    if (counterEl) {
      counterEl.textContent = `${this.collectedCount}/${this.totalCollectibles}`;
      counterEl.style.transform = 'scale(1.3)';
      setTimeout(() => { counterEl.style.transform = 'scale(1)'; }, 300);
    }
  }

  triggerKitchenVictory() {
    this.kitchenVictoryTriggered = true;

    if (window.gameStateManager) {
      window.gameStateManager.recordWordAttempt('Apple', true);
      window.gameStateManager.recordWordAttempt('Milk', true);
      window.gameStateManager.recordWordAttempt('Bread', true);
      window.gameStateManager.addCoins(60);
      window.gameStateManager.addXp(180);
      window.gameStateManager.unlockBadge('kitchen_master');
      window.gameStateManager.unlockBadge('world3_complete');
    }

    if (window.audioManager) {
      window.audioManager.playFanfare();
      window.audioManager.speak('Kitchen World Complete! You are a Master Chef!');
    }

    if (typeof confetti === 'function') {
      confetti({ particleCount: 220, spread: 95, origin: { y: 0.6 } });
    }

    if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
      window.gameApp.setWordHighlight('MASTER CHEF! 🍳👑', 'Parabéns! Você completou o Mundo 3!');
    }

    setTimeout(() => {
      // Reposiciona o jogador suavemente para a plataforma inicial
      if (this.player) {
        this.player.position.set(0, 3.5, 0);
        this.player.velocity.set(0, 0, 0);
        if (this.player.mesh) this.player.mesh.position.copy(this.player.position);
      }
      // Mantém a trava ativa durante esta sessão para impedir re-disparos e duplicação de moedas/XP
      this.kitchenVictoryTriggered = true;
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
    this.foodItems = [];
    this.collectibles = [];
    this.steamPuffs = [];
  }
}

window.World3KitchenManager = World3KitchenManager;
