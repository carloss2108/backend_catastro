const db = require("../config/db");

// ========================================================================
// OBTENER TODOS LOS PROPIETARIOS
// ========================================================================
const obtenerPropietarios = async (req, res) => {
  try {
    const { q } = req.query; // búsqueda por nombre
    let sql = `
      SELECT p.id, p.nombre, p.domicilio, p.fecha_registro,
             COUNT(pr.id) as num_predios
      FROM propietarios p
      LEFT JOIN predios pr ON pr.propietario_id = p.id
    `;
    const params = [];
    if (q) {
      sql += " WHERE p.nombre LIKE ?";
      params.push(`%${q}%`);
    }
    sql += " GROUP BY p.id ORDER BY p.nombre ASC";

    const [rows] = await db.execute(sql, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener propietarios:", error);
    res.status(500).json({ error: "Error interno.", detalles: error.message });
  }
};

// ========================================================================
// OBTENER UN PROPIETARIO POR ID
// ========================================================================
const obtenerPropietario = async (req, res) => {
  try {
    const { id } = req.params;
    const [[propietario]] = await db.execute(
      "SELECT id, nombre, domicilio, fecha_registro FROM propietarios WHERE id = ?",
      [id]
    );
    if (!propietario) {
      return res.status(404).json({ error: "Propietario no encontrado." });
    }
    // Incluir sus predios
    const [predios] = await db.execute(
      "SELECT id, clave_catastral, colonia, ubicacion FROM predios WHERE propietario_id = ?",
      [id]
    );
    res.status(200).json({ ...propietario, predios });
  } catch (error) {
    console.error("Error al obtener propietario:", error);
    res.status(500).json({ error: "Error interno.", detalles: error.message });
  }
};

// ========================================================================
// CREAR PROPIETARIO
// ========================================================================
const crearPropietario = async (req, res) => {
  try {
    const { nombre, domicilio } = req.body;
    if (!nombre?.trim()) {
      return res.status(400).json({ error: "El nombre es obligatorio." });
    }
    const [result] = await db.execute(
      "INSERT INTO propietarios (nombre, domicilio) VALUES (?, ?)",
      [nombre.trim(), domicilio?.trim() || null]
    );
    res.status(201).json({
      mensaje: "Propietario creado correctamente.",
      id: result.insertId,
      nombre: nombre.trim(),
      domicilio: domicilio?.trim() || null,
    });
  } catch (error) {
    console.error("Error al crear propietario:", error);
    res.status(500).json({ error: "Error interno.", detalles: error.message });
  }
};

// ========================================================================
// ACTUALIZAR PROPIETARIO
// ========================================================================
const actualizarPropietario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, domicilio } = req.body;
    if (!nombre?.trim()) {
      return res.status(400).json({ error: "El nombre es obligatorio." });
    }
    const [result] = await db.execute(
      "UPDATE propietarios SET nombre = ?, domicilio = ? WHERE id = ?",
      [nombre.trim(), domicilio?.trim() || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Propietario no encontrado." });
    }
    res.status(200).json({ mensaje: "Propietario actualizado.", id });
  } catch (error) {
    console.error("Error al actualizar propietario:", error);
    res.status(500).json({ error: "Error interno.", detalles: error.message });
  }
};

// ========================================================================
// ELIMINAR PROPIETARIO
// ========================================================================
const eliminarPropietario = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute(
      "DELETE FROM propietarios WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Propietario no encontrado." });
    }
    // Los predios quedan con propietario_id = NULL (ON DELETE SET NULL)
    res.status(200).json({ mensaje: "Propietario eliminado. Predios vinculados desvinculados.", id });
  } catch (error) {
    console.error("Error al eliminar propietario:", error);
    res.status(500).json({ error: "Error interno.", detalles: error.message });
  }
};

// ========================================================================
// UPSERT DESDE PÁGINA DE PREDIAL
// Recibe: { nombre, domicilio, clave_catastral }
// - Normaliza el nombre para buscar duplicados
// - Si el propietario ya existe → reutiliza, actualiza domicilio si es nuevo
// - Si no existe → inserta
// - Vincula propietario_id al predio correspondiente vía clave_catastral
// ========================================================================
const desdePredial = async (req, res) => {
  try {
    const { nombre, domicilio, clave_catastral } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({ error: "El campo 'nombre' es obligatorio." });
    }
    if (!clave_catastral?.trim()) {
      return res.status(400).json({ error: "El campo 'clave_catastral' es obligatorio." });
    }

    const nombreNormalizado = nombre.trim().toUpperCase();
    const domicilioLimpio = domicilio?.trim() || null;

    // 1. Buscar propietario existente por nombre normalizado (case-insensitive)
    const [existentes] = await db.execute(
      "SELECT id, nombre, domicilio FROM propietarios WHERE UPPER(TRIM(nombre)) = ?",
      [nombreNormalizado]
    );

    let propietarioId;
    let accion;

    if (existentes.length > 0) {
      // Ya existe — reutilizar
      propietarioId = existentes[0].id;
      accion = "existente";

      // Actualizar domicilio si ahora tenemos uno y antes no
      if (domicilioLimpio && !existentes[0].domicilio) {
        await db.execute(
          "UPDATE propietarios SET domicilio = ? WHERE id = ?",
          [domicilioLimpio, propietarioId]
        );
        accion = "existente_domicilio_actualizado";
      }
    } else {
      // No existe — insertar nuevo
      const [insertResult] = await db.execute(
        "INSERT INTO propietarios (nombre, domicilio) VALUES (?, ?)",
        [nombre.trim(), domicilioLimpio]
      );
      propietarioId = insertResult.insertId;
      accion = "creado";
    }

    // 2. Limpiar clave catastral (remover guiones/espacios)
    const claveLinpia = clave_catastral.trim().replace(/[^0-9a-zA-Z]/g, "");

    // 3. Buscar el predio por clave catastral
    const [predios] = await db.execute(
      "SELECT id, clave_catastral, propietario_id FROM predios WHERE clave_catastral = ?",
      [claveLinpia]
    );

    if (predios.length === 0) {
      return res.status(404).json({
        error: `Predio con clave catastral '${claveLinpia}' no encontrado. Extrae primero el predio desde catastro.`,
        propietario_id: propietarioId,
        accion,
      });
    }

    const predio = predios[0];

    // 4. Vincular propietario al predio
    await db.execute(
      "UPDATE predios SET propietario_id = ? WHERE id = ?",
      [propietarioId, predio.id]
    );

    res.status(200).json({
      mensaje: `Propietario ${accion === "creado" ? "registrado" : "encontrado"} y vinculado al predio correctamente.`,
      propietario_id: propietarioId,
      predio_id: predio.id,
      clave_catastral: predio.clave_catastral,
      nombre: nombre.trim(),
      accion,
    });
  } catch (error) {
    console.error("Error en desdePredial:", error);
    res.status(500).json({ error: "Error interno.", detalles: error.message });
  }
};

module.exports = {
  obtenerPropietarios,
  obtenerPropietario,
  crearPropietario,
  actualizarPropietario,
  eliminarPropietario,
  desdePredial,
};
