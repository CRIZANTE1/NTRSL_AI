const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign, LevelFormat
} = require('docx');
const fs = require('fs');

// ── Configurações ────────────────────────────────────────────────────────────
const FONT = "Arial";
const SZ   = 24; // 12pt
const SZ10 = 20; // 10pt
const SZ9  = 18; //  9pt
const SP = { before: 100, after: 100 };
const SP_HEADING = { before: 200, after: 60 };

const bLight = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const bDark  = { style: BorderStyle.SINGLE, size: 6, color: "1F3864" };
const bNone  = { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" };
const bCell  = { top: bLight, bottom: bLight, left: bLight, right: bLight };
const bHead  = { top: bDark,  bottom: bDark,  left: bDark,  right: bDark  };
const mg  = { top: 80,  bottom: 80,  left: 150, right: 150 };

// ── Helpers de texto ────────────────────────────────────────────────────────
const T  = (text, opts = {}) => new TextRun({ text, font: FONT, size: SZ,   ...opts });
const TI = (text, opts = {}) => new TextRun({ text, font: FONT, size: SZ10, ...opts });
const T9 = (text, opts = {}) => new TextRun({ text, font: FONT, size: SZ9,  ...opts });

function p(runs, align = AlignmentType.JUSTIFIED, spacing = SP) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [runs],
    alignment: align,
    spacing,
  });
}

function heading(text) {
  return new Paragraph({
    children: [T(text, { bold: true, color: "1F3864", size: 24 })],
    alignment: AlignmentType.LEFT,
    spacing: SP_HEADING,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F3864", space: 1 } },
  });
}

function instruction(text) {
  return new Paragraph({
    children: [T(text, { italics: true, color: "595959", size: SZ10 })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 60, after: 60 },
  });
}

function check(label, checked) {
  return p([T(checked ? "(X) " : "(    ) "), T(label)], AlignmentType.LEFT, { before: 40, after: 40 });
}

function subheading(text) {
  return new Paragraph({
    children: [T(text, { bold: true })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 160, after: 60 },
  });
}

// ── Helpers de fluxograma ───────────────────────────────────────────────────
const bFC = (c) => ({
  top:    { style: BorderStyle.SINGLE, size: 6, color: c },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: c },
  left:   { style: BorderStyle.SINGLE, size: 6, color: c },
  right:  { style: BorderStyle.SINGLE, size: 6, color: c },
});

/**
 * Cria uma célula de caixa do fluxograma.
 * textLines: string ou string[] — primeira linha fica em negrito.
 */
function fcBox(textLines, fill, textColor, width, { span = 1, size = SZ9 } = {}) {
  const lines = Array.isArray(textLines) ? textLines : [textLines];
  return new TableCell({
    borders: bFC(fill === "FFFFFF" ? "CCCCCC" : fill),
    width: { size: width, type: WidthType.DXA },
    columnSpan: span,
    margins: { top: 100, bottom: 100, left: 160, right: 160 },
    shading: { fill, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: lines.map((line, i) =>
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: i === 0 ? 30 : 8, after: i === lines.length - 1 ? 30 : 8 },
        children: [T9(line, { bold: i === 0, color: textColor, size })]
      })
    ),
  });
}

/** Célula com seta (sem borda). */
function fcArrow(width, { span = 1, dir = "▼" } = {}) {
  return new TableCell({
    borders: { top: bNone, bottom: bNone, left: bNone, right: bNone },
    width: { size: width, type: WidthType.DXA },
    columnSpan: span,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 20, after: 20 },
      children: [T9(dir, { color: "AAAAAA", size: SZ10 })]
    })],
  });
}

/** Célula invisível de espaçamento. */
function fcEmpty(width, { span = 1 } = {}) {
  return new TableCell({
    borders: { top: bNone, bottom: bNone, left: bNone, right: bNone },
    width: { size: width, type: WidthType.DXA },
    columnSpan: span,
    shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
    children: [new Paragraph({ children: [T9("")] })],
  });
}

// ── Diagrama 1: Fluxo de Inicialização do App ──────────────────────────────
// Colunas: [spacer 900 | metade A 3413 | divisor 400 | metade B 3413 | spacer 900]
const W_SIDE = 900;
const W_MID  = 7226;
const W_HALF = 3413;
const W_DIV  = 400;

function initFlowTable() {
  const TOTAL = 9026;

  function boxRow(lines, fill, textColor) {
    return new TableRow({ children: [
      fcEmpty(W_SIDE),
      fcBox(lines, fill, textColor, W_MID, { span: 3, size: SZ9 }),
      fcEmpty(W_SIDE),
    ]});
  }
  function arrowRow() {
    return new TableRow({ children: [
      fcEmpty(W_SIDE),
      fcArrow(W_MID, { span: 3 }),
      fcEmpty(W_SIDE),
    ]});
  }
  function branchRow() {
    return new TableRow({ children: [
      fcEmpty(W_SIDE),
      fcBox(
        ["❌  Configuração ausente",
         "Tela de aviso exibida:",
         "o app não pode funcionar",
         "sem conexão ao servidor"],
        "FDECEA", "C62828", W_HALF, { size: SZ9 }
      ),
      fcArrow(W_DIV, { dir: "│" }),
      fcBox(
        ["✔  Tudo certo",
         "App continua",
         "carregando normalmente"],
        "E8F5E9", "1B5E20", W_HALF, { size: SZ9 }
      ),
      fcEmpty(W_SIDE),
    ]});
  }

  return new Table({
    width: { size: TOTAL, type: WidthType.DXA },
    columnWidths: [W_SIDE, W_HALF, W_DIV, W_HALF, W_SIDE],
    rows: [
      // Passo 1
      boxRow(
        ["PASSO 1  —  Usuário abre o aplicativo no celular",
         "O app verifica se está corretamente conectado ao servidor antes de exibir qualquer tela"],
        "455A64", "FFFFFF"
      ),
      arrowRow(),
      // Passo 2 (branch)
      new TableRow({ children: [
        fcEmpty(W_SIDE),
        fcBox(["PASSO 2  —  Verificação de conexão com o servidor", "Dois caminhos possíveis:"], "607D8B", "FFFFFF", W_MID, { span: 3, size: SZ9 }),
        fcEmpty(W_SIDE),
      ]}),
      new TableRow({ children: [
        fcEmpty(W_SIDE),
        fcArrow(W_HALF),
        fcEmpty(W_DIV),
        fcArrow(W_HALF),
        fcEmpty(W_SIDE),
      ]}),
      branchRow(),
      // Caminho OK continua
      new TableRow({ children: [
        fcEmpty(W_SIDE),
        fcEmpty(W_HALF),
        fcArrow(W_DIV, { dir: "▼" }),
        fcEmpty(W_HALF),
        fcEmpty(W_SIDE),
      ]}),
      new TableRow({ children: [
        fcEmpty(W_SIDE),
        fcEmpty(W_HALF),
        fcBox(
          ["PASSO 3  —  Serviços essenciais carregados",
           "Sistema de login e autenticação do usuário",
           "Sincronização de dados com o servidor",
           "Monitoramento de erros e segurança"],
          "3949AB", "FFFFFF", W_HALF, { size: SZ9 }
        ),
        fcEmpty(W_HALF),
        fcEmpty(W_SIDE),
      ]}),
      new TableRow({ children: [
        fcEmpty(W_SIDE),
        fcEmpty(W_HALF),
        fcArrow(W_DIV, { dir: "▼" }),
        fcEmpty(W_HALF),
        fcEmpty(W_SIDE),
      ]}),
      new TableRow({ children: [
        fcEmpty(W_SIDE),
        fcEmpty(W_HALF),
        fcBox(
          ["PASSO 4  —  Recursos nativos do celular ativados",
           "Notificações de lembrete",
           "Biometria (digital ou reconhecimento facial)",
           "Modo offline automático quando sem internet",
           "Indicador visual de conexão na tela"],
          "6A1B9A", "FFFFFF", W_HALF, { size: SZ9 }
        ),
        fcEmpty(W_HALF),
        fcEmpty(W_SIDE),
      ]}),
      new TableRow({ children: [
        fcEmpty(W_SIDE),
        fcEmpty(W_HALF),
        fcArrow(W_DIV, { dir: "▼" }),
        fcEmpty(W_HALF),
        fcEmpty(W_SIDE),
      ]}),
      boxRow(
        ["PASSO 5  —  Telas do app prontas para uso",
         "Menu inferior com 4 abas: Resumo do dia  ·  Registrar refeição/exercício  ·  Histórico  ·  Sobre",
         "Acesso ao Perfil e Configurações",
         "Área exclusiva do administrador (somente usuários autorizados)"],
        "1F3864", "FFFFFF"
      ),
    ],
  });
}

