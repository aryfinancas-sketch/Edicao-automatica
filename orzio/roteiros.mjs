// Roteiros dos vídeos (seção 6 do briefing) descritos como dados.
//
// fala:   texto da narração. Use {exibido|falado} quando a voz lê diferente da
//         legenda (ex.: legenda "R$ 34,90", voz "trinta e quatro e noventa").
// titulo: "Texto na tela". Palavras entre *asteriscos* ficam no verde da Orzio.
// visual: partes da cena, na ordem. Cada parte recebe tempo proporcional ao
//         "peso"; a cena inteira dura o áudio da fala (a voz manda).
//
// Partes:
//   tela(planos)          prints do app/site com câmera (zoom, movimento, destaque)
//   grafico(modelo, ops)  mockup/motion graphic (whatsapp, planilha, extrato, logo, final)
//
// Plano de câmera: plano(arquivo, { de, para, destaque, toque, peso, v, h })
//   de/para:  [cx, cy, larguraVertical, larguraHorizontal] em pixels do print
//             (prints de 1536x695). A altura sai da proporção do vídeo.
//   v / h:    { de, para } só para o vertical ou só para o horizontal.
//   destaque: [x, y, w, h] contorno verde no elemento citado.
//   toque:    [x, y] toque discreto (ex.: clique no botão Empresa).

const T = (nome) => `telas/${nome}.jpg`;

const tela = (planos, extra = {}) => ({ tipo: 'tela', planos, peso: 1, ...extra });
const grafico = (modelo, opcoes = {}, extra = {}) => ({ tipo: 'grafico', modelo, opcoes, peso: 1, ...extra });
const plano = (arquivo, op) => ({ imagem: T(arquivo), peso: 1, ...op });
const FINAL = (opcoes = {}, extra = {}) => grafico('final', { botao: 'Testar demonstração', ...opcoes }, extra);

// Enquadramentos e destaques reaproveitados.
const GERAL = [895, 382, 640, 1240];
const P = {
  dashTopo: '01_app/01_dashboard_topo',
  dashCateg: '01_app/02_dashboard_fluxo_e_categorias',
  cartoes: '01_app/07_cartoes_fatura',
  cartoesFuturos: '01_app/09_cartoes_lancamentos_futuros',
  contas: '01_app/10_contas_a_pagar',
  contas12: '01_app/11_contas_fluxo_12_meses',
  parcTopo: '01_app/13_parcelamentos_topo',
  parcLista: '01_app/14_parcelamentos_lista',
  invResumo: '01_app/15_investimentos_resumo',
  invComp: '01_app/16_investimentos_evolucao_composicao',
  invCarteira: '01_app/18_investimentos_carteira',
  invProventos: '01_app/19_investimentos_proventos_ranking',
  ir: '01_app/21_imposto_de_renda',
  metas: '01_app/22_metas',
  notif: '01_app/30_notificacoes',
  empresa: '01_app/31_visao_empresa',
  importar: '02_formularios/03_importar_nota_corretagem',
  planos: '03_site/04_site_planos',
};

