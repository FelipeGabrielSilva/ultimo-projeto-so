const db = require('../config/database');
const authService = require('../services/authService');

class UserController {
  /**
   * Listar todos os usuários
   * GET /api/users
   */
  async getAll(req, res, next) {
    try {
      const result = await db.query(
        'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id ASC'
      );
      return res.json(result.rows);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Consultar usuário por ID
   * GET /api/users/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await db.query(
        'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      return res.json(result.rows[0]);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Criar novo usuário
   * POST /api/users
   */
  async create(req, res, next) {
    try {
      const { name, email, password, role, is_active } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
      }

      const validRole = role === 'admin' ? 'admin' : 'user';
      const activeStatus = is_active !== false;

      // Verificar se e-mail já existe
      const existing = await db.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
        [email.trim()]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
      }

      const hashedPassword = await authService.hashPassword(password);

      const result = await db.query(
        `INSERT INTO users (name, email, password, role, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, role, is_active, created_at`,
        [name.trim(), email.trim().toLowerCase(), hashedPassword, validRole, activeStatus]
      );

      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso.',
        user: result.rows[0],
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Atualizar usuário
   * PUT /api/users/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, email, password, role, is_active } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
      }

      // Verificar se usuário existe
      const checkUser = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      if (checkUser.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      // Prevenir que o usuário logado desative a si mesmo ou altere seu próprio perfil de admin
      if (req.session.user && req.session.user.id === parseInt(id, 10)) {
        if (role && role !== 'admin') {
          return res.status(400).json({ error: 'Você não pode revogar seu próprio privilégio de administrador.' });
        }
        if (is_active === false) {
          return res.status(400).json({ error: 'Você não pode desativar sua própria conta.' });
        }
      }

      // Verificar duplicação de e-mail em outro usuário
      const duplicate = await db.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2',
        [email.trim(), id]
      );

      if (duplicate.rows.length > 0) {
        return res.status(409).json({ error: 'Este e-mail já está em uso por outro usuário.' });
      }

      const validRole = role === 'admin' ? 'admin' : 'user';
      const activeStatus = is_active !== false;

      let result;
      if (password && password.trim().length > 0) {
        // Atualizar também a senha
        const hashedPassword = await authService.hashPassword(password);
        result = await db.query(
          `UPDATE users
           SET name = $1, email = $2, password = $3, role = $4, is_active = $5
           WHERE id = $6
           RETURNING id, name, email, role, is_active, created_at`,
          [name.trim(), email.trim().toLowerCase(), hashedPassword, validRole, activeStatus, id]
        );
      } else {
        // Atualizar sem alterar a senha
        result = await db.query(
          `UPDATE users
           SET name = $1, email = $2, role = $3, is_active = $4
           WHERE id = $5
           RETURNING id, name, email, role, is_active, created_at`,
          [name.trim(), email.trim().toLowerCase(), validRole, activeStatus, id]
        );
      }

      return res.json({
        message: 'Usuário atualizado com sucesso.',
        user: result.rows[0],
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Excluir usuário
   * DELETE /api/users/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Impedir auto-exclusão
      if (req.session.user && req.session.user.id === parseInt(id, 10)) {
        return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
      }

      // Verificar se existe
      const checkUser = await db.query('SELECT id FROM users WHERE id = $1', [id]);
      if (checkUser.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      await db.query('DELETE FROM users WHERE id = $1', [id]);

      return res.json({ message: 'Usuário excluído com sucesso.' });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new UserController();

