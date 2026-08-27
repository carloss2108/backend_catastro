const express = require("express");
const router = express.Router();
const publicacionesController = require("../controllers/publicaciones.controller");

// ========================================================================
// DEFINICIÓN DE ENDPOINTS PARA /api/publicaciones
// ========================================================================

// Obtener todas las publicaciones para el listado principal
router.get("/", publicacionesController.obtenerPublicaciones);

module.exports = router;
