const authService = require('../services/authService');

class AuthController {
  /**
   * Realiza login do usuário
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      const user = await authService.validateCredentials(email, password);

      // Salva usuário na sessão
      req.session.user = user;

      // Garante que a sessão seja salva antes de responder
      req.session.save((err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: 'Login realizado com sucesso.',
          user,
        });
      });
    } catch (err) {
      return res.status(401).json({ error: err.message || 'Credenciais inválidas.' });
    }
  }

  /**
   * Encerra a sessão do usuário
   * POST /api/auth/logout
   */
  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao encerrar sessão.' });
      }
      res.clearCookie('connect.sid');
      return res.json({ message: 'Logout realizado com sucesso.' });
    });
  }

  /**
   * Retorna os dados do usuário logado na sessão
   * GET /api/auth/me
   */
  me(req, res) {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }
    return res.json({ user: req.session.user });
  }
}

module.exports = new AuthController();

