const db = require("../config/db");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const streamifier = require("streamifier");

// ========================================================================
// CONFIGURACIÓN DE CLOUDINARY
// ========================================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ========================================================================
// CONFIGURACIÓN DE MULTER (memoria, no disco)
// ========================================================================
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB por archivo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen."), false);
    }
  },
});

// Middleware exportado para usar en las rutas
const uploadMiddleware = upload.array("fotos", 20);

// Helper: subir un buffer a Cloudinary como stream
const subirACloudinary = (buffer, carpeta) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `catastro-crm/${carpeta}`, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ========================================================================
// OBTENER FOTOS DE UNA PUBLICACIÓN
// ========================================================================
const obtenerFotos = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(
      "SELECT id, url_imagen, public_id, orden FROM fotos_publicaciones WHERE publicacion_id = ? ORDER BY orden ASC",
      [id]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener fotos:", error);
    res.status(500).json({ error: "Error al obtener fotos.", detalles: error.message });
  }
};

// ========================================================================
// SUBIR FOTOS A UNA PUBLICACIÓN (via Cloudinary)
// ========================================================================
const subirFotos = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No se recibieron archivos." });
    }

    // Obtener el orden máximo actual
    const [[{ maxOrden }]] = await db.execute(
      "SELECT COALESCE(MAX(orden), 0) as maxOrden FROM fotos_publicaciones WHERE publicacion_id = ?",
      [id]
    );

    const fotosSubidas = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const result = await subirACloudinary(file.buffer, `publicaciones/${id}`);

      const orden = maxOrden + i + 1;
      const [insertResult] = await db.execute(
        "INSERT INTO fotos_publicaciones (publicacion_id, url_imagen, public_id, orden) VALUES (?, ?, ?, ?)",
        [id, result.secure_url, result.public_id || '', orden]
      );

      fotosSubidas.push({
        id: insertResult.insertId,
        url_imagen: result.secure_url,
        public_id: result.public_id,
        orden,
      });
    }

    res.status(201).json({
      mensaje: `${fotosSubidas.length} foto(s) subida(s) correctamente.`,
      fotos: fotosSubidas,
    });
  } catch (error) {
    console.error("Error al subir fotos:", error);
    res.status(500).json({ error: "Error al subir fotos.", detalles: error.message });
  }
};

// ========================================================================
// REORDENAR FOTOS
// ========================================================================
const reordenarFotos = async (req, res) => {
  try {
    const { id } = req.params;
    const { orden } = req.body; // Array de { id, orden }

    if (!Array.isArray(orden) || orden.length === 0) {
      return res.status(400).json({ error: "Se requiere un array de orden válido." });
    }

    for (const item of orden) {
      await db.execute(
        "UPDATE fotos_publicaciones SET orden = ? WHERE id = ? AND publicacion_id = ?",
        [item.orden, item.id, id]
      );
    }

    res.status(200).json({ mensaje: "Fotos reordenadas correctamente." });
  } catch (error) {
    console.error("Error al reordenar fotos:", error);
    res.status(500).json({ error: "Error al reordenar fotos.", detalles: error.message });
  }
};

// ========================================================================
// ELIMINAR UNA FOTO
// ========================================================================
const eliminarFoto = async (req, res) => {
  try {
    const { fotoId } = req.params;

    // Obtener public_id para eliminar de Cloudinary
    const [rows] = await db.execute(
      "SELECT id, public_id FROM fotos_publicaciones WHERE id = ?",
      [fotoId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Foto no encontrada." });
    }

    const foto = rows[0];

    // Eliminar de Cloudinary (no falla si no existe)
    if (foto.public_id) {
      try {
        await cloudinary.uploader.destroy(foto.public_id);
      } catch (cloudErr) {
        console.warn("No se pudo eliminar de Cloudinary:", cloudErr.message);
      }
    }

    // Eliminar de la BD
    await db.execute("DELETE FROM fotos_publicaciones WHERE id = ?", [fotoId]);

    res.status(200).json({ mensaje: "Foto eliminada correctamente.", id: fotoId });
  } catch (error) {
    console.error("Error al eliminar foto:", error);
    res.status(500).json({ error: "Error al eliminar foto.", detalles: error.message });
  }
};

module.exports = {
  uploadMiddleware,
  obtenerFotos,
  subirFotos,
  reordenarFotos,
  eliminarFoto,
};