// ── Diagrama 2: Arquitetura em Camadas ─────────────────────────────────────
// 3 colunas: 3008 + 3009 + 3009 = 9026
const W3 = [3008, 3009, 3009];

function archTable() {
  const hdr = (text, fill) => new TableRow({ children: [
    fcBox([text], fill, "FFFFFF", 9026, { span: 3, size: SZ9 }),
  ]});
  const row3 = (a, b, c, fillA, fillB, fillC, tc = "000000") => new TableRow({ children: [
    fcBox(Array.isArray(a) ? a : [a], fillA, tc, W3[0], { size: SZ9 }),
    fcBox(Array.isArray(b) ? b : [b], fillB, tc, W3[1], { size: SZ9 }),
    fcBox(Array.isArray(c) ? c : [c], fillC, tc, W3[2], { size: SZ9 }),
  ]});
  const arrowRow = () => new TableRow({ children: [
    fcArrow(W3[0], { dir: "▼" }),
    fcArrow(W3[1], { dir: "▼" }),
    fcArrow(W3[2], { dir: "▼" }),
  ]});

  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: W3,
    rows: [
      // Camada 1: o que o usuário vê
      hdr("CAMADA 1  —  O QUE O USUÁRIO VÊ E USA  (aplicativo instalado no celular Android)", "2E5FA3"),
      row3(
        ["Telas do aplicativo (11 no total)",
         "Login e Cadastro",
         "Registro do dia (refeições + exercícios)",
         "Resumo e gráficos semanais",
         "Histórico mensal",
         "Perfil · Configurações",
         "Painel do administrador"],
        ["Elementos visuais interativos",
         "Busca de alimentos com autocompletar",
         "Busca de exercícios com autocompletar",
         "Recomendações do coach de IA",
         "Barra de progresso diário",
         "Gráfico de macronutrientes",
         "Aviso de tempo offline / online"],
        ["Recursos nativos do celular",
         "Armazenamento local (sem internet)",
         "Notificações de lembrete",
         "Biometria (digital / rosto)",
         "Vibração de feedback",
         "Barra de status e tela de abertura"],
        "BBDEFB", "BBDEFB", "BBDEFB", "1A237E"
      ),
      row3(
        ["Atualização automática de dados",
         "Dados do servidor ficam frescos por 5 minutos",
         "Tentativas automáticas em caso de falha"],
        ["Controle de sessão e perfil",
         "Mantém o usuário logado com segurança",
         "Gerencia permissões: usuário comum e administrador"],
        ["Armazenamento offline inteligente",
         "Registros salvos no celular quando sem internet",
         "Envio automático ao servidor quando a conexão voltar"],
        "C8E6C9", "C8E6C9", "C8E6C9", "1B5E20"
      ),
      arrowRow(),
      // Camada 2: servidor
      hdr("CAMADA 2  —  SERVIDOR E BANCO DE DADOS  (nuvem — invisível ao usuário, essencial ao app)", "1F3864"),
      row3(
        ["Login e Segurança",
         "Autenticação por e-mail e senha",
         "Dois tipos de acesso: usuário comum e administrador",
         "Proteção para que cada usuário veja somente seus dados"],
        ["Banco de dados",
         "Perfis e metas dos usuários",
         "Registros diários de refeições e exercícios",
         "Catálogo de alimentos e exercícios",
         "Histórico de uso da inteligência artificial",
         "Tokens de notificação push"],
        ["Processamento inteligente no servidor",
         "Busca avançada de alimentos (com correção de erros de digitação)",
         "Busca de exercícios",
         "Cálculo de resumo nutricional",
         "Geração de recomendações pela IA",
         "Controle do intervalo de 30 min entre recomendações",
         "Registro de tokens de notificação"],
        "CFD8DC", "CFD8DC", "CFD8DC", "263238"
      ),
      arrowRow(),
      // Camada 3: serviços externos
      hdr("CAMADA 3  —  SERVIÇOS EXTERNOS  (parceiros que fornecem dados e inteligência)", "1D9E75"),
      row3(
        ["Base de Dados de Alimentos",
         "Departamento de Agricultura dos EUA (USDA)",
         "Mais de 300 mil alimentos catalogados",
         "Consultado quando o alimento não está no app"],
        ["Inteligência Artificial",
         "Google Gemini (modelo leve e rápido)",
         "Analisa os registros e gera recomendações personalizadas",
         "Acionado exclusivamente pelo servidor",
         "A chave de acesso NUNCA fica no celular do usuário"],
        ["Base de Dados de Exercícios",
         "WGER (plataforma internacional de fitness)",
         "Centenas de exercícios catalogados",
         "Estimativa de calorias queimadas por atividade"],
        "B2DFDB", "B2DFDB", "B2DFDB", "004D40"
      ),
    ],
  });
}

