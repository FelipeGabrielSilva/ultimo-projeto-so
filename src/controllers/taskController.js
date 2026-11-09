const db = require('../config/database');

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

class TaskController {
  /**
   * Listar tarefas com suporte a filtros avançados
   * GET /api/tasks?search=...&client_id=...&user_id=...&status=...&start_date=...&end_date=...
   */
  async getAll(req, res, next) {
    try {
      const { search, client_id, user_id, status, start_date, end_date } = req.query;
      const conditions = [];
      const values = [];

      if (search && search.trim() !== '') {
        values.push(`%${search.trim()}%`);
        conditions.push(`(t.title ILIKE $${values.length} OR t.description ILIKE $${values.length})`);
      }

      if (client_id && client_id !== 'all') {
        values.push(parseInt(client_id, 10));
        conditions.push(`t.client_id = $${values.length}`);
      }

      if (user_id && user_id !== 'all') {
        values.push(parseInt(user_id, 10));
        conditions.push(`t.user_id = $${values.length}`);
      }

      if (status && status !== 'all') {
        values.push(status);
        conditions.push(`t.status = $${values.length}`);
      }

      if (start_date) {
        values.push(start_date);
        conditions.push(`t.due_date >= $${values.length}`);
      }

      if (end_date) {
        values.push(end_date);
        conditions.push(`t.due_date <= $${values.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const queryText = `
        SELECT 
          t.id, 
          t.client_id, 
          t.user_id, 
          t.title, 
          t.description, 
          t.status, 
          TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date, 
          t.created_at,
          c.name AS client_name,
          u.name AS user_name
        FROM tasks t
        JOIN clients c ON c.id = t.client_id
        LEFT JOIN users u ON u.id = t.user_id
        ${whereClause}
        ORDER BY 
          CASE WHEN t.status = 'completed' THEN 2 ELSE 1 END,
          t.due_date ASC NULLS LAST, 
          t.id DESC
      `;

      const result = await db.query(queryText, values);
      return res.json(result.rows);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Consultar tarefa por ID
   * GET /api/tasks/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const queryText = `
        SELECT 
          t.id, 
          t.client_id, 
          t.user_id, 
          t.title, 
          t.description, 
          t.status, 
          TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date, 
          t.created_at,
          c.name AS client_name,
          u.name AS user_name
        FROM tasks t
        JOIN clients c ON c.id = t.client_id
        LEFT JOIN users u ON u.id = t.user_id
        WHERE t.id = $1
      `;

      const result = await db.query(queryText, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tarefa não encontrada.' });
      }

      return res.json(result.rows[0]);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Criar nova tarefa
   * POST /api/tasks
   */
  async create(req, res, next) {
    try {
      const { client_id, user_id, title, description, status, due_date } = req.body;

      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'O título da tarefa é obrigatório.' });
      }

      if (!client_id) {
        return res.status(400).json({ error: 'É necessário selecionar um cliente para a tarefa.' });
      }

      // Validar se cliente existe
      const clientCheck = await db.query('SELECT id FROM clients WHERE id = $1', [client_id]);
      if (clientCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Cliente selecionado não foi encontrado.' });
      }

      // Validar se usuário responsável existe (se informado)
      let finalUserId = null;
      if (user_id) {
        const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
        if (userCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Usuário responsável não foi encontrado.' });
        }
        finalUserId = user_id;
      }

      const taskStatus = VALID_STATUSES.includes(status) ? status : 'pending';
      const taskDueDate = due_date && due_date.trim() !== '' ? due_date : null;

      const result = await db.query(
        `INSERT INTO tasks (client_id, user_id, title, description, status, due_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, client_id, user_id, title, description, status, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date, created_at`,
        [client_id, finalUserId, title.trim(), description ? description.trim() : null, taskStatus, taskDueDate]
      );

      return res.status(201).json({
        message: 'Tarefa cadastrada com sucesso.',
        task: result.rows[0],
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Atualizar tarefa existente
   * PUT /api/tasks/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { client_id, user_id, title, description, status, due_date } = req.body;

      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'O título da tarefa é obrigatório.' });
      }

      if (!client_id) {
        return res.status(400).json({ error: 'É necessário selecionar um cliente para a tarefa.' });
      }

      const checkTask = await db.query('SELECT id FROM tasks WHERE id = $1', [id]);
      if (checkTask.rows.length === 0) {
        return res.status(404).json({ error: 'Tarefa não encontrada.' });
      }

      const clientCheck = await db.query('SELECT id FROM clients WHERE id = $1', [client_id]);
      if (clientCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Cliente selecionado não foi encontrado.' });
      }

      let finalUserId = null;
      if (user_id) {
        const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
        if (userCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Usuário responsável não foi encontrado.' });
        }
        finalUserId = user_id;
      }

      const taskStatus = VALID_STATUSES.includes(status) ? status : 'pending';
      const taskDueDate = due_date && due_date.trim() !== '' ? due_date : null;

      const result = await db.query(
        `UPDATE tasks
         SET client_id = $1, user_id = $2, title = $3, description = $4, status = $5, due_date = $6
         WHERE id = $7
         RETURNING id, client_id, user_id, title, description, status, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date, created_at`,
        [client_id, finalUserId, title.trim(), description ? description.trim() : null, taskStatus, taskDueDate, id]
      );

      return res.json({
        message: 'Tarefa atualizada com sucesso.',
        task: result.rows[0],
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Excluir tarefa
   * DELETE /api/tasks/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const check = await db.query('SELECT id FROM tasks WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Tarefa não encontrada.' });
      }

      await db.query('DELETE FROM tasks WHERE id = $1', [id]);

      return res.json({ message: 'Tarefa excluída com sucesso.' });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Indicadores gerais e dados do Dashboard
   * GET /api/tasks/dashboard-stats
   */
  async getDashboardStats(req, res, next) {
    try {
      // 1. Contagens totais
      const clientsCountQuery = await db.query('SELECT COUNT(*)::int AS count FROM clients');
      const tasksCountQuery = await db.query(`
        SELECT 
          COUNT(*)::int AS total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END)::int AS in_progress,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::int AS cancelled
        FROM tasks
      `);

      // 2. Últimas 5 tarefas cadastradas
      const recentTasksQuery = await db.query(`
        SELECT 
          t.id, 
          t.title, 
          t.status, 
          TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date, 
          t.created_at,
          c.name AS client_name,
          u.name AS user_name
        FROM tasks t
        JOIN clients c ON c.id = t.client_id
        LEFT JOIN users u ON u.id = t.user_id
        ORDER BY t.id DESC
        LIMIT 5
      `);

      // 3. Tarefas próximas do vencimento (não concluídas nem canceladas, ordenadas por prazo)
      const dueSoonTasksQuery = await db.query(`
        SELECT 
          t.id, 
          t.title, 
          t.status, 
          TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date, 
          t.due_date - CURRENT_DATE AS days_until_due,
          c.name AS client_name,
          u.name AS user_name
        FROM tasks t
        JOIN clients c ON c.id = t.client_id
        LEFT JOIN users u ON u.id = t.user_id
        WHERE t.status IN ('pending', 'in_progress')
          AND t.due_date IS NOT NULL
        ORDER BY t.due_date ASC
        LIMIT 5
      `);

      const totalClients = clientsCountQuery.rows[0].count;
      const tasksStats = tasksCountQuery.rows[0];

      return res.json({
        totalClients,
        totalTasks: tasksStats.total,
        pendingTasks: tasksStats.pending,
        inProgressTasks: tasksStats.in_progress,
        completedTasks: tasksStats.completed,
        cancelledTasks: tasksStats.cancelled,
        recentTasks: recentTasksQuery.rows,
        dueSoonTasks: dueSoonTasksQuery.rows,
      });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new TaskController();

