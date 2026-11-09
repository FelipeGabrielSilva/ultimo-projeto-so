const authService = require('../services/authService');
const db = require('../config/database');

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

  /**
   * Atualiza o perfil do usuário logado (nome e/ou senha)
   * PUT /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      const userId = req.session.user.id;
      const { name, currentPassword, newPassword } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'O nome é obrigatório.' });
      }

      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const user = userResult.rows[0];

      if (newPassword && newPassword.trim().length > 0) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Informe a sua senha atual para definir uma nova.' });
        }

        const isMatch = await authService.comparePassword(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Senha atual incorreta.' });
        }

        if (newPassword.trim().length < 6) {
          return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
        }

        const hashedPassword = await authService.hashPassword(newPassword.trim());

        await db.query('UPDATE users SET name = $1, password = $2 WHERE id = $3', [
          name.trim(),
          hashedPassword,
          userId,
        ]);
      } else {
        await db.query('UPDATE users SET name = $1 WHERE id = $2', [name.trim(), userId]);
      }

      req.session.user.name = name.trim();
      req.session.save((err) => {
        if (err) return next(err);
        return res.json({
          message: 'Perfil atualizado com sucesso.',
          user: req.session.user,
        });
      });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AuthController();

