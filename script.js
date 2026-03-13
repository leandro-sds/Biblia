// ============================================================
//  Bíblia Sagrada – script.js adaptado para Android (WebView)
//  Sem dependência de PHP – lê os JSONs diretamente
// ============================================================

let dadosBiblia   = [];   // todos os versículos da versão carregada
let capitulosAtuais = {};
let livroAtual    = '';
let capituloAtual = '';
let resultadosBusca = [];
let paginaAtual   = 1;
let versaoAtual   = '';
const resultadosPorPagina = 10;

// Lista de versões disponíveis (apenas as que estão na pasta Biblias/)
const VERSOES = [
  { arquivo: 'Biblias/00_biblia_livre.json',                    nome: 'Bíblia Livre' },
  { arquivo: 'Biblias/01_almeida_corrigida_fiel.json',          nome: 'Almeida Corrigida Fiel' },
  { arquivo: 'Biblias/02_almeida_revista_e_corrigida.json',     nome: 'Almeida Revista e Corrigida' },
  { arquivo: 'Biblias/04_nova_versao_internacional.json',       nome: 'Nova Versão Internacional' },
  { arquivo: 'Biblias/06_king_james_atualizada.json',           nome: 'King James Atualizada' },
  { arquivo: 'Biblias/07_nova_traducao_linguagem_hoje.json',    nome: 'Nova Tradução na Linguagem de Hoje' },
  { arquivo: 'Biblias/09_almeida_seculo_xxi.json',              nome: 'Almeida Século XXI' },
  { arquivo: 'Biblias/14_nova_traducao_novo_mundo.json',        nome: 'Nova Tradução do Novo Mundo' },
  { arquivo: 'Biblias/15_catolica_tradicional.json',            nome: 'Católica Tradicional' },
  { arquivo: 'Biblias/17_Bíblia para todos (Edição comum).json',nome: 'Bíblia Para Todos' },
];

const nomesLivros = {
  'Gn':'Gênesis','Ex':'Êxodo','Lv':'Levítico','Nm':'Números','Dt':'Deuteronômio',
  'Js':'Josué','Jz':'Juízes','Rt':'Rute','1Sm':'1 Samuel','2Sm':'2 Samuel',
  '1Rs':'1 Reis','2Rs':'2 Reis','1Cr':'1 Crônicas','2Cr':'2 Crônicas','Ed':'Esdras',
  'Ne':'Neemias','Et':'Ester','Jó':'Jó','Sl':'Salmos','Pv':'Provérbios',
  'Ec':'Eclesiastes','Ct':'Cânticos','Is':'Isaías','Jr':'Jeremias','Lm':'Lamentações',
  'Ez':'Ezequiel','Dn':'Daniel','Os':'Oseias','Jl':'Joel','Am':'Amós',
  'Ob':'Obadias','Jn':'Jonas','Mq':'Miqueias','Na':'Naum','Hc':'Habacuque',
  'Sf':'Sofonias','Ag':'Ageu','Zc':'Zacarias','Ml':'Malaquias','Mt':'Mateus',
  'Mc':'Marcos','Lc':'Lucas','Jo':'João','At':'Atos','Rm':'Romanos',
  '1Co':'1 Coríntios','2Co':'2 Coríntios','Gl':'Gálatas','Ef':'Efésios','Fp':'Filipenses',
  'Cl':'Colossenses','1Ts':'1 Tessalonicenses','2Ts':'2 Tessalonicenses','1Tm':'1 Timóteo',
  '2Tm':'2 Timóteo','Tt':'Tito','Fm':'Filemom','Hb':'Hebreus','Tg':'Tiago',
  '1Pe':'1 Pedro','2Pe':'2 Pedro','1Jo':'1 João','2Jo':'2 João','3Jo':'3 João',
  'Jd':'Judas','Ap':'Apocalipse'
};

// Mapa inverso: nome completo → sigla
const nomeParaSigla = {};
Object.entries(nomesLivros).forEach(([sig, nome]) => { nomeParaSigla[nome] = sig; });

