const express = require('express');
const router = express.Router();
const {
  listarPublicaciones,
  obtenerPublicacionPorId,
  crearPublicacion
} = require('../controllers/publicacionesController');

router.get('/', listarPublicaciones);
router.get('/:id', obtenerPublicacionPorId);
router.post('/', crearPublicacion);

module.exports = router;