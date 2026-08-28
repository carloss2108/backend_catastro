const express = require("express");
const router = express.Router();
const fotosController = require("../controllers/fotos.controller");

// ========================================================================
// RUTAS PARA /api/publicaciones/:id/fotos  y  /api/fotos/:fotoId
// ========================================================================

// Obtener todas las fotos de una publicación
router.get("/:id/fotos", fotosController.obtenerFotos);

// Subir nuevas fotos (multipart/form-data, campo "fotos")
router.post("/:id/fotos", fotosController.uploadMiddleware, fotosController.subirFotos);

// Reordenar fotos de una publicación
router.put("/:id/fotos/reordenar", fotosController.reordenarFotos);

// Eliminar una foto específica por su ID
router.delete("/fotos/:fotoId", fotosController.eliminarFoto);

module.exports = router;
