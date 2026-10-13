// Mockups e motion graphics em HTML/CSS, renderizados quadro a quadro.
// O tempo é controlado: em cada quadro todas as animações CSS são pausadas e
// posicionadas em t, então o resultado é idêntico em qualquer máquina.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { FPS, PASTAS, RAIZ } from '../config.mjs';
import { codificadorDeQuadros, garantirPasta } from './util.mjs';

export const ARQ_LOGO_SVG = path.join(RAIZ, 'telas', '04_logo', 'logo_orzio.svg');

const CANVAS = {
  vertical: { w: 540, h: 960 },
  horizontal: { w: 960, h: 540 },
};

function fontes() {
  const f = (peso, arq) => `@font-face{font-family:Inter;font-weight:${peso};src:url("${pathToFileURL(path.join(PASTAS.fontes, arq)).href}")}`;
  return [f(400, 'Inter-Regular.otf'), f(600, 'Inter-SemiBold.otf'), f(700, 'Inter-Bold.otf'), f(800, 'Inter-ExtraBold.otf'), f(900, 'Inter-Black.otf')].join('\n');
}

function logoHtml(tamanho) {
  if (fs.existsSync(ARQ_LOGO_SVG)) return `<img class="logo" src="${pathToFileURL(ARQ_LOGO_SVG).href}" style="width:${tamanho}px;height:${tamanho}px">`;
  return `<div class="logo" style="width:${tamanho}px;height:${tamanho}px;border-radius:24%;background:linear-gradient(135deg,#2563eb,#22c55e)"></div>`;
}

const marca = (tam) => `<div class="marca" style="font-size:${tam}px">ORZI<span>O</span></div>`;

