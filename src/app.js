const express = require("express");
const cors = require("cors");
const prediosRoutes = require("./routes/predios.routes");
const contactosRoutes = require("./routes/contactos.routes");
const publicacionesRoutes = require("./routes/publicaciones.routes");
const fotosRoutes = require("./routes/fotos.routes");

const app = express();

// Middlewares
app.use(cors()); // Permite peticiones desde la extensión de Chrome y el frontend React
app.use(express.json()); // Permite recibir y parsear JSON

// Registro de Rutas
app.use("/api/predios", prediosRoutes);
app.use("/api/contactos", contactosRoutes);
app.use("/api/publicaciones", publicacionesRoutes);
// Rutas de fotos (sub-recursos de publicaciones + ruta independiente DELETE /api/fotos/:id)
app.use("/api/publicaciones", fotosRoutes);
app.use("/api", fotosRoutes);

module.exports = app;
