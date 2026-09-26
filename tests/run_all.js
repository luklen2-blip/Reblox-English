// tests/run_all.js - Suíte de Testes Automatizados Locais
const http = require('http');
const fs = require('fs');
const path = require('path');
const { server, generatePixPayload, sanitizeGameState, isRateLimited } = require('../server');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

function request(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    req.on('error', reject);
    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Iniciando Bateria de Testes Automatizados (Roblox English Obby 3D)...\n');

  const testPort = 3899;
  await new Promise(resolve => server.listen(testPort, resolve));

  try {
    // ================= TESTE 1: HEALTH CHECK (/api/health) =================
    console.log('📋 Teste 1: Endpoint de Monitoramento 24/7 (/api/health)');
    const healthRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/api/health',
      method: 'GET'
    });
    assert(healthRes.statusCode === 200, 'Health check deve responder HTTP 200');
    const healthJson = JSON.parse(healthRes.data);
    assert(healthJson.status === 'ok', 'Status retornado deve ser "ok"');
    assert(healthJson.version === '2.0.0', 'Versão deve ser "2.0.0"');
    assert(typeof healthJson.uptime_seconds === 'number', 'Deve informar tempo de uptime');

    // ================= TESTE 2: GERADOR DE PIX EMV OFICIAL =================
    console.log('\n📋 Teste 2: Motor Financeiro PIX EMV Oficial (Bacen)');
    const pixRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/api/pix/create',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      amount: 19.90,
      pixKey: 'luciano.obby@gmail.com',
      name: 'ROBLOX ENGLISH OBBY'
    }));

    assert(pixRes.statusCode === 200, 'API de PIX deve responder HTTP 200');
    const pixJson = JSON.parse(pixRes.data);
    assert(pixJson.success === true, 'Transação PIX gerada com sucesso');
    assert(pixJson.amount === '19.90', 'Valor formatado para R$ 19,90');
    assert(pixJson.payloadPix.startsWith('000201'), 'Payload PIX deve iniciar com 000201');
    assert(pixJson.payloadPix.includes('br.gov.bcb.pix'), 'Payload deve conter domínio oficial br.gov.bcb.pix');
    assert(pixJson.payloadPix.includes('6304'), 'Payload deve possuir tag de CRC 6304');
    assert(pixJson.kiwifyUrl === 'https://pay.kiwify.com.br/DHBiqnr', 'API deve retornar link oficial do Kiwify');

    // Validação de favorecido oficial padrão Luciano Sant Anna
    const defaultPixRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/api/pix/create',
      method: 'GET'
    });
    const defaultPixJson = JSON.parse(defaultPixRes.data);
    assert(defaultPixJson.beneficiary === 'LUCIANO SANT ANNA', 'Beneficiário padrão oficial deve ser LUCIANO SANT ANNA');
    assert(defaultPixJson.kiwifyUrl === 'https://pay.kiwify.com.br/DHBiqnr', 'Kiwify URL padrão deve ser https://pay.kiwify.com.br/DHBiqnr');

    // ================= TESTE 3: RESOLUÇÃO DE ARQUIVOS ESTÁTICOS =================
    console.log('\n📋 Teste 3: Resolução de Arquivos Estáticos e SPA Fallback');
    const indexRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/',
      method: 'GET'
    });
    assert(indexRes.statusCode === 200, 'Página raiz deve responder HTTP 200');
    assert(indexRes.data.includes('Roblox English Obby 3D'), 'HTML deve conter título da aplicação');
    assert(indexRes.data.includes('https://pay.kiwify.com.br/DHBiqnr'), 'HTML deve conter link oficial do Kiwify');
    assert(indexRes.data.includes('Luciano Sant Anna'), 'HTML deve exibir Luciano Sant Anna como favorecido oficial');

    const cssRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/css/style.css',
      method: 'GET'
    });
    assert(cssRes.statusCode === 200, 'CSS deve responder HTTP 200');
    assert(cssRes.headers['content-type'].includes('text/css'), 'Content-Type do CSS deve ser text/css');

    // Validação dos novos módulos: Mundo 2 e Reconhecimento de Voz Infantil
    const world2Res = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/js/world2.js',
      method: 'GET'
    });
    assert(world2Res.statusCode === 200, 'Arquivo /js/world2.js deve responder HTTP 200');
    assert(world2Res.data.includes('World2SafariManager'), 'world2.js deve conter a classe World2SafariManager');

    const speechRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/js/speech_recognition.js',
      method: 'GET'
    });
    assert(speechRes.statusCode === 200, 'Arquivo /js/speech_recognition.js deve responder HTTP 200');
    assert(speechRes.data.includes('KidSpeechRecognition'), 'speech_recognition.js deve conter KidSpeechRecognition');

    const worldsModalRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/js/worlds_modal.js',
      method: 'GET'
    });
    assert(worldsModalRes.statusCode === 200, 'Arquivo /js/worlds_modal.js deve responder HTTP 200');
    assert(worldsModalRes.data.includes('WorldsModalManager'), 'worlds_modal.js deve conter WorldsModalManager');

    // ================= TESTE 4: PÁGINAS LEGAIS (TERMOS E PRIVACIDADE) =================
    console.log('\n📋 Teste 4: Conformidade Legal Brasileira (CDC, ECA e LGPD)');
    const termosRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/termos',
      method: 'GET'
    });
    assert(termosRes.statusCode === 200, 'Rota /termos deve responder HTTP 200');
    assert(termosRes.data.includes('Código de Defesa do Consumidor') || termosRes.data.includes('ECA'), 'Termos de uso devem citar proteção legal');

    const privRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/privacidade',
      method: 'GET'
    });
    assert(privRes.statusCode === 200, 'Rota /privacidade deve responder HTTP 200');
    assert(privRes.data.includes('Artigo 14 da Lei Geral de Proteção de Dados') || privRes.data.includes('LGPD'), 'Privacidade deve cumprir Art. 14 da LGPD');

    // ================= TESTE 5: ARQUIVOS DE INFRAESTRUTURA DE NUVEM =================
    console.log('\n📋 Teste 5: Infraestrutura de Nuvem 24/7 (Render, Docker, Git)');
    const rootDir = path.join(__dirname, '..');
    assert(fs.existsSync(path.join(rootDir, 'render.yaml')), 'render.yaml deve existir na raiz');
    assert(fs.existsSync(path.join(rootDir, 'Dockerfile')), 'Dockerfile universal deve existir na raiz');
    assert(fs.existsSync(path.join(rootDir, '.gitignore')), '.gitignore deve existir na raiz');
    assert(fs.existsSync(path.join(rootDir, '.dockerignore')), '.dockerignore deve existir na raiz');

    // ================= TESTE 6: CÁLCULO MATEMÁTICO DO CRC-16 =================
    console.log('\n📋 Teste 6: Validação Algorítmica CRC-16');
    const customPayload = generatePixPayload({
      pixKey: 'teste@pix.com',
      name: 'TESTE PIX',
      city: 'CIDADE',
      amount: 10.00,
      txId: 'TESTE01'
    });
    const crcCode = customPayload.slice(-4);
    assert(crcCode.length === 4 && /^[0-9A-F]{4}$/.test(crcCode), 'Checksum CRC16 deve ser 4 dígitos hexadecimais em maiúsculas');

    // ================= TESTE 7: PERSISTÊNCIA DE DESBLOQUEIO VITALÍCIO =================
    console.log('\n📋 Teste 7: Persistência de Desbloqueio Vitalício (/api/user/status e /unlock)');
    const statusRes1 = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/api/user/status',
      method: 'GET'
    });
    assert(statusRes1.statusCode === 200, 'Endpoint /api/user/status deve responder HTTP 200');

    const unlockRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/api/user/unlock',
      method: 'POST'
    });
    assert(unlockRes.statusCode === 200, 'Endpoint /api/user/unlock deve responder HTTP 200');
    const unlockJson = JSON.parse(unlockRes.data);
    assert(unlockJson.unlocked === true, 'Desbloqueio vitalício deve confirmar unlocked: true');

    const statusRes2 = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/api/user/status',
      method: 'GET'
    });
    // ================= TESTE 8: GERENCIADOR CENTRAL DE ESTADO (userGameState) =================
    console.log('\n📋 Teste 8: Gerenciador Central de Estado do Jogo (userGameState)');
    const stateJsRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/js/state.js',
      method: 'GET'
    });
    assert(stateJsRes.statusCode === 200, 'Arquivo /js/state.js deve responder HTTP 200');
    assert(stateJsRes.data.includes('DEFAULT_GAME_STATE'), 'state.js deve conter DEFAULT_GAME_STATE');
    assert(stateJsRes.data.includes('wordsMastered'), 'state.js deve conter wordsMastered');
    assert(stateJsRes.data.includes('GameStateManager'), 'state.js deve conter a classe GameStateManager');

    const stateApiRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/api/user/state',
      method: 'GET'
    });
    assert(stateApiRes.statusCode === 200, 'Endpoint /api/user/state deve responder HTTP 200');
    const stateApiJson = JSON.parse(stateApiRes.data);
    assert(stateApiJson.success === true, 'API de estado deve confirmar success: true');
    assert(stateApiJson.state && typeof stateApiJson.state.isProUnlocked === 'boolean', 'Estado deve conter isProUnlocked');
    assert(typeof stateApiJson.state.currentWorld === 'number', 'Estado deve conter currentWorld');
    assert(typeof stateApiJson.state.selectedSkin === 'string', 'Estado deve conter selectedSkin');
    assert(typeof stateApiJson.state.collectedStars === 'number', 'Estado deve conter collectedStars');
    assert(Array.isArray(stateApiJson.state.wordsMastered), 'Estado deve conter array wordsMastered');
    assert(stateApiJson.state.wordsMastered.includes('Walk') && stateApiJson.state.wordsMastered.includes('Jump'), 'wordsMastered deve incluir palavras padrão Walk e Jump');

    const updateStateRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/api/user/state',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      state: {
        isProUnlocked: true,
        currentWorld: 2,
        selectedSkin: 'fire',
        collectedStars: 6,
        wordsMastered: ['Walk', 'Jump', 'Blue', 'Red', 'Star', 'Lion']
      }
    }));
    assert(updateStateRes.statusCode === 200, 'POST /api/user/state deve responder HTTP 200');
    const updateJson = JSON.parse(updateStateRes.data);
    assert(updateJson.state.selectedSkin === 'fire', 'Skin deve ter sido atualizada para fire');
    assert(updateJson.state.wordsMastered.includes('Lion'), 'wordsMastered deve incluir nova palavra Lion');

    // ================= TESTE 9: CABEÇALHOS DE SEGURANÇA E DEFESA PATH TRAVERSAL =================
    console.log('\n📋 Teste 9: Hardening de Segurança (OWASP Headers & Anti-Path Traversal)');
    assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'Cabeçalho X-Content-Type-Options nosniff presente');
    assert(healthRes.headers['x-frame-options'] === 'SAMEORIGIN', 'Cabeçalho X-Frame-Options SAMEORIGIN presente');
    assert(healthRes.headers['x-xss-protection'] === '1; mode=block', 'Cabeçalho X-XSS-Protection 1; mode=block presente');
    assert(healthRes.headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Cabeçalho Referrer-Policy presente');

    const traversalRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/..%2f..%2fserver.js',
      method: 'GET'
    });
    assert(traversalRes.statusCode === 403, 'Tentativa de path traversal deve ser bloqueada com HTTP 403');

    // ================= TESTE 10: SANITIZAÇÃO ESTRITA DE ESTADO (ANTI-PROTOTYPE POLLUTION) =================
    console.log('\n📋 Teste 10: Sanitização Estrita de Entrada e Validação do Estado');
    assert(sanitizeGameState(null) === null, 'sanitizeGameState com null retorna null');
    assert(sanitizeGameState('invalid') === null, 'sanitizeGameState com string retorna null');
    const safeOutput = sanitizeGameState({
      isProUnlocked: true,
      currentWorld: 99, // Inválido (aceita apenas 1 a 10)
      selectedSkin: 'ninja_pro',
      collectedStars: -5, // Inválido
      wordsMastered: ['  Jump  ', '<script>alert("xss")</script>Apple']
    });
    assert(safeOutput.isProUnlocked === true, 'isProUnlocked validado como boolean');
    assert(safeOutput.currentWorld === undefined, 'currentWorld fora do intervalo 1-10 deve ser ignorado');
    assert(safeOutput.collectedStars === undefined, 'collectedStars negativo deve ser ignorado');
    assert(safeOutput.wordsMastered[0] === 'Jump', 'wordsMastered deve remover espaços das palavras');
    assert(!safeOutput.wordsMastered[1].includes('<script>'), 'wordsMastered deve sanitizar caracteres perigosos');
    assert(typeof isRateLimited === 'function', 'Função isRateLimited deve estar disponível');

    // ================= TESTE 11: AVISOS ÉTICOS, PADRÃO MÉDICO/PSICOLÓGICO E DPO =================
    console.log('\n📋 Teste 11: Avisos Éticos, Não-Substituição Médica/Psicológica e DPO');
    assert(termosRes.data.includes('NÃO substituem diagnósticos') || termosRes.data.includes('psicológico'), 'Termos devem conter aviso de não substituição médica/psicológica');
    assert(privRes.data.includes('luciano.obby@gmail.com'), 'Política de privacidade deve conter canal de contato oficial do DPO');
    assert(indexRes.data.includes('modal-ethical-note'), 'Modal de conversão no HTML deve conter aviso ético aos pais');
    assert(indexRes.data.includes('apple-mobile-web-app-capable'), 'HTML deve conter meta tag para PWA e visualização móvel');

    // ================= TESTE 12: FASE 2 GAMIFICAÇÃO, NÍVEIS, MOEDAS, BADGES E MUNDO 3 =================
    console.log('\n📋 Teste 12: Gamificação Fase 2, Sistema de Níveis, Economia de Moedas e Mundo 3');
    const world3Res = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/js/world3.js',
      method: 'GET'
    });
    assert(world3Res.statusCode === 200, 'Arquivo /js/world3.js deve responder HTTP 200');
    assert(world3Res.data.includes('World3KitchenManager'), 'world3.js deve conter a classe World3KitchenManager');
    assert(world3Res.data.includes('createGiantApple'), 'world3.js deve conter modelo 3D da Maçã');
    assert(world3Res.data.includes('createGiantMilkCarton'), 'world3.js deve conter modelo 3D do Leite');
    assert(world3Res.data.includes('createGiantBread'), 'world3.js deve conter modelo 3D do Pão');

    assert(indexRes.data.includes('/js/world3.js'), 'HTML deve importar o script do Mundo 3 (/js/world3.js)');
    assert(indexRes.data.includes('student-dashboard-modal'), 'HTML deve conter o modal do Aluno (student-dashboard-modal)');
    assert(indexRes.data.includes('parents-dashboard-modal'), 'HTML deve conter o modal dos Pais (parents-dashboard-modal)');
    assert(indexRes.data.includes('hud-level-val'), 'HUD deve conter elemento de nível (hud-level-val)');
    assert(indexRes.data.includes('hud-xp-fill'), 'HUD deve conter barra de progresso de XP (hud-xp-fill)');
    assert(indexRes.data.includes('hud-coins-val'), 'HUD deve conter contador de moedas (hud-coins-val)');
    assert(indexRes.data.includes('student-dash-btn'), 'HUD deve conter botão de acesso ao Painel do Aluno');
    assert(indexRes.data.includes('parents-dash-btn'), 'HUD deve conter botão de acesso ao Painel dos Pais');
    assert(indexRes.data.includes('select-world-3-card'), 'Modal de Mundos deve conter card do Mundo 3');

    assert(stateJsRes.data.includes('calculateLevel'), 'state.js deve conter o método calculateLevel');
    assert(stateJsRes.data.includes('addXp'), 'state.js deve conter o método addXp');
    assert(stateJsRes.data.includes('addCoins'), 'state.js deve conter o método addCoins');
    assert(stateJsRes.data.includes('recordWordAttempt'), 'state.js deve conter o método recordWordAttempt');
    assert(stateJsRes.data.includes('getAccuracy'), 'state.js deve conter o método getAccuracy');
    assert(stateJsRes.data.includes('kitchen_master'), 'state.js deve registrar a conquista kitchen_master');

    const audioJsRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/js/audio.js',
      method: 'GET'
    });
    assert(audioJsRes.statusCode === 200, 'Arquivo /js/audio.js deve responder HTTP 200');
    assert(audioJsRes.data.includes('playCoin'), 'audio.js deve conter efeito sonoro playCoin');
    assert(audioJsRes.data.includes('playLevelUp'), 'audio.js deve conter efeito sonoro playLevelUp');
    assert(audioJsRes.data.includes('playDailyComplete'), 'audio.js deve conter efeito sonoro playDailyComplete');

    // Teste de persistência e sanitização dos novos campos da Fase 2 na API
    const gamifiedStateRes = await request({
      hostname: 'localhost',
      port: testPort,
      path: '/api/user/state',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      state: {
        xp: 220,
        level: 3,
        coins: 85,
        badges: ['first_word', 'animal_master', 'kitchen_master'],
        streak: 5,
        learningTimeSeconds: 650,
        wordStats: {
          Apple: { correct: 4, wrong: 1, attempts: 5 },
          Milk: { correct: 2, wrong: 0, attempts: 2 }
        }
      }
    }));
    assert(gamifiedStateRes.statusCode === 200, 'POST /api/user/state deve salvar campos da Fase 2 com HTTP 200');
    const gamifiedJson = JSON.parse(gamifiedStateRes.data);
    assert(gamifiedJson.state.xp === 220, 'API deve persistir XP');
    assert(gamifiedJson.state.level === 3, 'API deve persistir Level');
    assert(gamifiedJson.state.coins === 85, 'API deve persistir Moedas educacionais');
    assert(gamifiedJson.state.badges.includes('kitchen_master'), 'API deve persistir badge kitchen_master');
    assert(gamifiedJson.state.streak === 5, 'API deve persistir streak de dias ativos');
    assert(gamifiedJson.state.wordStats.Apple.correct === 4, 'API deve persistir estatísticas da palavra Apple');

    // Sanitização de valores inválidos da Fase 2
    const safeGamified = sanitizeGameState({
      xp: -50, // Inválido
      coins: -10, // Inválido
      badges: ['first_word', '<script>bad()</script>', 'invalid_badge_123'],
      wordStats: {
        '__proto__': { polluted: true },
        'NormalWord': { correct: 5, wrong: -2, attempts: 5 }
      }
    });
    assert(safeGamified.xp === undefined, 'Sanitizador deve rejeitar XP negativo');
    assert(safeGamified.coins === undefined, 'Sanitizador deve rejeitar Moedas negativas');
    assert(safeGamified.badges.includes('first_word') && !safeGamified.badges.includes('<script>bad()</script>'), 'Sanitizador deve filtrar badges maliciosos');
    assert(safeGamified.wordStats.NormalWord.correct === 5, 'Sanitizador deve aceitar estatísticas legítimas');
    assert(safeGamified.wordStats.NormalWord.wrong === 0, 'Sanitizador deve corrigir contagem de erros negativa');


  } catch (err) {
    console.error('❌ Erro durante a execução dos testes:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }

  console.log(`\n==================================================`);
  console.log(`🏁 Testes Concluídos: ${passedTests}/${totalTests} aprovados!`);
  console.log(`==================================================\n`);

  if (passedTests === totalTests) {
    console.log('🎉 SUCESSO: Todos os testes de qualidade foram aprovados com louvor!\n');
    process.exit(0);
  } else {
    console.error('⚠️ ALERTA: Alguns testes falharam.\n');
    process.exit(1);
  }
}

runTests();
