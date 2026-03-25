/* ═══════════════════════════════
   solicitante.js — Painel do Solicitante
   ═══════════════════════════════ */

let logado = null;

document.addEventListener('DOMContentLoaded', () => {
  logado = verificarSessao('solicitante');
  if (!logado) return;

  document.getElementById('topUser').textContent = logado.nome;
  document.getElementById('avt').textContent     = logado.nome.charAt(0).toUpperCase();
  document.getElementById('nomeUsr').textContent = logado.nome.split(' ')[0];

  document.querySelectorAll('.nav-item[data-v]').forEach(b =>
    b.addEventListener('click', () => ir(b.dataset.v))
  );

  /* Form chamado */
  document.getElementById('frmChamado').addEventListener('submit', e => {
    e.preventDefault();
    const novo = abrirChamado({
      titulo:          document.getElementById('ct').value,
      categoria:       document.getElementById('cc').value,
      prioridade:      document.getElementById('cp').value,
      local:           document.getElementById('cl').value,
      descricao:       document.getElementById('cd').value,
      solicitanteId:   logado.id,
      solicitanteNome: logado.nome
    });
    toast('Chamado aberto! Protocolo: ' + novo.protocolo);
    e.target.reset();
  });

  /* Form notebook */
  document.getElementById('frmNotebook').addEventListener('submit', e => {
    e.preventDefault();
    const novo = abrirNotebook({
      solicitanteId:   logado.id,
      solicitanteNome: logado.nome,
      sala:            document.getElementById('ns').value,
      turma:           document.getElementById('nt').value,
      data:            document.getElementById('nd').value,
      horario:         document.getElementById('nh').value,
      quantidade:      document.getElementById('nq').value,
      observacoes:     document.getElementById('no').value
    });
    toast('Solicitação registrada! Protocolo: ' + novo.protocolo);
    e.target.reset();
  });

  ir('home');
});

/* ── NAVEGAÇÃO ── */
const VIEWS_SOL = ['home', 'novo-chamado', 'novo-notebook', 'chamados', 'notebooks'];

function ir(id) {
  VIEWS_SOL.forEach(v => {
    const el = document.getElementById('v-' + v);
    if (el) el.classList.add('hidden');
  });
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.nav-item[data-v="${id}"]`);
  if (btn) btn.classList.add('active');

  ({
    'home':          renderHome,
    'novo-chamado':  () => document.getElementById('v-novo-chamado').classList.remove('hidden'),
    'novo-notebook': () => document.getElementById('v-novo-notebook').classList.remove('hidden'),
    'chamados':      renderMeusChamados,
    'notebooks':     renderMeusNotebooks
  }[id] || (() => {}))();
}

/* ── HOME ── */
function renderHome() {
  document.getElementById('v-home').classList.remove('hidden');
  const chamados  = getChamados().filter(c => c.solicitanteId === logado.id);
  const notebooks = getNotebooks().filter(n => n.solicitanteId === logado.id);
  const st = (lbl, n, c) =>
    `<div class="stat ${c}"><div class="stat-label">${lbl}</div><div class="stat-num">${n}</div></div>`;

  document.getElementById('dashCards').innerHTML =
    st('Pendentes',           chamados.filter(c => c.status === 'Pendente').length,     'yellow') +
    st('Em atendimento',      chamados.filter(c => c.status === 'Em andamento').length, 'blue')   +
    st('Finalizados',         chamados.filter(c => c.status === 'Finalizado').length,   'green')  +
    st('Notebooks solicitados', notebooks.length,                                       'blue');
}

/* ── MEUS CHAMADOS ── */
function renderMeusChamados() {
  document.getElementById('v-chamados').classList.remove('hidden');
  const lista = getChamados().filter(c => c.solicitanteId === logado.id);
  renderTabelaChamados(
    document.getElementById('chThead'),
    document.getElementById('chTbody'),
    document.getElementById('chVazio'),
    lista,
    { showSolicitante: false, showAcao: false }
  );
}

/* ── MEUS NOTEBOOKS ── */
function renderMeusNotebooks() {
  document.getElementById('v-notebooks').classList.remove('hidden');
  const lista = getNotebooks().filter(n => n.solicitanteId === logado.id);
  renderTabelaNotebooks(
    document.getElementById('nbThead'),
    document.getElementById('nbTbody'),
    document.getElementById('nbVazio'),
    lista,
    { showAcao: false }
  );
}

/* ── TOAST ── */
let _tt;
function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toastEl');
  el.className = 'toast ' + tipo;
  el.innerHTML = `<i class="fas fa-${tipo==='ok'?'check-circle':'exclamation-circle'}"></i> ${msg}`;
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.add('hidden'), 3200);
}