const PLANO = {
  saldo: plano(P.dashTopo, { de: GERAL, para: [433, 253, 430, 900], destaque: [289, 166, 288, 176] }),
  entradasSaidas: plano(P.dashTopo, { de: [433, 253, 430, 900], para: [890, 253, 600, 1100], destaque: [594, 166, 595, 176] }),
  categorias: plano(P.dashCateg, { de: [1298, 335, 560, 1000], para: [1298, 335, 440, 820], destaque: [1104, 141, 390, 391] }),
  aindaPagar: plano(P.parcTopo, { de: GERAL, para: [1298, 160, 460, 900], destaque: [1104, 94, 390, 80] }),
  parcelaProgresso: plano(P.parcLista, {
    destaque: [289, 136, 1205, 96],
    v: { de: [560, 184, 560], para: [1150, 184, 560] },
    h: { de: [890, 230, 0, 1240], para: [890, 184, 0, 1000] },
  }),
  fatura: plano(P.cartoes, { de: [700, 300, 640, 1240], para: [483, 480, 440, 900], destaque: [289, 374, 389, 240] }),
  futuros: plano(P.cartoesFuturos, {
    destaque: [289, 424, 1205, 246],
    v: { de: [600, 545, 600], para: [1150, 545, 600] },
    h: { de: [890, 450, 0, 1240], para: [890, 545, 0, 1050] },
  }),
  contasAlerta: plano(P.contas, { de: GERAL, para: [700, 190, 560, 1050], destaque: [288, 95, 440, 45] }),
  contas12: plano(P.contas12, {
    destaque: [289, 161, 1205, 408],
    v: { de: [600, 365, 640], para: [1180, 365, 640] },
    h: { de: [890, 365, 0, 1240], para: [890, 365, 0, 1100] },
  }),
  patrimonio: plano(P.invResumo, { de: GERAL, para: [738, 289, 460, 900], destaque: [594, 231, 288, 117] }),
  composicao: plano(P.invComp, { de: [1100, 300, 640, 1240], para: [1298, 300, 440, 860], destaque: [1104, 62, 390, 498] }),
  rendaFixa: plano(P.invComp, { de: [895, 420, 640, 1240], para: [700, 630, 560, 1050], destaque: [289, 586, 1205, 109] }),
  carteira: plano(P.invCarteira, {
    destaque: [289, 140, 1185, 340],
    v: { de: [560, 300, 600], para: [1100, 300, 600] },
    h: { de: [890, 300, 0, 1240], para: [880, 300, 0, 1100] },
  }),
  proventos: plano(P.invProventos, { de: GERAL, para: [890, 360, 640, 1150], destaque: [289, 261, 1205, 188] }),
  ranking: plano(P.invProventos, { de: [890, 360, 640, 1150], para: [700, 560, 560, 1050], destaque: [289, 474, 1205, 90] }),
  irTopo: plano(P.ir, { de: GERAL, para: [890, 280, 640, 1240], destaque: [289, 263, 1205, 117] }),
  irIsencao: plano(P.ir, { de: [890, 280, 640, 1240], para: [700, 190, 600, 1100], destaque: [289, 166, 1205, 72] }),
  irDarf: plano(P.ir, { de: [890, 330, 640, 1240], para: [600, 450, 560, 1000], destaque: [289, 406, 1205, 70] }),
  importarBotao: plano(P.invResumo, { de: GERAL, para: [1300, 200, 520, 1000], destaque: [1346, 162, 148, 40], toque: [1420, 182], toque_janela: [0.55, 0.85] }),
  importarModal: plano(P.importar, { de: [890, 330, 640, 1240], para: [890, 330, 560, 960], destaque: [636, 84, 510, 489] }),
  toggleEmpresa: plano(P.dashTopo, { de: [700, 300, 600, 1150], para: [230, 200, 420, 820], destaque: [20, 89, 215, 39], toque: [179, 108], toque_janela: [0.55, 0.9] }),
  visaoEmpresa: plano(P.empresa, { de: [230, 200, 420, 820], para: [890, 280, 640, 1240], destaque: [594, 166, 595, 176] }),
  metas: plano(P.metas, { de: GERAL, para: [588, 270, 560, 1000], destaque: [289, 166, 598, 209] }),
  notificacoes: plano(P.notif, { de: [1000, 250, 640, 1240], para: [1286, 190, 470, 860], destaque: [1128, 62, 318, 225], toque: [1428, 34], toque_janela: [0.02, 0.25] }),
  precoPessoal: plano(P.planos, { de: [763, 330, 640, 1240], para: [567, 470, 480, 900], destaque: [380, 352, 374, 180] }),
  planoTotal: plano(P.planos, { de: [763, 330, 640, 1240], para: [958, 480, 480, 900], destaque: [772, 352, 374, 200] }),
  dashGeral: plano(P.dashTopo, { de: [895, 382, 640, 1240], para: [700, 300, 560, 1100] }),
};

