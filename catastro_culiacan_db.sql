-- ========================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS PARA CATASTRO CULIACÁN (MariaDB 11.4.12)
-- ========================================================================

-- Creamos la base de datos (si no existe) y la seleccionamos
CREATE DATABASE IF NOT EXISTS catastro_culiacan_db
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE catastro_culiacan_db;

-- ========================================================================
-- TABLAS CATÁLOGO (Diccionarios de datos relacionales)
-- ========================================================================

-- Catálogo de Tipos de Predio (Ej: Casa, Terreno, Local)
CREATE TABLE IF NOT EXISTS tipo_predios (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Catálogo de Transacciones (Ej: Venta, Renta, Traspaso)
CREATE TABLE IF NOT EXISTS transacciones (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- (Opcional) Insertar valores por defecto para acelerar tu desarrollo
INSERT IGNORE INTO tipo_predios (nombre) VALUES 
('Casa'), ('Departamento'), ('Terreno'), ('Local Comercial'), ('Oficina'), ('Bodega');

INSERT IGNORE INTO transacciones (nombre) VALUES 
('Venta'), ('Renta'), ('Traspaso'), ('Remate Bancario');

-- ========================================================================
-- TABLA PRINCIPAL DE PREDIOS
-- ========================================================================
CREATE TABLE IF NOT EXISTS predios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificador principal optimizado de 18 caracteres fijos (sin guiones)
    -- Almacenado en ASCII para máxima eficiencia en la base de datos
    clave_catastral CHAR(18) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL UNIQUE COMMENT 'Solo números, ej: 007000022347014001',
    
    -- Datos de Identificación y Ubicación (Crudos de Catastro extraidos por la extension de Chrome)
    propietario VARCHAR(255),
    domicilio VARCHAR(255),
    ubicacion TEXT,
    colonia VARCHAR(150),
    poblacion VARCHAR(150),
    
    -- Dirección Estandarizada (Captura manual/Frontend)
    calle VARCHAR(255) COMMENT 'Nombre oficial de la calle limpia',
    numero VARCHAR(50) COMMENT 'Número exterior e interior (Ej. 123-B, S/N)',
    orientacion VARCHAR(50) COMMENT 'Nte, Sur, Ote, Pte',
    codigo_postal VARCHAR(10) COMMENT 'Código Postal',
    
    -- Características del Inmueble (Desde el Panel)
    recamaras TINYINT DEFAULT 0 COMMENT 'Cantidad de habitaciones (Desde el Panel)',
    banos_completos TINYINT DEFAULT 0 COMMENT 'Baños con regadera/tina (Desde el Panel)',
    banos_medios TINYINT DEFAULT 0 COMMENT 'Baños de visita, solo inodoro/lavamanos (Desde el Panel)',
    cochera TINYINT DEFAULT 0 COMMENT 'Capacidad de vehículos (Desde el Panel)',
    
    -- Superficies (extraidos por la extension de Catastro)
    m2_terreno DECIMAL(6,2),
    m2_construccion DECIMAL(6,2),
    
    -- Valores económicos (extraidos por la extension de Catastro)
    valor_terreno DECIMAL(11,2),
    valor_construccion DECIMAL(11,2),
    valor_catastral DECIMAL(11,2),
      
    -- Metadatos
    fecha_extraccion DATETIME DEFAULT CURRENT_TIMESTAMP,
        
    -- Índices para búsquedas y filtros ultrarrápidos
    INDEX idx_propietario (propietario),
    INDEX idx_colonia (colonia)
) ENGINE=InnoDB;

-- ========================================================================
-- TABLAS DE HISTORIAL (METROS Y VALORES)
-- ========================================================================
CREATE TABLE IF NOT EXISTS historial_m2_construccion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    predio_id INT NOT NULL,
    m2_terreno DECIMAL(6,2) NOT NULL,
    m2_construccion DECIMAL(6,2) NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (predio_id) REFERENCES predios(id) ON DELETE CASCADE,
    INDEX idx_hist_m2_predio (predio_id, fecha_registro)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historial_valor_catastral (
    id INT AUTO_INCREMENT PRIMARY KEY,
    predio_id INT NOT NULL,
    valor_terreno DECIMAL(11,2) NOT NULL,
    valor_construccion DECIMAL(11,2) NOT NULL,
    valor_catastral DECIMAL(11,2) NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (predio_id) REFERENCES predios(id) ON DELETE CASCADE,
    INDEX idx_hist_valor_predio (predio_id, fecha_registro)
) ENGINE=InnoDB;

-- ========================================================================
-- MÓDULO DE GESTIÓN COMERCIAL Y CONTACTOS
-- ========================================================================

-- Catálogo Principal de Contactos (Propietarios, Asesores, etc.)
CREATE TABLE IF NOT EXISTS contactos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    correo VARCHAR(255),
    tipo_contacto ENUM('Propietario', 'Asesor', 'Agencia') DEFAULT 'Asesor' COMMENT 'Propietario, Asesor, Agencia',
    empresa VARCHAR(150) COMMENT 'KW, Remax, Century21, o Independiente',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nombre_contacto (nombre),
    INDEX idx_telefono_contacto (telefono)
) ENGINE=InnoDB;

