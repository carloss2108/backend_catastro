const express = require("express");
const cors = require("cors");
const prediosRoutes = require("./routes/predios.routes");

const app = express();

// Middlewares
app.use(cors()); // Permite peticiones desde la extensión de Chrome
app.use(express.json()); // Permite recibir y parsear JSON

// Registro de Rutas
app.use("/api/predios", prediosRoutes);

// Aquí podrías agregar más rutas en el futuro (ej. app.use('/api/usuarios', usuariosRoutes); )

module.exports = app;
