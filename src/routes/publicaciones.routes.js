const express = require("express");
const router = express.Router();
const multer = require("multer");
const publicacionesController = require("../controllers/publicaciones.controller");

// ========================================================================
// CONFIGURACIÓN DE MULTER (Manejo de multipart/form-data)
// ========================================================================
// Configuramos Multer para guardar los archivos en MEMORIA (RAM) en lugar del disco duro.
// Como los enviaremos directo a Cloudinary, no tiene sentido ensuciar tu disco duro temporalmente.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10 MB por foto (opcional, para proteger tu servidor)
  },
});

// ========================================================================
// RUTAS DE GALERÍA DE FOTOS
// ========================================================================

// 1. Subir múltiples fotos a una publicación específica.
// upload.array('fotos') intercepta el form-data buscando un campo llamado "fotos" (con multiples archivos)
router.post("/:id/fotos", upload.array("fotos"), publicacionesController.subirFotos);

// 2. Reordenar las fotos (Recibe el nuevo array en el JSON del body)
router.put("/:id/fotos/reordenar", publicacionesController.reordenarFotos);

// 3. Eliminar una foto específica por su ID de Base de Datos
router.delete("/fotos/:idFoto", publicacionesController.eliminarFoto);

// ... Tus otras rutas existentes para publicaciones irían aquí (GET, PUT, etc.)

module.exports = router;
