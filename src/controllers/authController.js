const authService = require('../services/authService');
const db = require('../config/database');
const { DEFAULT_USER } = require('../middleware/authMiddleware');

class AuthController {
  /**
   * Retorna os dados do usuário ativo padrão (acesso direto sem login)
   * GET /api/auth/me
   */
  async me(req, res, next) {
    try {
      const result = await db.query(
        'SELECT id, name, email, role FROM users ORDER BY id ASC LIMIT 1'
      );
      const user = result.rows[0] || DEFAULT_USER;
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Atualiza o perfil do usuário ativo (nome e/ou senha)
   * PUT /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const firstUserResult = await db.query(
        'SELECT * FROM users ORDER BY id ASC LIMIT 1'
      );

      if (firstUserResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const user = firstUserResult.rows[0];
      const userId = user.id;
      const { name, currentPassword, newPassword } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'O nome é obrigatório.' });
      }

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

      return res.json({
        message: 'Perfil atualizado com sucesso.',
        user: {
          id: userId,
          name: name.trim(),
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AuthController();
