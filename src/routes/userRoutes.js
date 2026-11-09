const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Todas as rotas de usuários exigem autenticação e privilégio de administrador
router.use(requireAuth, requireAdmin);

router.get('/', userController.getAll.bind(userController));
router.post('/', userController.create.bind(userController));
router.get('/:id', userController.getById.bind(userController));
router.put('/:id', userController.update.bind(userController));
router.delete('/:id', userController.delete.bind(userController));

module.exports = router;

