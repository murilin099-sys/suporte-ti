/* ═══════════════════════════════
   notebook.js — Solicitações de Notebook
   ═══════════════════════════════ */

function getNotebooks() {
  try { return JSON.parse(localStorage.getItem(K.n)) || []; } catch(e) { return []; }
}
function setNotebooks(lista) {
  localStorage.setItem(K.n, JSON.stringify(lista));
}

function proximoNID() {
  const lista = getNotebooks();
  return lista.length > 0 ? Math.max(...lista.map(n => n.id || 0)) + 1 : 1;
}

function abrirNotebook(dados) {
  const lista = getNotebooks();
  const id = proximoNID();
  const novo = {
    id,
    protocolo:      'NB' + String(id).padStart(4, '0'),
    solicitanteId:  dados.solicitanteId,
    solicitanteNome:dados.solicitanteNome,
    sala:           dados.sala,
    turma:          dados.turma,
    data:           dados.data,
    horario:        dados.horario,
    quantidade:     Number(dados.quantidade),
    observacoes:    dados.observacoes || '',
    status:         'Pendente',
    dataEntrega:    null
  };
  lista.push(novo);
  setNotebooks(lista);
  return novo;
}

function atualizarStatusNotebook(id, status) {
  const lista = getNotebooks();
  const nb = lista.find(n => n.id === id);
  if (!nb) return false;
  nb.status = status;
  if (status === 'Entregue') nb.dataEntrega = new Date().toISOString();
  setNotebooks(lista);
  return true;
}

function renderTabelaNotebooks(containerThead, containerTbody, emptyEl, lista, opcoes) {
  const { showAcao = false } = opcoes;

  containerThead.innerHTML = `<tr>
    <th>Protocolo</th><th>Solicitante</th><th>Sala / Turma</th>
    <th>Data / Horário</th><th>Qtd</th><th>Status</th>
    ${showAcao ? '<th>Ação</th>' : ''}
  </tr>`;

  containerTbody.innerHTML = '';

  if (!lista.length) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');

  lista.sort((a, b) => {
    const da = new Date((a.data || '2000-01-01') + 'T' + (a.horario || '00:00'));
    const db = new Date((b.data || '2000-01-01') + 'T' + (b.horario || '00:00'));
    return db - da;
  });

  lista.forEach(nb => {
    const tr = document.createElement('tr');
    const df = nb.data ? nb.data.split('-').reverse().join('/') : '—';

    let h = `
      <td><span class="proto">${nb.protocolo || '—'}</span></td>
      <td style="color:var(--muted);font-size:0.82rem;">${nb.solicitanteNome}</td>
      <td><strong>${nb.sala}</strong> — ${nb.turma}</td>
      <td style="font-size:0.82rem;">${df} ${nb.horario || ''}</td>
      <td><strong>${nb.quantidade}</strong></td>
      <td><span class="badge b-${sl(nb.status)}">${nb.status}</span></td>`;

    if (showAcao) {
      let ac = '—';
      if (nb.status !== 'Entregue' && nb.status !== 'Cancelado') {
        ac = `<select class="iselect" onchange="window.onMudaNB(${nb.id},this.value)">
          <option ${nb.status==='Pendente'            ?'selected':''}>Pendente</option>
          <option ${nb.status==='Em separação'        ?'selected':''}>Em separação</option>
          <option ${nb.status==='Em rota de entrega'  ?'selected':''}>Em rota de entrega</option>
          <option ${nb.status==='Entregue'            ?'selected':''}>Entregue</option>
          <option ${nb.status==='Cancelado'           ?'selected':''}>Cancelado</option>
        </select>`;
      }
      h += `<td>${ac}</td>`;
    }

    tr.innerHTML = h;
    containerTbody.appendChild(tr);
  });
}