// ── Diagrama 3: Fluxo de Dados (registro de refeição/exercício) ────────────
function dataFlowTable() {
  const TOTAL = 9026;
  function fullRow(lines, fill, tc) {
    return new TableRow({ children: [fcBox(lines, fill, tc, TOTAL, { span: 3, size: SZ9 })] });
  }
  function arrowFull() {
    return new TableRow({ children: [fcArrow(TOTAL, { dir: "▼", span: 3 })] });
  }
  function row3(a, b, c, fa, fb, fc, tc = "000000") {
    return new TableRow({ children: [
      fcBox(Array.isArray(a) ? a : [a], fa, tc, W3[0], { size: SZ9 }),
      fcBox(Array.isArray(b) ? b : [b], fb, tc, W3[1], { size: SZ9 }),
      fcBox(Array.isArray(c) ? c : [c], fc, tc, W3[2], { size: SZ9 }),
    ]});
  }
  function arrowRow3() {
    return new TableRow({ children: [
      fcArrow(W3[0], { dir: "▼" }),
      fcArrow(W3[1], { dir: "▼" }),
      fcArrow(W3[2], { dir: "▼" }),
    ]});
  }

  return new Table({
    width: { size: TOTAL, type: WidthType.DXA },
    columnWidths: W3,
    rows: [
      // Passo 1
      fullRow(
        ["PASSO 1  —  Usuário digita o nome de um alimento ou exercício",
         "A busca acontece automaticamente enquanto o usuário digita"],
        "455A64", "FFFFFF"
      ),
      arrowFull(),
      // Passo 2
      fullRow(
        ["PASSO 2  —  O app procura nas três fontes de dados disponíveis (ao mesmo tempo)"],
        "546E7A", "FFFFFF"
      ),
      new TableRow({ children: [
        fcArrow(W3[0], { dir: "▼" }),
        fcArrow(W3[1], { dir: "▼" }),
        fcArrow(W3[2], { dir: "▼" }),
      ]}),
      row3(
        ["Fonte 1 — Lista interna do app",
         "Alimentos e exercícios mais comuns já incluídos no aplicativo",
         "Funciona mesmo sem internet"],
        ["Fonte 2 — Histórico de buscas",
         "Resultados de pesquisas anteriores guardados no servidor",
         "Resposta mais rápida para itens já buscados antes"],
        ["Fonte 3 — Base de dados mundial",
         "Alimentos: base do Departamento de Agricultura dos EUA",
         "Exercícios: plataforma internacional WGER",
         "Consultada quando as fontes 1 e 2 não têm o item"],
        "BBDEFB", "C8E6C9", "FFF9C4", "000000"
      ),
      arrowRow3(),
      // Passo 3
      fullRow(
        ["PASSO 3  —  Resultados organizados por relevância",
         "O app ordena os resultados colocando os mais prováveis no topo",
         "Funciona mesmo com erros de digitação e busca em português e inglês"],
        "4527A0", "FFFFFF"
      ),
      arrowFull(),
      // Passo 4
      fullRow(
        ["PASSO 4  —  Usuário escolhe o item e confirma",
         "O registro é salvo automaticamente — não é necessário apertar \"Salvar\""],
        "2E5FA3", "FFFFFF"
      ),
      arrowFull(),
      // Passo 5 — split online/offline
      fullRow(
        ["PASSO 5  —  Registro armazenado com segurança"],
        "37474F", "FFFFFF"
      ),
      new TableRow({ children: [
        fcArrow(W3[0], { dir: "▼" }),
        fcEmpty(W3[1]),
        fcArrow(W3[2], { dir: "▼" }),
      ]}),
      new TableRow({ children: [
        fcBox(
          ["Com internet",
           "Registro enviado diretamente ao servidor",
           "Disponível em todos os dispositivos do usuário"],
          "E3F2FD", "1A237E", W3[0], { size: SZ9 }
        ),
        fcBox(["↔", "Sincroniza quando", "a internet voltar"], "F5F5F5", "757575", W3[1], { size: SZ9 }),
        fcBox(
          ["Sem internet",
           "Registro salvo localmente no celular",
           "Enviado ao servidor assim que a conexão for restabelecida"],
          "E8F5E9", "1B5E20", W3[2], { size: SZ9 }
        ),
      ]}),
      arrowFull(),
      // Passo 6
      fullRow(
        ["PASSO 6  —  Inteligência Artificial analisa os registros do período",
         "A IA lê os alimentos e exercícios registrados e gera recomendações personalizadas de saúde",
         "Esse processo acontece no servidor, de forma segura e privada",
         "Disponível uma vez a cada 30 minutos (para garantir qualidade das análises)"],
        "4A148C", "FFFFFF"
      ),
      arrowFull(),
      // Resultado
      fullRow(
        ["RESULTADO  —  Recomendações do coach aparecem na tela do usuário",
         "Quando o intervalo de 30 minutos ainda não passou, o app mostra o tempo restante"],
        "1D9E75", "FFFFFF"
      ),
    ],
  });
}

