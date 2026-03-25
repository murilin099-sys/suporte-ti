/* ═══════════════════════════════
   login.js — Autenticação
   ═══════════════════════════════ */

const K = { u:'ti_u', c:'ti_c', n:'ti_n', s:'ti_s' };

/* Usuários padrão — usados se localStorage estiver vazio */
const USUARIOS_PADRAO = [
  { id:1, nome:'Administrador',  email:'admin@escola.br',  senha:'123', perfil:'admin'       },
  { id:2, nome:'João Técnico',   email:'tec1@escola.br',   senha:'123', perfil:'tecnico'     },
  { id:3, nome:'Profª Carolina', email:'prof1@escola.br',  senha:'123', perfil:'solicitante' }
];

function getUsuarios() {
  try {
    const raw = localStorage.getItem(K.u);
    if (!raw) return USUARIOS_PADRAO;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : USUARIOS_PADRAO;
  } catch(e) {
    return USUARIOS_PADRAO;
  }
}

function fazerLogin(email, senha) {
  const usuarios = getUsuarios();
  const user = usuarios.find(u =>
    u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
    u.senha === senha
  );
  return user || null;
}

function salvarSessao(user) {
  localStorage.setItem(K.s, JSON.stringify(user));
}

function getSessao() {
  try {
    const raw = localStorage.getItem(K.s);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) {
    return null;
  }
}

function logout() {
  localStorage.removeItem(K.s);
  window.location.href = 'login.html';
}

/* Verifica sessão ativa e redireciona se necessário */
function verificarSessao(perfilEsperado) {
  const sessao = getSessao();
  if (!sessao) {
    window.location.href = 'login.html';
    return null;
  }
  /* Valida que o usuário ainda existe */
  const usuarios = getUsuarios();
  const userAtual = usuarios.find(u => u.id === sessao.id && u.email === sessao.email);
  if (!userAtual) {
    logout();
    return null;
  }
  /* Redireciona se o perfil não bate */
  if (perfilEsperado && userAtual.perfil !== perfilEsperado) {
    redirecionarPorPerfil(userAtual.perfil);
    return null;
  }
  return userAtual;
}

function redirecionarPorPerfil(perfil) {
  const rotas = {
    admin:       'admin.html',
    tecnico:     'tecnico.html',
    solicitante: 'solicitante.html'
  };
  window.location.href = rotas[perfil] || 'login.html';
}
