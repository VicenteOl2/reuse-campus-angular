const express = require('express');
const router = express.Router();
const {
  listarSolicitudes,
  crearSolicitud,
  aceptarSolicitud
} = require('../controllers/solicitudesController');

router.get('/', listarSolicitudes);
router.post('/', crearSolicitud);
router.patch('/:id/aceptar', aceptarSolicitud);

module.exports = router;