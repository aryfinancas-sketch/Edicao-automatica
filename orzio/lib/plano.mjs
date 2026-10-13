// Calcula a duração de cada cena e parte a partir da narração.
// A voz manda: a cena dura o áudio + folgas; as partes dividem esse tempo por peso.
import fs from 'node:fs';
import path from 'node:path';
import {
  CPS_ESTIMADO, DURACAO_MIN_CARTAO_FINAL, FOLGA_FIM, FOLGA_INICIO, FPS, PASTAS,
} from '../config.mjs';
import { analisarFala } from '../roteiros.mjs';
import { doisDigitos, duracao, lerJson } from './util.mjs';

export const QUADROS_FUSAO = 8; // fusão entre planos de câmera

export function arquivosNarracao(videoId, indice) {
  const base = path.join(PASTAS.narracao, videoId, `cena_${doisDigitos(indice + 1)}`);
  return { audio: `${base}.mp3`, json: `${base}.json` };
}

const ehFinal = (p) => p.tipo === 'grafico' && p.modelo === 'final';

// Distribui "total" quadros pelos pesos, respeitando mínimos.
export function dividir(total, pesos, minimos = []) {
  const n = pesos.length;
  const r = new Array(n).fill(0);
  let restante = total;
  let livres = [...Array(n).keys()];
  const somaPesos = pesos.reduce((a, b) => a + b, 0) || 1;
  for (const i of [...livres]) {
    if (minimos[i] && total * pesos[i] / somaPesos < minimos[i]) {
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

// Quadros de cada plano de câmera. Todos menos o último ganham a sobreposição
// da fusão, para a parte manter a duração exata.
export function planejarPlanos(planos, quadros) {
  const q = dividir(quadros, planos.map((p) => p.peso || 1), planos.map(() => 12));
  return planos.map((p, i) => ({ ...p, quadros: q[i] + (i < planos.length - 1 ? QUADROS_FUSAO : 0) }));
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
        throw new Error(`Falta a narração de ${video.id} cena ${i + 1} (${arq.audio}).`);
      }
    }
    const temFinal = cena.visual.some(ehFinal);
    const ultima = i === video.cenas.length - 1;
    // "respiro": segundos extras de imagem depois da fala (com a trilha por baixo).
    let dur = (cena.fala ? FOLGA_INICIO + falaDur + FOLGA_FIM : DURACAO_MIN_CARTAO_FINAL) + (cena.respiro || 0);
    if (temFinal && cena.visual.length > 1) dur = Math.max(dur, DURACAO_MIN_CARTAO_FINAL + 1.5);
    if (temFinal) dur = Math.max(dur, DURACAO_MIN_CARTAO_FINAL);
    if (ultima) dur += 0.6;
    const quadros = Math.round(dur * FPS);
    const minFinal = Math.round(DURACAO_MIN_CARTAO_FINAL * FPS);
    const qPartes = dividir(
      quadros,
      cena.visual.map((p) => p.peso || 1),
      cena.visual.map((p) => (ehFinal(p) && cena.visual.length > 1 ? minFinal : 0)),
    );
    let inicioParte = inicio;
    const partes = cena.visual.map((p, k) => {
      const parte = { ...p, id: `c${doisDigitos(i + 1)}_p${k + 1}`, quadros: qPartes[k], inicio: inicioParte, dur: qPartes[k] / FPS };
      if (p.tipo === 'tela') parte.planosPlanejados = planejarPlanos(p.planos, qPartes[k]);
      inicioParte += parte.dur;
      return parte;
    });
    const r = {
      indice: i, inicio, dur: quadros / FPS, quadros, fala, falaDur, audio, alinhamento,
      inicioFala: inicio + FOLGA_INICIO,
      titulo: cena.titulo,
      // O título some quando entra o cartão final (ele já traz a chamada).
      fimTitulo: temFinal && cena.visual.length > 1 ? partes.find(ehFinal).inicio : inicio + quadros / FPS,
      espacoCentro: !!cena.espacoCentro,
      espacoInferior: !!cena.espacoInferior,
      partes,
    };
    inicio += r.dur;
    return r;
  });
  return { video, formato, cenas, dur: inicio, rascunho };
}
