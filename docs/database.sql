-- ============================================================
--  SISTEMA DE VENTAS - GRANIZADOS
--  Script SQL para crear la base de datos completa
--  Ejecutar en MySQL Workbench o phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS granizados_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE granizados_db;

-- ------------------------------------------------------------
-- TABLA: usuarios
-- Almacena los empleados y administradores del sistema
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,           -- bcrypt hash
  rol         ENUM('admin', 'cajero') NOT NULL DEFAULT 'cajero',
  activo      BOOLEAN       NOT NULL DEFAULT TRUE,
  creado_en   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLA: categorias
-- Ej: "Con licor", "Sin licor", "Extras"
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(80)   NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  creado_en   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLA: productos
-- Catálogo de granizados y complementos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(120)      NOT NULL,
  descripcion     VARCHAR(255),
  precio          DECIMAL(10,2)     NOT NULL,
  categoria_id    INT               NOT NULL,
  stock           INT               NOT NULL DEFAULT 0,
  stock_minimo    INT               NOT NULL DEFAULT 5,   -- alerta de bajo stock
  tiene_licor     BOOLEAN           NOT NULL DEFAULT FALSE,
  activo          BOOLEAN           NOT NULL DEFAULT TRUE,
  imagen_url      VARCHAR(255),
  creado_en       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_producto_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- ------------------------------------------------------------
-- TABLA: cajas
-- Apertura y cierre de caja por día/turno
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cajas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT               NOT NULL,
  fecha_apertura  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre    DATETIME,
  monto_inicial   DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  monto_final     DECIMAL(10,2),
  estado          ENUM('abierta','cerrada') NOT NULL DEFAULT 'abierta',
  notas           TEXT,
  CONSTRAINT fk_caja_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ------------------------------------------------------------
-- TABLA: ventas
-- Cabecera de cada transacción
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  caja_id         INT               NOT NULL,
  usuario_id      INT               NOT NULL,
  total           DECIMAL(10,2)     NOT NULL,
  metodo_pago     ENUM('efectivo','tarjeta','transferencia','otro')
                                    NOT NULL DEFAULT 'efectivo',
  fecha           DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notas           TEXT,
  CONSTRAINT fk_venta_caja
    FOREIGN KEY (caja_id)    REFERENCES cajas(id),
  CONSTRAINT fk_venta_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ------------------------------------------------------------
-- TABLA: detalle_ventas
-- Ítems individuales de cada venta
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  venta_id        INT               NOT NULL,
  producto_id     INT               NOT NULL,
  cantidad        INT               NOT NULL,
  precio_unitario DECIMAL(10,2)     NOT NULL,
  subtotal        DECIMAL(10,2)     NOT NULL,
  CONSTRAINT fk_detalle_venta
    FOREIGN KEY (venta_id)    REFERENCES ventas(id),
  CONSTRAINT fk_detalle_producto
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- ------------------------------------------------------------
-- TABLA: movimientos_inventario
-- Registro de entradas/salidas de stock
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  producto_id     INT               NOT NULL,
  usuario_id      INT               NOT NULL,
  tipo            ENUM('entrada','salida','ajuste') NOT NULL,
  cantidad        INT               NOT NULL,
  motivo          VARCHAR(255),
  fecha           DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_producto
    FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT fk_mov_usuario
    FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
);

-- ============================================================
-- DATOS INICIALES (SEED)
-- ============================================================

-- Categorías base
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Sin licor',  'Granizados clásicos para toda la familia'),
  ('Con licor',  'Granizados especiales para adultos (+18)'),
  ('Extras',     'Complementos y adiciones');

-- Usuario administrador por defecto
-- Contraseña: Admin123* (cambiar después del primer ingreso)
INSERT INTO usuarios (nombre, email, password, rol) VALUES
  ('Administrador', 'admin@granizados.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'admin');

-- Productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, categoria_id, stock, stock_minimo, tiene_licor) VALUES
  ('Granizado Limón',       'Limón natural con hielo raspado',           4500.00, 1, 50, 10, FALSE),
  ('Granizado Fresa',       'Fresa natural con hielo raspado',           4500.00, 1, 50, 10, FALSE),
  ('Granizado Mango',       'Mango con chamoy y chile',                  5000.00, 1, 40, 10, FALSE),
  ('Granizado Tamarindo',   'Tamarindo con sal y chile',                 4500.00, 1, 40, 10, FALSE),
  ('Granizado Piña Colada', 'Piña, coco y ron blanco',                   7500.00, 2, 30, 5,  TRUE),
  ('Granizado Margarita',   'Limón, sal y tequila',                      7500.00, 2, 30, 5,  TRUE),
  ('Granizado Michelada',   'Cerveza, limón, chamoy y especias',         8000.00, 2, 25, 5,  TRUE),
  ('Granizado Vodka Fresa', 'Fresa natural con vodka',                   7000.00, 2, 25, 5,  TRUE),
  ('Chamoy Extra',          'Porción adicional de chamoy',               500.00,  3, 100, 20, FALSE),
  ('Chile en polvo',        'Porción adicional de chile',                500.00,  3, 100, 20, FALSE);
