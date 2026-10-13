// Verificação obrigatória (seção 3): extrai 1 quadro por segundo, lê o texto
// com OCR e procura e-mail, CPF/CNPJ, telefone, final de cartão e o nome "Ari".
// Se achar, borra a região (boxblur) no trecho e confere de novo.
//
// npm run verificar                     todos os vídeos de saida/
// npm run verificar -- saida/stories_1.mp4
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorker } from 'tesseract.js';
import { MASCARA, PASTAS, RAIZ } from '../config.mjs';
import { argumentos, ffmpeg, garantirPasta, salvarJson } from '../lib/util.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MODULOS = path.join(AQUI, '..', '..', 'node_modules', '@tesseract.js-data');

const PADROES = [
  ['e-mail', /\S+@\S+\.\S+/],
  ['CPF/CNPJ', /\d{3}\.?\d{3}\.?\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/],
  ['telefone', /(\+?55\s?)?\(?\d{2}\)?\s?9\s?\d{4}-?\d{4}/],
  ['cartão', /[•*·]{3,}\s?\d{4}/],
  ['nome', new RegExp(`\\b(${MASCARA.nomes.join('|')})\\b`, 'i')],
];
const PERMITIDOS = [MASCARA.email, MASCARA.documento, MASCARA.telefone, MASCARA.cartao, '•••• 1234', '1234'];

function ehPermitido(texto) {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  return PERMITIDOS.some((p) => limpo.includes(p)) || /0{3}\.?0{3}\.?0{3}-?0{2}/.test(limpo) || /\b00\s?0{4,5}-?0{4}\b/.test(limpo);
}

async function prepararTesseract() {
  const dir = garantirPasta(path.join(PASTAS.cache, 'tessdata'));
  for (const lang of ['por', 'eng']) {
    const destino = path.join(dir, `${lang}.traineddata.gz`);
    if (!fs.existsSync(destino)) fs.copyFileSync(path.join(MODULOS, lang, '4.0.0_best_int', `${lang}.traineddata.gz`), destino);
  }
  return createWorker('por+eng', 1, { langPath: dir, cachePath: dir, gzip: true });
}

async function procurar(worker, pasta) {
  const quadros = fs.readdirSync(pasta).filter((a) => a.endsWith('.png')).sort();
  const achados = [];
  for (const q of quadros) {
    const segundo = parseInt(q.match(/(\d+)/)[1], 10) - 1;
    const { data } = await worker.recognize(path.join(pasta, q), {}, { blocks: true });
    const linhas = (data.blocks || []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines));
    for (const l of linhas) {
      for (const [tipo, re] of PADROES) {
        const m = l.text.match(re);
        if (m && !ehPermitido(l.text)) {
          achados.push({ segundo, tipo, trecho: m[0], caixa: l.bbox });
        }
      }
    }
  }
  return achados;
}

function borrar(arquivo, achados) {
  // Cada achado vira um recorte borrado sobreposto de 0,6 s antes a 1,4 s depois.
  const filtros = [];
  let atual = '[0:v]';
  achados.forEach((a, i) => {
    const { x0, y0, x1, y1 } = a.caixa;
    const x = Math.max(0, x0 - 12);
    const y = Math.max(0, y0 - 12);
    const w = x1 - x0 + 24;
    const h = y1 - y0 + 24;
    const ini = Math.max(0, a.segundo - 0.6);
    const fim = a.segundo + 1.4;
    filtros.push(`[0:v]crop=${w}:${h}:${x}:${y},boxblur=18:3[b${i}]`);
    filtros.push(`${atual}[b${i}]overlay=${x}:${y}:enable='between(t,${ini},${fim})'[v${i}]`);
    atual = `[v${i}]`;
  });
  const tmp = `${arquivo}.borrado.mp4`;
  ffmpeg(['-i', arquivo, '-filter_complex', filtros.join(';'), '-map', atual, '-map', '0:a?', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', tmp]);
  fs.renameSync(tmp, arquivo);
}

export async function verificarVideo(arquivo, { tentativas = 2 } = {}) {
  const nome = path.basename(arquivo, '.mp4');
  const worker = await prepararTesseract();
  try {
    for (let rodada = 1; rodada <= tentativas + 1; rodada += 1) {
      const pasta = garantirPasta(path.join(PASTAS.verificacao, nome));
      for (const a of fs.readdirSync(pasta)) fs.unlinkSync(path.join(pasta, a));
      ffmpeg(['-i', arquivo, '-vf', 'fps=1', path.join(pasta, 'q_%04d.png')]);
      const total = fs.readdirSync(pasta).length;
      const achados = await procurar(worker, pasta);
      salvarJson(path.join(PASTAS.verificacao, `${nome}.json`), { arquivo: path.relative(RAIZ, arquivo), quadros: total, rodada, achados });
      if (!achados.length) {
        console.log(`  ✔ verificação de dados pessoais: ${total} quadros, nada encontrado`);
        return { ok: true, quadros: total };
      }
      console.log(`  ⚠ ${achados.length} possível(is) dado(s) pessoal(is): ${achados.map((a) => `${a.segundo}s ${a.tipo} "${a.trecho}"`).join('; ')}`);
      if (rodada > tentativas) return { ok: false, quadros: total, achados };
      borrar(arquivo, achados);
      console.log('    regiões borradas, verificando de novo…');
    }
  } finally {
    await worker.terminate();
  }
  return { ok: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = argumentos();
  const arquivos = args._.length ? args._ : fs.readdirSync(PASTAS.saida).filter((a) => a.endsWith('.mp4')).map((a) => path.join(PASTAS.saida, a));
  let falhou = false;
  for (const a of arquivos) {
    console.log(`▶ ${a}`);
    const r = await verificarVideo(path.resolve(a));
    if (!r.ok) falhou = true;
  }
  process.exit(falhou ? 1 : 0);
}
