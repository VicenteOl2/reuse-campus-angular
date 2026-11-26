const { sql, getPool } = require('../config/db');

const MODALIDADES_VALIDAS = ['DONACIÓN', 'INTERCAMBIO'];
const ESTADOS_PUBLICACION = ['DISPONIBLE', 'RESERVADA', 'ENTREGADA', 'CANCELADA'];

async function listarPublicaciones(req, res) {
  try {
    const { estado, modalidad, categoria, usuarioId } = req.query;
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT
        p.id,
        p.titulo,
        p.descripcion,
        p.categoria,
        p.modalidad,
        p.estado,
        p.fechaPublicacion,
        p.usuarioId,
        u.nombre AS nombrePropietario,
        u.correo AS correoPropietario
      FROM dbo.Publicaciones p
      INNER JOIN dbo.Usuarios u ON u.id = p.usuarioId
      WHERE 1 = 1
    `;

    if (estado) {
      if (!ESTADOS_PUBLICACION.includes(estado)) {
        return res.status(400).json({ ok: false, mensaje: 'Estado de publicación no válido' });
      }
      request.input('estado', sql.NVarChar(20), estado);
      query += ' AND p.estado = @estado';
    }

    if (modalidad) {
      if (!MODALIDADES_VALIDAS.includes(modalidad)) {
        return res.status(400).json({ ok: false, mensaje: 'Modalidad no válida' });
      }
      request.input('modalidad', sql.NVarChar(20), modalidad);
      query += ' AND p.modalidad = @modalidad';
    }

    if (categoria) {
      request.input('categoria', sql.NVarChar(80), categoria.trim());
      query += ' AND p.categoria = @categoria';
    }

    if (usuarioId) {
      request.input('usuarioId', sql.Int, Number(usuarioId));
      query += ' AND p.usuarioId = @usuarioId';
    }

    query += ' ORDER BY p.fechaPublicacion DESC, p.id DESC';

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener publicaciones', detalle: err.message });
  }
}

async function obtenerPublicacionPorId(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, mensaje: 'ID de publicación inválido' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          p.id,
          p.titulo,
          p.descripcion,
          p.categoria,
          p.modalidad,
          p.estado,
          p.fechaPublicacion,
          p.usuarioId,
          u.nombre AS nombrePropietario,
          u.correo AS correoPropietario
        FROM dbo.Publicaciones p
        INNER JOIN dbo.Usuarios u ON u.id = p.usuarioId
        WHERE p.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Publicación no encontrada' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al buscar publicación', detalle: err.message });
  }
}

async function crearPublicacion(req, res) {
  try {
    const { titulo, descripcion, categoria, modalidad, usuarioId } = req.body;

    if (!titulo || !descripcion || !categoria || !modalidad || !usuarioId) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Faltan campos obligatorios: titulo, descripcion, categoria, modalidad, usuarioId'
      });
    }

    if (!MODALIDADES_VALIDAS.includes(modalidad)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La modalidad debe ser DONACIÓN o INTERCAMBIO'
      });
    }

    const pool = await getPool();

    const userCheck = await pool
      .request()
      .input('usuarioId', sql.Int, Number(usuarioId))
      .query('SELECT id, estado FROM dbo.Usuarios WHERE id = @usuarioId');

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'El usuario indicado no existe' });
    }

    if (userCheck.recordset[0].estado !== 'ACTIVO') {
      return res.status(403).json({ ok: false, mensaje: 'Solo usuarios ACTIVO pueden publicar' });
    }

    const insertResult = await pool
      .request()
      .input('titulo', sql.NVarChar(150), titulo.trim())
      .input('descripcion', sql.NVarChar(sql.MAX), descripcion.trim())
      .input('categoria', sql.NVarChar(80), categoria.trim())
      .input('modalidad', sql.NVarChar(20), modalidad)
      .input('usuarioId', sql.Int, Number(usuarioId))
      .query(`
        INSERT INTO dbo.Publicaciones (titulo, descripcion, categoria, modalidad, estado, usuarioId)
        OUTPUT INSERTED.*
        VALUES (@titulo, @descripcion, @categoria, @modalidad, 'DISPONIBLE', @usuarioId)
      `);

    res.status(201).json({ ok: true, publicacion: insertResult.recordset[0] });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al crear publicación', detalle: err.message });
  }
}

module.exports = { listarPublicaciones, obtenerPublicacionPorId, crearPublicacion };