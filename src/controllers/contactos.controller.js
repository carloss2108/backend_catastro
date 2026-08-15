const db = require("../config/db");

// ========================================================================
// LÓGICA DE NEGOCIO: OBTENER TODOS LOS CONTACTOS
// ========================================================================
const obtenerContactos = async (req, res) => {
  try {
    const sql = `
      SELECT 
        id,
        nombre,
        telefono,
        correo,
        tipo_contacto,
        empresa,
        DATE_FORMAT(fecha_registro, '%Y-%m-%d') AS fecha_registro
      FROM contactos
      ORDER BY fecha_registro DESC
    `;
    const [rows] = await db.execute(sql);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener contactos:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener los contactos.",
      detalles: error.message,
    });
  }
};

// ========================================================================
// LÓGICA DE NEGOCIO: CREAR UN NUEVO CONTACTO
// ========================================================================
const crearContacto = async (req, res) => {
  try {
    const { nombre, telefono, correo, tipo_contacto, empresa } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El campo 'nombre' es obligatorio." });
    }

    const sql = `
      INSERT INTO contactos (nombre, telefono, correo, tipo_contacto, empresa)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [resultado] = await db.execute(sql, [
      nombre,
      telefono || null,
      correo || null,
      tipo_contacto || "Asesor",
      empresa || null,
    ]);

    res.status(201).json({
      mensaje: "Contacto creado exitosamente.",
      id: resultado.insertId,
    });
  } catch (error) {
    console.error("Error al crear contacto:", error);
    res.status(500).json({
      error: "Error interno del servidor al crear el contacto.",
      detalles: error.message,
    });
  }
};

// ========================================================================
// LÓGICA DE NEGOCIO: OBTENER UN CONTACTO POR ID
// ========================================================================
const obtenerContactoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute("SELECT * FROM contactos WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Contacto no encontrado." });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error al obtener contacto:", error);
    res.status(500).json({
      error: "Error interno del servidor.",
      detalles: error.message,
    });
  }
};

// ========================================================================
// LÓGICA DE NEGOCIO: ACTUALIZAR UN CONTACTO (PUT)
// ========================================================================
const actualizarContacto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, correo, tipo_contacto, empresa } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El campo 'nombre' es obligatorio." });
    }

    // Verificar que el contacto existe antes de actualizar
    const [existe] = await db.execute("SELECT id FROM contactos WHERE id = ?", [id]);
    if (existe.length === 0) {
      return res.status(404).json({ error: "Contacto no encontrado." });
    }

    const sql = `
      UPDATE contactos
      SET nombre = ?, telefono = ?, correo = ?, tipo_contacto = ?, empresa = ?
      WHERE id = ?
    `;
    await db.execute(sql, [
      nombre,
      telefono || null,
      correo || null,
      tipo_contacto || "Asesor",
      empresa || null,
      id,
    ]);

    res.status(200).json({ mensaje: "Contacto actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar contacto:", error);
    res.status(500).json({
      error: "Error interno del servidor al actualizar el contacto.",
      detalles: error.message,
    });
  }
};

module.exports = {
  obtenerContactos,
  crearContacto,
  obtenerContactoPorId,
  actualizarContacto,
};