const BASE_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: var(--w); height: var(--h); overflow: hidden; }
body { font-family: Inter, sans-serif; color: #fff; background: #050807; position: relative; }
.fundo { position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 55% at 50% 0%, rgba(6,78,59,.55), transparent 70%),
              radial-gradient(ellipse 60% 40% at 50% 100%, rgba(37,99,235,.12), transparent 70%), #050807; }
.grade { position: absolute; inset: 0; opacity: .07;
  background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
  background-size: 40px 40px; }
.marca { font-weight: 800; letter-spacing: .32em; color: #fff; }
.marca span { color: #10b981; }
@keyframes surgir { from { opacity: 0; transform: translateY(14px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes aparecer { from { opacity: 0; } to { opacity: 1; } }
@keyframes sumir { from { opacity: 1; } to { opacity: 0; } }
@keyframes pulsar { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes pontinho { 0%,80%,100% { transform: translateY(0); opacity: .45; } 40% { transform: translateY(-4px); opacity: 1; } }
@keyframes onda { from { transform: scale(.6); opacity: .8; } to { transform: scale(2.4); opacity: 0; } }
@keyframes barra { 0%,100% { transform: scaleY(.35); } 50% { transform: scaleY(1); } }
@keyframes pop { 0% { opacity: 0; transform: scale(.4); } 70% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
@keyframes cair { from { transform: none; opacity: 1; } to { transform: translateY(160px) rotate(14deg); opacity: 0; } }
@keyframes rolarCima { from { transform: translateY(0); } to { transform: translateY(-50%); } }
.anim { animation-fill-mode: both !important; }
`;

// Uma animação que começa em t segundos.
const an = (nome, dur, t, extra = '') => `${nome} ${dur}s cubic-bezier(.2,.8,.2,1) ${t.toFixed(3)}s both${extra ? ` ${extra}` : ''}`;

// ---------------------------------------------------------------------------
// WhatsApp (visual da página "Assistente WhatsApp" do app)

const ICONE_CAMERA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#cbd5e1" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>';
const ICONE_MIC = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2.2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/></svg>';
const ICONE_PLAY = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 4l13 8-13 8z" fill="#fff"/></svg>';
const CHECKS = '<svg viewBox="0 0 18 12" width="16" height="11"><path d="M1 6l3.5 3.5L11 2M7 9.5l1 1L16 2" fill="none" stroke="#7dd3fc" stroke-width="1.8"/></svg>';

function ondas(n, semente = 3) {
  let s = semente;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: n }, () => `<i style="height:${(4 + r() * 18).toFixed(0)}px"></i>`).join('');
}

const CSS_WHATS = `
.tel { position: absolute; border-radius: 34px; background: #0b0b0b; border: 7px solid #1c1f1e;
  box-shadow: 0 0 0 1px #2a2f2d, 0 30px 80px rgba(0,0,0,.6), 0 0 80px rgba(16,185,129,.18); overflow: hidden; }
.cab { height: 62px; background: linear-gradient(180deg,#0f766e,#0d6b62); display: flex; align-items: center; gap: 10px; padding: 0 14px; }
.cab .logo { border-radius: 50%; background: #0b0b0b; padding: 3px; }
.cab b { font-size: 15px; font-weight: 700; display: block; }
.cab small { font-size: 11px; color: #c7f0e4; }
.cab .selo { margin-left: auto; font-size: 10px; background: rgba(16,185,129,.35); color: #d1fae5; padding: 3px 8px; border-radius: 99px; font-weight: 600; }
.chat { position: absolute; top: 62px; bottom: 64px; left: 0; right: 0; padding: 14px 12px; display: flex; flex-direction: column; justify-content: flex-end; gap: 10px;
  background: #141414; overflow: hidden; }
.msg { max-width: 82%; padding: 9px 12px 7px; border-radius: 14px; font-size: 14px; line-height: 1.38; position: relative; }
.bot { background: #262626; align-self: flex-start; border-top-left-radius: 4px; }
.eu { background: #22c55e; color: #fff; align-self: flex-end; border-top-right-radius: 4px; font-weight: 600; }
.hora { display: flex; justify-content: flex-end; align-items: center; gap: 3px; font-size: 10px; opacity: .75; margin-top: 3px; font-weight: 400; }
.audio { display: flex; align-items: center; gap: 8px; min-width: 190px; }
.audio .play { width: 30px; height: 30px; border-radius: 50%; background: rgba(0,0,0,.22); display: grid; place-items: center; flex: none; }
.audio .ondas { display: flex; align-items: center; gap: 2px; height: 24px; flex: 1; }
.audio .ondas i { width: 3px; border-radius: 2px; background: rgba(255,255,255,.85); display: block; }
.audio .dur { font-size: 11px; font-weight: 600; }
.transc { font-size: 12.5px; font-style: italic; font-weight: 500; opacity: .95; margin-top: 5px; border-top: 1px solid rgba(255,255,255,.25); padding-top: 5px; }
.digitando { display: flex; gap: 4px; padding: 12px 14px; }
.digitando i { width: 7px; height: 7px; border-radius: 50%; background: #a3a3a3; display: block; animation: pontinho 1s infinite; }
.digitando i:nth-child(2) { animation-delay: .15s; } .digitando i:nth-child(3) { animation-delay: .3s; }
.linha { display: flex; justify-content: space-between; gap: 14px; font-size: 13.5px; padding: 2px 0; }
.linha span { color: #a3a3a3; } .linha b { font-weight: 700; }
.ok { color: #4ade80; font-weight: 800; font-size: 14.5px; margin-bottom: 4px; display: block; }
.barra { position: absolute; left: 0; right: 0; bottom: 0; height: 64px; background: #101010; border-top: 1px solid #222;
  display: flex; align-items: center; gap: 8px; padding: 0 10px; }
.barra .cam { width: 38px; height: 38px; border-radius: 50%; border: 1px solid #333; display: grid; place-items: center; flex: none; }
.campo { flex: 1; height: 40px; border-radius: 20px; background: #1f1f1f; border: 1px solid #2c2c2c; font-size: 12.5px; color: #8a8a8a;
  display: flex; align-items: center; padding: 0 14px; position: relative; overflow: hidden; }
.mic { width: 42px; height: 42px; border-radius: 50%; background: #22c55e; display: grid; place-items: center; flex: none; position: relative; }
.grav { position: absolute; inset: 0; display: flex; align-items: center; gap: 8px; padding: 0 14px; background: #1f1f1f; color: #e5e5e5; }
.grav .ponto { width: 9px; height: 9px; border-radius: 50%; background: #ef4444; animation: pulsar .8s infinite; }
.grav .tempo { font-weight: 700; font-size: 13px; font-variant-numeric: tabular-nums; }
.grav .vivo { display: flex; gap: 2px; align-items: center; height: 18px; }
.grav .vivo i { width: 3px; height: 18px; background: #22c55e; border-radius: 2px; display: block; animation: barra .5s infinite; transform-origin: center; }
.grav small { margin-left: auto; color: #8a8a8a; font-size: 11px; }
.dedo { position: absolute; width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,.22); border: 2px solid rgba(255,255,255,.9);
  box-shadow: 0 6px 18px rgba(0,0,0,.4); pointer-events: none; }
.dedo .o { position: absolute; inset: -2px; border-radius: 50%; border: 3px solid rgba(34,197,94,.9); animation: onda 1.1s infinite; }
.foto { width: 190px; border-radius: 10px; overflow: hidden; background: #f5f5f4; padding: 12px 12px 10px; color: #292524;
  font-family: 'DejaVu Sans Mono', monospace; font-size: 10px; line-height: 1.5; transform: rotate(-2deg); position: relative; }
.foto h4 { text-align: center; font-size: 11px; letter-spacing: .1em; margin-bottom: 4px; }
.foto .tot { border-top: 1px dashed #78716c; margin-top: 4px; padding-top: 4px; font-weight: 700; display: flex; justify-content: space-between; }
.foto .env { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: grid; place-items: center; }
.foto .env i { width: 36px; height: 36px; border-radius: 50%; border: 3px solid rgba(255,255,255,.3); border-top-color: #fff; display: block; }
.lateral { position: absolute; display: flex; flex-direction: column; gap: 12px; }
.chip { background: rgba(20,20,20,.92); border: 1px solid #2a2a2a; border-radius: 14px; padding: 12px 16px; min-width: 200px;
  box-shadow: 0 10px 30px rgba(0,0,0,.45); }
.chip small { display: block; color: #9ca3af; font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
.chip b { font-size: 20px; font-weight: 800; }
.chip.verde b { color: #4ade80; }
`;

function bolhaAudio({ dur = '0:04', transcricao, t, semente }) {
  return `<div class="msg eu anim" style="animation:${an('surgir', 0.35, t)}">
    <div class="audio"><div class="play">${ICONE_PLAY}</div><div class="ondas">${ondas(22, semente)}</div><span class="dur">${dur}</span></div>
    ${transcricao ? `<div class="transc anim" style="animation:${an('aparecer', 0.4, t + 0.35)}">“${transcricao}”</div>` : ''}
    <div class="hora">agora ${CHECKS}</div></div>`;
}
const bolhaTexto = (texto, t) => `<div class="msg eu anim" style="animation:${an('surgir', 0.35, t)}">${texto}<div class="hora">agora ${CHECKS}</div></div>`;
const digitando = (t0, t1) => `<div class="msg bot digitando anim" style="animation:${an('surgir', 0.25, t0)}, ${an('sumir', 0.12, t1)};${''}"><i></i><i></i><i></i></div>`;
function resposta(t, titulo, linhas, extra = '') {
  return `<div class="msg bot anim" style="animation:${an('surgir', 0.4, t)}"><b class="ok">${titulo}</b>
    ${linhas.map(([k, v]) => `<div class="linha"><span>${k}</span><b>${v}</b></div>`).join('')}${extra}<div class="hora">agora</div></div>`;
}
function foto(t, loja, itens, total) {
  return `<div class="msg eu anim" style="animation:${an('surgir', 0.35, t)};padding:5px">
    <div class="foto"><h4>${loja}</h4>${itens.map(([a, b]) => `<div style="display:flex;justify-content:space-between"><span>${a}</span><span>${b}</span></div>`).join('')}
    <div class="tot"><span>TOTAL</span><span>${total}</span></div>
    <div class="env anim" style="animation:${an('sumir', 0.25, t + 0.9)}"><i class="anim" style="animation:girar .8s linear infinite"></i></div></div>
    <div class="hora">agora ${CHECKS}</div></div>`;
}

// Cada cena devolve as mensagens e, se houver, o trecho de gravação de áudio.
function roteiroWhats(cena, D) {
  const k = (f) => f * D;
  switch (cena) {
    case 'gravando-audio':
      return {
        gravacao: [0.15, k(0.55)],
        msgs: [bolhaAudio({ dur: '0:04', transcricao: 'Quanto eu gastei esse mês?', t: k(0.58), semente: 7 }), digitando(k(0.8), D + 1)],
      };
    case 'segurando-audio':
      return { gravacao: [0.1, D + 1], msgs: [] };
    case 'mercado-credito':
      return {
        gravacao: [0.1, k(0.22)],
        msgs: [
          bolhaAudio({ dur: '0:03', transcricao: 'Gastei 89,90 no mercado no crédito', t: k(0.24), semente: 3 }),
          digitando(k(0.42), k(0.55)),
          resposta(k(0.55), '✅ Lançado!', [['Valor', 'R$ 89,90'], ['Categoria', 'Mercado'], ['Pagamento', 'Crédito']]),
        ],
        lateral: [['Valor', 'R$ 89,90', k(0.62)], ['Categoria', 'Mercado', k(0.7)], ['Pagamento', 'Crédito', k(0.78)]],
      };
    case 'foto-nota':
      return {
        msgs: [
          bolhaTexto('Paguei 120 na farmácia no débito', 0.1),
          foto(k(0.3), 'FARMÁCIA', [['DIPIRONA', '12,90'], ['VITAMINA C', '34,60'], ['PROTETOR', '72,50']], 'R$ 120,00'),
          digitando(k(0.62), k(0.72)),
          resposta(k(0.72), '📸 Li sua nota!', [['Farmácia', 'R$ 120,00'], ['Pagamento', 'Débito']]),
        ],
      };
    case 'parcelado-3x':
      return {
        msgs: [
          bolhaTexto('Comprei 300 parcelado em 3x', 0.15),
          digitando(k(0.3), k(0.45)),
          resposta(k(0.45), '✅ Parcelamento lançado!', [['Total', 'R$ 300,00'], ['Parcelas', '3x de R$ 100,00'], ['1ª parcela', 'próxima fatura']]),
        ],
        lateral: [['Parcelas', '3x de R$ 100', k(0.55)], ['Falta pagar', 'R$ 300,00', k(0.65)]],
      };
    case 'mercado-50':
      return {
        gravacao: [0.1, k(0.25)],
        msgs: [
          bolhaAudio({ dur: '0:02', transcricao: 'Gastei 50 no mercado', t: k(0.27), semente: 5 }),
          digitando(k(0.42), k(0.52)),
          resposta(k(0.52), '✅ Lançado em 3 segundos', [['Mercado', 'R$ 50,00'], ['Saldo do mês', 'atualizado']]),
        ],
      };
    default:
      throw new Error(`Cena de WhatsApp desconhecida: ${cena}`);
  }
}

function htmlWhats(op, formato, D) {
  const r = roteiroWhats(op.cena, D);
  const v = formato === 'vertical';
  const tel = v ? { w: 360, h: 540, x: 90, y: 155 } : { w: 290, h: 455, x: 300, y: 52 };
  const escala = v ? 1 : 0.86;
  const gIni = r.gravacao ? r.gravacao[0] : -1;
  const gFim = r.gravacao ? r.gravacao[1] : -1;
  const gravacao = r.gravacao ? `
    <div class="grav anim" style="animation:${an('aparecer', 0.15, gIni)}, ${an('sumir', 0.15, gFim)}">
      <span class="ponto"></span><span class="tempo" id="tempo">0:00</span>
      <span class="vivo">${Array.from({ length: 8 }, (_, i) => `<i style="animation-delay:${(i * 0.07).toFixed(2)}s"></i>`).join('')}</span>
      <small>‹ deslize para cancelar</small></div>` : '';
  const dedo = r.gravacao ? `<div class="dedo anim" style="right:${(-7 + 0).toFixed(0)}px;bottom:${(-1).toFixed(0)}px;animation:${an('aparecer', 0.2, Math.max(0, gIni - 0.1))}, ${an('sumir', 0.2, gFim)}"><div class="o"></div></div>` : '';
  const lateral = !v && r.lateral ? `<div class="lateral" style="left:${tel.x + tel.w + 50}px;top:140px">
      ${r.lateral.map(([a, b, t], i) => `<div class="chip ${i === 0 ? 'verde' : ''} anim" style="animation:${an('surgir', 0.4, t)}"><small>${a}</small><b>${b}</b></div>`).join('')}</div>` : '';
  return {
    css: CSS_WHATS + '@keyframes girar { to { transform: rotate(360deg); } }',
    corpo: `
    <div class="tel" style="left:${tel.x}px;top:${tel.y}px;width:${tel.w / escala}px;height:${tel.h / escala}px;transform:scale(${escala});transform-origin:top left">
      <div class="cab">${logoHtml(38)}<div><b>Orzio • Assistente</b><small>online • responde na hora</small></div><span class="selo">Pessoal</span></div>
      <div class="chat">
        <div class="msg bot anim" style="animation:${an('aparecer', 0.01, 0)}">Olá, Ana! 👋 Me conta seus gastos por texto, áudio ou foto da nota que eu lanço na hora.<div class="hora">agora</div></div>
        ${r.msgs.join('\n')}
      </div>
      <div class="barra"><div class="cam">${ICONE_CAMERA}</div><div class="campo">Digite, mande áudio ou foto da nota...${gravacao}</div>
        <div class="mic anim" style="${r.gravacao ? `animation:${an('pop', 0.3, gIni)}` : ''}">${ICONE_MIC}${dedo}</div></div>
    </div>${lateral}`,
    script: r.gravacao ? `window.__quadro = (t) => { const s = Math.max(0, Math.min(t, ${gFim.toFixed(3)}) - ${gIni.toFixed(3)}); const el = document.getElementById('tempo'); if (el) el.textContent = '0:' + String(Math.floor(s)).padStart(2, '0'); };` : '',
  };
}

// ---------------------------------------------------------------------------
// Motion graphics

function htmlPlanilha(op, formato, D) {
  const v = formato === 'vertical';
  const k = (f) => f * D;
  const area = v ? { x: 40, y: 165, w: 460, h: 520 } : { x: 130, y: 85, w: 700, h: 370 };
  const linhas = v ? 11 : 9;
  const colunas = v ? 5 : 7;
  let s = 11;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const erros = ['#REF!', '#VALOR!', '#DIV/0!', '???'];
  const celulas = [];
  for (let i = 0; i < linhas; i += 1) {
    for (let j = 0; j < colunas; j += 1) {
      const erro = r() < 0.12;
      const texto = i === 0 ? ['Data', 'Gasto', 'Valor', 'Categ.', 'Conta', 'Obs', 'Total'][j] : erro ? erros[Math.floor(r() * erros.length)] : r() < 0.25 ? '' : `${(r() * 300).toFixed(2).replace('.', ',')}`;
      const t = k(0.02 + r() * 0.3);
      celulas.push(`<div class="cel ${i === 0 ? 'cabec' : ''} ${erro && i ? 'erro' : ''} anim" style="animation:${an('aparecer', 0.15, t)}">${texto}</div>`);
    }
  }
  const campos = ['Valor', 'Data', 'Categoria', 'Subcategoria', 'Conta', 'Forma de pagamento', 'Parcelas', 'Tags', 'Observação', 'Anexo'];
  const form = campos.map((c, i) => `<div class="campo-f anim" style="animation:${an('surgir', 0.25, k(0.4 + i * 0.033))}"><span>${c}</span><i></i></div>`).join('');
  return {
    css: `
      .planilha { position: absolute; left: ${area.x}px; top: ${area.y}px; width: ${area.w}px; display: grid; grid-template-columns: repeat(${colunas}, 1fr);
        border: 1px solid #2a3330; background: #0d1311; border-radius: 10px; overflow: hidden; }
      .cel { height: ${(area.h - 60) / linhas}px; border: 1px solid #1d2522; font-size: ${v ? 11 : 12}px; color: #9fb5ad; display: flex; align-items: center; padding: 0 6px; font-family: 'DejaVu Sans Mono', monospace; }
      .cabec { background: #16201c; color: #e2e8f0; font-weight: 700; font-family: Inter; }
      .erro { color: #f87171; background: rgba(239,68,68,.12); font-weight: 700; }
      .preguica { position: absolute; font-size: ${v ? 64 : 70}px; }
      .form { position: absolute; width: ${v ? 360 : 380}px; background: #111; border: 1px solid #2c2c2c; border-radius: 18px; padding: 16px 18px;
        box-shadow: 0 30px 80px rgba(0,0,0,.6); }
      .form h3 { font-size: 17px; margin-bottom: 10px; }
      .campo-f { display: flex; justify-content: space-between; align-items: center; border: 1px solid #2a2a2a; border-radius: 9px; padding: ${v ? 8 : 5}px 10px; margin-bottom: ${v ? 6 : 4}px; font-size: 12.5px; color: #a3a3a3; }
      .campo-f i { width: 70px; height: 8px; border-radius: 4px; background: #262626; display: block; }
      .contador { position: absolute; background: #ef4444; color: #fff; font-weight: 900; border-radius: 99px; padding: 8px 16px; font-size: ${v ? 22 : 24}px;
        box-shadow: 0 10px 30px rgba(239,68,68,.4); }
      .cafe { position: absolute; font-size: 15px; font-weight: 700; color: #fde68a; background: rgba(120,53,15,.5); border: 1px solid #92400e; padding: 8px 14px; border-radius: 12px; }
      .semana { position: absolute; background: #111; border: 1px solid #333; border-radius: 16px; padding: 14px 22px; text-align: center; }
      .semana small { color: #9ca3af; font-size: 12px; font-weight: 700; letter-spacing: .1em; } .semana b { display: block; font-size: 30px; font-weight: 900; }
      .xis { position: absolute; color: #ef4444; font-size: 120px; font-weight: 900; line-height: 1; }
    `,
    corpo: `
      <div class="anim" style="animation:${an('sumir', 0.4, k(0.36))}">
        <div class="planilha">${celulas.join('')}</div>
        <div class="preguica anim" style="${v ? 'right:44px;top:610px' : 'right:70px;top:360px'};animation:${an('pop', 0.5, k(0.18))}">🥱</div>
      </div>
      <div class="anim" style="animation:${an('aparecer', 0.01, k(0.38))}, ${an('cair', 0.6, k(0.78))}">
        <div class="form anim" style="${v ? 'left:90px;top:175px' : 'left:290px;top:70px'};animation:${an('surgir', 0.4, k(0.38))}"><h3>Nova transação</h3>${form}</div>
        <div class="cafe anim" style="${v ? 'left:40px;top:640px' : 'left:70px;top:150px'};animation:${an('surgir', 0.3, k(0.42))}">☕ Cafezinho · R$ 5,00</div>
        <div class="contador anim" style="${v ? 'right:36px;top:190px' : 'right:120px;top:100px'};animation:${an('pop', 0.3, k(0.44))}"><span id="cliques">1</span> cliques</div>
      </div>
      <div class="semana anim" style="${v ? 'left:170px;top:330px' : 'left:380px;top:190px'};animation:${an('pop', 0.45, k(0.8))}"><small>SEMANA</small><b>2</b></div>
      <div class="xis anim" style="${v ? 'left:215px;top:300px' : 'left:425px;top:160px'};animation:${an('pop', 0.35, k(0.86))}">✕</div>`,
    script: `window.__quadro = (t) => { const p = Math.max(0, Math.min(1, (t - ${k(0.44).toFixed(3)}) / ${k(0.3).toFixed(3)})); const el = document.getElementById('cliques'); if (el) el.textContent = String(1 + Math.round(p * 9)); };`,
  };
}

function htmlExtrato(op, formato, D) {
  const v = formato === 'vertical';
  const itens = [
    ['PIX ENVIADO', '-87,40'], ['COMPRA CARTÃO MERCADO', '-213,55'], ['TARIFA PACOTE', '-32,90'], ['DEB AUTOMÁTICO', '-149,90'],
    ['COMPRA CARTÃO LANCHONETE', '-28,00'], ['PIX ENVIADO', '-50,00'], ['IOF', '-3,12'], ['ASSINATURA STREAMING', '-55,90'],
    ['COMPRA PARCELADA 3/10', '-120,00'], ['SAQUE', '-200,00'], ['COMPRA CARTÃO FARMÁCIA', '-64,30'], ['PIX ENVIADO', '-15,00'],
  ];
  const lista = [...itens, ...itens].map(([a, b]) => `<div class="lin"><span>${a}</span><b>${b}</b></div>`).join('');
  const banda = (topo, altura, dur, atraso) => `<div class="banda" style="top:${topo}px;height:${altura}px"><div class="rolo" style="animation:rolarCima ${dur}s linear ${atraso}s infinite">${lista}</div></div>`;
  return {
    css: `
      .banda { position: absolute; left: ${v ? 30 : 140}px; right: ${v ? 30 : 140}px; overflow: hidden; border-radius: 14px; background: #0d1210; border: 1px solid #1f2a26;
        -webkit-mask-image: linear-gradient(transparent, #000 25%, #000 75%, transparent); }
      .lin { display: flex; justify-content: space-between; padding: 9px 16px; border-bottom: 1px solid #18201d; font-family: 'DejaVu Sans Mono', monospace; font-size: ${v ? 12.5 : 13}px; color: #94a3b8; }
      .lin b { color: #f87171; }
      .q { position: absolute; font-weight: 900; color: #fbbf24; opacity: .9; }
    `,
    corpo: `
      ${banda(v ? 150 : 40, v ? 250 : 150, 9, 0)}
      ${banda(v ? 640 : 380, v ? 250 : 140, 11, -3)}
      <div class="q anim" style="left:${v ? 60 : 120}px;top:${v ? 410 : 200}px;font-size:46px;animation:${an('pop', 0.4, 0.4)}">?</div>
      <div class="q anim" style="right:${v ? 70 : 130}px;top:${v ? 560 : 300}px;font-size:58px;animation:${an('pop', 0.4, 0.9)}">?</div>
      <div class="q anim" style="right:${v ? 140 : 300}px;top:${v ? 120 : 20}px;font-size:34px;animation:${an('pop', 0.4, 1.4)}">?</div>`,
  };
}

function htmlLogo(op, formato) {
  const v = formato === 'vertical';
  return {
    css: `.centro { position: absolute; left: 0; right: 0; top: ${v ? 330 : 150}px; display: flex; flex-direction: column; align-items: center; gap: 22px; }
      .aro { position: absolute; width: 240px; height: 240px; border-radius: 50%; border: 2px solid rgba(16,185,129,.6); top: -30px; }`,
    corpo: `<div class="centro">
      <div class="aro anim" style="animation:onda 1.6s ease-out .1s both"></div>
      <div class="anim" style="animation:${an('pop', 0.6, 0.05)}">${logoHtml(v ? 170 : 150)}</div>
      <div class="anim" style="animation:${an('surgir', 0.5, 0.45)}">${marca(v ? 40 : 36)}</div></div>`,
  };
}

function htmlFinal(op, formato, D) {
  const v = formato === 'vertical';
  const topo = op.espacoInferior ? (v ? 250 : 90) : (v ? 270 : 95);
  return {
    css: `.cartao { position: absolute; left: 0; right: 0; top: ${topo}px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: ${v ? 22 : 16}px; }
      .cartao h1 { font-size: ${v ? 44 : 46}px; font-weight: 900; line-height: 1.08; letter-spacing: -.02em; }
      .cartao h1 em { font-style: normal; color: #10b981; }
      .cta { background: #fff; color: #050807; font-weight: 700; font-size: ${v ? 20 : 19}px; padding: 15px 28px; border-radius: 14px; display: flex; align-items: center; gap: 10px;
        box-shadow: 0 0 0 6px rgba(16,185,129,.18), 0 20px 50px rgba(0,0,0,.5); }
      .garantia { font-size: 14px; color: #a7f3d0; font-weight: 600; }`,
    corpo: `<div class="cartao">
      <div class="anim" style="animation:${an('pop', 0.55, 0.05)}">${logoHtml(v ? 120 : 100)}</div>
      <div class="anim" style="animation:${an('surgir', 0.4, 0.25)}">${marca(v ? 30 : 28)}</div>
      <h1 class="anim" style="animation:${an('surgir', 0.45, 0.45)}">Teste grátis no<br><em>link da bio</em></h1>
      <div class="cta anim" style="animation:${an('pop', 0.45, 0.8)}, pulsar 1.6s ease-in-out ${(1.4).toFixed(2)}s infinite">${op.botao || 'Testar demonstração'} <span>→</span></div>
      <div class="garantia anim" style="animation:${an('aparecer', 0.4, 1.1)}">7 dias de garantia · cancele sem multa</div></div>`,
  };
}

const MODELOS = { whatsapp: htmlWhats, planilha: htmlPlanilha, extrato: htmlExtrato, logo: htmlLogo, final: htmlFinal };

export function htmlGrafico(modelo, opcoes, formato, D) {
  const c = CANVAS[formato];
  const fn = MODELOS[modelo];
  if (!fn) throw new Error(`Modelo de gráfico desconhecido: ${modelo}`);
  const g = fn(opcoes || {}, formato, D);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${fontes()}
    :root { --w: ${c.w}px; --h: ${c.h}px; }
    ${BASE_CSS}
    ${g.css}
  </style></head><body><div class="fundo"></div><div class="grade"></div>${g.corpo}
  <script>${g.script || ''}</script></body></html>`;
}

export async function renderizarGrafico(navegador, { modelo, opcoes, formato, quadros, saida, previa }) {
  const c = CANVAS[formato];
  const D = quadros / FPS;
  const dir = garantirPasta(PASTAS.graficos);
  const arqHtml = path.join(dir, `${path.basename(saida, '.mp4')}.html`);
  fs.writeFileSync(arqHtml, htmlGrafico(modelo, opcoes, formato, D));
  const pagina = await navegador.newPage({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 2 });
  await pagina.goto(pathToFileURL(arqHtml).href);
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(150);
  const cod = codificadorDeQuadros(saida, { fps: FPS });
  for (let f = 0; f < quadros; f += 1) {
    const t = f / FPS;
    await pagina.evaluate((tt) => {
      if (window.__quadro) window.__quadro(tt);
      for (const a of document.getAnimations()) { a.pause(); a.currentTime = tt * 1000; }
    }, t);
    const img = await pagina.screenshot({ type: 'jpeg', quality: 92 });
    if (previa && f === Math.floor(quadros * 0.85)) fs.writeFileSync(previa, img);
    await cod.escrever(img);
  }
  await cod.fechar();
  await pagina.close();
}
