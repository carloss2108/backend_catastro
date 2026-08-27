const db = require("../config/db");

// ========================================================================
// LÓGICA DE NEGOCIO: OBTENER PUBLICACIONES
// ========================================================================
const obtenerPublicaciones = async (req, res) => {
  try {
    const sql = `
      SELECT 
        pub.id,
        pub.asking_price,
        pub.calle,
        pub.numero,
        pub.colonia,
        pub.recamaras,
        pub.banos_completos,
        pub.banos_medios,
        pub.cochera,
        pub.m2_construccion,
        pub.m2_terreno,
        pub.estatus,
        pub.descripcion,
        c.nombre as agente_nombre,
        t.nombre as transaccion_nombre,
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
      ORDER BY pub.fecha_registro DESC
    `;
    // Nota: pub.colonia no existe directamente en publicaciones, 
    // pero si lo agregamos vía JOIN o usando los ids de asentamientos estaría aquí.
    // Revisando el SQL, publicaciones tiene id_asenta_cpcons. 
    // Para no complicarlo ahora, lo consultaré directamente o usaré la calle.
    
    // Corrijo el SQL exacto basado en el esquema real:
    const sqlReal = `
      SELECT 
        pub.id,
        pub.asking_price,
        pub.calle,
        pub.numero,
        pub.recamaras,
        pub.banos_completos,
        pub.banos_medios,
        pub.cochera,
        pub.m2_construccion,
        pub.m2_terreno,
        pub.estatus,
        pub.descripcion,
        c.nombre as agente_nombre,
        t.nombre as transaccion_nombre,
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
      ORDER BY pub.fecha_registro DESC
    `;

    const [rows] = await db.execute(sqlReal);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener publicaciones:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener las publicaciones.",
      detalles: error.message,
    });
  }
};

module.exports = {
  obtenerPublicaciones,
};
