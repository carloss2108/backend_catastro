const db = require("../config/db");
const cloudinary = require("../config/cloudinary");

// ========================================================================
// LÓGICA DE NEGOCIO: PUBLICACIONES Y SUS FOTOS
// ========================================================================

// 1. OTRAS FUNCIONES (Mantenemos tus funciones existentes arriba, si tienes)
// ...

// 2. NUEVA FUNCIÓN: SUBIR FOTOS (POST)
const subirFotos = async (req, res) => {
  // req.params.id contiene el ID de la publicación (ej. /api/publicaciones/45/fotos)
  const { id } = req.params;

  // multer nos dejará los archivos en req.files
  const archivos = req.files;

  if (!archivos || archivos.length === 0) {
    return res.status(400).json({ error: "No se enviaron imágenes." });
  }

  try {
    // A. Calcular cuál será el orden inicial
    // Buscamos cuál es el orden más alto actual para esta publicación. Si no hay fotos, empezamos en 1.
    const [ordenResult] = await db.query("SELECT COALESCE(MAX(orden), 0) as max_orden FROM fotos_publicaciones WHERE publicacion_id = ?", [id]);
    let proximoOrden = ordenResult[0].max_orden + 1;

    const fotosGuardadas = [];

    // B. Subir a Cloudinary (Usando un bucle for...of para usar await en orden)
    // Nota: Promesa.all es más rápido, pero este bucle garantiza que el 'orden' se asigne secuencialmente
    for (const archivo of archivos) {
      // Subimos el buffer directamente de la memoria a Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `catastro_culiacan/publicaciones/${id}`,
            // Opcional: Transformaciones automáticas para ahorrar peso
            // transformation: [{ width: 1920, height: 1080, crop: "limit", quality: "auto" }]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        // Le pasamos el archivo en memoria a la función de subida
        uploadStream.end(archivo.buffer);
      });

      // C. Insertar en Base de Datos
      const sqlInsert = `
                INSERT INTO fotos_publicaciones (publicacion_id, url_imagen, public_id, orden)
                VALUES (?, ?, ?, ?)
            `;
      const [dbResult] = await db.query(sqlInsert, [
        id,
        result.secure_url, // URL segura (https)
        result.public_id, // ID único en Cloudinary (ej. catastro_culiacan/publicaciones/45/ab3dfg)
        proximoOrden,
      ]);

      fotosGuardadas.push({
        id: dbResult.insertId,
        url_imagen: result.secure_url,
        orden: proximoOrden,
      });

      proximoOrden++; // Incrementamos el orden para la siguiente foto
    }

    res.status(201).json({
      mensaje: "Fotos subidas y guardadas exitosamente",
      fotos: fotosGuardadas,
    });
  } catch (error) {
    console.error("Error al subir fotos:", error);
    res.status(500).json({ error: "Error del servidor al procesar las imágenes.", detalle: error.message });
  }
};

// 3. NUEVA FUNCIÓN: ELIMINAR FOTO (DELETE)
const eliminarFoto = async (req, res) => {
  // Recibe el ID del registro de la base de datos (NO el de Cloudinary, ni el de la publicación)
  const { idFoto } = req.params;

  try {
    // A. Obtener el public_id de la base de datos
    const [fotos] = await db.query("SELECT public_id FROM fotos_publicaciones WHERE id = ?", [idFoto]);

    if (fotos.length === 0) {
      return res.status(404).json({ error: "Registro de foto no encontrado en la base de datos." });
    }

    const publicId = fotos[0].public_id;

    // B. Borrar de Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // C. Borrar de la Base de Datos (MariaDB)
    await db.query("DELETE FROM fotos_publicaciones WHERE id = ?", [idFoto]);

    res.status(200).json({ mensaje: "Foto eliminada correctamente de la nube y base de datos." });
  } catch (error) {
    console.error("Error al eliminar foto:", error);
    res.status(500).json({ error: "Error al intentar eliminar la foto." });
  }
};

// 4. NUEVA FUNCIÓN: REORDENAR FOTOS (PUT)
const reordenarFotos = async (req, res) => {
  // Esperamos un array en el body: [{id: 45, orden: 1}, {id: 42, orden: 2}]
  const { nuevoOrden } = req.body;

  if (!Array.isArray(nuevoOrden)) {
    return res.status(400).json({ error: 'Formato inválido. Se esperaba un array "nuevoOrden".' });
  }

  try {
    // Ejecutamos las actualizaciones una por una. (En una BD muy grande se haría distinto, pero para galerías pequeñas es perfecto)
    for (const item of nuevoOrden) {
      await db.query("UPDATE fotos_publicaciones SET orden = ? WHERE id = ?", [item.orden, item.id]);
    }

    res.status(200).json({ mensaje: "Orden actualizado correctamente." });
  } catch (error) {
    console.error("Error al reordenar:", error);
    res.status(500).json({ error: "Error al guardar el nuevo orden." });
  }
};

module.exports = {
  // ... tus otras funciones exportadas ...
  subirFotos,
  eliminarFoto,
  reordenarFotos,
};
