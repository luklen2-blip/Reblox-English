const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = parseInt(process.env.PORT, 10) || 3000;
const APP_NAME = process.env.APP_NAME || 'Roblox English Obby 3D';
const VERSION = '2.0.0';
let globalUserUnlocked = false;
let globalUserState = {
  isProUnlocked: false,
  currentWorld: 1,
  selectedSkin: 'default',
  collectedStars: 3,
  wordsMastered: ['Walk', 'Jump', 'Blue', 'Red', 'Star'],
  // Fase 2: Gamificação e Aprendizagem Contextual
  xp: 0,
  level: 1,
  coins: 0,
  badges: [],
  wordStats: {
    'Walk': { attempts: 1, correct: 1, wrong: 0 },
    'Jump': { attempts: 1, correct: 1, wrong: 0 },
    'Blue': { attempts: 1, correct: 1, wrong: 0 },
    'Red': { attempts: 1, correct: 0, wrong: 1 },
    'Star': { attempts: 1, correct: 1, wrong: 0 }
  },
  streak: 1,
  lastActiveDate: new Date().toISOString().slice(0, 10),
  learningTimeSeconds: 0,
  dailyChallenge: {
    id: 'daily_colors_1',
    title: 'Find 3 Colors in English',
    targetCount: 3,
    progress: 0,
    completed: false,
    rewardCoins: 25,
    rewardXp: 50
  }
};

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

// Rate Limiter em memória para prevenção de abuso e ataques de força bruta/DoS
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // Janela de 1 minuto
const MAX_GENERAL_REQ_PER_MIN = 300;
const MAX_API_MUTATION_PER_MIN = 60;

