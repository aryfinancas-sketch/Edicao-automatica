/* Roda dentro da página (page.addInitScript), antes dos scripts do app.
 * Só troca o que aparece na tela: nada é enviado ao servidor.
 *
 * - Mascara nome, e-mail, CPF/CNPJ, telefone e final de cartão em textos e
 *   atributos, e continua mascarando a cada mudança (MutationObserver).
 * - Esconde "Painel do dono", o título "DONO", o bloco de nome/e-mail do rodapé
 *   do menu lateral e o texto do link do WhatsApp (fica só o ícone).
 * - Travas: bloqueia cliques em botões proibidos e qualquer envio de formulário.
 * - window.__orzioVerificar() lista qualquer dado pessoal ainda visível.
 */
function instalarMascaraOrzio(CFG) {
  if (window.__orzioMascara) return;
  window.__orzioMascara = true;
  const M = CFG.mascara;

  const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const LETRA = '[\\p{L}\\p{N}_]';
  const reNome = new RegExp(`(?<!${LETRA})(?:${M.nomes.map(escapar).join('|')})(?!${LETRA})`, 'giu');
  const reEmail = /[^\s@<>()"'`,;:]*@[^\s@<>()"'`,;:]*/g;
  const reCnpj = /(?<![\d./-])\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}(?!\d)/g;
  const reCpf = /(?<![\d./-])\d{3}\.\d{3}\.\d{3}-\d{2}(?!\d)/g;
  const reTelefone = /(?<![\d\p{L}])(?:\+\s?55[\s.-]?|55[\s.-]?(?=\(?\d{2}\)?[\s.-]?9))?(?:\(\d{2}\)|\d{2})[\s.-]?(?:9[\s.-]?)?\d{4}[\s.-]?\d{4}(?!\d)/gu;
  const reCnpjNu = /(?<![\d./-])\d{14}(?![\d,])/g;
  const reCpfNu = /(?<![\d./-])\d{11}(?![\d,])/g;
  const reCartao = /(?:[•●*·∙]\s?){2,}\s?\d{4}(?!\d)/g;
  const reCartaoFinal = /(\b(?:final|terminado em|terminação)\s+)\d{4}(?!\d)/gi;

  function nomeFicticio(m) {
    return m === m.toUpperCase() ? M.nomeFicticio.toUpperCase() : M.nomeFicticio;
  }

  function mascararTexto(s) {
    if (!s || typeof s !== 'string') return s;
    let r = s;
    if (r.includes('@')) r = r.replace(reEmail, M.email);
    if (/\d/.test(r)) {
      r = r.replace(reCnpj, M.documento)
        .replace(reCpf, M.documento)
        .replace(reTelefone, M.telefone)
        .replace(reCnpjNu, M.documento)
        .replace(reCpfNu, M.documento)
        .replace(reCartao, M.cartao)
        .replace(reCartaoFinal, (_, prefixo) => `${prefixo}1234`);
    }
    r = r.replace(reNome, nomeFicticio);
    return r;
  }
  window.__orzioMascararTexto = mascararTexto;

  const IGNORAR = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
  const SEL_WHATS = 'a[href*="wa.me"], a[href*="whatsapp.com"], a[href^="whatsapp:"]';
  const SEL_AVATAR = '[class*="avatar" i], [data-slot="avatar"], [data-slot="avatar-fallback"]';
  const SEL_MENU = 'aside, nav, [data-sidebar]';

  function ocultar(el) {
    if (el && el.nodeType === 1 && !el.hasAttribute('data-orzio-oculto')) el.setAttribute('data-orzio-oculto', '');
  }

  // Sobe a partir do texto com e-mail até antes do primeiro ancestral que
  // contém links de navegação: esse é o bloco de nome/e-mail do rodapé.
  function ocultarBlocoConta(el) {
    const menu = el.closest(SEL_MENU);
    if (!menu) return;
    let bloco = el;
    while (bloco.parentElement && bloco.parentElement !== menu) {
      const pai = bloco.parentElement;
      if (pai.querySelectorAll('a[href*="/app"]').length > 0) break;
      bloco = pai;
    }
    ocultar(bloco);
  }

  function tratarTexto(no) {
    const pai = no.parentElement;
    if (!pai || IGNORAR.has(pai.nodeName)) return;
    const v = no.nodeValue;
    if (!v || !v.trim()) return;
    let novo = mascararTexto(v);
    if (pai.closest(SEL_WHATS)) novo = '';
    else if (pai.closest(SEL_AVATAR) && /^[\p{L}]{1,3}$/u.test(novo.trim())) novo = M.inicialAvatar;
    if (novo !== v) no.nodeValue = novo;

    const limpo = v.trim();
    if (/^dono$/i.test(limpo)) ocultar(pai);
    if (/^painel do dono$/i.test(limpo)) ocultar(pai.closest('a, button, li, [role="menuitem"]') || pai);
    if (v.includes('@') && pai.closest(SEL_MENU)) ocultarBlocoConta(pai);
  }

  const ATRIBUTOS = ['title', 'alt', 'aria-label', 'placeholder', 'data-tooltip', 'aria-description'];

  function tratarAtributos(el) {
    if (el.nodeType !== 1) return;
    for (const a of ATRIBUTOS) {
      const v = el.getAttribute(a);
      if (v) {
        const n = mascararTexto(v);
        if (n !== v) el.setAttribute(a, n);
      }
    }
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || '';
      if (/^mailto:/i.test(href) && href !== `mailto:${M.email}`) el.setAttribute('href', `mailto:${M.email}`);
      else if (/^tel:/i.test(href) && href !== 'tel:+5500000000000') el.setAttribute('href', 'tel:+5500000000000');
      else if (el.matches(SEL_WHATS) && /\d{6,}/.test(href)) el.setAttribute('href', 'https://wa.me/');
      if (/\/app\/admin(\/|$|\?)/.test(href)) ocultar(el.closest('li') || el);
    }
    if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.type !== 'file' && el.type !== 'password') {
      const n = mascararTexto(el.value);
      if (n !== el.value) el.value = n;
    }
  }

  function varrer(raiz) {
    if (!raiz) return;
    if (raiz.nodeType === 3) { tratarTexto(raiz); return; }
    if (raiz.nodeType !== 1 && raiz.nodeType !== 9 && raiz.nodeType !== 11) return;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) tratarTexto(n);
    if (raiz.nodeType === 1) tratarAtributos(raiz);
    if (raiz.querySelectorAll) {
      raiz.querySelectorAll('[title],[alt],[aria-label],[placeholder],[data-tooltip],input,textarea,a[href]').forEach(tratarAtributos);
    }
  }

  const css = `
    [data-orzio-oculto], a[href*="/app/admin"] { display: none !important; }
    html, body, * { scroll-behavior: auto !important; caret-color: transparent !important; }
    * { scrollbar-width: none !important; }
    *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
    #orzio-toque {
      position: fixed; z-index: 2147483647; pointer-events: none;
      width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%;
      background: rgba(255,255,255,.28); border: 2px solid rgba(255,255,255,.85);
      box-shadow: 0 0 0 6px rgba(16,185,129,.28), 0 4px 14px rgba(0,0,0,.35);
    }
    #orzio-toque.pressionado { transform: scale(.82); background: rgba(16,185,129,.45); }
  `;
  function instalarCss() {
    if (document.getElementById('orzio-mascara-css')) return;
    const s = document.createElement('style');
    s.id = 'orzio-mascara-css';
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  const observador = new MutationObserver((lista) => {
    for (const m of lista) {
      if (m.type === 'characterData') tratarTexto(m.target);
      else if (m.type === 'childList') m.addedNodes.forEach(varrer);
      else if (m.type === 'attributes') tratarAtributos(m.target);
    }
  });
  observador.observe(document, {
    subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: [...ATRIBUTOS, 'href', 'value'],
  });

  function varrerTudo() {
    instalarCss();
    varrer(document.documentElement);
  }
  window.__orzioVarrerTudo = varrerTudo;
  if (document.documentElement) varrerTudo();
  document.addEventListener('DOMContentLoaded', varrerTudo);
  window.addEventListener('load', varrerTudo);
  setInterval(varrerTudo, 400);

  // Indicador de toque discreto (substitui o cursor nas cenas com clique).
  window.__orzioToque = (x, y, pressionado) => {
    let el = document.getElementById('orzio-toque');
    if (!el) {
      el = document.createElement('div');
      el.id = 'orzio-toque';
      document.documentElement.appendChild(el);
    }
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.classList.toggle('pressionado', !!pressionado);
  };
  window.__orzioToqueRemover = () => document.getElementById('orzio-toque')?.remove();

  // ---- Travas: nada que altere a conta pode ser acionado. ----
  if (CFG.travas) {
    window.__orzioBloqueios = [];
    const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    const proibidos = CFG.botoesProibidos.map(norm);
    const ehProibido = (txt) => {
      const t = norm(txt);
      return !!t && proibidos.some((p) => t === p || t.startsWith(`${p} `));
    };
    const ICONES_PERIGO = 'svg.lucide-trash, svg.lucide-trash-2, svg.lucide-log-out, svg.lucide-refresh-cw';
    const SEL_ACIONAVEL = 'button, a, [role="button"], [role="menuitem"], [role="option"], input[type="submit"], input[type="button"], label';

    function motivoBloqueio(alvoEvento) {
      const el = alvoEvento && alvoEvento.closest ? alvoEvento.closest(SEL_ACIONAVEL) : null;
      if (!el) return null;
      const textos = [el.getAttribute('aria-label'), el.getAttribute('title'), el.innerText, el.value];
      const ruim = textos.find((x) => ehProibido(x));
      if (ruim) return norm(ruim);
      if (el.querySelector(ICONES_PERIGO)) return 'ícone de excluir/sair/sincronizar';
      if (el.matches('a') && CFG.rotasProibidas.some((r) => (el.getAttribute('href') || '').startsWith(r))) return `rota proibida ${el.getAttribute('href')}`;
      return null;
    }

    const barrar = (e) => {
      const motivo = motivoBloqueio(e.target);
      if (!motivo) return;
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      window.__orzioBloqueios.push(`${e.type}: ${motivo}`);
    };
    for (const tipo of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'touchstart', 'touchend', 'keydown']) {
      window.addEventListener(tipo, barrar, true);
    }
    window.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      window.__orzioBloqueios.push('submit de formulário');
    }, true);
    HTMLFormElement.prototype.submit = function () { window.__orzioBloqueios.push('form.submit()'); };
    HTMLFormElement.prototype.requestSubmit = function () { window.__orzioBloqueios.push('form.requestSubmit()'); };
    window.confirm = () => false;
    window.__orzioEhProibido = (el) => !!motivoBloqueio(el);
  }

  // ---- Verificação: o que ainda aparece de dado pessoal? ----
  window.__orzioVerificar = () => {
    varrerTudo();
    const achados = [];
    const textos = [document.title, document.body ? document.body.innerText : ''];
    document.querySelectorAll('input, textarea').forEach((el) => {
      if (el.type !== 'hidden' && el.type !== 'password' && el.offsetParent) textos.push(el.value);
    });
    const texto = textos.join('\n');
    const checar = (tipo, re, permitido) => {
      for (const m of texto.matchAll(re)) {
        if (m[0] !== permitido) achados.push({ tipo, trecho: m[0] });
      }
    };
    checar('e-mail', reEmail, M.email);
    checar('CNPJ', reCnpj, M.documento);
    checar('CPF', reCpf, M.documento);
    checar('telefone', reTelefone, M.telefone);
    checar('CNPJ', reCnpjNu, null);
    checar('CPF', reCpfNu, null);
    checar('cartão', reCartao, M.cartao);
    for (const m of texto.matchAll(reNome)) achados.push({ tipo: 'nome', trecho: m[0] });
    for (const m of texto.matchAll(reCartaoFinal)) {
      if (!m[0].endsWith('1234')) achados.push({ tipo: 'cartão', trecho: m[0] });
    }
    const visivel = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    document.querySelectorAll('a[href*="/app/admin"]').forEach((el) => {
      if (visivel(el)) achados.push({ tipo: 'menu', trecho: 'link Painel do dono visível' });
    });
    if (/(^|\n)\s*DONO\s*(\n|$)/.test(texto)) achados.push({ tipo: 'menu', trecho: 'título DONO visível' });
    if (/painel do dono/i.test(texto)) achados.push({ tipo: 'menu', trecho: 'Painel do dono visível' });
    const rota = location.pathname.replace(/\/$/, '');
    if (CFG.rotasProibidas.some((r) => rota === r || rota.startsWith(`${r}/`))) achados.push({ tipo: 'rota', trecho: rota });
    return achados;
  };
}
