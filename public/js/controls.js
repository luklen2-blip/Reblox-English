// controls.js - Controles Híbridos (PC Teclado/Mouse + Mobile Joystick/Touch)

class InputManager {
  constructor() {
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.jump = false;

    // Vetor de movimento analógico normalizado (-1 a 1)
    this.inputVector = { x: 0, z: 0 };

    // Câmera orbitária
    this.cameraRotation = {
      yaw: 0,      // Rotação horizontal (azimuth)
      pitch: 0.35  // Elevação vertical suave olhando de cima
    };

    this.isPointerDown = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.activeCameraTouchId = null;

    this.isMobile = this.detectMobile();
    this.initKeyboard();
    this.initMouse();
    this.initMobileTouch();

    if (this.isMobile) {
      document.body.classList.add('mobile-active');
    }
  }

  detectMobile() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 800
    );
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Retoma AudioContext no primeiro gesto do usuário
      if (window.audioManager) window.audioManager.resumeContext();

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = true;
          break;
        case 'Space':
          this.jump = true;
          e.preventDefault();
          break;
      }
      this.updateInputVector();
      this.hideDesktopHint();
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = false;
          break;
        case 'Space':
          this.jump = false;
          break;
      }
      this.updateInputVector();
    });
  }

  hideDesktopHint() {
    const hint = document.getElementById('desktop-hint');
    if (hint && hint.style.opacity !== '0') {
      setTimeout(() => {
        hint.style.opacity = '0';
      }, 1000);
    }
  }

  updateInputVector() {
    // Se o joystick mobile estiver sendo usado, ele sobrescreve o teclado
    if (this.joystickActive) return;

    let x = 0;
    let z = 0;

    if (this.moveForward) z -= 1;
    if (this.moveBackward) z += 1;
    if (this.moveLeft) x -= 1;
    if (this.moveRight) x += 1;

    // Normaliza para não andar mais rápido na diagonal
    const len = Math.hypot(x, z);
    if (len > 0) {
      this.inputVector.x = x / len;
      this.inputVector.z = z / len;
    } else {
      this.inputVector.x = 0;
      this.inputVector.z = 0;
    }
  }

  initMouse() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    container.addEventListener('mousedown', (e) => {
      if (window.audioManager) window.audioManager.resumeContext();
      this.isPointerDown = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerDown) return;
      const deltaX = e.clientX - this.lastPointerX;
      const deltaY = e.clientY - this.lastPointerY;

      this.cameraRotation.yaw -= deltaX * 0.006;
      this.cameraRotation.pitch += deltaY * 0.005;

      // Limita a rotação vertical para a câmera não inverter
      this.cameraRotation.pitch = Math.max(0.08, Math.min(Math.PI / 2.3, this.cameraRotation.pitch));

      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isPointerDown = false;
    });
  }

  initMobileTouch() {
    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');
    const jumpBtn = document.getElementById('jump-btn');
    const container = document.getElementById('canvas-container');

    if (!joystickZone || !jumpBtn || !container) return;

    let joystickTouchId = null;
    let startX = 0;
    let startY = 0;
    const maxRadius = 45; // Raio máximo de deslocamento em pixels

    // Touch no Joystick
    joystickZone.addEventListener('touchstart', (e) => {
      if (window.audioManager) window.audioManager.resumeContext();
      e.preventDefault();
      const touch = e.changedTouches[0];
      joystickTouchId = touch.identifier;
      const rect = joystickZone.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
      this.joystickActive = true;
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystickTouchId) {
          const dx = touch.clientX - startX;
          const dy = touch.clientY - startY;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);

          const clampedDist = Math.min(dist, maxRadius);
          const knobX = Math.cos(angle) * clampedDist;
          const knobY = Math.sin(angle) * clampedDist;

          joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

          // Normaliza de -1 a 1
          this.inputVector.x = knobX / maxRadius;
          this.inputVector.z = knobY / maxRadius;
        } else if (touch.identifier === this.activeCameraTouchId) {
          // Rotação de câmera por toque na tela
          const deltaX = touch.clientX - this.lastCameraTouchX;
          const deltaY = touch.clientY - this.lastCameraTouchY;

          this.cameraRotation.yaw -= deltaX * 0.008;
          this.cameraRotation.pitch += deltaY * 0.006;
          this.cameraRotation.pitch = Math.max(0.08, Math.min(Math.PI / 2.3, this.cameraRotation.pitch));

          this.lastCameraTouchX = touch.clientX;
          this.lastCameraTouchY = touch.clientY;
        }
      }
    }, { passive: false });

    const handleJoystickEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystickTouchId) {
          joystickTouchId = null;
          this.joystickActive = false;
          joystickKnob.style.transform = 'translate(-50%, -50%)';
          this.inputVector.x = 0;
          this.inputVector.z = 0;
        }
        if (touch.identifier === this.activeCameraTouchId) {
          this.activeCameraTouchId = null;
        }
      }
    };

    window.addEventListener('touchend', handleJoystickEnd);
    window.addEventListener('touchcancel', handleJoystickEnd);

    // Touch no Botão de Pulo Mobile
    jumpBtn.addEventListener('touchstart', (e) => {
      if (window.audioManager) window.audioManager.resumeContext();
      e.preventDefault();
      this.jump = true;
    }, { passive: false });

    jumpBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.jump = false;
    }, { passive: false });

    // Touch na tela para girar a câmera (excluindo joystick e botão)
    container.addEventListener('touchstart', (e) => {
      if (this.activeCameraTouchId !== null) return;
      const touch = e.changedTouches[0];
      this.activeCameraTouchId = touch.identifier;
      this.lastCameraTouchX = touch.clientX;
      this.lastCameraTouchY = touch.clientY;
    });
  }
}

window.inputManager = new InputManager();
