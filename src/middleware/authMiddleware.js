const DEFAULT_USER = {
  id: 1,
  name: 'Administrador',
  email: 'admin@minigestao.local',
  role: 'admin',
};

/**
 * Middleware de contexto de usuário (acesso direto ao sistema sem login)
 */
function requireAuth(req, res, next) {
  req.currentUser = DEFAULT_USER;
  return next();
}

/**
 * Middleware de verificação de perfil (liberado para acesso direto)
 */
function requireAdmin(req, res, next) {
  req.currentUser = req.currentUser || DEFAULT_USER;
  return next();
}

/**
 * Redireciona diretamente para o painel principal
 */
function redirectIfAuthenticated(req, res, next) {
  return res.redirect('/dashboard');
}

module.exports = {
  DEFAULT_USER,
  requireAuth,
  requireAdmin,
  redirectIfAuthenticated,
};
