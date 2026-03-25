/* ═══════════════════════════════
   chamados.js — Lógica de Chamados
   ═══════════════════════════════ */

function getChamados() {
  try { return JSON.parse(localStorage.getItem(K.c)) || []; } catch(e) { return []; }
}
function setChamados(lista) {
  localStorage.setItem(K.c, JSON.stringify(lista));
}

function proximoCID() {
  const lista = getChamados();
  return lista.length > 0 ? Math.max(...lista.map(c => c.id || 0)) + 1 : 1;
}

function gerarProtocoloCH() {
  const n = proximoCID();
  return 'CH' + String(n).padStart(4, '0');
}

function abrirChamado(dados) {
  const lista = getChamados();
  const id = proximoCID();
  const novo = {
    id,
    protocolo:      'CH' + String(id).padStart(4, '0'),
    titulo:         dados.titulo,
    categoria:      dados.categoria,
    prioridade:     dados.prioridade,
    local:          dados.local,
    descricao:      dados.descricao,
    solicitanteId:  dados.solicitanteId,
    solicitanteNome:dados.solicitanteNome,
    dataAbertura:   new Date().toISOString(),
    status:         'Pendente',
    tecnicoId:      null,
    tecnicoNome:    null
  };
  lista.push(novo);
  setChamados(lista);
  return novo;
}

function atualizarStatusChamado(id, status, tecnico) {
  const lista = getChamados();
  const ch = lista.find(c => c.id === id);
  if (!ch) return false;
  ch.status = status;
  if (status === 'Em andamento' && !ch.tecnicoId && tecnico) {
    ch.tecnicoId   = tecnico.id;
    ch.tecnicoNome = tecnico.nome;
  }
  if (status === 'Finalizado') {
    ch.dataFinalizado = new Date().toISOString();
  }
  setChamados(lista);
  return true;
}

function atribuirChamado(id, tecnico) {
  const lista = getChamados();
  const ch = lista.find(c => c.id === id);
  if (!ch) return false;
  ch.tecnicoId   = tecnico.id;
  ch.tecnicoNome = tecnico.nome;
  ch.status      = 'Em andamento';
  setChamados(lista);
  return true;
}

function sl(status) {
  return status.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function renderTabelaChamados(containerThead, containerTbody, emptyEl, lista, opcoes) {
  const { showSolicitante = false, showAcao = false, logado = null } = opcoes;

  containerThead.innerHTML = `<tr>
    <th>Protocolo</th><th>Título</th><th>Categoria</th><th>Prioridade</th>
    <th>Local</th><th>Data</th><th>Status</th>
    ${showSolicitante ? '<th>Solicitante</th>' : ''}
    ${showAcao        ? '<th>Ação</th>'        : ''}
  </tr>`;

  containerTbody.innerHTML = '';

  if (!lista.length) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');

  lista.sort((a, b) => (b.id || 0) - (a.id || 0));

  lista.forEach(ch => {
    const tr = document.createElement('tr');
    if (ch.prioridade === 'Urgente') tr.classList.add('urg');
    const dt = ch.dataAbertura
      ? new Date(ch.dataAbertura).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' })
      : '—';

    let h = `
      <td><span class="proto">${ch.protocolo || '—'}</span></td>
      <td><strong>${ch.titulo}</strong></td>
      <td>${ch.categoria}</td>
      <td>${ch.prioridade}</td>
      <td style="color:var(--muted);font-size:0.82rem;">${ch.local}</td>
      <td style="color:var(--muted);font-size:0.78rem;">${dt}</td>
      <td><span class="badge b-${sl(ch.status)}">${ch.status}</span></td>`;

    if (showSolicitante)
      h += `<td style="color:var(--muted);font-size:0.82rem;">${ch.solicitanteNome}</td>`;

    if (showAcao) {
      let ac = '—';
      if (ch.status !== 'Finalizado') {
        ac = `<select class="iselect" onchange="window.onMudaCH(${ch.id},this.value)">
          <option ${ch.status==='Pendente'     ?'selected':''}>Pendente</option>
          <option ${ch.status==='Em andamento' ?'selected':''}>Em andamento</option>
          <option ${ch.status==='Finalizado'   ?'selected':''}>Finalizado</option>
        </select>`;
        if (!ch.tecnicoId)
          ac += ` <button class="bsm bsm-p" onclick="window.onAtribuir(${ch.id})"><i class="fas fa-hand-point-right"></i> Atribuir</button>`;
      }
      h += `<td style="white-space:nowrap;">${ac}</td>`;
    }

    tr.innerHTML = h;
    containerTbody.appendChild(tr);
  });
}