-- Tabla Principal Comercial: Registro de Publicaciones de Inmuebles
CREATE TABLE IF NOT EXISTS publicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    predio_id INT NOT NULL,
    contacto_id INT NOT NULL,
    id_tipo_predio TINYINT NULL COMMENT 'Relación al catálogo de tipo de predio',
    id_transaccion TINYINT NOT NULL COMMENT 'Relación al catálogo de transacciones (Ej. Venta, Renta)',
    
    -- Valores comerciales específicos de esta publicación
    asking_price DECIMAL(12,2) COMMENT 'Precio de venta/renta solicitado',
    precio_cierre DECIMAL(12,2) COMMENT 'Precio real final de la operación',
    
    -- Dirección Estandarizada
    -- En el frontend al añadir una publicacion para un predio, el backend hará una consulta a la tabla predios, e inyectará automáticamente los datos en el formulario de la pantalla para no tener que escribirlos de cero
    calle VARCHAR(255) COMMENT 'Calle según la publicación',
    numero VARCHAR(50) COMMENT 'Número exterior/interior según publicación',
    orientacion VARCHAR(50) COMMENT 'Orientación comercial',
    codigo_postal VARCHAR(10) COMMENT 'CP según publicación',
    
    -- Características del Inmueble 
    -- Igual que la seccion de campos Dirección Estandarizada; se consultaran de tabla predios
    recamaras TINYINT DEFAULT 0 COMMENT 'Cantidad de habitaciones (Según publicación)',
    banos_completos TINYINT DEFAULT 0 COMMENT 'Baños completos (Según publicación)',
    banos_medios TINYINT DEFAULT 0 COMMENT 'Baños de visita (Según publicación)',
    cochera TINYINT DEFAULT 0 COMMENT 'Capacidad de vehículos (Según publicación)',
    
    -- Superficies
    -- Igual que la seccion de campos Dirección Estandarizada; se consultaran de tabla predios
    m2_terreno DECIMAL(6,2) COMMENT 'Terreno promovido',
    m2_construccion DECIMAL(6,2) COMMENT 'Construcción promovida',
    
    -- Columnas Virtuales Comerciales
    precio_m2_construccion DECIMAL(12,2) GENERATED ALWAYS AS (IF(m2_construccion > 0, asking_price / m2_construccion, NULL)) VIRTUAL COMMENT 'Costo m2 construido comercial',
    precio_m2_terreno DECIMAL(12,2) GENERATED ALWAYS AS (IF(m2_terreno > 0, asking_price / m2_terreno, NULL)) VIRTUAL COMMENT 'Costo m2 suelo comercial',
    
    -- Metadatos de Inteligencia de Mercado
    fuente VARCHAR(100) COMMENT 'Ej. Inmuebles24, Facebook, Trato Directo',
    url_origen TEXT COMMENT 'Enlace directo a la publicación web si existe',
    
    -- Estado de la publicación
    estatus ENUM('Activo', 'Cerrado', 'Cancelado', 'Pausado') DEFAULT 'Activo' COMMENT 'Estado de la gestión comercial',
    fecha_inicio DATE DEFAULT CURRENT_DATE NOT NULL COMMENT 'Fecha en que inicio la publicacion de venta',
    fecha_fin DATE NULL COMMENT 'Se llena cuando se cierra la venta o se cancela',
    notas TEXT COMMENT 'Observaciones sobre el trato o por qué se canceló',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Relaciones (Llaves Foráneas)
    CONSTRAINT fk_publicacion_predio FOREIGN KEY (predio_id) REFERENCES predios(id) ON DELETE CASCADE,
    CONSTRAINT fk_publicacion_contacto FOREIGN KEY (contacto_id) REFERENCES contactos(id) ON DELETE CASCADE,
    CONSTRAINT fk_publicacion_tipo_predio FOREIGN KEY (id_tipo_predio) REFERENCES tipo_predios(id) ON DELETE SET NULL,
    CONSTRAINT fk_publicacion_transaccion FOREIGN KEY (id_transaccion) REFERENCES transacciones(id) ON DELETE RESTRICT,
    
    -- Índice compuesto crucial para encontrar qué se vende hoy
    INDEX idx_publicacion_estatus (predio_id, estatus)
) ENGINE=InnoDB;

