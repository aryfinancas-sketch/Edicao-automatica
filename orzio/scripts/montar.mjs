// Monta os vídeos: cenas (prints com câmera + gráficos), narração, títulos,
// legendas e exportação em H.264 + AAC 30 fps.
//
// npm run montar                      todos os vídeos (exige narração e aprovação)
// npm run montar -- --video=reels_1_whatsapp --formato=vertical
// npm run montar -- --rascunho        sem narração: tempos estimados, sem áudio,
//                                     vai para saida/rascunhos/ (para aprovar o visual)
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { ARQ_APROVACAO, FORMATOS, FPS, PASTAS, RAIZ } from '../config.mjs';
import { VIDEOS } from '../roteiros.mjs';
import { renderizarGrafico } from '../lib/graficos.mjs';
import { gerarLegendas } from '../lib/legendas.mjs';
import { QUADROS_FUSAO, planejar } from '../lib/plano.mjs';
import { argumentos, duracao, ffmpeg, garantirPasta, salvarJson } from '../lib/util.mjs';
import { verificarVideo } from './verificar.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CAMERA = path.join(AQUI, '..', 'lib', 'camera.py');

const CAIXA = {
  vertical: { caixa: [40, 310, 1000, 1080], moldura: true },
  horizontal: { caixa: [0, 0, 1920, 1080], moldura: false },
};

function hash(obj) {
  return crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex').slice(0, 12);
}

