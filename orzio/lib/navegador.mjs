// Abre o Chromium já com máscara de dados, travas de clique e trava de rede.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
  ARQ_SESSAO, BOTOES_PROIBIDOS, FORMATOS, MASCARA, PASTAS, ROTAS_PROIBIDAS,
} from '../config.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FONTE_MASCARA = fs.readFileSync(path.join(AQUI, 'mascara-navegador.js'), 'utf8');

const UA_CELULAR = 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';

export function scriptMascara({ travas = true } = {}) {
  const cfg = { mascara: MASCARA, botoesProibidos: BOTOES_PROIBIDOS, rotasProibidas: ROTAS_PROIBIDAS, travas };
  return `${FONTE_MASCARA}\n;instalarMascaraOrzio(${JSON.stringify(cfg)});`;
}

export async function abrirNavegador({ visivel = false } = {}) {
  const opcoes = { headless: !visivel };
  if (process.env.ORZIO_CHROMIUM) opcoes.executablePath = process.env.ORZIO_CHROMIUM;
  return chromium.launch(opcoes);
}

// A sessão vem de .auth/orzio.json (npm run login) ou, num ambiente sem tela,
// da variável ORZIO_SESSAO_B64 (o mesmo JSON em base64).
export function carregarSessao() {
  if (fs.existsSync(ARQ_SESSAO)) return ARQ_SESSAO;
  if (process.env.ORZIO_SESSAO_B64) {
    return JSON.parse(Buffer.from(process.env.ORZIO_SESSAO_B64, 'base64').toString('utf8'));
  }
  return null;
}

// Requisições que não são de leitura só passam se forem renovação de sessão
// ou consultas conhecidas; todo o resto é bloqueado e registrado.
const PERMITIR_ESCRITA = [
  /\/auth\/v1\/token\?grant_type=refresh_token/,
  /\/auth\/v1\/user$/,
  /\/rest\/v1\/rpc\//,
  /\/functions\/v1\//,
];
const NUNCA_PERMITIR = /(delete|excluir|remov|apagar|insert|inserir|upsert|update|atualizar|criar|create|salvar|save|lancar|lançar|pagar|pagamento|pay|realizar|sync|sincron|b3|cancel|assinatura|subscription|checkout|stripe|logout|signout|send|enviar|whatsapp)/i;

export function decidirRequisicao(metodo, url) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(metodo)) return 'ok';
  let caminho = url;
  try { const u = new URL(url); caminho = u.pathname + u.search; } catch { /* mantém url */ }
  if (PERMITIR_ESCRITA.some((re) => re.test(caminho)) && !(NUNCA_PERMITIR.test(caminho) && !/grant_type=refresh_token/.test(caminho))) return 'ok-escrita';
  return 'bloquear';
}

export async function instalarGuardaRede(contexto, registro) {
  await contexto.route('**/*', async (rota) => {
    const req = rota.request();
    if (req.isNavigationRequest() && rotaProibida(req.url())) {
      registro(`BLOQUEADO navegação para rota proibida ${req.url()}`);
      return rota.abort('blockedbyclient');
    }
    const decisao = decidirRequisicao(req.method(), req.url());
    if (decisao === 'ok') return rota.continue();
    registro(`${decisao === 'ok-escrita' ? 'permitido' : 'BLOQUEADO'} ${req.method()} ${req.url()}`);
    if (decisao === 'ok-escrita') return rota.continue();
    return rota.abort('blockedbyclient');
  });
}

export function criarRegistro(nome) {
  fs.mkdirSync(PASTAS.cache, { recursive: true });
  const arq = path.join(PASTAS.cache, `${nome}.log`);
  return (linha) => fs.appendFileSync(arq, `${new Date().toISOString()} ${linha}\n`);
}

export async function criarContexto(navegador, formato, { sessao = true, travas = true, registro } = {}) {
  const f = FORMATOS[formato];
  const estado = sessao ? carregarSessao() : undefined;
  if (sessao && !estado) {
    throw new Error('Sessão não encontrada. Rode "npm run login" (ou defina ORZIO_SESSAO_B64) antes de capturar.');
  }
  const contexto = await navegador.newContext({
    viewport: f.viewport,
    deviceScaleFactor: f.dsf,
    isMobile: f.mobile,
    hasTouch: f.mobile,
    userAgent: f.mobile ? UA_CELULAR : undefined,
    colorScheme: 'dark',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    storageState: estado || undefined,
    acceptDownloads: false,
    serviceWorkers: 'block',
  });
  await contexto.addInitScript({ content: scriptMascara({ travas }) });
  const log = registro || criarRegistro('rede');
  if (travas) await instalarGuardaRede(contexto, log);
  contexto.on('page', (p) => {
    p.on('dialog', (d) => d.dismiss().catch(() => {}));
  });
  return contexto;
}

export function rotaProibida(url) {
  let caminho;
  try { caminho = new URL(url).pathname.replace(/\/$/, ''); } catch { return false; }
  return ROTAS_PROIBIDAS.some((r) => caminho === r || caminho.startsWith(`${r}/`));
}