-- ========================================================================
-- TABLA DE HISTORIAL DE ASKING PRICE (PUBLICACIONES)
-- ========================================================================
CREATE TABLE IF NOT EXISTS historial_asking_price (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    asking_price DECIMAL(12,2) NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hist_asking_publicacion FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE,
    INDEX idx_hist_asking_pub (publicacion_id, fecha_registro)
) ENGINE=InnoDB;

-- ========================================================================
-- TABLA DE FOTOGRAFÍAS DE PUBLICACIONES
-- ========================================================================
CREATE TABLE IF NOT EXISTS fotos_publicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    
    -- Almacenamiento en la Nube (Cloudinary)
    url_imagen VARCHAR(255) NOT NULL COMMENT 'URL segura servida por Cloudinary (https)',
    public_id VARCHAR(255) NOT NULL COMMENT 'ID único de Cloudinary, vital para poder borrar la foto después',
    
    -- Lógica de negocio (El orden dicta la portada)
    orden TINYINT NOT NULL DEFAULT 1 COMMENT '1 = Portada, 2 = Segunda foto, etc.',
    
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Relación con cascada: Si borras la publicación, se borran los registros de sus fotos
    CONSTRAINT fk_fotos_publicacion FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE,
        
    -- Índice para que las consultas de "traer las fotos de esta publicación" sean instantáneas
    INDEX idx_fotos_pub_orden (publicacion_id, orden)
) ENGINE=InnoDB;

-- ========================================================================
-- TRIGGERS PARA AUTOMATIZAR EL HISTORIAL
-- ========================================================================
DELIMITER //

CREATE TRIGGER trg_predios_after_insert
AFTER INSERT ON predios
FOR EACH ROW
BEGIN
    INSERT INTO historial_valor_catastral (predio_id, valor_terreno, valor_construccion, valor_catastral) 
    VALUES (NEW.id, NEW.valor_terreno, NEW.valor_construccion, NEW.valor_catastral);
    
    INSERT INTO historial_m2_construccion (predio_id, m2_terreno, m2_construccion) 
    VALUES (NEW.id, NEW.m2_terreno, NEW.m2_construccion);
END; //

CREATE TRIGGER trg_predios_after_update
AFTER UPDATE ON predios
FOR EACH ROW
BEGIN
    IF NEW.valor_catastral <> OLD.valor_catastral THEN
        INSERT INTO historial_valor_catastral (predio_id, valor_terreno, valor_construccion, valor_catastral) 
        VALUES (NEW.id, NEW.valor_terreno, NEW.valor_construccion, NEW.valor_catastral);
    END IF;

    IF NEW.m2_construccion <> OLD.m2_construccion OR NEW.m2_terreno <> OLD.m2_terreno THEN
        INSERT INTO historial_m2_construccion (predio_id, m2_terreno, m2_construccion) 
        VALUES (NEW.id, NEW.m2_terreno, NEW.m2_construccion);
    END IF;
END; //

DROP TRIGGER IF EXISTS trg_publicaciones_after_insert; //
CREATE TRIGGER trg_publicaciones_after_insert
AFTER INSERT ON publicaciones
FOR EACH ROW
BEGIN
    -- Si la nueva publicación nace con precio, guardamos su primera "foto" en el historial
    IF NEW.asking_price IS NOT NULL AND NEW.asking_price > 0 THEN
        INSERT INTO historial_asking_price (publicacion_id, asking_price)
        VALUES (NEW.id, NEW.asking_price);
    END IF;
END; //

DROP TRIGGER IF EXISTS trg_publicaciones_after_update; //
CREATE TRIGGER trg_publicaciones_after_update
AFTER UPDATE ON publicaciones
FOR EACH ROW
BEGIN
    -- Si el precio cambia, o si antes no tenía precio y ahora se le asignó, guardamos el nuevo récord
    IF (OLD.asking_price IS NULL AND NEW.asking_price > 0) OR (NEW.asking_price <> OLD.asking_price) THEN
        INSERT INTO historial_asking_price (publicacion_id, asking_price)
        VALUES (NEW.id, NEW.asking_price);
    END IF;
END; //

DELIMITER ;