function rodarPython(spec) {
  return new Promise((ok, erro) => {
    const p = spawn('python3', [CAMERA, spec], { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('close', (c) => (c === 0 ? ok() : erro(new Error(`camera.py falhou (${spec})`))));
  });
}

async function emParalelo(tarefas, limite) {
  const fila = [...tarefas];
  const trabalhadores = Array.from({ length: limite }, async () => {
    while (fila.length) await fila.shift()();
  });
  await Promise.all(trabalhadores);
}

function specCamera(parte, formato, saida) {
  const lado = formato === 'vertical' ? 2 : 3;
  const escolher = (p, chave) => {
    const especifico = formato === 'vertical' ? p.v : p.h;
    const ponto = (especifico && especifico[chave]) || p[chave] || p.de;
    return [ponto[0], ponto[1], ponto[lado]];
  };
  return {
    saida,
    fps: FPS,
    canvas: [FORMATOS[formato].largura, FORMATOS[formato].altura],
    ...CAIXA[formato],
    raio: 28,
    fusao: QUADROS_FUSAO,
    quadros: parte.quadros,
    planos: parte.planosPlanejados.map((p) => ({
      imagem: path.join(RAIZ, p.imagem),
      quadros: p.quadros,
      de: escolher(p, 'de'),
      para: escolher(p, 'para'),
      destaque: p.destaque || null,
      toque: p.toque || null,
      toque_janela: p.toque_janela || undefined,
    })),
  };
}

async function montarVideo(video, formato, { rascunho, verificar }) {
  const plano = planejar(video, formato, { rascunho });
  const nome = video.arquivo(formato);
  const pastaClipes = garantirPasta(path.join(PASTAS.clipes, `${video.id}_${formato}`));
  console.log(`\n▶ ${nome}: ${plano.cenas.length} cenas, ${plano.dur.toFixed(1)} s${rascunho ? ' (rascunho)' : ''}`);

  // 1) Clipes de cada parte (com cache pelo conteúdo da especificação).
  const clipes = [];
  const tarefasTela = [];
  const graficos = [];
  for (const cena of plano.cenas) {
    for (const parte of cena.partes) {
      if (parte.tipo === 'tela') {
        const chave = hash({ v: 2, formato, quadros: parte.quadros, planos: parte.planosPlanejados });
        const saida = path.join(pastaClipes, `${parte.id}_${chave}.mp4`);
        clipes.push(saida);
        if (!fs.existsSync(saida)) {
          const arqSpec = saida.replace(/\.mp4$/, '.json');
          salvarJson(arqSpec, specCamera(parte, formato, `${saida}.tmp.mp4`));
          tarefasTela.push(async () => {
            await rodarPython(arqSpec);
            fs.renameSync(`${saida}.tmp.mp4`, saida);
            console.log(`  ✓ ${parte.id} (prints)`);
          });
        }
      } else {
        const chave = hash({ v: 3, formato, quadros: parte.quadros, modelo: parte.modelo, opcoes: parte.opcoes, g: fs.statSync(path.join(AQUI, '..', 'lib', 'graficos.mjs')).mtimeMs });
        const saida = path.join(pastaClipes, `${parte.id}_${chave}.mp4`);
        clipes.push(saida);
        if (!fs.existsSync(saida)) graficos.push({ parte, saida });
      }
    }
  }
  const paralelo = emParalelo(tarefasTela, 3);
  if (graficos.length) {
    const navegador = await chromium.launch();
    for (const { parte, saida } of graficos) {
      await renderizarGrafico(navegador, { modelo: parte.modelo, opcoes: parte.opcoes, formato, quadros: parte.quadros, saida: `${saida}.tmp.mp4` });
      fs.renameSync(`${saida}.tmp.mp4`, saida);
      console.log(`  ✓ ${parte.id} (${parte.modelo})`);
    }
    await navegador.close();
  }
  await paralelo;

  // 2) Junta os clipes.
  const tmp = garantirPasta(path.join(PASTAS.cache, 'montagem'));
  const lista = path.join(tmp, `${video.id}_${formato}.txt`);
  fs.writeFileSync(lista, clipes.map((c) => `file '${c}'`).join('\n'));
  const semAudio = path.join(tmp, `${video.id}_${formato}_video.mp4`);
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', semAudio]);

  // 3) Áudio: cada fala no início da sua cena; trilha opcional a -20 dB.
  const audio = path.join(tmp, `${video.id}_${formato}_audio.wav`);
  const falas = plano.cenas.filter((c) => c.audio);
  // Trilha: trilha/vsl.* na VSL, trilha/curtos.* nos demais; senão, qualquer arquivo de áudio da pasta.
  const audios = fs.existsSync(PASTAS.trilha) ? fs.readdirSync(PASTAS.trilha).filter((a) => /^[^.].*\.(mp3|wav|m4a|aac|ogg)$/i.test(a)).sort() : [];
  const preferida = video.id.startsWith('vsl') ? 'vsl' : 'curtos';
  const trilhas = audios.filter((a) => a.startsWith(`${preferida}.`)).concat(audios.filter((a) => !a.startsWith(`${preferida}.`)));
  const D = plano.dur.toFixed(3);
  const entradas = [];
  const filtros = [];
  falas.forEach((c, i) => {
    entradas.push('-i', c.audio);
    filtros.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(c.inicioFala * 1000)}:all=1[f${i}]`);
  });
  const iBase = falas.length;
  entradas.push('-f', 'lavfi', '-t', D, '-i', 'anullsrc=r=48000:cl=stereo');
  const mix = ['[base]', ...falas.map((_, i) => `[f${i}]`)].join('');
  filtros.push(`[${iBase}:a]aformat=channel_layouts=stereo[base]`);
  filtros.push(`${mix}amix=inputs=${falas.length + 1}:normalize=0:duration=first${falas.length ? ',loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000' : ''}[voz]`);
  let saidaAudio = '[voz]';
  if (trilhas.length) {
    entradas.push('-stream_loop', '-1', '-i', path.join(PASTAS.trilha, trilhas[0]));
    filtros.push(`[${iBase + 1}:a]aresample=48000,aformat=channel_layouts=stereo,volume=-20dB,atrim=0:${D},afade=t=out:st=${Math.max(0, plano.dur - 1.5).toFixed(3)}:d=1.5[trilha]`);
    filtros.push('[voz][trilha]amix=inputs=2:normalize=0:duration=first[saida]');
    saidaAudio = '[saida]';
  }
  ffmpeg([...entradas, '-filter_complex', filtros.join(';'), '-map', saidaAudio, '-ar', '48000', '-t', D, audio]);

  // 4) Títulos + legendas, exportação final.
  const { ass, srt } = gerarLegendas(plano);
  const arqAss = path.join(tmp, `${video.id}_${formato}.ass`);
  fs.writeFileSync(arqAss, ass);
  const pastaSaida = garantirPasta(rascunho ? path.join(PASTAS.saida, 'rascunhos') : PASTAS.saida);
  const final = path.join(pastaSaida, nome);
  garantirPasta(PASTAS.legendas);
  if (!rascunho) fs.writeFileSync(path.join(PASTAS.legendas, nome.replace(/\.mp4$/, '.srt')), srt);
  const escapar = (p) => p.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
  ffmpeg([
    '-i', semAudio, '-i', audio,
    '-vf', `ass='${escapar(arqAss)}':fontsdir='${escapar(PASTAS.fontes)}'`,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-movflags', '+faststart', '-t', plano.dur.toFixed(3), final,
  ]);
  console.log(`  ✔ ${path.relative(RAIZ, final)} (${duracao(final).toFixed(1)} s)`);

  if (verificar) await verificarVideo(final);
  return final;
}

const args = argumentos();
const rascunho = !!args.rascunho;
if (!rascunho && !fs.existsSync(ARQ_APROVACAO) && !args.aprovado) {
  console.error('As telas ainda não foram aprovadas. Gere o rascunho (--rascunho), aprove e rode "npm run aprovar".');
  process.exit(1);
}
const videos = args.video && args.video !== 'todos' ? VIDEOS.filter((v) => v.id === args.video) : VIDEOS;
if (!videos.length) throw new Error(`Vídeo desconhecido: ${args.video}`);
for (const v of videos) {
  for (const formato of v.formatos) {
    if (args.formato && args.formato !== formato) continue;
    await montarVideo(v, formato, { rascunho, verificar: !rascunho && !args['sem-verificar'] });
  }
}
