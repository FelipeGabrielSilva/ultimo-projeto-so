const db = require('../config/database');

class ClientController {
  /**
   * Listar todos os clientes com suporte a pesquisa e filtros
   * GET /api/clients?search=...&status=...
   */
  async getAll(req, res, next) {
    try {
      const { search, status } = req.query;
      const conditions = [];
      const values = [];

      if (search && search.trim() !== '') {
        values.push(`%${search.trim()}%`);
        conditions.push(`(c.name ILIKE $${values.length} OR c.document ILIKE $${values.length} OR c.email ILIKE $${values.length})`);
      }

      if (status && status !== 'all') {
        values.push(status);
        conditions.push(`c.status = $${values.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const queryText = `
        SELECT 
          c.id, 
          c.name, 
          c.email, 
          c.phone, 
          c.document, 
          c.status, 
          c.created_at,
          COUNT(t.id)::int AS total_tasks,
          COUNT(CASE WHEN t.status = 'pending' OR t.status = 'in_progress' THEN 1 END)::int AS open_tasks
        FROM clients c
        LEFT JOIN tasks t ON t.client_id = c.id
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.id DESC
      `;

      const result = await db.query(queryText, values);
      return res.json(result.rows);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Consultar cliente por ID, incluindo suas tarefas
   * GET /api/clients/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const clientResult = await db.query(
        'SELECT id, name, email, phone, document, status, created_at FROM clients WHERE id = $1',
        [id]
      );

      if (clientResult.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }

      // Buscar tarefas vinculadas a esse cliente
      const tasksResult = await db.query(
        `SELECT t.id, t.title, t.description, t.status, t.due_date, t.created_at, u.name AS user_name
         FROM tasks t
         LEFT JOIN users u ON u.id = t.user_id
         WHERE t.client_id = $1
         ORDER BY t.due_date ASC NULLS LAST, t.id DESC`,
        [id]
      );

      const client = clientResult.rows[0];
      client.tasks = tasksResult.rows;

      return res.json(client);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Criar novo cliente
   * POST /api/clients
   */
  async create(req, res, next) {
    try {
      const { name, email, phone, document, status } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'O nome do cliente é obrigatório.' });
      }

      const clientStatus = status === 'inactive' ? 'inactive' : 'active';

      const result = await db.query(
        `INSERT INTO clients (name, email, phone, document, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, phone, document, status, created_at`,
        [
          name.trim(),
          email ? email.trim() : null,
          phone ? phone.trim() : null,
          document ? document.trim() : null,
          clientStatus,
        ]
      );

      return res.status(201).json({
        message: 'Cliente cadastrado com sucesso.',
        client: result.rows[0],
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Atualizar dados do cliente
   * PUT /api/clients/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, email, phone, document, status } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'O nome do cliente é obrigatório.' });
      }

      const check = await db.query('SELECT id FROM clients WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }

      const clientStatus = status === 'inactive' ? 'inactive' : 'active';

      const result = await db.query(
        `UPDATE clients
         SET name = $1, email = $2, phone = $3, document = $4, status = $5
         WHERE id = $6
         RETURNING id, name, email, phone, document, status, created_at`,
        [
          name.trim(),
          email ? email.trim() : null,
          phone ? phone.trim() : null,
          document ? document.trim() : null,
          clientStatus,
          id,
        ]
      );

      return res.json({
        message: 'Cliente atualizado com sucesso.',
        client: result.rows[0],
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Excluir cliente
   * DELETE /api/clients/:id
   * Regra de segurança: Bloqueia exclusão caso possua tarefas vinculadas
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const check = await db.query('SELECT id, name FROM clients WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }

      // Verificar se o cliente possui tarefas relacionadas
      const tasksCheck = await db.query('SELECT COUNT(*)::int AS count FROM tasks WHERE client_id = $1', [id]);
      const taskCount = tasksCheck.rows[0].count;

      if (taskCount > 0) {
        return res.status(400).json({
          error: `Não é possível excluir o cliente "${check.rows[0].name}" porque ele possui ${taskCount} tarefa(s) vinculada(s). Remova ou altere as tarefas antes de excluir o cliente.`,
        });
      }

      await db.query('DELETE FROM clients WHERE id = $1', [id]);

      return res.json({ message: 'Cliente excluído com sucesso.' });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new ClientController();

