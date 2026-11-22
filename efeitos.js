const tabuleiro = document.getElementById('tabuleiro');
const dica = document.getElementById('dica');
const area = tabuleiro.parentElement;
let chaveAtual = '';

const limparDestaques = () => {
  for (const celula of tabuleiro.querySelectorAll('.destaque')) {
    celula.classList.remove('destaque');
  }
};

const criarItem = (palavra) => {
  const item = document.querySelector(`#listaDicas [data-palavra="${palavra}"]`);
  const escrita = item.textContent.trim();

  const bloco = document.createElement('div');
  bloco.className = 'dicaItem';

  const categoria = document.createElement('span');
  categoria.className = 'dicaCategoria';
  categoria.textContent = `${item.value} ${item.parentElement.dataset.direcao}`;

  const texto = document.createElement('p');
  texto.className = escrita ? 'dicaTexto' : 'dicaTexto vazia';
  texto.textContent = escrita || 'Dica ainda não escrita.';

  bloco.append(categoria, texto);
  return bloco;
};

const mostrarDica = (celula) => {
  const palavras = [celula.dataset.h, celula.dataset.v].filter(Boolean);
  const chave = palavras.join('|');

  if (chave !== chaveAtual) {
    chaveAtual = chave;
    limparDestaques();
    dica.replaceChildren();
    for (const palavra of palavras) {
      for (const parte of tabuleiro.querySelectorAll(`[data-h="${palavra}"], [data-v="${palavra}"]`)) {
        parte.classList.add('destaque');
      }
      dica.append(criarItem(palavra));
    }
  }

  const caixa = celula.getBoundingClientRect();
  const base = area.getBoundingClientRect();
  const centro = caixa.left - base.left + caixa.width / 2;
  const metade = dica.offsetWidth / 2;
  const x = Math.min(Math.max(centro, metade), base.width - metade);

  const primeiraVez = !dica.classList.contains('visivel');
  if (primeiraVez) dica.style.transition = 'none';
  dica.style.setProperty('--x', `${x}px`);
  dica.style.setProperty('--y', `${caixa.top - base.top}px`);
  dica.style.setProperty('--seta', `${centro - x}px`);
  if (primeiraVez) {
    void dica.offsetWidth;
    dica.style.transition = '';
  }
  dica.classList.add('visivel');
};

const esconderDica = () => {
  dica.classList.remove('visivel');
  limparDestaques();
  chaveAtual = '';
};

const aoEntrar = (evento) => {
  const celula = evento.target.closest('.celula');
  if (celula) mostrarDica(celula);
};

tabuleiro.addEventListener('mouseover', aoEntrar);
tabuleiro.addEventListener('focusin', aoEntrar);
tabuleiro.addEventListener('mouseleave', esconderDica);
tabuleiro.addEventListener('focusout', (evento) => {
  if (!tabuleiro.contains(evento.relatedTarget)) esconderDica();
});

const botaoConferir = document.getElementById('botaoConferir');
const botaoReiniciar = document.getElementById('botaoReiniciar');
const acertos = document.getElementById('acertos');
const parabens = document.getElementById('parabens');
const palavras = [...document.querySelectorAll('#listaDicas [data-palavra]')].map((item) => item.dataset.palavra);

const limparResultado = () => {
  for (const celula of tabuleiro.querySelectorAll('.certa, .errada')) {
    celula.classList.remove('certa', 'errada');
  }
  parabens.hidden = true;
  acertos.textContent = '–';
};

