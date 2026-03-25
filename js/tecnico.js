/* ═══════════════════════════════
   tecnico.js — Painel do Técnico
   ═══════════════════════════════ */

let logado = null;

document.addEventListener('DOMContentLoaded', () => {
  logado = verificarSessao('tecnico');
  if (!logado) return;

  document.getElementById('topUser').textContent = logado.nome;
  document.getElementById('avt').textContent     = logado.nome.charAt(0).toUpperCase();

  document.querySelectorAll('.nav-item[data-v]').forEach(b =>
    b.addEventListener('click', () => ir(b.dataset.v))
  );

  ir('home');
});

/* ── NAVEGAÇÃO ── */
const VIEWS_TEC = ['home', 'chamados', 'notebooks'];

function ir(id) {
  VIEWS_TEC.forEach(v => {
    const el = document.getElementById('v-' + v);
    if (el) el.classList.add('hidden');
  });
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.nav-item[data-v="${id}"]`);
  if (btn) btn.classList.add('active');

  ({
    'home':      renderHome,
    'chamados':  renderChamadosTecnico,
    'notebooks': renderNotebooksTecnico
  }[id] || (() => {}))();
}

/* ── HOME ── */
function renderHome() {
  document.getElementById('v-home').classList.remove('hidden');
  const chamados  = getChamados();
  const notebooks = getNotebooks();
  const meus      = chamados.filter(c => c.tecnicoId === logado.id);
  const st = (lbl, n, c) =>
    `<div class="stat ${c}"><div class="stat-label">${lbl}</div><div class="stat-num">${n}</div></div>`;

  document.getElementById('dashCards').innerHTML =
    st('Atribuídos a mim', meus.filter(c => c.status !== 'Finalizado').length, 'blue')   +
    st('Finalizados',      meus.filter(c => c.status === 'Finalizado').length,  'green')  +
    st('NB pendentes',     notebooks.filter(n => n.status === 'Pendente').length,'yellow') +
    st('Chamados livres',  chamados.filter(c => !c.tecnicoId && c.status === 'Pendente').length, 'red');

  const ult = [...chamados]
    .filter(c => c.tecnicoId === logado.id || (!c.tecnicoId && c.status === 'Pendente'))
    .sort((a,b) => (b.id||0)-(a.id||0)).slice(0, 5);
  const resume = document.getElementById('homeResume');
  if (ult.length) {
    const tbody = ult.map(c => `
      <tr class="${c.prioridade==='Urgente'?'urg':''}">
        <td><span class="proto">${c.protocolo||'—'}</span></td>
        <td><strong>${c.titulo}</strong></td>
        <td>${c.prioridade}</td>
        <td><span class="badge b-${sl(c.status)}">${c.status}</span></td>
        <td style="color:var(--muted);font-size:0.82rem;">${c.solicitanteNome}</td>
      </tr>`).join('');
    resume.innerHTML = `
      <div class="card" style="margin-bottom:0;">
        <div class="card-header"><div class="card-icon"><i class="fas fa-clock"></i></div><span class="card-title">Chamados para atendimento</span></div>
        <div class="tbl-wrap"><table>
          <thead><tr><th>Protocolo</th><th>Título</th><th>Prioridade</th><th>Status</th><th>Solicitante</th></tr></thead>
          <tbody>${tbody}</tbody>
        </table></div>
      </div>`;
  } else {
    resume.innerHTML = '';
  }
}

/* ── CHAMADOS ── */
function renderChamadosTecnico() {
  document.getElementById('v-chamados').classList.remove('hidden');
  const todos = getChamados();
  const lista = todos.filter(c =>
    c.tecnicoId === logado.id || (!c.tecnicoId && c.status === 'Pendente')
  );
  renderTabelaChamados(
    document.getElementById('chThead'),
    document.getElementById('chTbody'),
    document.getElementById('chVazio'),
    lista,
    { showSolicitante: true, showAcao: true, logado }
  );
}

window.onMudaCH = (id, status) => {
  atualizarStatusChamado(id, status, logado);
  renderChamadosTecnico();
  toast('Status atualizado!');
};
window.onAtribuir = id => {
  atribuirChamado(id, logado);
  renderChamadosTecnico();
  toast('Chamado atribuído a você!');
};

/* ── NOTEBOOKS ── */
function renderNotebooksTecnico() {
  document.getElementById('v-notebooks').classList.remove('hidden');
  const lista = getNotebooks();
  renderTabelaNotebooks(
    document.getElementById('nbThead'),
    document.getElementById('nbTbody'),
    document.getElementById('nbVazio'),
    lista,
    { showAcao: true }
  );
}
window.onMudaNB = (id, status) => {
  atualizarStatusNotebook(id, status);
  renderNotebooksTecnico();
  toast('Status atualizado!');
};

/* ── TOAST ── */
let _tt;
function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toastEl');
  el.className = 'toast ' + tipo;
  el.innerHTML = `<i class="fas fa-${tipo==='ok'?'check-circle':'exclamation-circle'}"></i> ${msg}`;
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.add('hidden'), 3200);
}
