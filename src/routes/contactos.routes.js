const express = require("express");
const router = express.Router();
const contactosController = require("../controllers/contactos.controller");

// ========================================================================
// DEFINICIÓN DE ENDPOINTS PARA /api/contactos
// ========================================================================

// Obtener todos los contactos
router.get("/", contactosController.obtenerContactos);

// Crear un nuevo contacto
router.post("/", contactosController.crearContacto);

// Obtener un contacto específico por su ID
router.get("/:id", contactosController.obtenerContactoPorId);

// Actualizar un contacto existente
router.put("/:id", contactosController.actualizarContacto);

module.exports = router;
