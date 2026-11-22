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