// -----------------------------------------------------------
//  Normalização de texto (remove acentos, caixa baixa)
// -----------------------------------------------------------
function normalizar(texto) {
  return texto.toLowerCase()
    .replace(/[áàãâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòõôö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/ç/g, 'c');
}

// -----------------------------------------------------------
//  1. Carregar versões no <select>
// -----------------------------------------------------------
function carregarVersoes() {
  const select = document.getElementById('versao-biblia');
  select.innerHTML = '';

  VERSOES.forEach((v, index) => {
    const opt = document.createElement('option');
    opt.value  = v.arquivo;
    opt.textContent = v.nome;
    if (index === 0) {
      opt.selected = true;
      versaoAtual  = v.arquivo;
    }
    select.appendChild(opt);
  });

  carregarBiblia(versaoAtual).then(() => carregarLivros());
  select.focus();
}

// -----------------------------------------------------------
//  2. Carregar o JSON da versão escolhida na memória
// -----------------------------------------------------------
async function carregarBiblia(arquivo) {
  try {
    mostrarCarregando(true);
    const res  = await fetch(arquivo);
    const json = await res.json();

    dadosBiblia = json.map(v => {
      let sigla = v.livro ?? v.book;
      const cap = parseInt(v.capitulo ?? v.chapter);
      const ver = parseInt(v.versiculo ?? v.verse);
      const txt = v.texto ?? v.text;

      // Garantir que a sigla seja válida
      if (!nomesLivros[sigla]) {
        sigla = nomeParaSigla[sigla] ?? sigla;
      }
      return { livro: sigla, capitulo: cap, versiculo: ver, texto: txt };
    }).filter(v => v.livro && v.texto);

  } catch (e) {
    console.error('Erro ao carregar versão:', e);
    alert('Não foi possível carregar esta versão.');
    dadosBiblia = [];
  } finally {
    mostrarCarregando(false);
  }
}

function mostrarCarregando(sim) {
  let el = document.getElementById('loading-msg');
  if (!el) {
    el = document.createElement('p');
    el.id = 'loading-msg';
    el.style.cssText = 'text-align:center;color:#888;font-style:italic;';
    document.getElementById('versiculos-container').before(el);
  }
  el.textContent = sim ? '⏳ Carregando versão…' : '';
}

// -----------------------------------------------------------
//  Botão "Carregar versão"
// -----------------------------------------------------------
document.getElementById('btn-carregar-versao').addEventListener('click', async () => {
  const select   = document.getElementById('versao-biblia');
  versaoAtual    = select.value;
  const nomeVers = select.options[select.selectedIndex].text;

  limparResultados();
  await carregarBiblia(versaoAtual);
  carregarLivros();
  alert('Versão alterada para: ' + nomeVers);
});

// -----------------------------------------------------------
//  3. Preencher <select> de livros
// -----------------------------------------------------------
function carregarLivros() {
  const select = document.getElementById('livro');
  select.innerHTML = '';

  const optInicial = document.createElement('option');
  optInicial.value = '';
  optInicial.textContent = 'Selecione um livro';
  optInicial.disabled = true;
  optInicial.selected = true;
  select.appendChild(optInicial);

  // Livros únicos na ordem que aparecem
  const vistos = new Set();
  dadosBiblia.forEach(v => {
    if (!vistos.has(v.livro)) {
      vistos.add(v.livro);
      const opt = document.createElement('option');
      opt.value = v.livro;
      opt.textContent = nomesLivros[v.livro] ?? v.livro;
      select.appendChild(opt);
    }
  });

  // Recriar para remover listeners antigos
  const novoSelect = select.cloneNode(true);
  select.parentNode.replaceChild(novoSelect, select);
  novoSelect.addEventListener('change', () => {
    limparResultados();
    carregarCapitulos();
  });
}

// -----------------------------------------------------------
//  4. Preencher <select> de capítulos
// -----------------------------------------------------------
function carregarCapitulos() {
  livroAtual = document.getElementById('livro').value;
  if (!livroAtual) return;

  // Montar mapa capítulo → { versículo → texto }
  capitulosAtuais = {};
  dadosBiblia.forEach(v => {
    if (v.livro !== livroAtual) return;
    const cap = String(v.capitulo);
    const ver = String(v.versiculo);
    if (!capitulosAtuais[cap]) capitulosAtuais[cap] = {};
    capitulosAtuais[cap][ver] = v.texto;
  });

  const select = document.getElementById('capitulo');
  select.innerHTML = '';

  const optInicial = document.createElement('option');
  optInicial.value = '';
  optInicial.textContent = 'Selecione um capítulo';
  optInicial.disabled = true;
  optInicial.selected = true;
  select.appendChild(optInicial);

  Object.keys(capitulosAtuais).sort((a, b) => Number(a) - Number(b)).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = 'Capítulo ' + c;
    select.appendChild(opt);
  });
}

// -----------------------------------------------------------
//  5. Mostrar versículos do capítulo
// -----------------------------------------------------------
function mostrarVersiculos(versos) {
  limparResultados();
  const div = document.getElementById('versiculos-container');
  div.innerHTML = '';

  Object.keys(versos).sort((a, b) => Number(a) - Number(b)).forEach(v => {
    const p = document.createElement('p');
    p.textContent = `${v}. ${versos[v]}`;
    p.id = `versiculo-${v}`;
    p.tabIndex = 0;
    div.appendChild(p);
  });

  const primeiro = document.getElementById('versiculo-1');
  if (primeiro) {
    setTimeout(() => { primeiro.scrollIntoView({ behavior: 'smooth' }); primeiro.focus(); }, 100);
  }

  criarNavegacaoCapitulos(div);
}

