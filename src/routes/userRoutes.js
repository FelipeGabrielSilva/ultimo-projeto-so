const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Consulta de usuários: qualquer usuário autenticado pode listar (necessário para atribuir tarefas)
router.get('/', requireAuth, userController.getAll.bind(userController));
router.get('/:id', requireAuth, userController.getById.bind(userController));

// Operações administrativas: criar, editar e excluir exigem privilégio de administrador
router.post('/', requireAuth, requireAdmin, userController.create.bind(userController));
router.put('/:id', requireAuth, requireAdmin, userController.update.bind(userController));
router.delete('/:id', requireAuth, requireAdmin, userController.delete.bind(userController));

module.exports = router;

