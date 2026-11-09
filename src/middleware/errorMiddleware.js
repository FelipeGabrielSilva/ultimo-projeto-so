/**
 * Middleware para rotas não encontradas (404)
 */
function notFoundHandler(req, res, next) {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ error: 'Recurso não encontrado na API.' });
  }
  return res.status(404).sendFile('404.html', { root: './src/views' }, (err) => {
    if (err) {
      res.status(404).send('<h1>404 - Página não encontrada</h1><p><a href="/dashboard">Voltar ao painel</a></p>');
    }
  });
}

/**
 * Middleware de tratamento de erros global
 */
function errorHandler(err, req, res, next) {
  // Registra o erro no log interno do servidor
  console.error('[ERRO INTERNO]', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  const statusCode = err.status || err.statusCode || 500;
  const isApi = req.originalUrl.startsWith('/api/') || req.xhr;

  const clientMessage = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.'
    : err.message || 'Erro inesperado.';

  if (isApi) {
    return res.status(statusCode).json({ error: clientMessage });
  }

  return res.status(statusCode).send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h2>Ops! Ocorreu um erro (${statusCode})</h2>
      <p>${clientMessage}</p>
      <a href="/dashboard" style="display: inline-block; padding: 10px 20px; background: #0d6efd; color: white; text-decoration: none; border-radius: 5px;">Voltar ao Dashboard</a>
    </div>
  `);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
