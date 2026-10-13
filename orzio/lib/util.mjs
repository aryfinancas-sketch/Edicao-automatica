import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function garantirPasta(p) {
  fs.mkdirSync(p, { recursive: true });
  return p;
}

export function rodar(cmd, args, { silencioso = true } = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 256 });
  if (r.status !== 0) {
    const saida = (r.stderr || r.stdout || '').split('\n').slice(-25).join('\n');
    throw new Error(`${cmd} falhou (${r.status}):\n${saida}`);
  }
  if (!silencioso) process.stdout.write(r.stdout);
  return r.stdout;
}

export function ffmpeg(args) {
  return rodar('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
}

export function duracao(arquivo) {
  const s = rodar('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arquivo]);
  return parseFloat(s.trim());
}

// Abre um ffmpeg que recebe imagens JPEG pela entrada padrão e grava um MP4.
export function codificadorDeQuadros(saida, { fps = 30, largura, altura } = {}) {
  const filtro = largura ? [`-vf`, `scale=${largura}:${altura}:flags=lanczos,format=yuv420p`] : ['-pix_fmt', 'yuv420p'];
  const proc = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    ...filtro, '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-r', String(fps), saida,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const fim = new Promise((ok, erro) => proc.on('close', (c) => (c === 0 ? ok() : erro(new Error(`ffmpeg saiu com ${c} ao gerar ${saida}`)))));
  return {
    async escrever(buffer) {
      if (!proc.stdin.write(buffer)) await new Promise((r) => proc.stdin.once('drain', r));
    },
    async fechar() { proc.stdin.end(); await fim; },
  };
}

export function lerJson(arq, padrao = null) {
  try { return JSON.parse(fs.readFileSync(arq, 'utf8')); } catch { return padrao; }
}

export function salvarJson(arq, dados) {
  garantirPasta(path.dirname(arq));
  fs.writeFileSync(arq, JSON.stringify(dados, null, 2));
}

export const doisDigitos = (n) => String(n).padStart(2, '0');

export function argumentos(argv = process.argv.slice(2)) {
  const r = { _: [] };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) r[m[1]] = m[2] === undefined ? true : m[2];
    else r._.push(a);
  }
  return r;
}

export const suavizar = (t) => t * t * (3 - 2 * t);
export const suavizarForte = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
