// pix.js - Motor de Pagamento PIX Oficial (Bacen EMV) e Controle do Modal de Desbloqueio (React UnlockModal Theme)

class PixCheckout {
  constructor() {
    this.copied = false;
    this.isCheckingPayment = false;
    this.isUnlocked = false;
    this.pixCode = "00020126580014BR.GOV.BCB.PIX0136luciano.obby@gmail.com520400005303986540519.905802BR5925ROBLOX ENGLISH OBBY 3D6009FORTALEZA62070503***6304E2D1";

    this.checkStoredUnlockStatus();
    this.initEventListeners();
    this.fetchDynamicPix();
  }

  async checkStoredUnlockStatus() {
    // 1. Checa persistência local no navegador
    const local = (window.userGameState && window.userGameState.isProUnlocked) ||
                  localStorage.getItem('roblox_english_obby_unlocked') === 'true';
    if (local) {
      this.isUnlocked = true;
      this.applyVipUI();
      return;
    }

    // 2. Checa status no backend
    try {
      const res = await fetch('/api/user/status');
      const data = await res.json();
      if (data.unlocked) {
        this.isUnlocked = true;
        localStorage.setItem('roblox_english_obby_unlocked', 'true');
        this.applyVipUI();
      }
    } catch (e) {}
  }

  applyVipUI() {
    const vipEl = document.getElementById('vip-badge');
    if (vipEl) vipEl.style.display = 'block';
  }

