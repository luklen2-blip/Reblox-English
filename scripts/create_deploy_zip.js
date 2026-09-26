// scripts/create_deploy_zip.js - Gera pacote .zip limpo na Área de Trabalho para deploy imediato em nuvem
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = path.resolve(__dirname, '..');
const desktopDir = path.join(process.env.USERPROFILE || 'C:\\Users\\luciano', 'Desktop');
const targetZip = path.join(desktopDir, 'Roblox-English-Obby-Deploy.zip');

console.log('📦 Gerando pacote de deploy instantâneo para Nuvem...');
console.log(`📂 Diretório de Origem: ${projectDir}`);
console.log(`🎯 Destino do ZIP: ${targetZip}`);

if (fs.existsSync(targetZip)) {
  fs.unlinkSync(targetZip);
  console.log('🧹 Arquivo zip anterior removido da Área de Trabalho.');
}

try {
  // PowerShell Compress-Archive excluindo pastas desnecessárias
  const tempDeployDir = path.join(projectDir, '..', 'roblox_deploy_temp');
  if (fs.existsSync(tempDeployDir)) {
    fs.rmSync(tempDeployDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDeployDir, { recursive: true });

  // Copia arquivos relevantes
  const filesToCopy = [
    'server.js',
    'package.json',
    'render.yaml',
    'Dockerfile',
    '.gitignore',
    '.dockerignore'
  ];

  for (const f of filesToCopy) {
    const src = path.join(projectDir, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(tempDeployDir, f));
    }
  }

  // Copia pastas
  const copyFolderRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyFolderRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyFolderRecursive(path.join(projectDir, 'public'), path.join(tempDeployDir, 'public'));
  copyFolderRecursive(path.join(projectDir, 'tests'), path.join(tempDeployDir, 'tests'));
  copyFolderRecursive(path.join(projectDir, 'scripts'), path.join(tempDeployDir, 'scripts'));

  // Executa Compress-Archive do PowerShell
  const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${tempDeployDir}\\*' -DestinationPath '${targetZip}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });

  // Limpa temp
  fs.rmSync(tempDeployDir, { recursive: true, force: true });

  const stats = fs.statSync(targetZip);
  console.log(`\n🎉 Pacote ZIP gerado com sucesso!`);
  console.log(`📊 Tamanho: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`📍 Localização: ${targetZip}\n`);
} catch (err) {
  console.error('❌ Erro ao criar arquivo ZIP:', err.message);
  process.exit(1);
}