const conferir = () => {
  limparResultado();
  let total = 0;

  for (const palavra of palavras) {
    const celulas = tabuleiro.querySelectorAll(`[data-h="${palavra}"], [data-v="${palavra}"]`);
    let digitado = '';
    for (const celula of celulas) {
      digitado += celula.querySelector('input').value.toUpperCase();
    }

    if (digitado === palavra.toUpperCase()) {
      total++;
      for (const celula of celulas) {
        celula.classList.remove('errada');
        celula.classList.add('certa');
      }
    } else {
      for (const celula of celulas) {
        const preenchida = celula.querySelector('input').value !== '';
        if (preenchida && !celula.classList.contains('certa')) celula.classList.add('errada');
      }
    }
  }

  acertos.textContent = total;
  if (total === palavras.length) {
    parabens.hidden = false;
    parabens.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const reiniciar = () => {
  for (const campo of tabuleiro.querySelectorAll('input')) {
    campo.value = '';
  }
  limparResultado();
  acertos.textContent = '0';
  esconderDica();
};

botaoConferir.addEventListener('click', conferir);
botaoReiniciar.addEventListener('click', reiniciar);
tabuleiro.addEventListener('input', limparResultado);

/* ---------- Digitação fluida: o cursor avança sozinho pela palavra ---------- */

const colunas = getComputedStyle(tabuleiro).gridTemplateColumns.split(' ').length;
let direcao = 'h'; // 'h' = horizontal, 'v' = vertical

const outraDirecao = () => (direcao === 'h' ? 'v' : 'h');

// Se a casa não pertence a uma palavra na direção atual, troca para a outra.
const ajustarDirecao = (celula) => {
  if (!celula.dataset[direcao]) direcao = outraDirecao();
};

const casasDaPalavra = (celula) => {
  const nome = celula.dataset[direcao];
  if (!nome) return [];
  return [...tabuleiro.querySelectorAll(`[data-${direcao}="${nome}"] input`)];
};

const marcarPalavraAtiva = (celula) => {
  for (const c of tabuleiro.querySelectorAll('.palavraAtiva')) c.classList.remove('palavraAtiva');
  if (!celula) return;
  for (const campo of casasDaPalavra(celula)) campo.closest('.celula').classList.add('palavraAtiva');
};

// Move o foco `passo` casas dentro da palavra atual (+1 avança, -1 volta).
const vizinhaNaPalavra = (campo, passo) => {
  const lista = casasDaPalavra(campo.closest('.celula'));
  return lista[lista.indexOf(campo) + passo] || null;
};

// Move o foco para a casa vizinha no tabuleiro (usado pelas setas).
const vizinhaNoTabuleiro = (campo, deltaLinha, deltaColuna) => {
  const filhos = [...tabuleiro.children];
  const indice = filhos.indexOf(campo.closest('.celula'));
  const linha = Math.floor(indice / colunas) + deltaLinha;
  const coluna = (indice % colunas) + deltaColuna;
  if (coluna < 0 || coluna >= colunas || linha < 0) return null;
  const alvo = filhos[linha * colunas + coluna];
  return alvo && alvo.classList.contains('celula') ? alvo.querySelector('input') : null;
};

const processarLetra = (campo) => {
  const letra = [...campo.value].find((c) => /\p{L}/u.test(c)) || '';
  campo.value = letra;
  if (!letra) return;
  const proxima = vizinhaNaPalavra(campo, 1);
  if (proxima) proxima.focus();
};

tabuleiro.addEventListener('focusin', (evento) => {
  const campo = evento.target;
  if (!campo.matches('input')) return;
  const celula = campo.closest('.celula');
  ajustarDirecao(celula);
  marcarPalavraAtiva(celula);
  campo.select(); // a próxima letra digitada substitui a atual
});

tabuleiro.addEventListener('focusout', (evento) => {
  if (!tabuleiro.contains(evento.relatedTarget)) marcarPalavraAtiva(null);
});

// Clicar de novo na casa já selecionada alterna entre horizontal e vertical.
tabuleiro.addEventListener('mousedown', (evento) => {
  const campo = evento.target;
  if (!campo.matches('input') || campo !== document.activeElement) return;
  const celula = campo.closest('.celula');
  if (celula.dataset.h && celula.dataset.v) {
    direcao = outraDirecao();
    marcarPalavraAtiva(celula);
  }
});

// O navegador coloca o cursor ao soltar o mouse; selecionamos de novo para sobrescrever.
tabuleiro.addEventListener('click', (evento) => {
  if (evento.target.matches('input')) evento.target.select();
});

// Digitação normal: tratamos antes de o navegador inserir o texto. Assim a letra
// avança mesmo quando é igual à que já estava na casa (o navegador não dispararia
// 'input' nesse caso) e o limite de 1 caractere nunca bloqueia a tecla.
tabuleiro.addEventListener('beforeinput', (evento) => {
  const campo = evento.target;
  if (!campo.matches('input') || evento.inputType !== 'insertText') return;
  evento.preventDefault();
  const letra = [...(evento.data || '')].find((c) => /\p{L}/u.test(c));
  if (!letra) return;
  campo.value = letra;
  limparResultado();
  const proxima = vizinhaNaPalavra(campo, 1);
  if (proxima) proxima.focus();
  else campo.select();
});

// Colar e teclados com composição (alguns celulares) chegam por aqui.
tabuleiro.addEventListener('input', (evento) => {
  if (evento.target.matches('input') && !evento.isComposing) processarLetra(evento.target);
});
tabuleiro.addEventListener('compositionend', (evento) => {
  if (evento.target.matches('input')) processarLetra(evento.target);
});

tabuleiro.addEventListener('keydown', (evento) => {
  const campo = evento.target;
  if (!campo.matches('input') || evento.ctrlKey || evento.metaKey || evento.altKey) return;

  if (evento.key === 'Backspace' && campo.value === '') {
    const anterior = vizinhaNaPalavra(campo, -1);
    evento.preventDefault();
    if (anterior) {
      anterior.value = '';
      limparResultado();
      anterior.focus();
    }
    return;
  }

  const setas = {
    ArrowLeft: ['h', 0, -1],
    ArrowRight: ['h', 0, 1],
    ArrowUp: ['v', -1, 0],
    ArrowDown: ['v', 1, 0],
  };
  if (setas[evento.key]) {
    const [eixo, dLinha, dColuna] = setas[evento.key];
    evento.preventDefault();
    direcao = eixo;
    const alvo = vizinhaNoTabuleiro(campo, dLinha, dColuna);
    if (alvo) alvo.focus();
    else marcarPalavraAtiva(campo.closest('.celula'));
  }
});

for (const campo of tabuleiro.querySelectorAll('input')) {
  campo.setAttribute('autocapitalize', 'characters');
  campo.setAttribute('autocorrect', 'off');
  campo.setAttribute('spellcheck', 'false');
}