// ── Documento ────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "\u2022",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: SP } }
      }]
    }]
  },
  styles: { default: { document: { run: { font: FONT, size: SZ } } } },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 708, footer: 708, gutter: 0 },
      }
    },
    children: [

      // ── Cabeçalho institucional ──────────────────────────────────────────
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [6800, 2226],
        rows: [new TableRow({ children: [
          new TableCell({
            borders: bHead, width: { size: 6800, type: WidthType.DXA }, margins: mg,
            shading: { fill: "1F3864", type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              p([T("Centro Universitário Internacional UNINTER", { bold: true, color: "FFFFFF" })], AlignmentType.LEFT, { before: 40, after: 20 }),
              p([T("Escola Superior Politécnica – ESP",           { bold: true, color: "FFFFFF" })], AlignmentType.LEFT, { before: 20, after: 40 }),
            ]
          }),
          new TableCell({
            borders: bHead, width: { size: 2226, type: WidthType.DXA }, margins: mg,
            shading: { fill: "F5A623", type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [p([T("UNINTER", { bold: true, color: "1F3864", size: 28 })], AlignmentType.CENTER)]
          }),
        ]})]
      }),
      p([]),

      // ── Título do documento ──────────────────────────────────────────────
      p([T("ATIVIDADES EXTENSIONISTAS", { bold: true, size: 28 })], AlignmentType.CENTER, { before: 200, after: 60 }),
      p([T("Proposta de Tema / Trabalho Final", { bold: true, size: 24 })], AlignmentType.CENTER, { before: 60, after: 200 }),

      // ── CURSO ────────────────────────────────────────────────────────────
      heading("Curso"),
      instruction("Assinale o curso ao qual você pertence."),
      check("Bacharelado em Engenharia da Computação", true),
      check("Bacharelado em Engenharia de Software", false),
      check("CST em Análise e Desenvolvimento de Sistemas", false),
      check("CST em Banco de Dados", false),
      check("CST em Ciência de Dados", false),
      check("CST em Desenvolvimento Mobile", false),
      check("CST em Gestão da Tecnologia da Informação", false),
      check("CST em Jogos Digitais", false),
      check("CST em Redes de Computadores", false),

      // ── DISCIPLINA ───────────────────────────────────────────────────────
      heading("Disciplina"),
      instruction("Assinale a disciplina Atividade Extensionista que você está cursando."),
      check("Atividade Extensionista I: Tecnologia Aplicada à Inclusão Digital – Levantamento", false),
      check("Atividade Extensionista II: Tecnologia Aplicada à Inclusão Digital – Projeto", false),
      check("Atividade Extensionista III: Tecnologia Aplicada à Inclusão Digital – Análise", false),
      check("Atividade Extensionista IV: Tecnologia Aplicada à Inclusão Digital – Implementação", true),

      // ── ETAPA ────────────────────────────────────────────────────────────
      heading("Etapa"),
      instruction("Assinale a etapa que está entregando."),
      check("Validação da proposta", false),
      check("Trabalho final", true),

      // ── ALUNO ────────────────────────────────────────────────────────────
      heading("Aluno(s) e RU(s)"),
      instruction("Informe seu nome completo e seu RU."),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [6000, 3026],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: bCell, width: { size: 6000, type: WidthType.DXA }, margins: mg, shading: { fill: "D9E1F2", type: ShadingType.CLEAR }, children: [p([T("Aluno", { bold: true })], AlignmentType.LEFT)] }),
            new TableCell({ borders: bCell, width: { size: 3026, type: WidthType.DXA }, margins: mg, shading: { fill: "D9E1F2", type: ShadingType.CLEAR }, children: [p([T("RU",   { bold: true })], AlignmentType.LEFT)] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: bCell, width: { size: 6000, type: WidthType.DXA }, margins: mg, children: [p([T("CRISTIAN FERREIRA CARLOS")], AlignmentType.LEFT)] }),
            new TableCell({ borders: bCell, width: { size: 3026, type: WidthType.DXA }, margins: mg, children: [p([T("4314390")], AlignmentType.LEFT)] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: bCell, width: { size: 6000, type: WidthType.DXA }, margins: mg, children: [p([], AlignmentType.LEFT)] }),
            new TableCell({ borders: bCell, width: { size: 3026, type: WidthType.DXA }, margins: mg, children: [p([], AlignmentType.LEFT)] }),
          ]}),
        ]
      }),

      // ── TÍTULO ───────────────────────────────────────────────────────────
      heading("Título"),
      instruction("Escreva o título de sua Atividade Extensionista."),
      p([T("NTRSL AI Mobile: Implementação de Aplicativo Android com React e Capacitor para Monitoramento de Calorias e Atividades Físicas com Inteligência Artificial", { bold: true })]),

      // ── SETOR DE APLICAÇÃO ───────────────────────────────────────────────
      heading("Setor de Aplicação"),
      instruction("Escreva o setor em que seu projeto será aplicado."),
      p([T(
        "O setor de saúde e bem-estar, com foco em nutrição e condicionamento físico, é o contexto de aplicação deste projeto. " +
        "O aplicativo Android NTRSL AI Mobile (com.ntrsl.ai) é voltado para a comunidade em geral — em especial pessoas que buscam " +
        "monitorar sua ingestão calórica e níveis de atividade física de forma prática e acessível pelo smartphone. Desenvolvido com " +
        "React 19.0 e Capacitor 8.3.0, a solução conta com Vite 6.2 + TypeScript 5.8.2, Tailwind CSS 4.1.14, TanStack Query 5.99.0 e " +
        "React Router 7.14.1; backend Supabase 2.103.0 (autenticação, Postgres e 6 Edge Functions Deno), integração com a API Google " +
        "Gemini exclusivamente no servidor, persistência offline via Capacitor SQLite e busca de alimentos e exercícios com dicionário " +
        "local e APIs públicas (USDA FDC e WGER). Os testes e a implementação junto à comunidade foram realizados nas dependências da " +
        "Vibra Energia (CNPJ 34.274.233/0064-88), localizada na Rodovia Presidente Castelo Branco, km 20, Jardim Mutinga, Barueri – SP. " +
        "Após a validação comunitária, o app foi preparado para distribuição pública via Google Play Store, incluindo a elaboração de " +
        "Política de Privacidade em conformidade com a LGPD (Lei 13.709/2018), Termos de Uso, Formulário de Segurança de Dados (Data Safety) e " +
        "Android App Bundle (AAB) assinado com keystore de release."
      )]),

      // ── ODS ──────────────────────────────────────────────────────────────
      heading("Objetivos de Desenvolvimento Sustentável (ODS)"),
      instruction("Assinale o(s) ODS que refletem no tema escolhido."),
      check("01. Erradicação da pobreza", false),
      check("02. Fome zero e agricultura sustentável", false),
      check("03. Saúde e bem-estar", true),
      check("04. Educação de qualidade", false),
      check("05. Igualdade de gênero", false),
      check("06. Água potável e saneamento", false),
      check("07. Energia limpa e acessível", false),
      check("08. Trabalho decente e crescimento econômico", false),
      check("09. Indústria, inovação e infraestrutura", true),
      check("10. Redução das desigualdades", false),
      check("11. Cidades e comunidades sustentáveis", false),
      check("12. Consumo e produção responsáveis", false),
      check("13. Ação contra a mudança global do clima", false),
      check("14. Vida na água", false),
      check("15. Vida terrestre", false),
      check("16. Paz, justiça e instituições eficazes", false),
      check("17. Parcerias e meios de implementação", false),

      // ── OBJETIVOS ────────────────────────────────────────────────────────
      heading("Objetivos"),
      instruction("Liste, no mínimo, três objetivos a serem alcançados com o desenvolvimento do projeto."),
      p([T(
        "Este projeto tem como objetivo implementar a versão Android do aplicativo NTRSL AI, evoluindo o protótipo web " +
        "desenvolvido na Atividade Extensionista III para uma solução móvel de maior alcance e usabilidade, com backend " +
        "Supabase, persistência offline e integração com Inteligência Artificial. Os objetivos específicos são:"
      )]),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T(
          "Desenvolver o aplicativo Android utilizando React 19.0 (Vite 6.2 + TypeScript 5.8.2), Capacitor 8.3.0 e Tailwind CSS 4.1.14, " +
          "com React Router 7.14.1, TanStack Query 5.99.0 e build como APK para dispositivos Android 7.0+ (minSdkVersion 24 / targetSdkVersion 34); " +
          "o app conta com 11 telas (pages) e 23 componentes reutilizáveis."
        )] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T(
          "Integrar o backend Supabase 2.103.0 (autenticação, Postgres e 6 Edge Functions Deno) e a API Google Gemini — " +
          "exclusivamente no servidor (GOOGLE_API_KEY nunca exposta no bundle Android) — para fornecer resumo nutricional " +
          "(nutrition-summary) e recomendações de coach por IA (ai-recommendations) com cooldown de 30 minutos; " +
          "plugins Capacitor nativos para biometria, push FCM, SQLite, haptics, status bar e splash screen."
        )] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T(
          "Implementar busca multicamada de alimentos (USDA FDC) e exercícios (WGER) com dicionário local (JSON embutido), " +
          "fuzzy search via Fuse.js 7.3.0 e cache em Postgres (food_catalog, exercise_catalog), além de fila offline com " +
          "Capacitor SQLite + outboxSync para sincronização assíncrona dos registros diários (daily_logs) quando a conexão for restabelecida."
        )] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T(
          "Aplicar o aplicativo junto aos colaboradores da Vibra Energia (Barueri – SP), coletando evidências de uso e " +
          "validando a usabilidade e a relevância das recomendações geradas pela IA para a promoção de hábitos saudáveis."
        )] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T(
          "Preparar a publicação do aplicativo na Google Play Store, compreendendo: geração do Android App Bundle (AAB) " +
          "assinado com keystore de release e configuração de signingConfigs no build.gradle; elaboração da Política de " +
          "Privacidade em conformidade com a LGPD (Lei 13.709/2018); redação dos Termos de Uso; preenchimento do Formulário " +
          "de Segurança de Dados (Data Safety) exigido pelo Play Console; e configuração de minifyEnabled + shrinkResources " +
          "com regras ProGuard/R8 para Capacitor e WebView."
        )] }),

      // ── METODOLOGIA ──────────────────────────────────────────────────────
      heading("Metodologia"),
      instruction("Insira o(s) diagrama(s) que apresenta(m) a metodologia aplicada no projeto."),
      p([T(
        "A metodologia foi estruturada em quatro fases sequenciais, com duração total de 180 dias (aproximadamente 6 meses), " +
        "partindo do projeto aprovado na Atividade Extensionista III e evoluindo para um aplicativo Android com React 19.0 e " +
        "Capacitor 8.3.0, backend Supabase e integração com Google Gemini. O cronograma reflete o desenvolvimento incremental " +
        "realizado por um único desenvolvedor em formação, com entregas parciais a cada fase. A seguir estão os três diagramas " +
        "da arquitetura e do fluxo do app, seguidos do diagrama de fases e do cronograma Gantt."
      )]),

      // ──────────────────────────────────────────────────────────────────────
      // DIAGRAMA 1: Fluxo de Inicialização
      // ──────────────────────────────────────────────────────────────────────
      p([T("Diagrama 1 – Como o aplicativo abre: sequência passo a passo desde o toque até as telas prontas", { bold: true })], AlignmentType.LEFT, { before: 180, after: 80 }),
      initFlowTable(),
      p([TI("Figura 1: Sequência de abertura do app — desde o toque do usuário até as telas estarem prontas para uso.", { italics: true, color: "595959" })], AlignmentType.CENTER, { before: 40, after: 160 }),

      // ──────────────────────────────────────────────────────────────────────
      // DIAGRAMA 2: Arquitetura em Camadas
      // ──────────────────────────────────────────────────────────────────────
      p([T("Diagrama 2 – Onde cada parte do app vive: o celular, o servidor e os serviços externos", { bold: true })], AlignmentType.LEFT, { before: 40, after: 80 }),
      archTable(),
      p([TI("Figura 2: Organização do app em três camadas — o que o usuário vê, o servidor onde os dados ficam guardados e os serviços externos parceiros.", { italics: true, color: "595959" })], AlignmentType.CENTER, { before: 40, after: 160 }),

      // ──────────────────────────────────────────────────────────────────────
      // DIAGRAMA 3: Fluxo de Dados
      // ──────────────────────────────────────────────────────────────────────
      p([T("Diagrama 3 – O que acontece quando o usuário registra uma refeição ou exercício", { bold: true })], AlignmentType.LEFT, { before: 40, after: 80 }),
      dataFlowTable(),
      p([TI("Figura 3: Caminho completo de uma informação — desde o momento em que o usuário digita um alimento ou exercício até receber a recomendação personalizada da IA.", { italics: true, color: "595959" })], AlignmentType.CENTER, { before: 40, after: 160 }),

      // ──────────────────────────────────────────────────────────────────────
      // Fases e texto metodológico
      // ──────────────────────────────────────────────────────────────────────
      subheading("Fase 1 – Planejamento e Configuração do Ambiente (Duração: 25 dias)"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Definição da arquitetura: React 19.0 (Vite 6.2 + TypeScript 5.8.2) + Capacitor 8.3.0 + Supabase (Postgres + 6 Edge Functions Deno).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Configuração do ambiente: Node.js 24, Android Studio, SDK Android (minSdkVersion 24 / targetSdkVersion 34); criação do projeto Supabase com schema inicial, migrations e RLS.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Deploy das Edge Functions via Supabase CLI: food-search, exercise-search, nutrition-summary, ai-recommendations, ai-cooldown e push-register.")] }),

      subheading("Fase 2 – Desenvolvimento da Interface React (Duração: 55 dias)"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Implementação das 11 telas: Home (/home), Dashboard (/dashboard), Histórico (/historico), Sobre (/sobre), Perfil, Configurações, Privacidade, Personalização, Login, Cadastro e Admin.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Tailwind CSS 4.1.14 com design tokens centralizados (src/theme/colors.ts: background #F5F0EA, accent #E8A87C), glass morphism leve e BottomNav com filtro SVG.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("React Router 7.14.1 com rotas protegidas (ProtectedRoute, AdminRoute), TanStack Query 5.99.0 para cache de servidor e gráficos Recharts 3.8.1 (macros e calorias dos últimos 7 dias).")] }),

      subheading("Fase 3 – Integração do Backend, IA e Persistência Offline (Duração: 50 dias)"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("6 Edge Functions Deno deployadas no Supabase: food-search (v37) com dicionário + fuzzy + USDA FDC; exercise-search (v10) com dicionário + WGER; rankCandidates para reordenação; ai-cooldown para consulta de cooldown; push-register para tokens FCM.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Gemini somente no servidor (gemini-3.1-flash-lite via GOOGLE_API_KEY secret): nutrition-summary e ai-recommendations com cooldown de 30 min registrado em ai_usage.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Fila offline: Capacitor SQLite + outboxSync (src/lib/localDb/) para sincronização assíncrona dos daily_logs; roles user/admin com RLS no Postgres; biometria e push FCM via plugins Capacitor nativos Android.")] }),

      subheading("Fase 4 – Build, Testes, Aplicação Comunitária e Publicação (Duração: 50 dias)"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Geração do APK de teste e do Android App Bundle (AAB) de release via Android Studio; configuração de signingConfigs com keystore dedicado, minifyEnabled true, shrinkResources true e regras ProGuard/R8 para Capacitor e WebView.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Testes funcionais e de usabilidade em dispositivos reais Android 7.0+ e emuladores; ajustes de debounce (400 ms), fallback offline dos pickers e flush de auto-save (pendingSaveRef ao desmontar NutritionHomePage).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Distribuição do APK e coleta de evidências com colaboradores da Vibra Energia (Rod. Pres. Castelo Branco, km 20, Jardim Mutinga, Barueri – SP).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Preparação para publicação na Google Play Store: elaboração da Política de Privacidade (LGPD), Termos de Uso, Formulário Data Safety, listagem completa da loja (descrição PT-BR, screenshots, feature graphic) e hospedagem da política em URL pública via GitHub Pages.")] }),

      // Diagrama de fases
      p([T("Diagrama 4 – Diagrama Sequencial das Fases:", { bold: true })], AlignmentType.LEFT, { before: 160, after: 80 }),
      (() => {
        const bh2 = (c) => ({ top: { style: BorderStyle.SINGLE, size: 6, color: c }, bottom: { style: BorderStyle.SINGLE, size: 6, color: c }, left: { style: BorderStyle.SINGLE, size: 6, color: c }, right: { style: BorderStyle.SINGLE, size: 6, color: c } });
        const cores   = ["2E5FA3","1D9E75","C8860A","C0392B"];
        const coresBg = ["D9E1F2","C6EFCE","FFEB9C","FCE4D6"];
        const fases = [
          { num:"Fase 1", nome:"Planejamento\ne Configuração",  dias:"25 dias\nDia 1–25",    del:"✔ Ambiente pronto" },
          { num:"Fase 2", nome:"Desenvolvimento\nda Interface", dias:"55 dias\nDia 26–80",   del:"✔ UI funcional" },
          { num:"Fase 3", nome:"Backend, IA\ne Offline",        dias:"50 dias\nDia 81–130",  del:"✔ IA + offline ok" },
          { num:"Fase 4", nome:"Build, Testes\ne Comunidade",   dias:"50 dias\nDia 131–180", del:"✔ AAB + Play Store" },
        ];
        const mkLine = (txt, bold, color, size) => new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 30, after: 30 },
          children: [TI(txt, { bold, color, size: size || SZ10 })]
        });
        return new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [2256, 2256, 2257, 2257],
          rows: [
            new TableRow({ children: fases.map((f, i) => new TableCell({
              borders: bh2(cores[i]), width: { size: 2256, type: WidthType.DXA }, margins: mg,
              shading: { fill: cores[i], type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
              children: [
                mkLine(f.num, true, "FFFFFF", SZ10),
                ...f.nome.split("\n").map(l => mkLine(l, false, "FFFFFF", SZ10)),
              ]
            })) }),
            new TableRow({ children: fases.map((f, i) => new TableCell({
              borders: bh2(cores[i]), width: { size: 2256, type: WidthType.DXA }, margins: mg,
              shading: { fill: coresBg[i], type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
              children: f.dias.split("\n").map(l => mkLine(l, true, cores[i], SZ10)),
            })) }),
            new TableRow({ children: fases.map((f, i) => new TableCell({
              borders: bh2(cores[i]), width: { size: 2256, type: WidthType.DXA }, margins: mg,
              shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
              children: [mkLine(f.del, true, cores[i], SZ10)],
            })) }),
          ]
        });
      })(),

      // Gantt
      (() => {
        const cores  = ["2E5FA3","1D9E75","C8860A","C0392B"];
        const labels = ["F1 – 25d","F2 – 55d","F3 – 50d","F4 – 50d"];
        const widths = [938, 2063, 1875, 1875];
        const bh2 = (c) => ({ top:{ style:BorderStyle.SINGLE, size:6, color:c }, bottom:{ style:BorderStyle.SINGLE, size:6, color:c }, left:{ style:BorderStyle.SINGLE, size:6, color:c }, right:{ style:BorderStyle.SINGLE, size:6, color:c } });
        return new Table({
          width: { size: 6750, type: WidthType.DXA }, columnWidths: widths,
          rows: [new TableRow({ children: labels.map((lbl, i) => new TableCell({
            borders: bh2(cores[i]), width: { size: widths[i], type: WidthType.DXA },
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            shading: { fill: cores[i], type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 30, after: 30 },
              children: [TI(lbl, { bold: true, color: "FFFFFF" })] })]
          }))})]
        });
      })(),
      p([TI("Duração total: 180 dias (aproximadamente 6 meses)", { italics: true })], AlignmentType.RIGHT, { before: 40, after: 160 }),

      // ── RESULTADOS ───────────────────────────────────────────────────────
      heading("Resultados Esperados/Obtidos"),
      instruction("Insira os resultados esperados/obtidos com a aplicação do projeto."),
      p([T("O aplicativo NTRSL AI Mobile (com.ntrsl.ai) foi implementado e os seguintes resultados foram obtidos:")]),

      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Android App Bundle (AAB) assinado com keystore de release, publicado em https://github.com/CRIZANTE1/NTRSL_AI; build otimizado (minifyEnabled + shrinkResources + ProGuard/R8) para Android 7.0+ (minSdkVersion 24 / targetSdkVersion 36); 11 telas, dashboard diário, FoodPicker multicamada (USDA FDC + dicionário local), ExercisePicker (WGER + dicionário local) e gráficos semanais Recharts 3.8.1.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Backend Supabase operacional com 6 Edge Functions Deno deployadas: food-search (v37), exercise-search (v10), nutrition-summary, ai-recommendations, ai-cooldown e push-register. Gemini (gemini-3.1-flash-lite) exclusivamente no servidor — chave GOOGLE_API_KEY nunca exposta no bundle Android.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Persistência offline via Capacitor SQLite + fila outboxSync para sincronização assíncrona dos daily_logs com o Supabase Postgres; OfflineSyncEffects gerencia reconexão automática; histórico disponível sem internet.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Sistema de autenticação completo: Supabase Auth (e-mail/senha), roles user/admin com RLS, painel de administração (/admin), biometria nativa e push FCM via plugins Capacitor; auditoria de eventos em security_audit_events.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T("Documentação legal e técnica para publicação na Google Play Store: Política de Privacidade em conformidade com a LGPD (Lei 13.709/2018), Termos de Uso, Formulário de Segurança de Dados (Data Safety), listagem completa PT-BR (nome, descrições, screenshots) e configurações de build de release (signingConfigs, ProGuard, AAB splits por ABI/densidade/idioma).")] }),

      // Tabela de funcionalidades
      p([T("Quadro de funcionalidades implementadas:", { bold: true })], AlignmentType.LEFT, { before: 160, after: 80 }),
      (() => {
        const bi = { top: bLight, bottom: bLight, left: bLight, right: bLight };
        const rows = [
          { func:"Funcionalidade", status:"Status", obs:"Detalhe técnico", h:true },
          { func:"Dashboard diário (calorias + macros)", status:"Implementado", obs:"Proteína, carbs, gordura + meta personalizável (PersonalizationPage)" },
          { func:"FoodPicker com busca multicamada",     status:"Implementado", obs:"JSON local → food_catalog → USDA FDC (v37) · Fuse.js 7.3 · debounce 400 ms" },
          { func:"ExercisePicker com busca multicamada", status:"Implementado", obs:"JSON local → exercise_catalog → WGER (v10) · rankCandidates PT/EN" },
          { func:"Recomendação de coach por IA",         status:"Implementado", obs:"Gemini no servidor; cooldown 30 min (ai_usage); CooldownBanner no UI" },
          { func:"Persistência offline + fila sync",     status:"Implementado", obs:"Capacitor SQLite + outboxSync → daily_logs Supabase (OfflineSyncEffects)" },
          { func:"Gráficos semanais",                    status:"Implementado", obs:"Recharts 3.8.1 – últimos 7 dias (calorias e macros) no DashboardPage" },
          { func:"Auth + roles user/admin + RLS",        status:"Implementado", obs:"Supabase Auth + AdminPage (/admin) + Postgres RLS + AuditErrorReporter" },
          { func:"Biometria e push (FCM)",               status:"Implementado", obs:"Plugins Capacitor nativos Android (BiometricLock + PushNotificationsEffects)" },
          { func:"Perfil + metas nutricionais",          status:"Implementado", obs:"ProfilePage + PersonalizationPage (goal_kcal, goal_proteina, goal_carbs)" },
          { func:"Histórico mensal",                     status:"Implementado", obs:"HistoricoPage com CalendarStrip e navegação por dias" },
          { func:"Refinamento nutricional por IA",       status:"Implementado", obs:"AiRefineResultCard + nutrition-summary (Edge Function Deno)" },
          { func:"Publicação na Google Play Store",      status:"Preparado",    obs:"AAB assinado · signingConfigs · R8/ProGuard · bundle splits (ABI/density/language)" },
          { func:"Política de Privacidade (LGPD)",       status:"Preparado",    obs:"Lei 13.709/2018 · Data Safety · Termos de Uso · URL pública para Play Console" },
        ];
        return new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [3200, 1426, 4400],
          rows: rows.map((r, i) => new TableRow({ children: [
            new TableCell({ borders: bi, width:{ size:3200, type:WidthType.DXA }, margins: mg,
              shading:{ fill: r.h?"1F3864": i%2===0?"EEF2F7":"FFFFFF", type:ShadingType.CLEAR },
              children:[new Paragraph({ spacing:{ before:40,after:40 }, children:[TI(r.func, { bold:r.h, color:r.h?"FFFFFF":"000000" })] })] }),
            new TableCell({ borders: bi, width:{ size:1426, type:WidthType.DXA }, margins: mg,
              shading:{ fill: r.h?"1F3864": i%2===0?"EEF2F7":"FFFFFF", type:ShadingType.CLEAR },
              children:[new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ before:40,after:40 }, children:[TI(r.status, { bold:r.h, color:r.h?"FFFFFF":r.status==="Implementado"?"1E6B3C":"000000" })] })] }),
            new TableCell({ borders: bi, width:{ size:4400, type:WidthType.DXA }, margins: mg,
              shading:{ fill: r.h?"1F3864": i%2===0?"EEF2F7":"FFFFFF", type:ShadingType.CLEAR },
              children:[new Paragraph({ spacing:{ before:40,after:40 }, children:[TI(r.obs, { italics:!r.h, bold:r.h, color:r.h?"FFFFFF":"444444" })] })] }),
          ]}))
        });
      })(),

      // ── APLICAÇÃO COMUNITÁRIA E EVIDÊNCIAS ───────────────────────────────
      heading("Aplicação Comunitária e Evidências de Teste"),
      p([T(
        "A etapa de aplicação comunitária foi realizada nas dependências da Vibra Energia (Rod. Pres. Castelo Branco, " +
        "km 20, Jardim Mutinga, Barueri – SP). O APK foi instalado nos dispositivos pessoais de dois colaboradores " +
        "voluntários, que utilizaram o aplicativo por ao menos um dia completo registrando refeições e exercícios e " +
        "interagindo com as recomendações da IA. Os participantes confirmaram a realização dos testes por assinatura no quadro abaixo."
      )]),

      (() => {
        const bh2 = { top:bDark, bottom:bDark, left:bDark, right:bDark };
        const bi2 = { top:bLight, bottom:bLight, left:bLight, right:bLight };
        const mg2 = { top: 120, bottom: 120, left: 150, right: 150 };
        const hRow = new TableRow({ children: [
          new TableCell({ borders:bh2, width:{size:360,type:WidthType.DXA}, margins:mg2, shading:{fill:"1F3864",type:ShadingType.CLEAR},
            children:[new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:60,after:60}, children:[TI("Nº",{bold:true,color:"FFFFFF"})] })] }),
          new TableCell({ borders:bh2, width:{size:2200,type:WidthType.DXA}, margins:mg2, shading:{fill:"1F3864",type:ShadingType.CLEAR},
            children:[new Paragraph({ spacing:{before:60,after:60}, children:[TI("Nome completo",{bold:true,color:"FFFFFF"})] })] }),
          new TableCell({ borders:bh2, width:{size:1500,type:WidthType.DXA}, margins:mg2, shading:{fill:"1F3864",type:ShadingType.CLEAR},
            children:[new Paragraph({ spacing:{before:60,after:60}, children:[TI("Cargo / Função",{bold:true,color:"FFFFFF"})] })] }),
          new TableCell({ borders:bh2, width:{size:1200,type:WidthType.DXA}, margins:mg2, shading:{fill:"1F3864",type:ShadingType.CLEAR},
            children:[new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:60,after:60}, children:[TI("Data",{bold:true,color:"FFFFFF"})] })] }),
          new TableCell({ borders:bh2, width:{size:1566,type:WidthType.DXA}, margins:mg2, shading:{fill:"1F3864",type:ShadingType.CLEAR},
            children:[new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:60,after:60}, children:[TI("Dispositivo Android",{bold:true,color:"FFFFFF"})] })] }),
          new TableCell({ borders:bh2, width:{size:2200,type:WidthType.DXA}, margins:mg2, shading:{fill:"1F3864",type:ShadingType.CLEAR},
            children:[new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:60,after:60}, children:[TI("Assinatura",{bold:true,color:"FFFFFF"})] })] }),
        ]});
        const dRow = (num) => new TableRow({ height:{ value:1440, rule:"atLeast" }, children:[
          new TableCell({ borders:bi2, width:{size:360,type:WidthType.DXA}, margins:mg2, verticalAlign:VerticalAlign.CENTER,
            children:[new Paragraph({ alignment:AlignmentType.CENTER, children:[TI(String(num),{bold:true})] })] }),
          new TableCell({ borders:bi2, width:{size:2200,type:WidthType.DXA}, margins:mg2, children:[new Paragraph({ children:[TI("")] })] }),
          new TableCell({ borders:bi2, width:{size:1500,type:WidthType.DXA}, margins:mg2, children:[new Paragraph({ children:[TI("")] })] }),
          new TableCell({ borders:bi2, width:{size:1200,type:WidthType.DXA}, margins:mg2, children:[new Paragraph({ children:[TI("")] })] }),
          new TableCell({ borders:bi2, width:{size:1566,type:WidthType.DXA}, margins:mg2, children:[new Paragraph({ children:[TI("")] })] }),
          new TableCell({ borders:bi2, width:{size:2200,type:WidthType.DXA}, margins:mg2, verticalAlign:VerticalAlign.BOTTOM,
            children:[
              new Paragraph({ spacing:{before:0,after:0}, children:[TI("")] }),
              new Paragraph({ spacing:{before:0,after:60}, border:{ bottom:{ style:BorderStyle.SINGLE, size:4, color:"000000", space:1 } }, children:[TI("")] }),
            ]
          }),
        ]});
        return new Table({
          width:{ size:9026, type:WidthType.DXA }, columnWidths:[360,2200,1500,1200,1566,2200],
          rows:[hRow, dRow(1), dRow(2)]
        });
      })(),
      p([TI("Local: Vibra Energia – Rod. Pres. Castelo Branco, km 20, Jardim Mutinga, Barueri – SP, 2026.", { italics: true })], AlignmentType.LEFT, { before: 60, after: 60 }),
      p([T("Repositório do projeto: https://github.com/CRIZANTE1/NTRSL_AI")], AlignmentType.LEFT, { before: 40, after: 100 }),

      // ── CONSIDERAÇÕES FINAIS ─────────────────────────────────────────────
      heading("Considerações Finais"),
      instruction("Liste, no mínimo, três aprendizados obtidos com o projeto."),
      p([T(
        "O desenvolvimento do NTRSL AI Mobile consolidou aprendizados técnicos e sociais que extrapolam o escopo " +
        "de qualquer disciplina isolada. A seguir, os principais aprendizados obtidos ao longo das quatro fases."
      )]),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T(
          "A combinação React 19 + Capacitor 8.3.0 + Supabase 2.103.0 demonstrou ser uma stack coesa para apps mobile: " +
          "a lógica nutricional portada do protótipo Streamlit foi reaproveitada quase integralmente em TypeScript 5.8.2 " +
          "(src/lib/nutrition.ts), e as 6 Edge Functions Deno permitiram isolar todas as chamadas ao Gemini no servidor, " +
          "eliminando riscos de exposição da GOOGLE_API_KEY no bundle Android. O bootstrap via main.tsx → appShell → App → AppRoutes " +
          "separou claramente validação de ambiente, providers, efeitos nativos e roteamento."
        )] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T(
          "A arquitetura de busca em três camadas (dicionário local JSON → cache Postgres food_catalog/exercise_catalog → USDA FDC/WGER) " +
          "com fuzzy search Fuse.js 7.3.0 e rankCandidates evidenciou a importância do design defensivo: o app funciona mesmo sem " +
          "internet, degradando graciosamente para o dicionário local enquanto sincroniza registros via fila outboxSync + Capacitor SQLite."
        )] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T(
          "Os testes com colaboradores da Vibra Energia revelaram que o design system baseado em tokens (colors.ts: " +
          "background #F5F0EA, accent #E8A87C) foi bem recebido visualmente, mas que o fluxo de registro exigiu " +
          "otimização do debounce (400 ms) e do flush de auto-save (pendingSaveRef ao desmontar NutritionHomePage) " +
          "para garantir fluidez em conexões móveis instáveis, comuns em ambientes industriais."
        )] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T(
          "O projeto reforça o compromisso com o ODS 03 (Saúde e Bem-Estar) ao demonstrar que tecnologia móvel " +
          "acessível, distribuída pela Google Play Store, pode ser um veículo eficaz de promoção de saúde preventiva em " +
          "ambientes corporativos e comunidades locais, ampliando o alcance para além dos testadores iniciais da Vibra Energia."
        )] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: SP,
        children: [T(
          "A preparação para publicação na Google Play Store evidenciou exigências que vão além do desenvolvimento técnico: " +
          "a conformidade com a LGPD (Lei 13.709/2018) exigiu mapear cada dado coletado, sua finalidade e os terceiros " +
          "envolvidos (Supabase, Firebase, Google Gemini); o Formulário Data Safety tornou explícita a responsabilidade do " +
          "desenvolvedor sobre privacidade; e a configuração do build de release (signingConfigs, AAB, R8/ProGuard) " +
          "demonstrou que a distribuição segura em loja exige processos formais distintos da distribuição direta por APK."
        )] }),

      // ── REFERÊNCIAS ──────────────────────────────────────────────────────
      heading("Referências"),
      p([T("CAPACITOR. Capacitor: Cross-platform Native Runtime for Web Apps. Ionic Framework, 2024. Disponível em: https://capacitorjs.com/docs. Acesso em: jun. 2026.")]),
      p([T("REACT. React – A JavaScript library for building user interfaces. Meta Open Source, 2024. Disponível em: https://react.dev. Acesso em: jun. 2026.")]),
      p([T("SUPABASE. Supabase Docs – Open Source Firebase Alternative. Supabase Inc., 2024. Disponível em: https://supabase.com/docs. Acesso em: jun. 2026.")]),
      p([T("GOOGLE. Gemini API Documentation – Models and Pricing. Google AI, 2024. Disponível em: https://ai.google.dev/docs. Acesso em: jun. 2026.")]),
      p([T("ANDROID DEVELOPERS. Android API Levels and Version Distribution. Google, 2024. Disponível em: https://developer.android.com/tools/releases/platforms. Acesso em: jun. 2026.")]),
      p([T("NAÇÕES UNIDAS (ONU). Os 17 Objetivos de Desenvolvimento Sustentável. Nações Unidas Brasil, 2024. Disponível em: https://brasil.un.org/pt-br/sdgs. Acesso em: jun. 2026.")]),
      p([T("SANTOS, Altair Martins dos; RIBEIRO, Sylvio Nascimento. Arduino: do básico à internet das coisas. Rio de Janeiro: Brasport, 2023. ISBN: 978-85-7452-966-0.")]),
      p([T("STROUSTRUP, Bjarne. Princípios e práticas de programação com C++. 3. ed. Porto Alegre: Bookman, 2025. ISBN: 9780138308681.")]),
      p([T("GOOGLE. Google Play Console Help – Publish your app. Google LLC, 2024. Disponível em: https://support.google.com/googleplay/android-developer. Acesso em: jun. 2026.")]),
      p([T("BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). Brasília, DF: Presidência da República, 2018. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm. Acesso em: jun. 2026.")]),

      // ── Rodapé ───────────────────────────────────────────────────────────
      p([]),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { before: 400, after: 0 },
        children: [T("Atividades Extensionistas – Proposta de Tema / Trabalho Final", { italics: true, size: SZ10, color: "808080" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/claude/Atividade_Extensionista_IV.docx', buf);
  console.log('OK');
});
