const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const productosCtrl = require('../controllers/gestionProductos');
const Usuario = require('../models/Usuario');

// Middleware para validar ObjectId de producto
function validarObjectId(req, res, next) {
    const id = req.params.productoId;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        console.error("productoId inválido o faltante:", id);
        return res.status(400).json({ error: 'productoId es requerido y debe ser válido.' });
    }
    next();
}

// Middleware para validar usuarioId
function validarUsuarioId(req, res, next) {
    // Asegura que req.query y req.body existan antes de acceder a sus propiedades
    const usuarioId =
        (req.query && req.query.usuarioId) ||
        (req.body && req.body.usuarioId);
    console.log("usuarioId recibido en ruta:", usuarioId, typeof usuarioId);
    if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
        console.error("usuarioId inválido o faltante:", usuarioId);
        return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
    }
    next();
}

// Middleware para verificar existencia de usuario y stock array
async function verificarUsuarioYStock(req, res, next) {
    try {
        const usuarioId = req.query.usuarioId || req.body.usuarioId;
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            console.error("Usuario no encontrado:", usuarioId);
            return res.status(404).json({ error: 'Usuario no encontrado.', usuarioIdBuscado: usuarioId });
        }
        if (!Array.isArray(usuario.stock)) {
            console.error("El campo stock no es un array para el usuario:", usuarioId, usuario.stock);
            return res.status(500).json({ error: 'El campo stock no es un array.' });
        }
        req._usuario = usuario; // para usar en el controlador si se quiere
        next();
    } catch (err) {
        console.error("Error al verificar usuario y stock:", err);
        return res.status(500).json({ error: "Error interno al verificar usuario", detalle: err.message, stack: err.stack });
    }
}

// Alta de producto (usuarioId en body o query)
router.post('/crear', validarUsuarioId, verificarUsuarioYStock, productosCtrl.agregarProducto);

// Modificación de producto (usuarioId y productoId)
router.put('/modificar/:productoId', validarUsuarioId, validarObjectId, verificarUsuarioYStock, productosCtrl.modificarProducto);

// Baja lógica de producto (usuarioId y productoId)
router.delete('/eliminar/:productoId', validarUsuarioId, validarObjectId, verificarUsuarioYStock, productosCtrl.eliminarProducto);

// Activar producto inactivo (usuarioId y productoId)
router.patch('/activar/:productoId', validarUsuarioId, validarObjectId, verificarUsuarioYStock, productosCtrl.activarProducto);

// Modificar stock de producto agotado (usuarioId y productoId)
router.patch('/stock/:productoId', validarUsuarioId, validarObjectId, verificarUsuarioYStock, productosCtrl.modificarStockProductoAgotado);

// Listar productos activos (usuarioId)
router.get('/activos', validarUsuarioId, verificarUsuarioYStock, async (req, res) => {
    try {
        const usuario = req._usuario;
        if (!usuario || !Array.isArray(usuario.stock)) {
            console.error("Usuario o stock no válido en /activos:", usuario);
            return res.status(500).json({ error: "Usuario o stock no válido." });
        }
        const productosActivos = usuario.stock.filter(p =>
            p &&
            p.estado === "activo" &&
            p.tipo === "producto" &&
            p.precioCompra !== undefined &&
            p.precioVenta !== undefined &&
            p.cantidad !== undefined &&
            (!p.descripcion || p.descripcion === "") &&
            (p.costo === undefined || p.costo === null)
        );
        console.log("Cantidad de productos activos encontrados:", productosActivos.length);
        res.json({ productos: productosActivos });
    } catch (err) {
        console.error("Error en /activos:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
});

// Listar productos agotados (usuarioId)
router.get('/agotados', validarUsuarioId, verificarUsuarioYStock, async (req, res) => {
    try {
        const usuario = req._usuario;
        if (!usuario || !Array.isArray(usuario.stock)) {
            console.error("Usuario o stock no válido en /agotados:", usuario);
            return res.status(500).json({ error: "Usuario o stock no válido." });
        }
        const productosAgotados = usuario.stock.filter(p =>
            p &&
            p.estado === "agotado" &&
            p.tipo === "producto" &&
            p.precioCompra !== undefined &&
            p.precioVenta !== undefined &&
            p.cantidad !== undefined &&
            (!p.descripcion || p.descripcion === "") &&
            (p.costo === undefined || p.costo === null)
        );
        console.log("Cantidad de productos agotados encontrados:", productosAgotados.length);
        res.json({ productos: productosAgotados });
    } catch (err) {
        console.error("Error en /agotados:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
});

// Obtener todos los productos del usuario (usuarioId)
router.get('/todos', validarUsuarioId, verificarUsuarioYStock, async (req, res) => {
    try {
        const usuario = req._usuario;
        if (!usuario || !Array.isArray(usuario.stock)) {
            console.error("Usuario o stock no válido en /todos:", usuario);
            return res.status(500).json({ error: "Usuario o stock no válido." });
        }
        const productos = usuario.stock.filter(p =>
            p &&
            p.tipo === "producto" &&
            p.precioCompra !== undefined &&
            p.precioVenta !== undefined &&
            p.cantidad !== undefined &&
            (!p.descripcion || p.descripcion === "") &&
            (p.costo === undefined || p.costo === null)
        );
        console.log("Cantidad de productos encontrados:", productos.length);
        res.json({ productos });
    } catch (err) {
        console.error("Error en /todos:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
});

module.exports = router;
