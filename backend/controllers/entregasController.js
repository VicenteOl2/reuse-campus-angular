const { sql, getPool } = require('../config/db');

async function listarEntregas(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        e.id,
        e.publicacionId,
        p.titulo AS tituloPublicacion,
        p.modalidad,
        p.estado AS estadoPublicacion,
        e.solicitudId,
        e.propietarioId,
        prop.nombre AS nombrePropietario,
        e.receptorId,
        rec.nombre AS nombreReceptor,
        e.fechaAcuerdo,
        e.fechaEntrega,
        e.estado
      FROM dbo.EntregasIntercambios e
      INNER JOIN dbo.Publicaciones p ON p.id = e.publicacionId
      INNER JOIN dbo.Usuarios prop ON prop.id = e.propietarioId
      INNER JOIN dbo.Usuarios rec ON rec.id = e.receptorId
      ORDER BY e.id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al listar entregas', detalle: err.message });
  }
}

async function completarEntrega(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, mensaje: 'ID de entrega inválido' });
  }

  let transaction;
  try {
    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const entregaRes = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query(`
        SELECT id, publicacionId, estado
        FROM dbo.EntregasIntercambios
        WHERE id = @id
      `);

    if (entregaRes.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Entrega no encontrada' });
    }

    const entrega = entregaRes.recordset[0];
    if (entrega.estado !== 'PENDIENTE') {
      await transaction.rollback();
      return res.status(409).json({
        ok: false,
        mensaje: `La entrega ya está en estado ${entrega.estado}`
      });
    }

    const updatedEntrega = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query(`
        UPDATE dbo.EntregasIntercambios
        SET estado = 'COMPLETADA',
            fechaEntrega = SYSDATETIME()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    await new sql.Request(transaction)
      .input('publicacionId', sql.Int, entrega.publicacionId)
      .query(`
        UPDATE dbo.Publicaciones
        SET estado = 'ENTREGADA'
        WHERE id = @publicacionId
      `);

    await transaction.commit();

    res.json({
      ok: true,
      mensaje: 'Entrega completada y publicación marcada como ENTREGADA',
      entrega: updatedEntrega.recordset[0]
    });
  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (_) {}
    }
    res.status(500).json({ ok: false, mensaje: 'Error al completar entrega', detalle: err.message });
  }
}

module.exports = { listarEntregas, completarEntrega };