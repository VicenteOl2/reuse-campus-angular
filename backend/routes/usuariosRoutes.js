const express = require('express');
const router = express.Router();
const { listarUsuarios, loginUsuario } = require('../controllers/usuariosController');

router.get('/usuarios', listarUsuarios);
router.post('/auth/login', loginUsuario);

module.exports = router;