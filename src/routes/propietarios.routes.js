const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/propietarios.controller");

// GET    /api/propietarios          → listar (acepta ?q=nombre para buscar)
router.get("/", ctrl.obtenerPropietarios);

// GET    /api/propietarios/:id      → detalle + predios vinculados
router.get("/:id", ctrl.obtenerPropietario);

// POST   /api/propietarios          → crear
router.post("/", ctrl.crearPropietario);

// POST   /api/propietarios/desde-predial → upsert desde página de pagos + vinculación a predio
router.post("/desde-predial", ctrl.desdePredial);

// PUT    /api/propietarios/:id      → actualizar
router.put("/:id", ctrl.actualizarPropietario);

// DELETE /api/propietarios/:id      → eliminar (predios quedan con propietario_id = NULL)
router.delete("/:id", ctrl.eliminarPropietario);

module.exports = router;
