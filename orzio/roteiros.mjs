// Roteiros dos vídeos (seção 6 do briefing) descritos como dados.
//
// fala:   texto da narração. Use {exibido|falado} quando a pronúncia precisa de
//         ajuda: a legenda mostra "exibido" e a voz lê "falado".
// titulo: "Texto na tela". Palavras entre *asteriscos* ficam no verde da Orzio.
// visual: partes da cena, na ordem. O tempo de cada parte é proporcional ao
//         "peso" e a cena inteira dura o tempo do áudio (a voz manda).
//
// Partes:
//   app(rota, passos)     tela do app gravada com máscara
//   site(passos)          página inicial pública (orzio.com.br)
//   grafico(modelo, ops)  mockup/motion graphic renderizado (whatsapp, planilha,
//                         extrato, logo, final)
// Passos de app/site:
//   segurar(peso, zoom?)  pausa na tela atual, com zoom suave opcional
//   rolarAte(alvo, peso)  rolagem gradual até o elemento
//   rolar(fracao, peso)   rolagem gradual até uma fração da página
//   clicar(alvo, peso)    toque discreto + clique (só rótulos permitidos)
//   abrirMenu()           abre o menu lateral no celular
//   limpar(acao)          ação fora da gravação (fechar modal, voltar ao Pessoal)

const t = (...textos) => ({ textos });
const css = (...seletores) => ({ css: seletores });
const re = (padrao) => ({ regex: padrao });

const app = (rota, passos, extra = {}) => ({ tipo: 'app', rota, passos, peso: 1, ...extra });
const site = (passos, extra = {}) => ({ tipo: 'site', rota: '/', passos, peso: 1, ...extra });
const grafico = (modelo, opcoes = {}, extra = {}) => ({ tipo: 'grafico', modelo, opcoes, peso: 1, ...extra });

const segurar = (peso = 1, zoom = null) => ({ acao: 'segurar', peso, zoom });
const zoom = (alvo, escala = 1.35) => ({ alvo, escala });
const rolarAte = (alvo, peso = 1) => ({ acao: 'rolarAte', alvo, peso });
const rolar = (fracao, peso = 1) => ({ acao: 'rolar', fracao, peso });
const clicar = (alvo, peso = 0.35) => ({ acao: 'clicar', alvo, peso });
const abrirMenu = () => ({ acao: 'abrirMenu', peso: 0.3, apenas: 'vertical' });
const limpar = (acao, alvo) => ({ acao: 'limpar', limpar: acao, alvo, peso: 0 });

// Alvos usados em várias cenas. Cada um tenta os textos na ordem.
const A = {
  saldo: t('Saldo do mês', 'Saldo atual', 'Saldo'),
  entradas: t('Entradas', 'Receitas'),
  categorias: t('Gastos por categoria', 'Despesas por categoria', 'Por categoria', 'Categorias'),
  faturaAtual: t('Fatura atual', 'Fatura aberta', 'Fatura'),
  limite: t('Limite disponível', 'Limite usado', 'Limite'),
  lancFuturos: t('Lançamentos futuros', 'Próximas parcelas', 'Próximas faturas'),
  progressoParcela: re('\\b\\d{1,2}\\s*/\\s*\\d{1,2}\\b'),
  faltaPagar: t('Falta pagar', 'Restante', 'Falta', 'A pagar'),
  previsao12: t('Próximos 12 meses', '12 meses', 'Previsão'),
  patrimonio: t('Patrimônio total', 'Patrimônio'),
  composicao: t('Composição da carteira', 'Composição', 'Alocação'),
  proventosMes: t('Proventos por mês', 'Proventos mensais', 'Proventos', 'Dividendos'),
  ranking: t('Ranking de Dividendos', 'Ranking de dividendos', 'Ranking'),
  importarNota: t('Importar nota de corretagem', 'Importar nota', 'Importar'),
  apuracao: t('Apuração mensal', 'Apuração'),
  isencao: t('Isenção', 'Isento', 'R$ 20.000'),
  darf: t('DARF 6015', '6015', 'DARF'),
  metasProgresso: css('[role="progressbar"]', 'progress', '[class*="progress" i]'),
  sino: css('button:has(svg.lucide-bell)', 'button[aria-label*="otifica" i]', '[aria-label*="otifica" i]', 'button:has(svg[class*="bell" i])'),
  empresa: t('Empresa'),
  pessoal: t('Pessoal'),
  planos: t('Planos', 'Escolha seu plano', 'Preços'),
  preco3490: t('R$ 34,90', '34,90'),
  planoTotal: t('Plano Total', 'Total'),
};

