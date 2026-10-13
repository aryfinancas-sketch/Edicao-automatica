// Calcula a duração de cada cena, parte e passo a partir da narração.
// A voz manda: a cena dura o áudio + folgas; as partes dividem esse tempo por peso.
import fs from 'node:fs';
import path from 'node:path';
import {
  CPS_ESTIMADO, DURACAO_MIN_CARTAO_FINAL, FOLGA_FIM, FOLGA_INICIO, FPS, PASTAS,
} from '../config.mjs';
import { analisarFala } from '../roteiros.mjs';
import { doisDigitos, duracao, lerJson } from './util.mjs';

export const QUADROS_TRANSICAO = 8; // fusão curta depois de um clique

export function arquivosNarracao(videoId, indice) {
  const base = path.join(PASTAS.narracao, videoId, `cena_${doisDigitos(indice + 1)}`);
  return { audio: `${base}.mp3`, json: `${base}.json` };
}

const ehFinal = (p) => p.tipo === 'grafico' && p.modelo === 'final';

function dividir(total, pesos, minimos) {
  // Distribui "total" quadros pelos pesos, respeitando mínimos.
  const n = pesos.length;
  const r = new Array(n).fill(0);
  let restante = total;
  let livres = [...Array(n).keys()];
  for (const i of [...livres]) {
    if (minimos[i] && total * pesos[i] / pesos.reduce((a, b) => a + b, 0) < minimos[i]) {
      r[i] = minimos[i];
      restante -= minimos[i];
      livres = livres.filter((x) => x !== i);
    }
  }
  const soma = livres.reduce((a, i) => a + pesos[i], 0) || 1;
  let acumulado = 0;
  livres.forEach((i, k) => {
    r[i] = k === livres.length - 1 ? restante - acumulado : Math.round(restante * pesos[i] / soma);
    acumulado += r[i];
  });
  return r;
}

export function passosGravados(parte, formato) {
  return parte.passos.filter((p) => p.acao !== 'limpar' && (!p.apenas || p.apenas === formato));
}

export function planejarPassos(parte, formato, quadros) {
  const passos = passosGravados(parte, formato);
  const q = dividir(quadros, passos.map((p) => p.peso || 0.3), passos.map(() => 6));
  // Depois de um clique, o passo seguinte começa com uma fusão: ganha os
  // quadros da sobreposição para a parte manter a duração exata.
  return passos.map((p, i) => {
    const depoisDeClique = i > 0 && ['clicar', 'abrirMenu'].includes(passos[i - 1].acao);
    return { ...p, quadros: q[i] + (depoisDeClique ? QUADROS_TRANSICAO : 0), transicao: depoisDeClique ? 'fusao' : 'corte' };
  });
}

export function planejar(video, formato, { rascunho = false } = {}) {
  let inicio = 0;
  const cenas = video.cenas.map((cena, i) => {
    const fala = analisarFala(cena.fala || '');
    const arq = arquivosNarracao(video.id, i);
    let falaDur = 0;
    let alinhamento = null;
    let audio = null;
    if (cena.fala) {
      if (fs.existsSync(arq.audio)) {
        audio = arq.audio;
        falaDur = duracao(arq.audio);
        alinhamento = lerJson(arq.json)?.alinhamento || null;
      } else if (rascunho) {
        falaDur = fala.falado.length / CPS_ESTIMADO;
      } else {
        throw new Error(`Falta a narração de ${video.id} cena ${i + 1}. Rode "npm run narracao".`);
      }
    }
    const temFinal = cena.visual.some(ehFinal);
    const ultima = i === video.cenas.length - 1;
    let dur = cena.fala ? FOLGA_INICIO + falaDur + FOLGA_FIM : DURACAO_MIN_CARTAO_FINAL;
    if (temFinal && cena.visual.length > 1) dur = Math.max(dur, DURACAO_MIN_CARTAO_FINAL + 1.2);
    if (temFinal) dur = Math.max(dur, DURACAO_MIN_CARTAO_FINAL);
    if (ultima) dur += 0.6;
    const quadros = Math.round(dur * FPS);
    const qPartes = dividir(
      quadros,
      cena.visual.map((p) => p.peso || 1),
      cena.visual.map((p) => (ehFinal(p) && cena.visual.length > 1 ? Math.round(DURACAO_MIN_CARTAO_FINAL * FPS) : 0)),
    );
    let inicioParte = inicio;
    const partes = cena.visual.map((p, k) => {
      const parte = {
        ...p,
        id: `c${doisDigitos(i + 1)}_p${k + 1}`,
        quadros: qPartes[k],
        inicio: inicioParte,
        dur: qPartes[k] / FPS,
      };
      if (p.passos) parte.passosPlanejados = planejarPassos(p, formato, qPartes[k]);
      inicioParte += parte.dur;
      return parte;
    });
    const r = {
      indice: i,
      inicio,
      dur: quadros / FPS,
      quadros,
      fala,
      falaDur,
      audio,
      alinhamento,
      inicioFala: inicio + FOLGA_INICIO,
      titulo: cena.titulo,
      espacoCentro: !!cena.espacoCentro,
      espacoInferior: !!cena.espacoInferior,
      partes,
    };
    inicio += r.dur;
    return r;
  });
  return { video, formato, cenas, dur: inicio, rascunho };
}