function criarNavegacaoCapitulos(container) {
  const nav = document.createElement('div');
  nav.style.cssText = 'margin-top:20px;padding-top:10px;border-top:1px solid #ccc;';

  const capKeys = Object.keys(capitulosAtuais).map(Number).sort((a, b) => a - b);
  const idx = capKeys.indexOf(Number(capituloAtual));

  if (idx > 0) {
    const btn = document.createElement('button');
    btn.textContent = '⬅️ Capítulo anterior';
    btn.onclick = () => {
      document.getElementById('capitulo').value = capKeys[idx - 1];
      document.getElementById('carregarCapitulo').click();
    };
    nav.appendChild(btn);
  }

  if (idx < capKeys.length - 1) {
    const btn = document.createElement('button');
    btn.textContent = '➡️ Próximo capítulo';
    btn.onclick = () => {
      document.getElementById('capitulo').value = capKeys[idx + 1];
      document.getElementById('carregarCapitulo').click();
    };
    nav.appendChild(btn);
  }

  const btnFechar = document.createElement('button');
  btnFechar.textContent = '❌ Fechar leitura';
  btnFechar.onclick = () => {
    container.innerHTML = '';
    document.getElementById('livro').focus();
    document.getElementById('capitulo').value = '';
    livroAtual = '';
    capituloAtual = '';
  };
  nav.appendChild(btnFechar);
  container.appendChild(nav);
}

document.getElementById('carregarCapitulo').addEventListener('click', () => {
  const select = document.getElementById('capitulo');
  capituloAtual = select.value;
  if (!capituloAtual || !capitulosAtuais[capituloAtual]) return;
  mostrarVersiculos(capitulosAtuais[capituloAtual]);
});

// -----------------------------------------------------------
//  6. Busca por palavra/frase
// -----------------------------------------------------------
function limparResultados() {
  document.getElementById('versiculos-container').innerHTML = '';
  resultadosBusca = [];
  paginaAtual = 1;
}

function mostrarPagina(resultados, pagina, termo) {
  const div = document.getElementById('versiculos-container');
  div.innerHTML = '';

  const contador = document.createElement('p');
  contador.textContent = `Foram encontrados ${resultados.length} versículos.`;
  contador.style.fontWeight = 'bold';
  contador.tabIndex = 0;
  div.appendChild(contador);

  const inicio = (pagina - 1) * resultadosPorPagina;
  const fim    = inicio + resultadosPorPagina;

  resultados.slice(inicio, fim).forEach((r, idx) => {
    const p = document.createElement('p');
    const textoMarcado = r.texto.replace(new RegExp(`(${termo})`, 'gi'), '<mark>$1</mark>');
    const nomeCompleto = nomesLivros[r.livro] ?? r.livro;
    p.innerHTML = `${textoMarcado}<br><strong>${nomeCompleto} ${r.capitulo}:${r.versiculo}</strong>`;
    p.tabIndex = 0;
    p.id = `resultado-${idx}`;
    div.appendChild(p);
  });

  const primeiro = document.getElementById('resultado-0') ?? contador;
  if (primeiro) setTimeout(() => { primeiro.scrollIntoView({ behavior: 'smooth' }); primeiro.focus(); }, 100);

  const nav = document.createElement('div');
  nav.style.marginTop = '20px';

  if (pagina > 1) {
    const btn = document.createElement('button');
    btn.textContent = '⬅️ Página anterior';
    btn.onclick = () => mostrarPagina(resultados, pagina - 1, termo);
    nav.appendChild(btn);
  }
  if (fim < resultados.length) {
    const btn = document.createElement('button');
    btn.textContent = '➡️ Próxima página';
    btn.onclick = () => mostrarPagina(resultados, pagina + 1, termo);
    nav.appendChild(btn);
  }

  const btnLimpar = document.createElement('button');
  btnLimpar.textContent = '🧹 Nova pesquisa';
  btnLimpar.onclick = () => {
    limparResultados();
    document.getElementById('busca-palavra').value = '';
    document.getElementById('busca-palavra').focus();
  };
  nav.appendChild(btnLimpar);
  div.appendChild(nav);
}

document.getElementById('buscarTexto').addEventListener('click', () => {
  const termo = document.getElementById('busca-palavra').value.trim();
  if (!termo) return;

  const termoNorm = normalizar(termo);
  const termoOrig = termo.toLowerCase();
  const palavras  = termoNorm.split(/\s+/);
  const usarNorm  = termo.length > 2;

  const resultados = dadosBiblia.filter(v => {
    const tokNorm = normalizar(v.texto).split(/\W+/);
    const tokOrig = v.texto.toLowerCase().split(/\W+/);
    return palavras.every(p => {
      if (!p) return true;
      return tokOrig.includes(termoOrig) || (usarNorm && tokNorm.includes(p));
    });
  });

  resultadosBusca = resultados;
  const div = document.getElementById('versiculos-container');
  div.innerHTML = '';

  if (resultados.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'Nenhum versículo encontrado nesta versão.';
    p.classList.add('sem-resultados');
    p.tabIndex = 0;
    div.appendChild(p);
    p.focus();
    return;
  }

  mostrarPagina(resultados, 1, termo);
});

// -----------------------------------------------------------
//  Iniciar
// -----------------------------------------------------------
carregarVersoes();