const FINAL = (opcoes = {}, extra = {}) => grafico('final', { botao: 'Testar demonstração', ...opcoes }, extra);

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
        fala: 'Por isso eu criei a Orzio: a inteligência artificial que organiza sua vida financeira direto pelo WhatsApp.',
        titulo: 'Orzio: suas finanças pelo *WhatsApp*',
        visual: [
          grafico('logo', {}, { peso: 0.8 }),
          app('/app', [segurar(1, zoom(null, 1.08))], { peso: 1.2 }),
        ],
      },
      {
        fala: 'Passou o cartão? Manda um áudio, um texto ou até a foto da nota. A IA entende o valor, a categoria e a forma de pagamento, e lança tudo sozinha.',
        titulo: 'Áudio, texto ou *foto da nota*',
        visual: [grafico('whatsapp', { cena: 'mercado-credito' })],
      },
      {
        fala: 'Na mesma hora, seu painel atualiza. Saldo do mês, entradas, saídas e pra onde o dinheiro está indo, por categoria.',
        titulo: 'Painel em *tempo real*',
        visual: [app('/app', [
          segurar(1.2, zoom(A.saldo)),
          rolarAte(A.categorias, 0.8),
          segurar(1.3, zoom(A.categorias, 1.25)),
        ])],
      },
      {
        fala: 'Comprou parcelado? A Orzio mostra cada parcela, em qual fatura ela cai e quanto ainda falta pagar. Fatura e limite do cartão, sempre à vista.',
        titulo: 'Nunca mais se perca nas *parcelas*',
        visual: [
          app('/app/parcelamentos', [segurar(1, zoom(A.progressoParcela, 1.4)), rolar(0.35, 0.8), segurar(0.8)], { peso: 1.2 }),
          app('/app/cartoes', [segurar(1, zoom(A.faturaAtual)), rolarAte(A.lancFuturos, 0.7), segurar(0.8)]),
        ],
      },
      {
        fala: 'Contas de luz, internet, financiamento do carro ou do apartamento: tudo com alerta de vencimento e a previsão dos próximos {12|doze} meses.',
        titulo: 'Veja o *futuro* do seu dinheiro',
        visual: [app('/app/contas', [segurar(1), rolarAte(A.previsao12, 0.8), segurar(1.4, zoom(A.previsao12, 1.2))])],
      },
      {
        fala: 'E se você investe, a Orzio vai além. Acompanha sua carteira com cotações, renda fixa e Tesouro, mostra seus dividendos e ainda calcula o Imposto de Renda das suas vendas, com o {DARF|dárfi} pronto.',
        titulo: 'Carteira + dividendos + *IR*',
        visual: [
          app('/app/investimentos', [
            segurar(1, zoom(A.patrimonio)),
            rolarAte(A.composicao, 0.6),
            segurar(0.7),
            rolarAte(A.proventosMes, 0.6),
            segurar(0.8),
          ], { peso: 1.6 }),
          app('/app/imposto-renda', [segurar(1, zoom(A.darf, 1.3))]),
        ],
      },
      {
        fala: 'Tem empresa? Com um clique você troca entre as finanças pessoais e as do seu negócio.',
        titulo: 'Pessoal e Empresa *num clique*',
        visual: [app('/app', [
          abrirMenu(),
          segurar(0.8, zoom(A.empresa, 1.3)),
          clicar(A.empresa),
          segurar(1.4),
          limpar('voltarPessoal'),
        ])],
      },
      {
        fala: 'Defina suas metas, acompanhe o progresso e receba alertas antes de cada vencimento.',
        titulo: '*Metas* e alertas',
        visual: [app('/app/metas', [
          segurar(1.1, zoom(A.metasProgresso, 1.25)),
          clicar(A.sino),
          segurar(1.2),
          limpar('fechar'),
        ])],
      },
      {
        fala: 'Tudo isso a partir de {R$ 34,90|trinta e quatro e noventa} por mês, com 7 dias de garantia. Não gostou, cancela sem multa.',
        titulo: 'A partir de *R$ 34,90/mês* · 7 dias de garantia',
        visual: [site([rolarAte(A.preco3490, 0.8), segurar(1.6, zoom(A.preco3490, 1.3))])],
      },
      {
        fala: 'Clique no link, teste a demonstração grátis e veja como é ter o controle do seu dinheiro numa simples mensagem.',
        titulo: 'Teste grátis no *link da bio*',
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
      {
        fala: 'Eu organizo minhas finanças sem abrir nenhum app.',
        titulo: 'Controle financeiro *sem abrir app*',
        visual: [grafico('whatsapp', { cena: 'segurando-audio' })],
      },
      {
        fala: 'Gastei no mercado? Mando um áudio no WhatsApp e pronto. A IA entende, classifica e lança.',
        titulo: 'Gastei 89,90 no mercado *✓ Lançado*',
        visual: [grafico('whatsapp', { cena: 'mercado-credito' })],
      },
      {
        fala: 'Também funciona com texto ou com a foto da notinha.',
        titulo: 'Áudio · texto · *foto da nota*',
        visual: [grafico('whatsapp', { cena: 'foto-nota' })],
      },
      {
        fala: 'E no painel eu vejo tudo atualizado: quanto entrou, quanto saiu e onde estou gastando mais.',
        titulo: 'Tudo atualizado *na hora*',
        visual: [app('/app', [segurar(1.1, zoom(A.entradas, 1.3)), rolarAte(A.categorias, 0.7), segurar(1.2, zoom(A.categorias, 1.25))])],
      },
      {
        fala: 'Chama Orzio. Testa grátis no link da bio.',
        titulo: 'Orzio · teste grátis no *link da bio*',
        visual: [FINAL()],
      },
    ],
  },

  // 6.3 Reels/TikTok 2 — "Quanto ainda falta pagar?"
  {
    id: 'reels_2_parcelas',
    formatos: ['vertical'],
    arquivo: () => 'reels_2_parcelas.mp4',
    cenas: [
      {
        fala: 'Você sabe quanto ainda falta pagar de tudo que parcelou?',
        titulo: 'Quanto falta pagar das suas *parcelas*?',
        visual: [app('/app/parcelamentos', [segurar(0.8), rolar(0.3, 1)])],
      },
      {
        fala: 'Eu também não sabia. Agora a Orzio me mostra cada compra parcelada, quantas parcelas já paguei e quanto ainda falta.',
        titulo: 'Parcela *por parcela*',
        visual: [app('/app/parcelamentos', [segurar(1.2, zoom(A.progressoParcela, 1.45)), segurar(1.2, zoom(A.faltaPagar, 1.35))])],
      },
      {
        fala: 'No cartão, eu vejo a fatura atual, o limite usado e as parcelas que vão cair nos próximos meses.',
        titulo: 'Fatura, limite e *próximas parcelas*',
        visual: [app('/app/cartoes', [segurar(1, zoom(A.faturaAtual)), segurar(0.8, zoom(A.limite)), rolarAte(A.lancFuturos, 0.7), segurar(1)])],
      },
      {
        fala: 'E ainda tenho a previsão dos próximos {12|doze} meses, com contas e financiamentos juntos. Sem susto no fim do mês.',
        titulo: 'Sem susto no *fim do mês*',
        visual: [app('/app/contas', [rolarAte(A.previsao12, 0.7), segurar(1.6, zoom(A.previsao12, 1.2))])],
      },
      {
        fala: 'Pra lançar, é só mandar no WhatsApp. Orzio, teste grátis no link da bio.',
        titulo: 'Orzio · teste grátis no *link da bio*',
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
      {
        fala: 'Você investe em ações e ainda calcula o imposto na mão?',
        titulo: 'IR das ações na mão? *Nunca mais*',
        visual: [app('/app/imposto-renda', [segurar(1, zoom(A.darf, 1.3))])],
      },
      {
        fala: 'Na Orzio eu acompanho minha carteira inteira: ações, {FIIs|fiis}, ETFs, Tesouro e CDB, com cotação e preço médio.',
        titulo: 'Carteira completa *num lugar*',
        visual: [app('/app/investimentos', [segurar(1, zoom(A.patrimonio)), rolarAte(A.composicao, 0.7), segurar(1.1)])],
      },
      {
        fala: 'Pra cadastrar, é só subir a nota de corretagem. Ela lê os ativos sozinha.',
        titulo: 'Importa a *nota de corretagem*',
        visual: [app('/app/investimentos', [segurar(0.6, zoom(A.importarNota, 1.3)), clicar(A.importarNota), segurar(1.5), limpar('fechar')])],
      },
      {
        fala: 'Eu vejo meus dividendos mês a mês e ainda tenho um ranking dos maiores pagadores do ano.',
        titulo: 'Dividendos e *ranking*',
        visual: [app('/app/investimentos', [rolarAte(A.proventosMes, 0.6), segurar(1, zoom(A.proventosMes, 1.2)), rolarAte(A.ranking, 0.6), segurar(1, zoom(A.ranking, 1.2))])],
      },
      {
        fala: 'Quando eu vendo, ela calcula o imposto do mês, aplica a isenção de {20 mil|vinte mil} e já mostra o {DARF|dárfi}.',
        titulo: 'IR calculado + *DARF*',
        visual: [app('/app/imposto-renda', [
          rolarAte(A.apuracao, 0.5), segurar(0.9, zoom(A.apuracao, 1.25)),
          rolarAte(A.isencao, 0.5), segurar(0.8),
          rolarAte(A.darf, 0.5), segurar(1, zoom(A.darf, 1.35)),
        ])],
      },
      {
        fala: 'Orzio, controle financeiro e investimentos no mesmo app. Teste grátis no link da bio.',
        titulo: 'Orzio · teste grátis no *link da bio*',
        visual: [site([rolarAte(A.planoTotal, 0.6), segurar(1, zoom(A.planoTotal, 1.25))], { peso: 1.2 }), FINAL()],
      },
    ],
  },

  // 6.5 Stories (até 15 s cada). Cada story é um vídeo separado e termina com o cartão final.
  {
    id: 'stories_1',
    formatos: ['vertical'],
    arquivo: () => 'stories_1.mp4',
    stories: true,
    cenas: [
      {
        fala: 'Sinceramente: você sabe quanto gastou esse mês?',
        titulo: null,
        espacoCentro: true, // enquete "Sei exatamente / Nem ideia"
        visual: [grafico('extrato', { espacoCentro: true })],
      },
      { fala: '', titulo: null, visual: [FINAL({ curto: true })] },
    ],
  },
  {
    id: 'stories_2',
    formatos: ['vertical'],
    arquivo: () => 'stories_2.mp4',
    stories: true,
    cenas: [
      {
        fala: 'Eu resolvi isso mandando áudio no WhatsApp. A IA lança tudo pra mim.',
        titulo: 'Lançou em *3 segundos*',
        visual: [grafico('whatsapp', { cena: 'mercado-50' })],
      },
      { fala: '', titulo: null, visual: [FINAL({ curto: true })] },
    ],
  },
  {
    id: 'stories_3',
    formatos: ['vertical'],
    arquivo: () => 'stories_3.mp4',
    stories: true,
    cenas: [
      {
        fala: 'E o painel mostra tudo atualizado na hora.',
        titulo: 'Painel em *tempo real*',
        visual: [app('/app', [segurar(1, zoom(A.saldo)), rolarAte(A.categorias, 0.6), segurar(1)])],
      },
      { fala: '', titulo: null, visual: [FINAL({ curto: true })] },
    ],
  },
  {
    id: 'stories_4',
    formatos: ['vertical'],
    arquivo: () => 'stories_4.mp4',
    stories: true,
    cenas: [
      {
        fala: 'Toca no link e testa grátis.',
        titulo: '*7 dias* de garantia',
        espacoInferior: true, // figurinha de link
        visual: [FINAL({ espacoInferior: true })],
      },
    ],
  },
];

export function buscarVideo(id) {
  const v = VIDEOS.find((x) => x.id === id);
  if (!v) throw new Error(`Vídeo desconhecido: ${id}. Opções: ${VIDEOS.map((x) => x.id).join(', ')}`);
  return v;
}

// Separa a fala em texto exibido (legenda) e texto falado (voz), mantendo o
// mapa de posições para alinhar as legendas aos tempos da narração.
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
