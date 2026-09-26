const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = parseInt(process.env.PORT, 10) || 3000;
const APP_NAME = process.env.APP_NAME || 'Roblox English Obby 3D';
const VERSION = '2.0.0';
let globalUserUnlocked = false;

// Gerador oficial de Payload Pix EMV (Bacen) com CRC-16
function generatePixPayload({ pixKey, name, city, amount, txId = 'OBBY1' }) {
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
    formatField('00', '01'), // Payload Format Indicator
    formatField('26', merchantAccountInfo), // Merchant Account Info
    formatField('52', '0000'), // Merchant Category Code
    formatField('53', '986'), // Transaction Currency (BRL)
    amount ? formatField('54', Number(amount).toFixed(2)) : '', // Transaction Amount
    formatField('58', 'BR'), // Country Code
    formatField('59', name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 25)), // Merchant Name
    formatField('60', city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 15)), // Merchant City
    formatField('62', additionalDataField), // Additional Data Field
    '6304' // CRC16 Indicator
  ].join('');

  // Cálculo CRC-16 / CCITT-FALSE
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

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.webm': 'video/webm'
};

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = reqUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Endpoint obrigatório de monitoramento de saúde /api/health
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ok',
      app: APP_NAME,
      version: VERSION,
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 2. Rota de geração de PIX EMV oficial
  if (pathname === '/api/pix/create' && (req.method === 'POST' || req.method === 'GET')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        let params = {};
        if (req.method === 'POST' && body) {
          params = JSON.parse(body);
        } else {
          params = Object.fromEntries(reqUrl.searchParams);
        }

        const pixKey = params.pixKey || 'luciano.obby@gmail.com';
        const name = params.name || 'ROBLOX ENGLISH OBBY';
        const city = params.city || 'FORTALEZA';
        const amount = params.amount || 19.90;
        const txId = params.txId || 'OBBYKIDS' + Math.floor(1000 + Math.random() * 9000);

        const payloadPix = generatePixPayload({ pixKey, name, city, amount, txId });
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payloadPix)}`;

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          amount: Number(amount).toFixed(2),
          pixKey,
          txId,
          payloadPix,
          qrCodeUrl,
          description: 'Acesso Vitalício - Todos os Mundos de Inglês (Roblox Obby)'
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 3. Persistência de Desbloqueio Vitalício do Usuário
  if (pathname === '/api/user/status' && req.method === 'GET') {
    const isUnlocked = globalUserUnlocked || false;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ unlocked: isUnlocked }));
    return;
  }

  if (pathname === '/api/user/unlock' && req.method === 'POST') {
    globalUserUnlocked = true;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, unlocked: true, message: 'Acesso Vitalício Ativado!' }));
    return;
  }

  // 3. Atalhos amigáveis para rotas de compliance legal
  if (pathname === '/termos') {
    pathname = '/termos.html';
  } else if (pathname === '/privacidade') {
    pathname = '/privacidade.html';
  }

  // Se pathname for '/', serve index.html
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // 4. Resolução Universal e Resiliente de Arquivos Estáticos (public/ e raiz)
  const targetFile = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const candidatePaths = [
    path.join(__dirname, 'public', targetFile),
    path.join(__dirname, targetFile),
    path.join(process.cwd(), 'public', targetFile),
    path.join(process.cwd(), targetFile)
  ];

  let filePath = candidatePaths.find(p => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isFile();
    } catch (e) {
      return false;
    }
  });

  // Se não encontrar o arquivo e não for requisição de API, aplica SPA Fallback para index.html
  if (!filePath && !pathname.startsWith('/api/')) {
    const spaCandidates = [
      path.join(__dirname, 'public', 'index.html'),
      path.join(__dirname, 'index.html'),
      path.join(process.cwd(), 'public', 'index.html'),
      path.join(process.cwd(), 'index.html')
    ];
    filePath = spaCandidates.find(p => {
      try {
        return fs.existsSync(p) && fs.statSync(p).isFile();
      } catch (e) {
        return false;
      }
    });
  }

  if (filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Erro interno ao ler arquivo: ' + err.message);
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': (ext === '.html' || ext === '.js' || ext === '.css') 
          ? 'no-cache, no-store, must-revalidate' 
          : 'public, max-age=3600'
      });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Recurso não encontrado', path: pathname }));
  }
});

function startServer(portToTry) {
  const s = server.listen(portToTry, () => {
    console.log(`🚀 [${APP_NAME}] rodando na porta ${portToTry}`);
    console.log(`🌐 URL Local: http://localhost:${portToTry}`);
    console.log(`🩺 Health Check: http://localhost:${portToTry}/api/health`);
  });

  s.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && !process.env.PORT) {
      console.log(`⚠️ Porta ${portToTry} ocupada, tentando ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('❌ Erro no servidor:', err);
    }
  });
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = { server, generatePixPayload };
