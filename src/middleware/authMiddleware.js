/**
 * Middleware para verificar se o usuário está autenticado
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  // Se for requisição de API ou AJAX, retorna status 401 JSON
  const isApi = req.originalUrl.startsWith('/api/') || 
                req.xhr || 
                (req.headers.accept && req.headers.accept.includes('application/json'));

  if (isApi) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login para continuar.' });
  }

  // Se for navegação de página no navegador, redireciona para login
  return res.redirect('/login');
}

/**
 * Middleware para verificar se o usuário é administrador
 */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    const isApi = req.originalUrl.startsWith('/api/') || req.xhr;
    if (isApi) {
      return res.status(401).json({ error: 'Acesso não autorizado.' });
    }
    return res.redirect('/login');
  }

  if (req.session.user.role !== 'admin') {
    const isApi = req.originalUrl.startsWith('/api/') || req.xhr;
    if (isApi) {
      return res.status(403).json({ error: 'Permissão negada. Apenas administradores podem executar esta ação.' });
    }
    return res.redirect('/dashboard?error=forbidden');
  }

  return next();
}

/**
 * Middleware para páginas públicas (como /login): redireciona se já estiver autenticado
 */
function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  redirectIfAuthenticated,
};

