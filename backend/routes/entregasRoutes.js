const express = require('express');
const router = express.Router();
const { listarEntregas, completarEntrega } = require('../controllers/entregasController');

router.get('/', listarEntregas);
router.patch('/:id/completar', completarEntrega);

module.exports = router;