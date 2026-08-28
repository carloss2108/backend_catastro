const express = require("express");
const router = express.Router();
const publicacionesController = require("../controllers/publicaciones.controller");

// ========================================================================
// DEFINICIÓN DE ENDPOINTS PARA /api/publicaciones
// ========================================================================

// Obtener catálogos (tipos de predio y transacciones)
router.get("/catalogos", publicacionesController.obtenerCatalogos);

// Obtener todas las publicaciones para el listado principal
router.get("/", publicacionesController.obtenerPublicaciones);

// Obtener una publicación por ID
router.get("/:id", publicacionesController.obtenerPublicacion);

// Crear nueva publicación
router.post("/", publicacionesController.crearPublicacion);

// Actualizar publicación por ID
router.put("/:id", publicacionesController.actualizarPublicacion);

module.exports = router;
