/* ═══════════════════════════════
   admin.js — Painel do Administrador
   ═══════════════════════════════ */

let logado = null;

document.addEventListener('DOMContentLoaded', () => {
  logado = verificarSessao('admin');
  if (!logado) return;

  /* Preenche info do usuário na topbar */
  document.getElementById('topUser').textContent = logado.nome;
  document.getElementById('avt').textContent     = logado.nome.charAt(0).toUpperCase();

  /* Nav */
  document.querySelectorAll('.nav-item[data-v]').forEach(b =>
    b.addEventListener('click', () => ir(b.dataset.v))
  );

  ir('home');
  renderUsuarios();

  /* Form novo usuário */
  document.getElementById('frmUser').addEventListener('submit', e => {
    e.preventDefault();
    const nome   = document.getElementById('un').value.trim();
    const email  = document.getElementById('ue').value.trim();
    const senha  = document.getElementById('us').value;
    const perfil = document.getElementById('up').value;

    const usuarios = getUsuarios();
    if (usuarios.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      toast('E-mail já cadastrado.', 'err'); return;
    }
    const nextId = Math.max(...usuarios.map(u => u.id), 0) + 1;
    usuarios.push({ id:nextId, nome, email, senha, perfil });
    localStorage.setItem(K.u, JSON.stringify(usuarios));
    toast('Usuário cadastrado!');
    e.target.reset();
    renderUsuarios();
  });
});

/* ── NAVEGAÇÃO ── */
const VIEWS_ADMIN = ['home', 'chamados', 'notebooks', 'usuarios'];

function ir(id) {
  VIEWS_ADMIN.forEach(v => {
    const el = document.getElementById('v-' + v);
    if (el) el.classList.add('hidden');
  });
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.nav-item[data-v="${id}"]`);
  if (btn) btn.classList.add('active');

  ({
    'home':      renderHome,
    'chamados':  renderTodosChamados,
    'notebooks': renderTodosNotebooks,
    'usuarios':  () => { document.getElementById('v-usuarios').classList.remove('hidden'); renderUsuarios(); }
  }[id] || (() => {}))();
}

/* ── HOME / DASHBOARD ── */
function renderHome() {
  document.getElementById('v-home').classList.remove('hidden');
  const chamados  = getChamados();
  const notebooks = getNotebooks();
  const usuarios  = getUsuarios();
  const st = (lbl, n, c) =>
    `<div class="stat ${c}"><div class="stat-label">${lbl}</div><div class="stat-num">${n}</div></div>`;

  document.getElementById('dashCards').innerHTML =
    st('Chamados pendentes',   chamados.filter(c => c.status === 'Pendente').length,     'yellow') +
    st('Em andamento',         chamados.filter(c => c.status === 'Em andamento').length, 'blue')   +
    st('Finalizados',          chamados.filter(c => c.status === 'Finalizado').length,   'green')  +
    st('Usuários',             usuarios.length,                                          'blue')   +
    st('Técnicos',             usuarios.filter(u => u.perfil === 'tecnico').length,      'green')  +
    st('NB pendentes',         notebooks.filter(n => n.status === 'Pendente').length,    'yellow');

  /* Chamados recentes */
  const ult = [...chamados].sort((a,b) => (b.id||0)-(a.id||0)).slice(0, 5);
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
        <div class="card-header"><div class="card-icon"><i class="fas fa-clock"></i></div><span class="card-title">Chamados recentes</span></div>
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
function renderTodosChamados() {
  document.getElementById('v-chamados').classList.remove('hidden');
  const lista = getChamados();
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
  renderTodosChamados();
  toast('Status atualizado!');
};
window.onAtribuir = id => {
  atribuirChamado(id, logado);
  renderTodosChamados();
  toast('Chamado atribuído!');
};

/* ── NOTEBOOKS ── */
function renderTodosNotebooks() {
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
  renderTodosNotebooks();
  toast('Status atualizado!');
};

/* ── USUÁRIOS ── */
function renderUsuarios() {
  const bdy      = document.getElementById('usrBdy');
  const usuarios = getUsuarios();
  bdy.innerHTML  = '';
  usuarios.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${u.nome}</strong></td>
      <td style="color:var(--muted);font-size:0.82rem;">${u.email}</td>
      <td><span class="ptag p-${u.perfil}">${u.perfil}</span></td>
      <td><button class="bsm bsm-d" onclick="delUsr(${u.id})"><i class="fas fa-trash-alt"></i> Excluir</button></td>`;
    bdy.appendChild(tr);
  });
}

function delUsr(id) {
  if (id === logado.id) { toast('Não é possível excluir a si mesmo.', 'err'); return; }
  if (!confirm('Confirma exclusão?')) return;
  let usuarios = getUsuarios().filter(u => u.id !== id);
  localStorage.setItem(K.u, JSON.stringify(usuarios));
  renderUsuarios();
  toast('Usuário excluído.');
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
