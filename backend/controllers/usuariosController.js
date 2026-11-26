const { sql, getPool } = require('../config/db');

async function listarUsuarios(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, nombre, correo, rol, estado
      FROM dbo.Usuarios
      ORDER BY id ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al listar usuarios', detalle: err.message });
  }
}

async function loginUsuario(req, res) {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Debe indicar correo y password' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('correo', sql.NVarChar(150), correo.trim())
      .query(`
        SELECT id, nombre, correo, password, rol, estado
        FROM dbo.Usuarios
        WHERE correo = @correo
      `);

    const usuario = result.recordset[0];
    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    if (usuario.password !== password) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    if (usuario.estado !== 'ACTIVO') {
      return res.status(403).json({
        ok: false,
        mensaje: `El usuario se encuentra ${usuario.estado}`
      });
    }

    res.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        estado: usuario.estado
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar sesión', detalle: err.message });
  }
}

module.exports = { listarUsuarios, loginUsuario };