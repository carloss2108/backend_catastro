const db = require("../config/db");

// ========================================================================
// LÓGICA DE NEGOCIO: OBTENER PUBLICACIONES
// ========================================================================
const obtenerPublicaciones = async (req, res) => {
  try {
    const sql = `
      SELECT 
        pub.id,
        pub.predio_id,
        pub.contacto_id,
        pub.id_tipo_predio,
        pub.id_transaccion,
        pub.asking_price,
        pub.calle,
        pub.numero,
        pub.orientacion,
        pub.codigo_postal,
        pub.recamaras,
        pub.banos_completos,
        pub.banos_medios,
        pub.cochera,
        pub.m2_construccion,
        pub.m2_terreno,
        pub.estatus,
        pub.descripcion,
        pub.fuente,
        pub.url_origen,
        pub.notas,
        c.nombre as agente_nombre,
        t.nombre as transaccion_nombre,
        tp.nombre as tipo_predio_nombre,
        (
          SELECT url_imagen 
          FROM fotos_publicaciones 
          WHERE publicacion_id = pub.id 
          ORDER BY orden ASC 
          LIMIT 1
        ) as foto_portada
      FROM publicaciones pub
      LEFT JOIN contactos c ON pub.contacto_id = c.id
      LEFT JOIN transacciones t ON pub.id_transaccion = t.id
      LEFT JOIN tipo_predios tp ON pub.id_tipo_predio = tp.id
      ORDER BY pub.fecha_registro DESC
    `;

    const [rows] = await db.execute(sql);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener publicaciones:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener las publicaciones.",
      detalles: error.message,
    });
  }
};

// ========================================================================
// LÓGICA DE NEGOCIO: OBTENER CATÁLOGOS (Tipo Predios y Transacciones)
// ========================================================================
const obtenerCatalogos = async (req, res) => {
  try {
    const [tipoPredios] = await db.execute("SELECT id, nombre FROM tipo_predios ORDER BY id ASC");
    const [transacciones] = await db.execute("SELECT id, nombre FROM transacciones ORDER BY id ASC");

    res.status(200).json({
      tipo_predios: tipoPredios,
      transacciones: transacciones,
    });
  } catch (error) {
    console.error("Error al obtener catálogos:", error);
    res.status(500).json({
      error: "Error al obtener catálogos.",
      detalles: error.message,
    });
  }
};

// ========================================================================
// LÓGICA DE NEGOCIO: CREAR PUBLICACIÓN
// ========================================================================
const crearPublicacion = async (req, res) => {
  try {
    const {
      predio_id,
      contacto_id,
      id_transaccion,
      id_tipo_predio,
      asking_price,
      calle,
      numero,
      orientacion,
      codigo_postal,
      recamaras,
      banos_completos,
      banos_medios,
      cochera,
      m2_construccion,
      m2_terreno,
      descripcion,
      fuente,
      url_origen,
      estatus,
      notas,
      fotos,
    } = req.body;

    if (!predio_id) {
      return res.status(400).json({ error: "El predio es obligatorio." });
    }
    if (!contacto_id) {
      return res.status(400).json({ error: "El contacto es obligatorio." });
    }
    if (!id_transaccion) {
      return res.status(400).json({ error: "El tipo de operación es obligatorio." });
    }
    if (!id_tipo_predio) {
      return res.status(400).json({ error: "El tipo de predio es obligatorio." });
    }
    if (!asking_price || isNaN(asking_price)) {
      return res.status(400).json({ error: "El precio de lista es obligatorio y debe ser numérico." });
    }
    if (!calle || !calle.trim()) {
      return res.status(400).json({ error: "La calle es obligatoria." });
    }
    if (!numero || !numero.trim()) {
      return res.status(400).json({ error: "El número es obligatorio." });
    }

    const sql = `
      INSERT INTO publicaciones (
        predio_id,
        contacto_id,
        id_tipo_predio,
        id_transaccion,
        asking_price,
        calle,
        numero,
        orientacion,
        codigo_postal,
        recamaras,
        banos_completos,
        banos_medios,
        cochera,
        m2_construccion,
        m2_terreno,
        descripcion,
        fuente,
        url_origen,
        estatus,
        notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
      predio_id,
      contacto_id,
      id_tipo_predio,
      id_transaccion,
      parseFloat(asking_price),
      calle.trim(),
      numero.trim(),
      orientacion || null,
      codigo_postal || null,
      parseInt(recamaras) || 0,
      parseInt(banos_completos) || 0,
      parseInt(banos_medios) || 0,
      parseInt(cochera) || 0,
      m2_construccion ? parseFloat(m2_construccion) : null,
      m2_terreno ? parseFloat(m2_terreno) : null,
      descripcion || null,
      fuente || null,
      url_origen || null,
      estatus || "Activo",
      notas || null,
    ];

    const [result] = await db.execute(sql, valores);
    const publicacionId = result.insertId;

    if (fotos && Array.isArray(fotos) && fotos.length > 0) {
      for (let i = 0; i < fotos.length; i++) {
        const foto = fotos[i];
        const url_imagen = typeof foto === "string" ? foto : foto.url_imagen;
        const public_id = typeof foto === "object" && foto.public_id ? foto.public_id : `pub_${publicacionId}_${i + 1}`;
        if (url_imagen) {
          await db.execute(
            `INSERT INTO fotos_publicaciones (publicacion_id, url_imagen, public_id, orden) VALUES (?, ?, ?, ?)`,
            [publicacionId, url_imagen, public_id, i + 1]
          );
        }
      }
    }

    res.status(201).json({
      mensaje: "Publicación creada con éxito.",
      id: publicacionId,
    });
  } catch (error) {
    console.error("Error al crear publicación:", error);
    res.status(500).json({
      error: "Error interno del servidor al crear la publicación.",
      detalles: error.message,
    });
  }
};

// ========================================================================
// LÓGICA DE NEGOCIO: OBTENER UNA PUBLICACIÓN POR ID
// ========================================================================
const obtenerPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        pub.id,
        pub.predio_id,
        pub.contacto_id,
        pub.id_tipo_predio,
        pub.id_transaccion,
        pub.asking_price,
        pub.precio_cierre,
        pub.calle,
        pub.numero,
        pub.orientacion,
        pub.codigo_postal,
        pub.recamaras,
        pub.banos_completos,
        pub.banos_medios,
        pub.cochera,
        pub.m2_construccion,
        pub.m2_terreno,
        pub.estatus,
        pub.descripcion,
        pub.fuente,
        pub.url_origen,
        pub.notas,
        pub.fecha_inicio,
        pub.fecha_fin,
        pub.fecha_registro,
        c.nombre as agente_nombre,
        t.nombre as transaccion_nombre,
        tp.nombre as tipo_predio_nombre
      FROM publicaciones pub
      LEFT JOIN contactos c ON pub.contacto_id = c.id
      LEFT JOIN transacciones t ON pub.id_transaccion = t.id
      LEFT JOIN tipo_predios tp ON pub.id_tipo_predio = tp.id
      WHERE pub.id = ?
    `;
    const [rows] = await db.execute(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Publicación no encontrada." });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error al obtener publicación:", error);
    res.status(500).json({ error: "Error interno.", detalles: error.message });
  }
};

