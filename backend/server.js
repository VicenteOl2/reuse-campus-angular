const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { getPool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const usuariosRoutes = require('./routes/usuariosRoutes');
const publicacionesRoutes = require('./routes/publicacionesRoutes');

const solicitudesRoutes = require('./routes/solicitudesRoutes');
const entregasRoutes = require('./routes/entregasRoutes');
app.use(cors());
app.use(express.json());



app.use('/api', usuariosRoutes);
app.use('/api/publicaciones', publicacionesRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/entregas', entregasRoutes);
// Prueba de conexión API + SQL Server
app.get('/api/health', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT DB_NAME() AS baseActiva, GETDATE() AS fechaServidor');
    res.json({
      ok: true,
      mensaje: 'API ReUse Campus operativa',
      bd: result.recordset[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error conectando a SQL Server',
      detalle: error.message
    });
  }
});

// Manejo de rutas inexistentes
app.use((req, res) => {
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor ReUse Campus escuchando en http://localhost:${PORT}`);
});