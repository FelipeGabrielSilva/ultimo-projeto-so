const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { requireAuth } = require('../middleware/authMiddleware');

// Rotas de tarefas exigem autenticação
router.use(requireAuth);

// Endpoint de indicadores e estatísticas do dashboard (deve vir antes de /:id)
router.get('/dashboard-stats', taskController.getDashboardStats.bind(taskController));

router.get('/', taskController.getAll.bind(taskController));
router.post('/', taskController.create.bind(taskController));
router.get('/:id', taskController.getById.bind(taskController));
router.put('/:id', taskController.update.bind(taskController));
router.delete('/:id', taskController.delete.bind(taskController));

module.exports = router;
