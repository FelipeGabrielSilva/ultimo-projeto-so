const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/me', authController.me.bind(authController));
router.put('/profile', authController.updateProfile.bind(authController));

module.exports = router;
