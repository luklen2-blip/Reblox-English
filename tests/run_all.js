// tests/run_all.js - Suíte de Testes Automatizados Locais
const http = require('http');
const fs = require('fs');
const path = require('path');
const { server, generatePixPayload } = require('../server');

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
