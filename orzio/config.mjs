// Configuração central da produção dos vídeos da Orzio.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ = path.resolve(AQUI, '..');

export const URL_SITE = (process.env.ORZIO_URL || 'https://www.orzio.com.br').replace(/\/$/, '');

export const PASTAS = {
  saida: path.join(RAIZ, 'saida'),
  legendas: path.join(RAIZ, 'saida', 'legendas'),
  narracao: path.join(RAIZ, 'saida', 'narracao'),
  previas: path.join(RAIZ, 'saida', 'previas'),
  cache: path.join(RAIZ, 'saida', '.cache'),
  capturas: path.join(RAIZ, 'saida', '.cache', 'capturas'),
  graficos: path.join(RAIZ, 'saida', '.cache', 'graficos'),
  clipes: path.join(RAIZ, 'saida', '.cache', 'clipes'),
  verificacao: path.join(RAIZ, 'saida', '.cache', 'verificacao'),
  voz: path.join(RAIZ, 'voz'),
  trilha: path.join(RAIZ, 'trilha'),
  auth: path.join(RAIZ, '.auth'),
  fontes: path.join(AQUI, 'fontes'),
  modelosGraficos: path.join(AQUI, 'graficos'),
};

export const ARQ_SESSAO = path.join(PASTAS.auth, 'orzio.json');
export const ARQ_AMOSTRA_VOZ = path.join(PASTAS.voz, 'amostra.mp3');
export const ARQ_APROVACAO = path.join(PASTAS.previas, 'APROVADO');
export const ARQ_LOGO = path.join(PASTAS.cache, 'logo.png');

export const CORES = {
  verde: '#10B981',
  verdeEscuro: '#047857',
  fundo: '#070B0A',
  fundo2: '#0E1513',
  texto: '#FFFFFF',
  contorno: '#05090A',
};

export const FPS = 30;

// Vertical: viewport de celular 430x932 @3x, exportado em 1080x1920.
// A tela capturada (1290x2796) é mais alta que 9:16, então o vídeo mostra a
// janela 9:16 do topo (430x764 CSS) em tela cheia; a rolagem cobre o resto.
// Horizontal: viewport 1920x1080 @2x, para o zoom continuar nítido.
export const FORMATOS = {
  vertical: {
    id: 'vertical', sufixo: '9x16', largura: 1080, altura: 1920,
    viewport: { width: 430, height: 932 }, dsf: 3, mobile: true,
  },
  horizontal: {
    id: 'horizontal', sufixo: '16x9', largura: 1920, altura: 1080,
    viewport: { width: 1920, height: 1080 }, dsf: 2, mobile: false,
  },
};

// Altura (em px CSS) da janela visível no vídeo para cada formato.
export function janelaVisivelCss(formato) {
  const f = FORMATOS[formato];
  return Math.min(f.viewport.height, Math.round(f.viewport.width * f.altura / f.largura));
}

export const ROTAS_PROIBIDAS = ['/app/b3', '/app/admin', '/app/assinatura', '/app/perfil'];

// Rótulos que nunca podem ser clicados (comparação pelo início do texto do botão).
// A primeira linha é a lista do briefing; as demais são sinônimos de gravação.
export const BOTOES_PROIBIDOS = [
  'Salvar', 'Lançar', 'Cadastrar', 'Adicionar', 'Salvar venda', 'Paguei uma parcela',
  'Realizar', 'Sincronizar', 'Excluir', 'Sair', 'Cancelar assinatura',
  'Confirmar', 'Enviar', 'Registrar', 'Criar', 'Pagar', 'Quitar', 'Antecipar', 'Marcar como pago',
  'Apagar', 'Remover', 'Deletar', 'Arquivar', 'Duplicar', 'Desconectar', 'Conectar', 'Atualizar',
  'Resgatar', 'Vender', 'Comprar', 'Assinar', 'Processar', 'Upload', 'Logout',
];

const nomesExtras = (process.env.ORZIO_NOMES_OCULTOS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

export const MASCARA = {
  // "Ari" é o nome na conta; "Ary" cobre a grafia do e-mail. Sobrenomes ou
  // apelidos extras podem ser passados em ORZIO_NOMES_OCULTOS="Fulano,Ciclano".
  nomes: ['Ari', 'Ary', ...nomesExtras],
  nomeFicticio: 'Ana',
  email: 'voce@email.com',
  documento: '000.000.000-00',
  telefone: '+55 00 00000-0000',
  cartao: '•••• 1234',
  inicialAvatar: 'A',
};

export const ELEVENLABS = {
  api: 'https://api.elevenlabs.io',
  nomeVoz: 'Orzio - Narrador',
  modelo: 'eleven_multilingual_v2',
  formatoAudio: 'mp3_44100_128',
  // Tom animado e confiante, ritmo de redes sociais.
  ajustes: { stability: 0.38, similarity_boost: 0.85, style: 0.4, use_speaker_boost: true, speed: 1.06 },
};

// Folgas de cada cena em torno da fala (segundos).
export const FOLGA_INICIO = 0.15;
export const FOLGA_FIM = 0.35;
export const DURACAO_MIN_CARTAO_FINAL = 2.2;
// Estimativa de fala sem narração gerada (para prévias): caracteres por segundo.
export const CPS_ESTIMADO = 15.5;
