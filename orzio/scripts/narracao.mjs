// Narração das cenas.
//
// Caminho 1 (sem acesso à API): um ou mais MP3 gerados no site da ElevenLabs
// com todas as falas em ordem, separadas por pausas de ~2 s.
//   npm run narracao -- --arquivo=voz/narracao.mp3 [--arquivo2=voz/parte2.mp3]
// O script acha as pausas, corta uma fala por cena e grava em saida/narracao/.
//
// Caminho 2 (API liberada): gera cada fala com timestamps por caractere.
//   ELEVENLABS_API_KEY=... npm run narracao -- --api [--voz=<voice_id>]
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ELEVENLABS, PASTAS, RAIZ } from '../config.mjs';
import { VIDEOS, analisarFala, falasEmOrdem } from '../roteiros.mjs';
import { arquivosNarracao } from '../lib/plano.mjs';
import { argumentos, duracao, ffmpeg, garantirPasta, salvarJson } from '../lib/util.mjs';

const args = argumentos();
const falas = falasEmOrdem();

function detectarPausas(arquivo, ruido, minPausa) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', arquivo, '-af', `silencedetect=n=${ruido}dB:d=${minPausa}`, '-f', 'null', '-'], { encoding: 'utf8' });
  const inicios = [...r.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => parseFloat(m[1]));
  const fins = [...r.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => parseFloat(m[1]));
  return inicios.map((ini, i) => ({ ini, fim: fins[i] ?? Infinity }));
}

function segmentar(arquivo, esperado) {
  const total = duracao(arquivo);
  for (const minPausa of [1.2, 1.0, 1.5, 0.8, 1.8, 0.65]) {
    for (const ruido of [-40, -35, -45, -30, -50]) {
      const pausas = detectarPausas(arquivo, ruido, minPausa);
      const trechos = [];
      let cursor = 0;
      for (const p of pausas) {
        if (p.ini - cursor > 0.25) trechos.push({ ini: cursor, fim: p.ini });
        cursor = Math.min(p.fim, total);
      }
      if (total - cursor > 0.25) trechos.push({ ini: cursor, fim: total });
      if (trechos.length === esperado) return { trechos, ruido, minPausa };
    }
  }
  return null;
}

async function porArquivo() {
  const arquivos = Object.keys(args).filter((k) => k.startsWith('arquivo')).sort().map((k) => path.resolve(args[k]));
  if (!arquivos.length) throw new Error('Informe --arquivo=caminho.mp3');
  let fonte = arquivos[0];
  if (arquivos.length > 1) {
    fonte = path.join(garantirPasta(PASTAS.cache), 'narracao_unida.wav');
    const lista = path.join(PASTAS.cache, 'narracao_lista.txt');
    fs.writeFileSync(lista, arquivos.map((a) => `file '${a}'`).join('\n'));
    ffmpeg(['-f', 'concat', '-safe', '0', '-i', lista, '-ar', '44100', '-ac', '1', fonte]);
  }
  const r = segmentar(fonte, falas.length);
  if (!r) {
    const p = detectarPausas(fonte, -40, 1.0).length + 1;
    throw new Error(`Esperava ${falas.length} falas separadas por pausas, mas encontrei cerca de ${p}. Confira se o texto foi colado inteiro, com as pausas.`);
  }
  console.log(`${falas.length} falas encontradas (pausas ≥ ${r.minPausa}s, ${r.ruido} dB)`);
  const pad = 0.08;
  falas.forEach((f, i) => {
    const t = r.trechos[i];
    const ini = Math.max(0, t.ini - pad);
    const fim = t.fim + pad;
    const arq = arquivosNarracao(f.video, f.indice);
    garantirPasta(path.dirname(arq.audio));
    ffmpeg(['-i', fonte, '-ss', ini.toFixed(3), '-to', fim.toFixed(3), '-af', 'afade=t=in:d=0.03,areverse,afade=t=in:d=0.06,areverse', '-ar', '44100', '-b:a', '192k', arq.audio]);
    salvarJson(arq.json, { origem: 'arquivo', alinhamento: { inicio: t.ini - ini, fim: t.fim - ini } });
    const video = VIDEOS.find((v) => v.id === f.video);
    console.log(`  ${f.video} cena ${f.indice + 1}: ${(t.fim - t.ini).toFixed(1)} s — ${analisarFala(video.cenas[f.indice].fala).exibido.slice(0, 50)}…`);
  });
}

async function api(caminho, opcoes = {}) {
  const chave = process.env.ELEVENLABS_API_KEY;
  if (!chave) throw new Error('Defina ELEVENLABS_API_KEY nas configurações do ambiente.');
  const r = await fetch(`${ELEVENLABS.api}${caminho}`, { ...opcoes, headers: { 'xi-api-key': chave, ...(opcoes.headers || {}) } });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r;
}

async function escolherVoz() {
  if (args.voz) return args.voz;
  const { voices } = await (await api('/v1/voices')).json();
  const pontuar = (v) => {
    const l = v.labels || {};
    const texto = `${v.name} ${JSON.stringify(l)} ${v.description || ''}`.toLowerCase();
    return (l.gender === 'female' ? 4 : 0) + (/portug|brazil|brasil/.test(texto) ? 4 : 0)
      + (/advert|commercial|comercial|narrat|social/.test(texto) ? 2 : 0) + (v.category === 'premade' ? 1 : 0);
  };
  const melhor = voices.sort((a, b) => pontuar(b) - pontuar(a))[0];
  console.log(`Voz escolhida: ${melhor.name} (${melhor.voice_id})`);
  return melhor.voice_id;
}

async function porApi() {
  const voz = await escolherVoz();
  for (let i = 0; i < falas.length; i += 1) {
    const f = falas[i];
    const video = VIDEOS.find((v) => v.id === f.video);
    const { falado } = analisarFala(video.cenas[f.indice].fala);
    const arq = arquivosNarracao(f.video, f.indice);
    if (fs.existsSync(arq.audio) && !args.refazer) continue;
    const vizinha = (k) => { const g = falas[k]; if (!g) return undefined; const vv = VIDEOS.find((v) => v.id === g.video); return analisarFala(vv.cenas[g.indice].fala).falado; };
    const r = await api(`/v1/text-to-speech/${voz}/with-timestamps?output_format=${ELEVENLABS.formatoAudio}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: falado, model_id: ELEVENLABS.modelo, voice_settings: ELEVENLABS.ajustes,
        previous_text: f.video === falas[i - 1]?.video ? vizinha(i - 1) : undefined,
        next_text: f.video === falas[i + 1]?.video ? vizinha(i + 1) : undefined,
      }),
    });
    const dados = await r.json();
    garantirPasta(path.dirname(arq.audio));
    fs.writeFileSync(arq.audio, Buffer.from(dados.audio_base64, 'base64'));
    const al = dados.alignment;
    salvarJson(arq.json, {
      origem: 'api', voz,
      alinhamento: {
        caracteres: al.characters, inicios: al.character_start_times_seconds, fins: al.character_end_times_seconds,
        inicio: al.character_start_times_seconds[0], fim: al.character_end_times_seconds.at(-1),
      },
    });
    console.log(`  ✓ ${f.video} cena ${f.indice + 1}`);
  }
}

if (args.api) await porApi();
else await porArquivo();
console.log(`Narração salva em ${path.relative(RAIZ, PASTAS.narracao)}/`);
