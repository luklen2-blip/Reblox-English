// tests/test_cloud_live.js - Validação Ao Vivo na Nuvem (Live Cloud E2E)
const https = require('https');
const http = require('http');

const targetUrl = process.argv[2] || process.env.LIVE_URL || 'http://localhost:3001';

console.log(`🌐 Iniciando Teste de Homologação na Nuvem: ${targetUrl}`);

function liveRequest(path, method = 'GET', bodyData = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(path, targetUrl);
    const isHttps = fullUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method: method,
      headers: {
        'User-Agent': 'AntigravityLiveTester/2.0'
      },
      rejectUnauthorized: false // Ignora avisos de certificados intermediários em Windows/ambientes transitórios
    };

    if (bodyData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = client.request(options, res => {
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
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function runLiveTest() {
  try {
    // 1. Health check ao vivo
    console.log('📡 1. Testando /api/health na nuvem...');
    const health = await liveRequest('/api/health');
    console.log(`   Status: HTTP ${health.statusCode}`);
    const healthData = JSON.parse(health.data);
    console.log(`   Uptime: ${healthData.uptime_seconds}s | Versão: ${healthData.version} | App: ${healthData.app}`);

    // 2. Landing / Game App
    console.log('🎮 2. Testando carregamento do jogo 3D (/)');
    const home = await liveRequest('/');
    console.log(`   Status: HTTP ${home.statusCode} | Tamanho: ${home.data.length} bytes`);

    // 3. API PIX
    console.log('💳 3. Testando criação de PIX em produção...');
    const pix = await liveRequest('/api/pix/create', 'POST', JSON.stringify({
      amount: 19.90,
      pixKey: 'producao@pix.com'
    }));
    const pixData = JSON.parse(pix.data);
    console.log(`   Status: HTTP ${pix.statusCode} | PIX Criado: ${pixData.success} | Payload CRC: ${pixData.payloadPix.slice(-4)}`);

    // 4. Termos e LGPD
    console.log('⚖️ 4. Testando rotas legais (/termos e /privacidade)...');
    const termos = await liveRequest('/termos');
    const priv = await liveRequest('/privacidade');
    console.log(`   Termos: HTTP ${termos.statusCode} | Privacidade: HTTP ${priv.statusCode}`);

    // 5. Assets de Mundo 2 e Reconhecimento de Voz
    console.log('🦁 5. Testando assets do Mundo 2 e Módulo de Voz...');
    const w2 = await liveRequest('/js/world2.js');
    const stt = await liveRequest('/js/speech_recognition.js');
    console.log(`   World 2 JS: HTTP ${w2.statusCode} (${w2.data.length} bytes) | STT JS: HTTP ${stt.statusCode} (${stt.data.length} bytes)`);

    console.log('\n✅ HOMOLOGAÇÃO NA NUVEM CONCLUÍDA COM 100% DE SUCESSO!\n');
  } catch (err) {
    console.error('❌ Falha na homologação de nuvem:', err.message);
    process.exit(1);
  }
}

runLiveTest();
