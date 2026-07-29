// ========================================================================
// SERVIDOR BACKEND PARA CATASTRO CULIACÁN - PUNTO DE ENTRADA
// ========================================================================
require("dotenv").config(); // Carga las variables del archivo .env
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

// Levantar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`Esperando datos de la extensión en el endpoint: POST /api/predios`);
});