// ========================================================================
// LÓGICA DE NEGOCIO: ACTUALIZAR PUBLICACIÓN
// ========================================================================
const actualizarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      contacto_id,
      id_transaccion,
      id_tipo_predio,
      asking_price,
      precio_cierre,
      calle,
      numero,
      orientacion,
      codigo_postal,
      recamaras,
      banos_completos,
      banos_medios,
      cochera,
      m2_construccion,
      m2_terreno,
      descripcion,
      fuente,
      url_origen,
      estatus,
      notas,
      fecha_fin,
    } = req.body;

    const sql = `
      UPDATE publicaciones SET
        contacto_id = ?,
        id_transaccion = ?,
        id_tipo_predio = ?,
        asking_price = ?,
        precio_cierre = ?,
        calle = ?,
        numero = ?,
        orientacion = ?,
        codigo_postal = ?,
        recamaras = ?,
        banos_completos = ?,
        banos_medios = ?,
        cochera = ?,
        m2_construccion = ?,
        m2_terreno = ?,
        descripcion = ?,
        fuente = ?,
        url_origen = ?,
        estatus = ?,
        notas = ?,
        fecha_fin = ?
      WHERE id = ?
    `;

    const valores = [
      contacto_id,
      id_transaccion,
      id_tipo_predio,
      asking_price ? parseFloat(asking_price) : null,
      precio_cierre ? parseFloat(precio_cierre) : null,
      calle,
      numero,
      orientacion || null,
      codigo_postal || null,
      parseInt(recamaras) || 0,
      parseInt(banos_completos) || 0,
      parseInt(banos_medios) || 0,
      parseInt(cochera) || 0,
      m2_construccion ? parseFloat(m2_construccion) : null,
      m2_terreno ? parseFloat(m2_terreno) : null,
      descripcion || null,
      fuente || null,
      url_origen || null,
      estatus || "Activo",
      notas || null,
      fecha_fin || null,
      id,
    ];

    const [result] = await db.execute(sql, valores);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Publicación no encontrada." });
    }
    res.status(200).json({ mensaje: "Publicación actualizada con éxito.", id });
  } catch (error) {
    console.error("Error al actualizar publicación:", error);
    res.status(500).json({ error: "Error interno.", detalles: error.message });
  }
};

module.exports = {
  obtenerPublicaciones,
  obtenerCatalogos,
  crearPublicacion,
  obtenerPublicacion,
  actualizarPublicacion,
};
