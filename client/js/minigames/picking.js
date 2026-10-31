// Minijuegos de elegir lo correcto: tablón, libro, café, certificado y compilar.

import { myInfo } from '../state.js';
import { pick, shuffle, progressBar } from './kit.js';

const FILL_MS = 1500;
const COMPILE_MS = 1200;
const STEP_MS = 100;
const FAKE_NAMES = ['Aarón', 'Nayra', 'Iballa', 'Echedey', 'Yeray', 'Tania', 'Acoidan', 'Carla', 'Dácil', 'Óscar'];
const GRADES = ['5,0', '6,3', '7,5', '8,1', '9,2', '4,9', '5,5', '6,8'];

// Rellena la barra durante ms y luego termina.
function fillThen(g, label, ms, done) {
  const setBar = progressBar(g.stage, label);
  let t = 0;
  g.interval(() => {
    if (t >= ms) return;
    t += STEP_MS;
    setBar(t / ms);
    if (t >= ms) g.finish(done);
  }, STEP_MS);
}

// Mirar las notas: busca tu nombre en la lista y púlsalo.
function tablon(g) {
  const me = myInfo()?.name || 'Tú';
  g.say(`Busca tu nota en el tablón: ${me}`);
  const board = g.el('div', 'mg-board');
  const names = shuffle([me, ...shuffle(FAKE_NAMES.filter((n) => n !== me)).slice(0, 7)]);
  for (const name of names) {
    const row = g.el('button', 'mg-board-row');
    row.append(g.el('span', '', name), g.el('span', 'mg-grade', '???'));
    row.addEventListener('click', () => {
      if (name !== me) return g.shake(row);
      row.lastChild.textContent = pick(GRADES.slice(0, 4));
      row.classList.add('found');
      g.finish('¡Aprobado!');
    });
    board.append(row);
  }
  g.stage.append(board);
}

// Buscar un libro: el que tiene la signatura pedida.
function libro(g) {
  const codes = shuffle(['QA76', 'TK51', 'QC17', 'TA34', 'QA39', 'TJ21', 'QD45', 'TK78', 'QA11', 'TN02']);
  const wanted = pick(codes);
  g.say(`Busca el libro con la signatura ${wanted}.`);
  const shelf = g.el('div', 'mg-shelf');
  const colors = ['#a85a40', '#3f7cac', '#c9803f', '#5f8f4e', '#7a5c9e', '#94592a'];
  codes.forEach((code, i) => {
    const book = g.el('button', 'mg-book', code);
    book.style.background = colors[i % colors.length];
    book.style.height = `${110 + ((i * 37) % 50)}px`;
    book.addEventListener('click', () => {
      if (code !== wanted) return g.shake(book);
      book.classList.add('found');
      g.finish('¡Libro encontrado!');
    });
    shelf.append(book);
  });
  g.stage.append(shelf);
}

// Pedir un café: elige el que pone en el ticket y espera a que se llene la taza.
function cafe(g) {
  const options = ['Solo', 'Cortado', 'Café con leche', 'Barraquito'];
  const order = pick(options);
  g.say('Prepara lo que pide el ticket.');
  const ticket = g.el('div', 'mg-ticket');
  ticket.append(g.el('small', '', 'TICKET Nº 042'), g.el('strong', '', order));
  const cup = g.el('div', 'mg-cup');
  const coffee = g.el('div', 'mg-coffee');
  cup.append(coffee);
  const buttons = g.el('div', 'mg-options');
  for (const name of shuffle(options)) {
    const b = g.el('button', 'btn ghost small', name);
    b.addEventListener('click', () => {
      if (name !== order) return g.shake(b);
      buttons.remove();
      coffee.classList.add('filling');
      fillThen(g, 'Sirviendo…', FILL_MS, '¡Marchando un ' + order.toLowerCase() + '!');
    });
    buttons.append(b);
  }
  g.stage.append(ticket, cup, buttons);
}

// Pedir un certificado: marca las casillas en orden (1, 2, 3, 4).
function certificado(g) {
  g.say('Marca las casillas del formulario en orden: 1, 2, 3 y 4.');
  const form = g.el('div', 'mg-form');
  let next = 1;
  const boxes = shuffle([1, 2, 3, 4]).map((n) => {
    const box = g.el('button', 'mg-check', String(n));
    box.addEventListener('click', () => {
      if (n !== next) {
        g.shake(form);
        next = 1;
        boxes.forEach((b) => b.classList.remove('checked'));
        return;
      }
      box.classList.add('checked');
      next++;
      if (next > 4) g.finish('¡Certificado solicitado!');
    });
    return box;
  });
  form.append(g.el('strong', '', 'Solicitud de certificado académico'), ...boxes);
  g.stage.append(form);
}

// Compilar el proyecto: pulsa las líneas con error y compila.
function compilar(g) {
  g.say('Pulsa las líneas en rojo para arreglar los errores.');
  // Cada línea: [versión con error, versión correcta].
  const lines = [
    ['int main(void) {', 'int main(void) {'],
    ['  int nota = 5', '  int nota = 5;'],
    ['  printf("Hola ESIT\\n")', '  printf("Hola ESIT\\n");'],
    ['  for (int i = 0; i < n; i++', '  for (int i = 0; i < n; i++)'],
    ['    suma += notas[i]', '    suma += notas[i];'],
    ['  retrun suma / n;', '  return suma / n;'],
    ['}', '}'],
  ];
  const broken = new Set(shuffle([1, 2, 3, 4, 5]).slice(0, 3));
  const editor = g.el('div', 'mg-editor');
  lines.forEach(([bad, good], i) => {
    const line = g.el('button', 'mg-code-line', `${i + 1}  ${broken.has(i) ? bad : good}`);
    if (broken.has(i)) line.classList.add('error');
    line.addEventListener('click', () => {
      if (!broken.delete(i)) return;
      line.textContent = `${i + 1}  ${good}`;
      line.classList.remove('error');
      line.classList.add('fixed');
      if (broken.size === 0) fillThen(g, 'Compilando…', COMPILE_MS, 'BUILD SUCCESSFUL');
    });
    editor.append(line);
  });
  g.stage.append(editor);
}

export const pickingGames = { tablon, libro, cafe, certificado, compilar };
