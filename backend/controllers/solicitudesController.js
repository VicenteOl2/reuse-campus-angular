const { sql, getPool } = require('../config/db');

async function listarSolicitudes(req, res) {
  try {
    const { publicacionId, solicitanteId, estado } = req.query;
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT
        s.id,
        s.publicacionId,
        p.titulo AS tituloPublicacion,
        p.modalidad,
        p.estado AS estadoPublicacion,
        p.usuarioId AS propietarioId,
        prop.nombre AS nombrePropietario,
        s.solicitanteId,
        sol.nombre AS nombreSolicitante,
        sol.correo AS correoSolicitante,
        s.mensaje,
        s.fechaSolicitud,
        s.estado
      FROM dbo.Solicitudes s
      INNER JOIN dbo.Publicaciones p ON p.id = s.publicacionId
      INNER JOIN dbo.Usuarios prop ON prop.id = p.usuarioId
      INNER JOIN dbo.Usuarios sol ON sol.id = s.solicitanteId
      WHERE 1 = 1
    `;

    if (publicacionId) {
      request.input('publicacionId', sql.Int, Number(publicacionId));
      query += ' AND s.publicacionId = @publicacionId';
    }

    if (solicitanteId) {
      request.input('solicitanteId', sql.Int, Number(solicitanteId));
      query += ' AND s.solicitanteId = @solicitanteId';
    }

    if (estado) {
      request.input('estado', sql.NVarChar(20), estado);
      query += ' AND s.estado = @estado';
    }

    query += ' ORDER BY s.fechaSolicitud DESC, s.id DESC';

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al listar solicitudes', detalle: err.message });
  }
}

async function crearSolicitud(req, res) {
  try {
    const { publicacionId, solicitanteId, mensaje } = req.body;

    if (!publicacionId || !solicitanteId || !mensaje) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Faltan campos obligatorios: publicacionId, solicitanteId, mensaje'
      });
    }

    const pool = await getPool();

    const userRes = await pool
      .request()
      .input('solicitanteId', sql.Int, Number(solicitanteId))
      .query('SELECT id, estado FROM dbo.Usuarios WHERE id = @solicitanteId');

    if (userRes.recordset.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'El solicitante no existe' });
    }

    if (userRes.recordset[0].estado !== 'ACTIVO') {
      return res.status(403).json({ ok: false, mensaje: 'Solo usuarios ACTIVO pueden enviar solicitudes' });
    }

    const pubRes = await pool
      .request()
      .input('publicacionId', sql.Int, Number(publicacionId))
      .query('SELECT id, estado, usuarioId FROM dbo.Publicaciones WHERE id = @publicacionId');

    if (pubRes.recordset.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'La publicación no existe' });
    }

    const pub = pubRes.recordset[0];
    if (pub.estado !== 'DISPONIBLE') {
      return res.status(409).json({
        ok: false,
        mensaje: `No se puede solicitar una publicación en estado ${pub.estado}`
      });
    }

    if (Number(pub.usuarioId) === Number(solicitanteId)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No puedes solicitar tu propia publicación'
      });
    }

    const dupRes = await pool
      .request()
      .input('publicacionId', sql.Int, Number(publicacionId))
      .input('solicitanteId', sql.Int, Number(solicitanteId))
      .query(`
        SELECT id FROM dbo.Solicitudes
        WHERE publicacionId = @publicacionId
          AND solicitanteId = @solicitanteId
          AND estado = 'PENDIENTE'
      `);

    if (dupRes.recordset.length > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: 'Ya tienes una solicitud PENDIENTE para esta publicación'
      });
    }

    const insertRes = await pool
      .request()
      .input('publicacionId', sql.Int, Number(publicacionId))
      .input('solicitanteId', sql.Int, Number(solicitanteId))
      .input('mensaje', sql.NVarChar(500), mensaje.trim())
      .query(`
        INSERT INTO dbo.Solicitudes (publicacionId, solicitanteId, mensaje, estado)
        OUTPUT INSERTED.*
        VALUES (@publicacionId, @solicitanteId, @mensaje, 'PENDIENTE')
      `);

    res.status(201).json({ ok: true, solicitud: insertRes.recordset[0] });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al crear solicitud', detalle: err.message });
  }
}

async function aceptarSolicitud(req, res) {
  const solicitudId = Number(req.params.id);
  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    return res.status(400).json({ ok: false, mensaje: 'ID de solicitud inválido' });
  }

  let transaction;
  try {
    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const solRes = await new sql.Request(transaction)
      .input('solicitudId', sql.Int, solicitudId)
      .query(`
        SELECT s.id, s.publicacionId, s.solicitanteId, s.estado AS estadoSolicitud,
               p.estado AS estadoPublicacion, p.usuarioId AS propietarioId
        FROM dbo.Solicitudes s
        INNER JOIN dbo.Publicaciones p ON p.id = s.publicacionId
        WHERE s.id = @solicitudId
      `);

    if (solRes.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Solicitud no encontrada' });
    }

    const datos = solRes.recordset[0];
    if (datos.estadoSolicitud !== 'PENDIENTE') {
      await transaction.rollback();
      return res.status(409).json({
        ok: false,
        mensaje: `Solo se pueden aceptar solicitudes PENDIENTE (actual: ${datos.estadoSolicitud})`
      });
    }

    if (datos.estadoPublicacion !== 'DISPONIBLE') {
      await transaction.rollback();
      return res.status(409).json({
        ok: false,
        mensaje: `La publicación ya no está DISPONIBLE (estado actual: ${datos.estadoPublicacion})`
      });
    }

    await new sql.Request(transaction)
      .input('solicitudId', sql.Int, solicitudId)
      .query(`
        UPDATE dbo.Solicitudes
        SET estado = 'ACEPTADA'
        WHERE id = @solicitudId
      `);

    await new sql.Request(transaction)
      .input('publicacionId', sql.Int, datos.publicacionId)
      .input('solicitudId', sql.Int, solicitudId)
      .query(`
        UPDATE dbo.Solicitudes
        SET estado = 'RECHAZADA'
        WHERE publicacionId = @publicacionId
          AND id <> @solicitudId
          AND estado = 'PENDIENTE'
      `);

    await new sql.Request(transaction)
      .input('publicacionId', sql.Int, datos.publicacionId)
      .query(`
        UPDATE dbo.Publicaciones
        SET estado = 'RESERVADA'
        WHERE id = @publicacionId
      `);

    const entregaRes = await new sql.Request(transaction)
      .input('publicacionId', sql.Int, datos.publicacionId)
      .input('solicitudId', sql.Int, solicitudId)
      .input('propietarioId', sql.Int, datos.propietarioId)
      .input('receptorId', sql.Int, datos.solicitanteId)
      .query(`
        INSERT INTO dbo.EntregasIntercambios
          (publicacionId, solicitudId, propietarioId, receptorId, estado)
        OUTPUT INSERTED.*
        VALUES (@publicacionId, @solicitudId, @propietarioId, @receptorId, 'PENDIENTE')
      `);

    await transaction.commit();

    res.json({
      ok: true,
      mensaje: 'Solicitud aceptada, publicación reservada y entrega generada',
      entrega: entregaRes.recordset[0]
    });
  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (_) {}
    }
    res.status(500).json({ ok: false, mensaje: 'Error al aceptar solicitud', detalle: err.message });
  }
}

module.exports = { listarSolicitudes, crearSolicitud, aceptarSolicitud };