const express = require("express");
const cors = require("cors");
const prediosRoutes = require("./routes/predios.routes");
const contactosRoutes = require("./routes/contactos.routes");
const publicacionesRoutes = require("./routes/publicaciones.routes");

const app = express();

// Middlewares
app.use(cors()); // Permite peticiones desde la extensión de Chrome y el frontend React
app.use(express.json()); // Permite recibir y parsear JSON

// Registro de Rutas
app.use("/api/predios", prediosRoutes);
app.use("/api/contactos", contactosRoutes);
app.use("/api/publicaciones", publicacionesRoutes);

module.exports = app;
