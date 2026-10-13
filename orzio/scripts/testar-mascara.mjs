// Testa máscara, travas de clique e trava de rede numa página local com dados
// pessoais falsos. Não acessa a Orzio. Uso: npm run testar-mascara
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PASTAS } from '../config.mjs';
import { abrirNavegador, criarContexto } from '../lib/navegador.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const HTML = fs.readFileSync(path.join(AQUI, '..', 'teste', 'pagina-teste.html'));

const recebidas = [];
const servidor = http.createServer((req, res) => {
  recebidas.push(`${req.method} ${req.url}`);
  if (req.url.startsWith('/app')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(HTML);
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  return res.end('{"ok":true}');
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${servidor.address().port}`;

const falhas = [];
const checar = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) falhas.push(msg); };

const navegador = await abrirNavegador();
const logs = [];
for (const formato of ['horizontal', 'vertical']) {
  console.log(`\n== ${formato}`);
  const contexto = await criarContexto(navegador, formato, { sessao: false, registro: (l) => logs.push(l) });
  const pagina = await contexto.newPage();
  await pagina.goto(`${base}/app`);
  await pagina.waitForTimeout(700);

  const achados = await pagina.evaluate(() => window.__orzioVerificar());
  checar(achados.length === 0, `verificação DOM sem dados pessoais (${JSON.stringify(achados)})`);
  const texto = await pagina.evaluate(() => document.body.innerText);
  for (const deve of ['Olá, Ana', 'R$ 1.234,56', 'R$ 89,90', 'R$ 12.345.678,90', '13/10/2026', '2025-2026', 'Salário', 'Variável', '3/5 pagas', '•••• 1234', 'final 1234', '000.000.000-00', '+55 00 00000-0000', 'voce@email.com', 'Bem-vindo de volta, Ana']) {
    checar(texto.includes(deve), `mostra "${deve}"`);
  }
  for (const nao of ['Ari', 'ari.teste', 'exemplo.com', '99876', '3333-4444', '123.456.789', '52998224725', '4321', '8765', '9876', 'Painel do dono', 'DONO', 'Falar no WhatsApp']) {
    checar(!texto.includes(nao), `não mostra "${nao}"`);
  }
  checar(await pagina.title() === 'Orzio — Ana', `título da aba mascarado (${await pagina.title()})`);
  checar(await pagina.inputValue('#campo') === 'voce@email.com', 'campo de e-mail mascarado');
  checar(await pagina.getAttribute('.avatar', 'title') === 'ANA SOUZA', 'atributo title mascarado');
  checar((await pagina.textContent('.avatar')).trim() === 'A', 'inicial do avatar = A');
  checar(await pagina.isVisible('#whats svg'), 'ícone do WhatsApp visível');
  checar(!(await pagina.getAttribute('#whats', 'href')).match(/\d{6}/), 'link do WhatsApp sem número');
  checar(!(await pagina.isVisible('.rodape .email')), 'bloco nome/e-mail do rodapé oculto');

  // Travas de clique
  await pagina.evaluate(() => { window.__acionou = []; });
  const proibidos = ['#b-salvar', '#b-adicionar', '#b-sair', '#b-excluir', '#b-assinatura', '#b-enviar'];
  for (const sel of proibidos) await pagina.click(sel, { force: true }).catch(() => {});
  await pagina.press('#formulario input', 'Enter').catch(() => {});
  const acionados = await pagina.evaluate(() => window.__acionou);
  checar(acionados.length === 0, `botões proibidos não acionam nada (${acionados.join(', ')})`);
  for (const sel of ['#b-cancelar', '#b-importar']) await pagina.click(sel);
  const permitidos = await pagina.evaluate(() => window.__acionou);
  checar(permitidos.join(',') === 'b-cancelar,b-importar', `Cancelar e Importar nota funcionam (${permitidos.join(', ')})`);

  // Trava de rede
  const rede = await pagina.evaluate(async () => {
    const r = async (metodo, url) => {
      try { const x = await fetch(url, { method: metodo, body: metodo === 'GET' ? undefined : '{}' }); return x.ok ? 'passou' : 'erro'; } catch { return 'bloqueado'; }
    };
    return {
      lerTabela: await r('GET', '/rest/v1/transacoes?select=*'),
      gravarTabela: await r('POST', '/rest/v1/transacoes'),
      alterarTabela: await r('PATCH', '/rest/v1/transacoes?id=eq.1'),
      apagar: await r('DELETE', '/rest/v1/transacoes?id=eq.1'),
      renovarSessao: await r('POST', '/auth/v1/token?grant_type=refresh_token'),
      rpcLeitura: await r('POST', '/rest/v1/rpc/resumo_mensal'),
      rpcExcluir: await r('POST', '/rest/v1/rpc/excluir_transacao'),
      funcaoSincronizar: await r('POST', '/functions/v1/sincronizar-b3'),
      funcaoCotacoes: await r('POST', '/functions/v1/cotacoes'),
      logout: await r('POST', '/auth/v1/logout'),
    };
  });
  const esperado = {
    lerTabela: 'passou', gravarTabela: 'bloqueado', alterarTabela: 'bloqueado', apagar: 'bloqueado',
    renovarSessao: 'passou', rpcLeitura: 'passou', rpcExcluir: 'bloqueado', funcaoSincronizar: 'bloqueado',
    funcaoCotacoes: 'passou', logout: 'bloqueado',
  };
  for (const [k, v] of Object.entries(esperado)) checar(rede[k] === v, `rede ${k}: ${rede[k]} (esperado ${v})`);

  const nav = await pagina.goto(`${base}/app/admin`).then(() => 'abriu').catch(() => 'bloqueado');
  checar(nav === 'bloqueado', `navegação para /app/admin bloqueada (${nav})`);

  await pagina.close();
  const limpa = await contexto.newPage();
  await limpa.goto(`${base}/app`);
  await limpa.waitForTimeout(600);
  fs.mkdirSync(PASTAS.cache, { recursive: true });
  await limpa.screenshot({ path: path.join(PASTAS.cache, `teste-mascara-${formato}.png`) });
  await contexto.close();
}
await navegador.close();
servidor.close();

const escritas = recebidas.filter((r) => !r.startsWith('GET'));
console.log('\nRequisições de escrita que chegaram ao servidor:', escritas);
checar(escritas.every((r) => /refresh_token|rpc\/resumo_mensal|functions\/v1\/cotacoes/.test(r)), 'só renovação de sessão e leituras chegaram ao servidor');
console.log(falhas.length ? `\n${falhas.length} falha(s).` : '\nTudo certo.');
process.exit(falhas.length ? 1 : 0);
