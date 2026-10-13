// Títulos ("Texto na tela") e legendas em ASS (queimados no vídeo) e SRT.
import { FORMATOS } from '../config.mjs';

const LAYOUT = {
  vertical: {
    titulo: { tam: 72, margemV: 118, porLinha: 20 },
    legenda: { tam: 58, margemV: 330, porLinha: 24 },
  },
  horizontal: {
    titulo: { tam: 64, margemV: 42, porLinha: 38 },
    legenda: { tam: 50, margemV: 58, porLinha: 42 },
  },
};

const VERDE_ASS = '&H0081B910&'; // #10B981 em BGR
const BRANCO_ASS = '&H00FFFFFF&';

function tempoAss(s) {
  const t = Math.max(0, s);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const seg = (t % 60).toFixed(2).padStart(5, '0');
  return `${h}:${String(m).padStart(2, '0')}:${seg}`;
}

function tempoSrt(s) {
  const ms = Math.round(Math.max(0, s) * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const seg = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')},${String(r).padStart(3, '0')}`;
}

// Quebra em linhas de até "max" caracteres sem cortar palavras.
export function quebrarLinhas(texto, max) {
  const linhas = [];
  let atual = '';
  for (const p of texto.split(/\s+/).filter(Boolean)) {
    const visivel = (s) => s.replace(/\*/g, '');
    if (atual && visivel(`${atual} ${p}`).length > max) { linhas.push(atual); atual = p; } else atual = atual ? `${atual} ${p}` : p;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

// Títulos longos diminuem a fonte para caber em no máximo 2 linhas.
function tituloAss(titulo, max, tam) {
  let linhas = quebrarLinhas(titulo, max);
  let prefixo = '';
  for (const fator of [0.85, 0.72, 0.62]) {
    if (linhas.length <= 2) break;
    linhas = quebrarLinhas(titulo, Math.floor(max / fator));
    prefixo = `{\\fs${Math.round(tam * fator)}}`;
  }
  return prefixo + linhas.join('\\N')
    .replace(/\*([^*]+)\*/g, `{\\c${VERDE_ASS}}$1{\\c${BRANCO_ASS}}`);
}

// Tempo de cada palavra exibida. Com alinhamento por caractere (API da
// ElevenLabs) usa os tempos reais; sem ele, distribui pela duração da fala
// proporcionalmente ao tamanho do texto falado.
export function temposDasPalavras(cena) {
  const { tokens } = cena.fala;
  const al = cena.alinhamento;
  const inicioFala = al?.inicio ?? 0;
  const fimFala = al?.fim ?? cena.falaDur;
  const totalFalado = tokens.reduce((a, t) => a + t.falado.length, 0) || 1;
  const porCaractere = al?.caracteres ? al : null;
  const palavras = [];
  let pos = 0;
  for (const tk of tokens) {
    const ini = pos;
    const fim = pos + tk.falado.length;
    pos = fim;
    const tIni = porCaractere ? porCaractere.inicios[Math.min(ini, porCaractere.inicios.length - 1)]
      : inicioFala + (fimFala - inicioFala) * ini / totalFalado;
    const tFim = porCaractere ? porCaractere.fins[Math.min(fim - 1, porCaractere.fins.length - 1)]
      : inicioFala + (fimFala - inicioFala) * fim / totalFalado;
    const ws = tk.exibido.split(/\s+/).filter(Boolean);
    const tamanhos = ws.map((w) => w.length + 1);
    const soma = tamanhos.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    ws.forEach((w, i) => {
      const a = tIni + (tFim - tIni) * acc / soma;
      acc += tamanhos[i];
      palavras.push({ texto: w, inicio: a, fim: tIni + (tFim - tIni) * acc / soma });
    });
  }
  return palavras;
}

// Agrupa palavras em blocos de no máximo 2 linhas, quebrando em fim de frase.
export function blocosDeLegenda(palavras, porLinha) {
  const blocos = [];
  let atual = [];
  const caberia = (lista) => quebrarLinhas(lista.map((p) => p.texto).join(' '), porLinha).length <= 2;
  for (const p of palavras) {
    if (atual.length && !caberia([...atual, p])) { blocos.push(atual); atual = []; }
    atual.push(p);
    if (/[.?!:]$/.test(p.texto) && atual.length >= 3) { blocos.push(atual); atual = []; }
  }
  if (atual.length) blocos.push(atual);
  return blocos;
}

export function gerarLegendas(plano) {
  const { formato } = plano;
  const f = FORMATOS[formato];
  const L = LAYOUT[formato];
  const eventos = [];
  const srt = [];

  for (const cena of plano.cenas) {
    if (cena.titulo) {
      const ini = cena.inicio + 0.05;
      const fim = Math.max(ini + 0.5, cena.fimTitulo - 0.06);
      if (formato === 'horizontal') {
        eventos.push(`Dialogue: 0,${tempoAss(ini)},${tempoAss(fim)},Faixa,,0,0,0,,{\\fad(200,150)\\an7\\pos(0,0)\\bord0\\shad0\\1c&H000000&\\1a&H50&\\blur30\\p1}m 0 0 l ${f.largura} 0 ${f.largura} 230 0 230{\\p0}`);
      }
      eventos.push(`Dialogue: 1,${tempoAss(ini)},${tempoAss(fim)},Titulo,,0,0,0,,{\\fad(220,160)\\fscx92\\fscy92\\t(0,280,\\fscx100\\fscy100)}${tituloAss(cena.titulo, L.titulo.porLinha, L.titulo.tam)}`);
    }
    if (!cena.fala.exibido) continue;
    const palavras = temposDasPalavras(cena);
    const blocos = blocosDeLegenda(palavras, L.legenda.porLinha);
    const estilo = cena.espacoInferior ? 'LegendaAlta' : 'Legenda';
    blocos.forEach((b, i) => {
      const ini = cena.inicioFala + b[0].inicio;
      const prox = blocos[i + 1] ? cena.inicioFala + blocos[i + 1][0].inicio : cena.inicioFala + b[b.length - 1].fim + 0.35;
      const fim = Math.min(prox, cena.inicio + cena.dur - 0.02);
      const texto = quebrarLinhas(b.map((p) => p.texto).join(' '), L.legenda.porLinha);
      eventos.push(`Dialogue: 2,${tempoAss(ini)},${tempoAss(fim)},${estilo},,0,0,0,,${texto.join('\\N')}`);
      srt.push(`${srt.length + 1}\n${tempoSrt(ini)} --> ${tempoSrt(fim)}\n${texto.join('\n')}\n`);
    });
  }

  const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: ${f.largura}
PlayResY: ${f.altura}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Titulo,Inter Black,${L.titulo.tam},&H00FFFFFF,&H00FFFFFF,&H00070B0A,&H96000000,0,0,0,0,100,100,-1,0,1,3,3,8,50,50,${L.titulo.margemV},1
Style: Legenda,Inter ExtraBold,${L.legenda.tam},&H00FFFFFF,&H00FFFFFF,&H00070B0A,&H00000000,0,0,0,0,100,100,0,0,1,5,0,2,60,60,${L.legenda.margemV},1
Style: LegendaAlta,Inter ExtraBold,${L.legenda.tam},&H00FFFFFF,&H00FFFFFF,&H00070B0A,&H00000000,0,0,0,0,100,100,0,0,1,5,0,2,60,60,${formato === 'vertical' ? 640 : L.legenda.margemV},1
Style: Faixa,Inter,10,&H00000000,&H00000000,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${eventos.join('\n')}
`;
  return { ass, srt: srt.join('\n') };
}