export const VIDEOS = [
  // 6.1 VSL principal (~2 min), 9:16 e 16:9
  {
    id: 'vsl_principal',
    formatos: ['vertical', 'horizontal'],
    arquivo: (formato) => `vsl_principal_${formato === 'vertical' ? '9x16' : '16x9'}.mp4`,
    cenas: [
      {
        fala: 'Você sabe pra onde foi o seu dinheiro esse mês? Se a resposta é "mais ou menos", esse vídeo é pra você.',
        titulo: 'Pra onde foi seu *dinheiro*?',
        visual: [grafico('whatsapp', { cena: 'gravando-audio' })],
      },
      {
        fala: 'Planilha dá preguiça. App de finanças pede dez cliques pra anotar um cafezinho. Aí você desiste na segunda semana.',
        titulo: 'Planilha? Formulário? *Desisti.*',
        visual: [grafico('planilha')],
      },
      {
        fala: 'Por isso existe a Orzio: a inteligência artificial que organiza sua vida financeira direto pelo WhatsApp.',
        titulo: 'Orzio: suas finanças pelo *WhatsApp*',
        visual: [grafico('logo', {}, { peso: 0.8 }), tela([PLANO.dashGeral], { peso: 1.2 })],
      },
      {
        fala: 'Passou o cartão? Manda um áudio, um texto ou até a foto da nota. A IA entende o valor, a categoria e a forma de pagamento, e lança tudo sozinha.',
        titulo: 'Áudio, texto ou *foto da nota*',
        visual: [grafico('whatsapp', { cena: 'mercado-credito' })],
      },
      {
        fala: 'Na mesma hora, seu painel atualiza. Saldo do mês, entradas, saídas e pra onde o dinheiro está indo, por categoria.',
        titulo: 'Painel em *tempo real*',
        visual: [tela([PLANO.saldo, PLANO.entradasSaidas, { ...PLANO.categorias, peso: 1.2 }])],
      },
      {
        fala: 'Comprou parcelado? A Orzio mostra cada parcela, em qual fatura ela cai e quanto ainda falta pagar. Fatura e limite do cartão, sempre à vista.',
        titulo: 'Nunca mais se perca nas *parcelas*',
        visual: [tela([PLANO.parcelaProgresso, PLANO.futuros, PLANO.aindaPagar, PLANO.fatura])],
      },
      {
        fala: 'Contas de luz, internet, financiamento do carro ou do apartamento: tudo com alerta de vencimento e a previsão dos próximos {12|doze} meses.',
        titulo: 'Veja o *futuro* do seu dinheiro',
        visual: [tela([PLANO.contasAlerta, { ...PLANO.contas12, peso: 1.4 }])],
      },
      {
        fala: 'E se você investe, a Orzio vai além. Acompanha sua carteira com cotações, renda fixa e Tesouro, mostra seus dividendos e ainda calcula o Imposto de Renda das suas vendas, com o DARF pronto.',
        titulo: 'Carteira + dividendos + *IR*',
        visual: [tela([PLANO.patrimonio, PLANO.composicao, PLANO.rendaFixa, PLANO.ranking, PLANO.irDarf])],
      },
      {
        fala: 'Tem empresa? Com um clique você troca entre as finanças pessoais e as do seu negócio.',
        titulo: 'Pessoal e Empresa *num clique*',
        visual: [tela([PLANO.toggleEmpresa, PLANO.visaoEmpresa])],
      },
      {
        fala: 'Defina suas metas, acompanhe o progresso e receba alertas antes de cada vencimento.',
        titulo: '*Metas* e alertas',
        visual: [tela([PLANO.metas, PLANO.notificacoes])],
      },
      {
        fala: 'Tudo isso a partir de {R$ 34,90|trinta e quatro e noventa} por mês, com {7|sete} dias de garantia. Não gostou, cancela sem multa.',
        titulo: 'A partir de *R$ 34,90/mês* · 7 dias de garantia',
        visual: [tela([PLANO.precoPessoal])],
      },
      {
        fala: 'Clique no link, teste a demonstração grátis e veja como é ter o controle do seu dinheiro numa simples mensagem.',
        titulo: null, // o cartão final já traz "Teste grátis no link da bio"
        visual: [FINAL()],
      },
    ],
  },

  // 6.2 Reels/TikTok 1 — "Só mandei um áudio"
  {
    id: 'reels_1_whatsapp',
    formatos: ['vertical'],
    arquivo: () => 'reels_1_whatsapp.mp4',
    cenas: [
      { fala: 'Eu organizo minhas finanças sem abrir nenhum app.', titulo: 'Controle financeiro *sem abrir app*', respiro: 1.0, visual: [grafico('whatsapp', { cena: 'segurando-audio' })] },
      { fala: 'Gastei no mercado? Mando um áudio no WhatsApp e pronto. A IA entende, classifica e lança.', titulo: 'Gastei 89,90 no mercado *✓ Lançado*', respiro: 2.0, visual: [grafico('whatsapp', { cena: 'mercado-credito' })] },
      { fala: 'Também funciona com texto ou com a foto da notinha.', titulo: 'Áudio · texto · *foto da nota*', respiro: 2.0, visual: [grafico('whatsapp', { cena: 'foto-nota' })] },
      { fala: 'E no painel eu vejo tudo atualizado: quanto entrou, quanto saiu e onde estou gastando mais.', titulo: 'Tudo atualizado *na hora*', respiro: 1.0, visual: [tela([PLANO.entradasSaidas, PLANO.categorias])] },
      { fala: 'Chama Orzio. Testa grátis no link da bio.', titulo: null, respiro: 1.0, visual: [FINAL()] },
    ],
  },

  // 6.3 Reels/TikTok 2 — "Quanto ainda falta pagar?"
  {
    id: 'reels_2_parcelas',
    formatos: ['vertical'],
    arquivo: () => 'reels_2_parcelas.mp4',
    cenas: [
      { fala: 'Você sabe quanto ainda falta pagar de tudo que parcelou?', titulo: 'Quanto falta pagar das suas *parcelas*?', visual: [tela([PLANO.aindaPagar])] },
      {
        fala: 'Eu também não sabia. Agora a Orzio me mostra cada compra parcelada, quantas parcelas já paguei e quanto ainda falta.',
        titulo: 'Parcela *por parcela*',
        visual: [tela([{ ...PLANO.parcelaProgresso, peso: 1.5 }, PLANO.aindaPagar])],
      },
      { fala: 'No cartão, eu vejo a fatura atual, o limite usado e as parcelas que vão cair nos próximos meses.', titulo: 'Fatura, limite e *próximas parcelas*', visual: [tela([PLANO.fatura, PLANO.futuros])] },
      { fala: 'E ainda tenho a previsão dos próximos {12|doze} meses, com contas e financiamentos juntos. Sem susto no fim do mês.', titulo: 'Sem susto no *fim do mês*', visual: [tela([PLANO.contas12])] },
      {
        fala: 'Pra lançar, é só mandar no WhatsApp. Orzio, teste grátis no link da bio.',
        titulo: 'É só mandar no *WhatsApp*',
        visual: [grafico('whatsapp', { cena: 'parcelado-3x' }, { peso: 1.3 }), FINAL()],
      },
    ],
  },

  // 6.4 Reels/TikTok 3 — "Investe? Então para de sofrer com o IR"
  {
    id: 'reels_3_investidor',
    formatos: ['vertical'],
    arquivo: () => 'reels_3_investidor.mp4',
    cenas: [
      { fala: 'Você investe em ações e ainda calcula o imposto na mão?', titulo: 'IR das ações na mão? *Nunca mais*', visual: [tela([PLANO.irTopo])] },
      {
        fala: 'Na Orzio eu acompanho minha carteira inteira: ações, fundos imobiliários, ETFs, Tesouro e CDB, com cotação e preço médio.',
        titulo: 'Carteira completa *num lugar*',
        visual: [tela([PLANO.patrimonio, PLANO.composicao, PLANO.carteira])],
      },
      { fala: 'Pra cadastrar, é só subir a nota de corretagem. Ela lê os ativos sozinha.', titulo: 'Importa a *nota de corretagem*', visual: [tela([PLANO.importarBotao, { ...PLANO.importarModal, peso: 1.3 }])] },
      { fala: 'Eu vejo meus dividendos mês a mês e ainda tenho um ranking dos maiores pagadores do ano.', titulo: 'Dividendos e *ranking*', visual: [tela([PLANO.proventos, PLANO.ranking])] },
      {
        fala: 'Quando eu vendo, ela calcula o imposto do mês, aplica a isenção de {20 mil|vinte mil} e já mostra o DARF.',
        titulo: 'IR calculado + *DARF*',
        visual: [tela([PLANO.irIsencao, PLANO.irDarf])],
      },
      {
        fala: 'Orzio, controle financeiro e investimentos no mesmo app. Teste grátis no link da bio.',
        titulo: 'Plano Total: *tudo num app*',
        visual: [tela([PLANO.planoTotal], { peso: 1.2 }), FINAL()],
      },
    ],
  },

  // 6.5 Stories (até 15 s). Cada story é um vídeo e termina com o cartão final.
  {
    id: 'stories_1',
    formatos: ['vertical'],
    arquivo: () => 'stories_1.mp4',
    stories: true,
    cenas: [
      { fala: 'Sinceramente: você sabe quanto gastou esse mês?', titulo: null, espacoCentro: true, visual: [grafico('extrato', { espacoCentro: true })] },
      { fala: '', titulo: null, visual: [FINAL({ curto: true })] },
    ],
  },
  {
    id: 'stories_2',
    formatos: ['vertical'],
    arquivo: () => 'stories_2.mp4',
    stories: true,
    cenas: [
      { fala: 'Eu resolvi isso mandando áudio no WhatsApp. A IA lança tudo pra mim.', titulo: 'Lançou em *3 segundos*', visual: [grafico('whatsapp', { cena: 'mercado-50' })] },
      { fala: '', titulo: null, visual: [FINAL({ curto: true })] },
    ],
  },
  {
    id: 'stories_3',
    formatos: ['vertical'],
    arquivo: () => 'stories_3.mp4',
    stories: true,
    cenas: [
      { fala: 'E o painel mostra tudo atualizado na hora.', titulo: 'Painel em *tempo real*', visual: [tela([PLANO.saldo, PLANO.categorias])] },
      { fala: '', titulo: null, visual: [FINAL({ curto: true })] },
    ],
  },
  {
    id: 'stories_4',
    formatos: ['vertical'],
    arquivo: () => 'stories_4.mp4',
    stories: true,
    cenas: [
      { fala: 'Toca no link e testa grátis.', titulo: '*7 dias* de garantia', espacoInferior: true, visual: [FINAL({ espacoInferior: true })] },
    ],
  },
];

