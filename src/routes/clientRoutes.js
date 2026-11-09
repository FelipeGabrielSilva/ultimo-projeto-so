const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { requireAuth } = require('../middleware/authMiddleware');

// Rotas de clientes exigem autenticação
router.use(requireAuth);

router.get('/', clientController.getAll.bind(clientController));
router.post('/', clientController.create.bind(clientController));
router.get('/:id', clientController.getById.bind(clientController));
router.put('/:id', clientController.update.bind(clientController));
router.delete('/:id', clientController.delete.bind(clientController));

module.exports = router;
