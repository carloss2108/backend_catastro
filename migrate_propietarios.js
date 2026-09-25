const db = require('./src/config/db');

async function migrate() {
  try {
    // 1. Crear tabla propietarios si no existe
    await db.execute(`
      CREATE TABLE IF NOT EXISTS propietarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL COMMENT 'Nombre completo o razon social',
        domicilio VARCHAR(255) COMMENT 'Domicilio personal o fiscal',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_propietario_nombre (nombre)
      ) ENGINE=InnoDB
    `);
    console.log('OK Tabla propietarios creada/verificada');

    // 2. Verificar si ya existe propietario_id en predios
    const [cols] = await db.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'catastro_culiacan_db'
        AND TABLE_NAME = 'predios'
        AND COLUMN_NAME = 'propietario_id'
    `);

    if (cols.length === 0) {
      await db.execute(`
        ALTER TABLE predios
          ADD COLUMN propietario_id INT DEFAULT NULL
            COMMENT 'Referencia al propietario registrado'
          AFTER clave_catastral
      `);
      console.log('OK Columna propietario_id agregada');

      await db.execute('ALTER TABLE predios ADD INDEX idx_propietario_id (propietario_id)');
      console.log('OK Indice idx_propietario_id creado');

      await db.execute(`
        ALTER TABLE predios
          ADD CONSTRAINT fk_predio_propietario
          FOREIGN KEY (propietario_id) REFERENCES propietarios(id) ON DELETE SET NULL
      `);
      console.log('OK FK fk_predio_propietario creado');
    } else {
      console.log('- propietario_id ya existe, sin cambios en predios');
    }

    console.log('Migracion completada con exito');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

migrate();