// Ordem das falas no MP3 único gerado na ElevenLabs (separadas por pausas).
export function falasEmOrdem() {
  const r = [];
  for (const v of VIDEOS) v.cenas.forEach((c, i) => { if (c.fala) r.push({ video: v.id, indice: i }); });
  return r;
}

export function buscarVideo(id) {
  const v = VIDEOS.find((x) => x.id === id);
  if (!v) throw new Error(`Vídeo desconhecido: ${id}. Opções: ${VIDEOS.map((x) => x.id).join(', ')}`);
  return v;
}

// Separa a fala em texto exibido (legenda) e texto falado (voz).
export function analisarFala(fala) {
  const tokens = [];
  const re = /\{([^|}]+)\|([^}]+)\}/g;
  let ultimo = 0;
  let m;
  while ((m = re.exec(fala))) {
    if (m.index > ultimo) tokens.push({ exibido: fala.slice(ultimo, m.index), falado: fala.slice(ultimo, m.index) });
    tokens.push({ exibido: m[1], falado: m[2] });
    ultimo = re.lastIndex;
  }
  if (ultimo < fala.length) tokens.push({ exibido: fala.slice(ultimo), falado: fala.slice(ultimo) });
  return {
    exibido: tokens.map((x) => x.exibido).join(''),
    falado: tokens.map((x) => x.falado).join(''),
    tokens,
  };
}