function isRateLimited(ip, isMutation = false) {
  const now = Date.now();
  const limit = isMutation ? MAX_API_MUTATION_PER_MIN : MAX_GENERAL_REQ_PER_MIN;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const timestamps = rateLimitMap.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW);
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  
  if (rateLimitMap.size > 2000) {
    for (const [key, times] of rateLimitMap.entries()) {
      if (times.length === 0 || now - times[times.length - 1] > RATE_LIMIT_WINDOW) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  return timestamps.length > limit;
}

// Sanitização e validação estrita do estado do jogo (prevenção de prototype pollution)
function sanitizeGameState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const safe = {};
  
  if (typeof raw.isProUnlocked === 'boolean') {
    safe.isProUnlocked = raw.isProUnlocked;
  }
  if (typeof raw.currentWorld === 'number' && Number.isInteger(raw.currentWorld) && raw.currentWorld >= 1 && raw.currentWorld <= 10) {
    safe.currentWorld = raw.currentWorld;
  }
  if (typeof raw.selectedSkin === 'string' && /^[a-zA-Z0-9_\-]{1,32}$/.test(raw.selectedSkin)) {
    safe.selectedSkin = raw.selectedSkin;
  }
  if (typeof raw.collectedStars === 'number' && Number.isInteger(raw.collectedStars) && raw.collectedStars >= 0 && raw.collectedStars <= 1000) {
    safe.collectedStars = raw.collectedStars;
  }
  if (Array.isArray(raw.wordsMastered)) {
    safe.wordsMastered = raw.wordsMastered
      .filter(w => typeof w === 'string' && w.trim().length > 0 && w.length <= 40)
      .map(w => w.trim().replace(/[<>\/]/g, '').slice(0, 40))
      .slice(0, 100);
  }
  // Fase 2: Gamificação e Métricas Seguras
  if (typeof raw.xp === 'number' && Number.isInteger(raw.xp) && raw.xp >= 0 && raw.xp <= 1000000) {
    safe.xp = raw.xp;
  }
  if (typeof raw.level === 'number' && Number.isInteger(raw.level) && raw.level >= 1 && raw.level <= 100) {
    safe.level = raw.level;
  }
  if (typeof raw.coins === 'number' && Number.isInteger(raw.coins) && raw.coins >= 0 && raw.coins <= 1000000) {
    safe.coins = raw.coins;
  }
  if (Array.isArray(raw.badges)) {
    safe.badges = raw.badges
      .filter(b => typeof b === 'string' && /^[a-zA-Z0-9_\-]{1,32}$/.test(b))
      .slice(0, 50);
  }
  if (raw.wordStats && typeof raw.wordStats === 'object' && !Array.isArray(raw.wordStats)) {
    safe.wordStats = {};
    for (const [key, val] of Object.entries(raw.wordStats)) {
      if (/^[a-zA-Z0-9_\- ]{1,32}$/.test(key) && val && typeof val === 'object') {
        safe.wordStats[key] = {
          attempts: Number.isInteger(val.attempts) && val.attempts >= 0 ? Math.min(val.attempts, 10000) : 0,
          correct: Number.isInteger(val.correct) && val.correct >= 0 ? Math.min(val.correct, 10000) : 0,
          wrong: Number.isInteger(val.wrong) && val.wrong >= 0 ? Math.min(val.wrong, 10000) : 0
        };
      }
    }
  }
  if (typeof raw.streak === 'number' && Number.isInteger(raw.streak) && raw.streak >= 0 && raw.streak <= 3650) {
    safe.streak = raw.streak;
  }
  if (typeof raw.lastActiveDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.lastActiveDate)) {
    safe.lastActiveDate = raw.lastActiveDate;
  }
  if (typeof raw.learningTimeSeconds === 'number' && Number.isInteger(raw.learningTimeSeconds) && raw.learningTimeSeconds >= 0) {
    safe.learningTimeSeconds = Math.min(raw.learningTimeSeconds, 10000000);
  }
  if (raw.dailyChallenge && typeof raw.dailyChallenge === 'object') {
    safe.dailyChallenge = {
      id: typeof raw.dailyChallenge.id === 'string' ? raw.dailyChallenge.id.slice(0, 32) : 'daily_1',
      title: typeof raw.dailyChallenge.title === 'string' ? raw.dailyChallenge.title.slice(0, 60) : 'Daily Challenge',
      targetCount: Number.isInteger(raw.dailyChallenge.targetCount) ? raw.dailyChallenge.targetCount : 3,
      progress: Number.isInteger(raw.dailyChallenge.progress) ? raw.dailyChallenge.progress : 0,
      completed: Boolean(raw.dailyChallenge.completed),
      rewardCoins: Number.isInteger(raw.dailyChallenge.rewardCoins) ? raw.dailyChallenge.rewardCoins : 25,
      rewardXp: Number.isInteger(raw.dailyChallenge.rewardXp) ? raw.dailyChallenge.rewardXp : 50
    };
  }
  return safe;
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = reqUrl.pathname;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // Cabeçalhos de Segurança (OWASP Standard)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Verificação de Rate Limit geral
  if (isRateLimited(clientIp, false)) {
    res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Muitas requisições. Aguarde um momento.', status: 429 }));
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
        const name = params.name || 'LUCIANO SANT ANNA';
        const city = params.city || 'FORTALEZA';
        const amount = params.amount || 19.90;
        const txId = params.txId || 'OBBYKIDS' + Math.floor(1000 + Math.random() * 9000);
        const kiwifyUrl = 'https://pay.kiwify.com.br/DHBiqnr';

        const payloadPix = generatePixPayload({ pixKey, name, city, amount, txId });
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payloadPix)}`;

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          amount: Number(amount).toFixed(2),
          pixKey,
          txId,
          beneficiary: name,
          kiwifyUrl,
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

  // 3. Persistência de Desbloqueio e Estado do Jogo do Usuário
  if (pathname === '/api/user/status' && req.method === 'GET') {
    const isUnlocked = globalUserUnlocked || (globalUserState && globalUserState.isProUnlocked) || false;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ unlocked: isUnlocked }));
    return;
  }

  if (pathname === '/api/user/unlock' && req.method === 'POST') {
    globalUserUnlocked = true;
    globalUserState.isProUnlocked = true;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, unlocked: true, message: 'Acesso Vitalício Ativado!' }));
    return;
  }

  if (pathname === '/api/user/state' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, state: globalUserState }));
    return;
  }

  if (pathname === '/api/user/state' && req.method === 'POST') {
    if (isRateLimited(clientIp, true)) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Muitas requisições. Aguarde um momento.', status: 429 }));
      return;
    }
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const sanitized = sanitizeGameState(parsed.state);
        if (sanitized) {
          globalUserState = { ...globalUserState, ...sanitized };
          if (globalUserState.isProUnlocked) {
            globalUserUnlocked = true;
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, state: globalUserState }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
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

  // 4. Resolução Universal e Resiliente de Arquivos Estáticos com Defesa Anti-Traversal
  const targetFile = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  let decodedTarget = targetFile;
  try {
    decodedTarget = decodeURIComponent(targetFile);
  } catch (e) {
    decodedTarget = targetFile;
  }

  if (decodedTarget.includes('..') || path.isAbsolute(decodedTarget)) {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Acesso negado: caminho inválido', path: pathname }));
    return;
  }

  const candidatePaths = [
    path.join(__dirname, 'public', decodedTarget),
    path.join(__dirname, decodedTarget),
    path.join(process.cwd(), 'public', decodedTarget),
    path.join(process.cwd(), decodedTarget)
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

module.exports = { server, generatePixPayload, sanitizeGameState, isRateLimited };