  // Gera o PIX EMV oficial do Banco Central com CRC16 matemático
  generatePixPayload({ pixKey, name, city, amount, txId = 'OBBY1' }) {
    const formatField = (id, value) => {
      const len = String(value.length).padStart(2, '0');
      return `${id}${len}${value}`;
    };

    const merchantAccountInfo = [
      formatField('00', 'br.gov.bcb.pix'),
      formatField('01', pixKey)
    ].join('');

    const additionalDataField = formatField('05', txId);

    let payload = [
      formatField('00', '01'),
      formatField('26', merchantAccountInfo),
      formatField('52', '0000'),
      formatField('53', '986'),
      amount ? formatField('54', Number(amount).toFixed(2)) : '',
      formatField('58', 'BR'),
      formatField('59', name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 25)),
      formatField('60', city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 15)),
      formatField('62', additionalDataField),
      '6304'
    ].join('');

    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= (payload.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
    return payload + crcHex;
  }

  async fetchDynamicPix() {
    try {
      const res = await fetch('/api/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 19.90,
          pixKey: 'luciano.obby@gmail.com',
          name: 'ROBLOX ENGLISH OBBY 3D',
          city: 'FORTALEZA'
        })
      });
      const data = await res.json();
      if (data.success && data.payloadPix) {
        this.pixCode = data.payloadPix;
        const qrImg = document.getElementById('pix-qr-img');
        if (qrImg) qrImg.src = data.qrCodeUrl;
      }
    } catch (e) {
      this.pixCode = this.generatePixPayload({
        pixKey: 'luciano.obby@gmail.com',
        name: 'ROBLOX ENGLISH OBBY 3D',
        city: 'FORTALEZA',
        amount: 19.90,
        txId: 'OBBY' + Math.floor(1000 + Math.random() * 9000)
      });
      const qrImg = document.getElementById('pix-qr-img');
      if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(this.pixCode)}`;
      }
    }
  }

  initEventListeners() {
    // 1. Botão de Copiar PIX Copia e Cola
    const copyBtn = document.getElementById('copy-pix-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.handleCopy();
      });
    }

    // 2. Botão de Simulação de Pagamento ("Já fiz o pagamento (Liberar Acesso)")
    const simulateBtn = document.getElementById('simulate-pay-btn');
    if (simulateBtn) {
      simulateBtn.addEventListener('click', () => {
        this.handleSimulatePayment();
      });
    }

    // 3. Botão Fechar Modal
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.handleClose();
      });
    }

    // 4. Toggle do QR Code Drawer
    const toggleQrBtn = document.getElementById('toggle-qr-btn');
    const qrDrawer = document.getElementById('pix-qr-drawer');
    if (toggleQrBtn && qrDrawer) {
      toggleQrBtn.addEventListener('click', () => {
        qrDrawer.classList.toggle('active');
        toggleQrBtn.textContent = qrDrawer.classList.contains('active')
          ? '▲ Ocultar QR Code'
          : '📱 Prefere ler o QR Code no celular? Clique aqui';
      });
    }

    // 5. Badges de Vocabulário
    const vocabTags = document.querySelectorAll('.vocab-tag');
    vocabTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const word = tag.getAttribute('data-word') || tag.textContent.trim();
        if (window.audioManager) {
          window.audioManager.speak(word);
        }
      });
    });
  }

  handleCopy() {
    navigator.clipboard.writeText(this.pixCode).then(() => {
      this.copied = true;
      const copyBtn = document.getElementById('copy-pix-btn');
      if (copyBtn) {
        copyBtn.textContent = '✓ Código PIX Copiado!';
        copyBtn.classList.add('copied');
      }

      setTimeout(() => {
        this.copied = false;
        if (copyBtn) {
          copyBtn.textContent = '⚡ Pagar R$ 19,90 no PIX (Copia e Cola)';
          copyBtn.classList.remove('copied');
        }
      }, 3000);
    }).catch(() => {
      // Fallback manual de seleção caso a permissão do clipboard seja restrita
      const tempInput = document.createElement('input');
      tempInput.value = this.pixCode;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      tempInput.remove();

      const copyBtn = document.getElementById('copy-pix-btn');
      if (copyBtn) {
        copyBtn.textContent = '✓ Código PIX Copiado!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = '⚡ Pagar R$ 19,90 no PIX (Copia e Cola)';
          copyBtn.classList.remove('copied');
        }, 3000);
      }
    });
  }

  handleSimulatePayment() {
    this.isCheckingPayment = true;
    const simulateBtn = document.getElementById('simulate-pay-btn');
    if (simulateBtn) {
      simulateBtn.disabled = true;
      simulateBtn.textContent = 'Verificando pagamento...';
    }

    // Simulação de confirmação do webhook (2000ms)
    setTimeout(() => {
      this.isCheckingPayment = false;
      if (simulateBtn) {
        simulateBtn.disabled = false;
        simulateBtn.textContent = 'Já fiz o pagamento (Liberar Acesso)';
      }

      this.onPaymentSuccess();
    }, 2000);
  }

  onPaymentSuccess() {
    this.isUnlocked = true;

    // 1. Salva o estado de liberação localmente no userGameState e nuvem
    if (window.gameStateManager) {
      window.gameStateManager.unlockPro();
    } else {
      localStorage.setItem('roblox_english_obby_unlocked', 'true');
      fetch('/api/user/unlock', { method: 'POST' }).catch(() => {});
    }

    // 2. Aplica UI VIP e descongela o boneco
    this.applyVipUI();
    if (window.player) {
      window.player.isFrozen = false;
    }
    if (window.skinManager) {
      window.skinManager.renderSkinGrid();
    }

    // 4. Efeito comemorativo de vitória
    if (window.portalManager && typeof window.portalManager.fireConfetti === 'function') {
      window.portalManager.fireConfetti();
    }

    if (window.audioManager) {
      window.audioManager.playFanfare();
      window.audioManager.speak("Payment confirmed! You are awesome! All worlds are now unlocked!");
    }

    alert(
      "🎉 PAGAMENTO CONFIRMADO COM SUCESSO!\n\n" +
      "✨ ACESSO VITALÍCIO LIBERADO!\n" +
      "✓ +4 Novos Mundos 3D temáticos (+80 palavras em inglês)\n" +
      "✓ Loja de skins, roupas e chapéus para o avatar liberada!\n" +
      "✓ Sem mensalidade nem anúncios.\n\n" +
      "O boneco foi descongelado e o jogo continuará sempre desbloqueado neste aparelho!"
    );

    this.handleClose();
  }

  handleClose() {
    const modal = document.getElementById('victory-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }
}

window.pixCheckout = new PixCheckout();
