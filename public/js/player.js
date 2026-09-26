// player.js - Personagem Bloco estilo Roblox com Física e Animação Procedural

class Player {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    // Estado físico
    this.position = new THREE.Vector3(0, 3, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.isGrounded = false;
    this.canJump = true;
    this.isFrozen = false;
    this.moveSpeed = 9.0;
    this.jumpForce = 13.0;
    this.gravity = -26.0;

    // Checkpoint seguro atual
    this.currentCheckpoint = new THREE.Vector3(0, 3, 0);
    this.checkpoint = this.currentCheckpoint;

    // Variáveis de animação
    this.walkCycle = 0;
    this.targetRotationY = 0;

    this.createCharacterMesh();
    this.scene.add(this.mesh);
    this.mesh.position.copy(this.position);
  }

  // Gera o rostinho amigável desenhado em canvas 2D para a face do boneco
  createFaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Fundo amarelo suave da cabeça
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 256, 256);

    // Olhinhos expressivos de desenho animado
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(80, 110, 18, 0, Math.PI * 2);
    ctx.arc(176, 110, 18, 0, Math.PI * 2);
    ctx.fill();

    // Brilho nos olhos
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(75, 105, 6, 0, Math.PI * 2);
    ctx.arc(171, 105, 6, 0, Math.PI * 2);
    ctx.fill();

    // Bochechas rosadas infantis
    ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.beginPath();
    ctx.arc(60, 140, 16, 0, Math.PI * 2);
    ctx.arc(196, 140, 16, 0, Math.PI * 2);
    ctx.fill();

    // Sorriso alegre
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 140, 40, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createCharacterMesh() {
    const yellowMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
    const blueMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const darkBlueMat = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
    const faceTex = this.createFaceTexture();
    const faceMat = new THREE.MeshLambertMaterial({ map: faceTex });

    // Materiais da cabeça em formato de cubo (face na frente)
    const headMats = [
      yellowMat, yellowMat, yellowMat, yellowMat, faceMat, yellowMat
    ];

    // 1. Cabeça (Cubo amarelo Roblox)
    const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    this.head = new THREE.Mesh(headGeo, headMats);
    this.head.position.y = 1.9;
    this.mesh.add(this.head);

    // Grupo dinâmico de acessórios (chapéus, capacetes, coroas)
    this.accessoryGroup = new THREE.Group();
    this.head.add(this.accessoryGroup);

    // 2. Torso (Azul vivo)
    this.torsoMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const torsoGeo = new THREE.BoxGeometry(1.0, 1.1, 0.6);
    this.torso = new THREE.Mesh(torsoGeo, this.torsoMat);
    this.torso.position.y = 1.0;
    this.mesh.add(this.torso);

    // 3. Braços com articulação no ombro
    const armGeo = new THREE.BoxGeometry(0.35, 1.0, 0.35);
    armGeo.translate(0, -0.4, 0); // desloca o pivô para o ombro

    this.leftArm = new THREE.Mesh(armGeo, yellowMat);
    this.leftArm.position.set(0.68, 1.4, 0);
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, yellowMat);
    this.rightArm.position.set(-0.68, 1.4, 0);
    this.mesh.add(this.rightArm);

    // 4. Pernas com articulação no quadril
    const legGeo = new THREE.BoxGeometry(0.42, 1.0, 0.45);
    legGeo.translate(0, -0.45, 0); // desloca o pivô para o quadril

    this.leftLeg = new THREE.Mesh(legGeo, darkBlueMat);
    this.leftLeg.position.set(0.24, 0.5, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, darkBlueMat);
    this.rightLeg.position.set(-0.24, 0.5, 0);
    this.mesh.add(this.rightLeg);

    // Aplica skin salva ou padrão
    const savedSkinId = localStorage.getItem('roblox_english_obby_skin') || 'default';
    if (window.SKINS) {
      const skin = window.SKINS.find(s => s.id === savedSkinId) || window.SKINS[0];
      this.applySkin(skin);
    } else {
      this.applySkin({ id: 'default', color: '#0284c7', hatType: 'cap' });
    }
  }

  // Aplica personalização de roupas e acessórios épicos na cabeça do boneco
  applySkin(skin) {
    if (!skin) return;

    // 1. Atualiza cor da roupa do torso
    if (this.torso && this.torso.material) {
      this.torso.material.color.set(skin.color);
    }

    // 2. Remove acessório 3D anterior
    while (this.accessoryGroup.children.length > 0) {
      this.accessoryGroup.remove(this.accessoryGroup.children[0]);
    }

    // 3. Monta o acessório correspondente
    switch (skin.hatType) {
      case 'fire': {
        // Labaredas / Chifres de Fogo
        const fireMat1 = new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0x991b1b });
        const fireMat2 = new THREE.MeshLambertMaterial({ color: 0xf97316, emissive: 0xc2410c });
        const coneGeo = new THREE.ConeGeometry(0.18, 0.55, 6);
        const leftHorn = new THREE.Mesh(coneGeo, fireMat1);
        leftHorn.position.set(-0.28, 0.55, 0);
        leftHorn.rotation.z = 0.25;
        const rightHorn = new THREE.Mesh(coneGeo, fireMat1);
        rightHorn.position.set(0.28, 0.55, 0);
        rightHorn.rotation.z = -0.25;
        const centerSpike = new THREE.Mesh(coneGeo, fireMat2);
        centerSpike.position.set(0, 0.65, 0);
        centerSpike.scale.set(1.1, 1.2, 1.1);
        this.accessoryGroup.add(leftHorn);
        this.accessoryGroup.add(rightHorn);
        this.accessoryGroup.add(centerSpike);
        break;
      }
      case 'astro': {
        // Capacete Astronauta com Viseira Dourada
        const helmMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
        const helmGeo = new THREE.BoxGeometry(0.92, 0.92, 0.92);
        const helm = new THREE.Mesh(helmGeo, helmMat);
        helm.position.set(0, 0, 0);
        const visorMat = new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0x78350f });
        const visorGeo = new THREE.BoxGeometry(0.7, 0.4, 0.15);
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 0.05, 0.45);
        this.accessoryGroup.add(helm);
        this.accessoryGroup.add(visor);
        break;
      }
      case 'crown': {
        // Coroa Dourada Real com Picos
        const crownMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0xca8a04 });
        const crownBaseGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.2, 16);
        const crownBase = new THREE.Mesh(crownBaseGeo, crownMat);
        crownBase.position.set(0, 0.5, 0);
        this.accessoryGroup.add(crownBase);
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const spikeGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
          const spike = new THREE.Mesh(spikeGeo, crownMat);
          spike.position.set(Math.cos(angle) * 0.42, 0.65, Math.sin(angle) * 0.42);
          this.accessoryGroup.add(spike);
        }
        break;
      }
      case 'ninja': {
        // Faixa Ninja Preta com fitas atrás
        const ninjaMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
        const bandGeo = new THREE.BoxGeometry(0.86, 0.18, 0.86);
        const band = new THREE.Mesh(bandGeo, ninjaMat);
        band.position.set(0, 0.35, 0);
        const tailGeo = new THREE.BoxGeometry(0.12, 0.45, 0.08);
        const tail = new THREE.Mesh(tailGeo, ninjaMat);
        tail.position.set(0.15, 0.1, -0.48);
        tail.rotation.x = -0.3;
        this.accessoryGroup.add(band);
        this.accessoryGroup.add(tail);
        break;
      }
      case 'dino': {
        // Crista Espinhosa de Dinossauro Verde
        const dinoMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
        for (let i = 0; i < 4; i++) {
          const spikeGeo = new THREE.ConeGeometry(0.12, 0.25, 4);
          const spike = new THREE.Mesh(spikeGeo, dinoMat);
          spike.position.set(0, 0.48 + (i === 1 || i === 2 ? 0.08 : 0), -0.32 + i * 0.22);
          spike.rotation.x = 0.2;
          this.accessoryGroup.add(spike);
        }
        break;
      }
      case 'cap':
      default: {
        // Boné vermelho esportivo
        const capMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
        const capGeo = new THREE.BoxGeometry(0.85, 0.25, 0.85);
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = 0.45;
        const visorGeo = new THREE.BoxGeometry(0.85, 0.1, 0.4);
        const visor = new THREE.Mesh(visorGeo, capMat);
        visor.position.set(0, -0.08, 0.55);
        cap.add(visor);
        this.accessoryGroup.add(cap);
        break;
      }
    }
  }

  update(delta, input, cameraRotation, platforms) {
    // 0. Se o jogador estiver congelado pelo Portal Dourado
    if (this.isFrozen) {
      this.velocity.x = 0;
      this.velocity.z = 0;
      if (this.velocity.y > 0) this.velocity.y = 0;
      // Pose comemorativa com braços para o alto
      this.leftArm.rotation.x = -Math.PI * 0.75;
      this.rightArm.rotation.x = -Math.PI * 0.75;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      return;
    }

    // 1. Processa movimentação relativa ao ângulo horizontal da câmera
    const moveX = input.inputVector.x;
    const moveZ = input.inputVector.z;
    const isMoving = Math.hypot(moveX, moveZ) > 0.1;

    let dirWorld = new THREE.Vector3(0, 0, 0);
    if (isMoving) {
      // Rotaciona o vetor de entrada de acordo com a rotação da câmera (yaw)
      const forward = new THREE.Vector3(-Math.sin(cameraRotation.yaw), 0, -Math.cos(cameraRotation.yaw));
      const right = new THREE.Vector3(Math.cos(cameraRotation.yaw), 0, -Math.sin(cameraRotation.yaw));

      dirWorld.addScaledVector(forward, -moveZ);
      dirWorld.addScaledVector(right, moveX);
      dirWorld.normalize();

      this.velocity.x = dirWorld.x * this.moveSpeed;
      this.velocity.z = dirWorld.z * this.moveSpeed;

      // Rotação suave do personagem na direção que está andando
      this.targetRotationY = Math.atan2(dirWorld.x, dirWorld.z);
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // Interpolação suave do ângulo do corpo
    const diff = this.targetRotationY - this.mesh.rotation.y;
    // Corrige voltas completas em radianos (-PI a PI)
    const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.mesh.rotation.y += normalizedDiff * 14 * delta;

    // 2. Pulo e Gravidade
    if (input.jump && this.isGrounded && this.canJump) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.canJump = false;

      // Comando de voz nativo en-US "Jump!"
      if (window.audioManager) {
        window.audioManager.playJump();
        window.audioManager.speak('Jump!');
        if (window.gameApp && typeof window.gameApp.setWordHighlight === 'function') {
          window.gameApp.setWordHighlight('JUMP!', 'Salte pelas plataformas flutuantes');
        }
      }
    }

    if (!input.jump) {
      this.canJump = true;
    }

    // Aplica gravidade
    this.velocity.y += this.gravity * delta;

    // 3. Aplica deslocamento tentado
    const nextPos = this.position.clone();
    nextPos.x += this.velocity.x * delta;
    nextPos.z += this.velocity.z * delta;
    nextPos.y += this.velocity.y * delta;

    // 4. Detecção de Colisão com Plataformas
    const playerRadius = 0.5;
    const playerHeight = 1.9;
    let groundedThisFrame = false;

    for (const plat of platforms) {
      const box = plat.box; // THREE.Box3 atualizado
      if (!box) continue;

      // Verifica se o personagem está horizontalmente sobre a plataforma
      const withinX = nextPos.x >= box.min.x - playerRadius && nextPos.x <= box.max.x + playerRadius;
      const withinZ = nextPos.z >= box.min.z - playerRadius && nextPos.z <= box.max.z + playerRadius;

      if (withinX && withinZ) {
        // Aterrisagem no topo da plataforma
        const footY = nextPos.y;
        const prevFootY = this.position.y;
        const topY = box.max.y;

        if (prevFootY >= topY - 0.25 && footY <= topY + 0.15 && this.velocity.y <= 0) {
          nextPos.y = topY;
          this.velocity.y = 0;
          groundedThisFrame = true;

          // Se a plataforma tiver callback ao pisar (ex: cores)
          if (plat.onStep) {
            plat.onStep(this);
          }
          break;
        }
      }
    }

    this.isGrounded = groundedThisFrame;
    this.position.copy(nextPos);
    this.mesh.position.copy(this.position);

    // 5. Verificação de Queda no Abismo e Respawn Seguro
    if (this.position.y < -15) {
      this.respawn();
    }

    // 6. Animação Procedural dos Membros
    this.animateLimbs(delta, isMoving);
  }

  respawn() {
    this.position.copy(this.currentCheckpoint);
    this.velocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);

    if (window.audioManager) {
      window.audioManager.playTryAgain();
      window.audioManager.speak("Let's try again! You can do it!");
    }
  }

  setCheckpoint(newPos) {
    this.currentCheckpoint.copy(newPos);
  }

  animateLimbs(delta, isMoving) {
    if (!this.isGrounded) {
      // Pose de Pulo: Pernas flexionadas, braços erguidos comemorando
      this.leftArm.rotation.x = -Math.PI * 0.7;
      this.rightArm.rotation.x = -Math.PI * 0.7;
      this.leftLeg.rotation.x = 0.5;
      this.rightLeg.rotation.x = 0.2;
      return;
    }

    if (isMoving) {
      // Ciclo de caminhada clássico estilo boneco de blocos
      this.walkCycle += delta * 12;
      const swing = Math.sin(this.walkCycle) * 0.75;

      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing;
      this.rightArm.rotation.x = swing;

      // Leve balanço lateral da cabeça
      this.head.rotation.z = Math.sin(this.walkCycle * 0.5) * 0.06;
    } else {
      // Postura Parada (Idle): respiração suave
      this.walkCycle += delta * 2;
      const breathe = Math.sin(this.walkCycle) * 0.05;

      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = breathe;
      this.rightArm.rotation.x = -breathe;
      this.head.rotation.z = 0;
      this.torso.position.y = 1.0 + breathe * 0.2;
    }
  }
}

window.Player = Player;
