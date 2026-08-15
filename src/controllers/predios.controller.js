const db = require("../config/db");
const { limpiarClave, limpiarNumero } = require("../utils/helpers");

// ========================================================================
// LÓGICA DE NEGOCIO: GUARDAR PREDIO
// ========================================================================
const guardarPredio = async (req, res) => {
  try {
    const datos = req.body;

    // 1. Validación básica
    if (!datos.Clave_Catastral || datos.Clave_Catastral === "No encontrado") {
      return res.status(400).json({ error: "Se requiere una Clave Catastral válida." });
    }

    // 2. Limpieza de datos utilizando las utilerías
    const claveLimpia = limpiarClave(datos.Clave_Catastral);
    const m2Terreno = limpiarNumero(datos.Superficie_Terreno);
    const m2Construccion = limpiarNumero(datos.Superficie_Construida);
    const valorTerreno = limpiarNumero(datos.Valor_Terreno);
    const valorConstruccion = limpiarNumero(datos.Valor_Construccion);
    const valorCatastral = limpiarNumero(datos.Valor_Catastral);
    const propietarioLimpio = (datos.Propietario || "").substring(0, 150);

    // 3. Consulta SQL preparada (Upsert)
    const sql = `
            INSERT INTO predios (
                clave_catastral, propietario, domicilio, ubicacion, colonia, poblacion, 
                m2_terreno, m2_construccion, valor_terreno, valor_construccion, valor_catastral
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                propietario = VALUES(propietario),
                domicilio = VALUES(domicilio),
                ubicacion = VALUES(ubicacion),
                colonia = VALUES(colonia),
                poblacion = VALUES(poblacion),
                m2_terreno = VALUES(m2_terreno),
                m2_construccion = VALUES(m2_construccion),
                valor_terreno = VALUES(valor_terreno),
                valor_construccion = VALUES(valor_construccion),
                valor_catastral = VALUES(valor_catastral),
                fecha_extraccion = CURRENT_TIMESTAMP;
        `;

    const valores = [
      claveLimpia,
      propietarioLimpio,
      datos.Domicilio || "",
      datos.Ubicacion || "",
      datos.Colonia || "",
      datos.Poblacion || "",
      m2Terreno,
      m2Construccion,
      valorTerreno,
      valorConstruccion,
      valorCatastral,
    ];

    // 4. Ejecución en la base de datos
    const [resultado] = await db.execute(sql, valores);

    // 5. Respuesta HTTP al cliente (Extensión)
    res.status(200).json({
      mensaje: "Predio guardado exitosamente",
      clave: claveLimpia,
      accion: resultado.insertId ? "Insertado/Actualizado" : "Sin cambios",
    });
  } catch (error) {
    console.error("Error al guardar el predio:", error);
    res.status(500).json({
      error: "Error interno del servidor al guardar en la base de datos.",
      detalles: error.message,
    });
  }
};

// ========================================================================
// LÓGICA DE NEGOCIO: OBTENER PREDIOS
// ========================================================================
const obtenerPredios = async (req, res) => {
  try {
    // Por ahora traemos los últimos 100 registros para no saturar
    const sql = `
      SELECT * FROM predios 
      ORDER BY fecha_extraccion DESC 
      LIMIT 100
    `;
    const [rows] = await db.execute(sql);
    
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener predios:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener los datos.",
      detalles: error.message,
    });
  }
};

module.exports = {
  guardarPredio,
  obtenerPredios
};
