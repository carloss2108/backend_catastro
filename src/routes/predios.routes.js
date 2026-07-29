const express = require("express");
const router = express.Router();
const prediosController = require("../controllers/predios.controller");

// ========================================================================
// DEFINICIÓN DE ENDPOINTS PARA /api/predios
// ========================================================================

// Cuando se hace un POST a /api/predios, se ejecuta la función del controlador
router.post("/", prediosController.guardarPredio);

module.exports = router;
