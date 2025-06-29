const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const serviciosCtrl = require('../controllers/gestionServicios');
const Usuario = require('../models/Usuario');

// Middleware para validar ObjectId de servicio
function validarObjectId(req, res, next) {
    const id = req.params.servicioId;
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
        console.error("servicioId inválido:", id);
        return res.status(400).json({ error: 'servicioId inválido.' });
    }
    next();
}

// Middleware para validar usuarioId SOLO en req.body para POST /alta
function validarUsuarioIdBody(req, res, next) {
    const usuarioId = req.body && req.body.usuarioId;
    console.log("usuarioId recibido en body (POST /alta):", usuarioId);
    if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
        console.error("usuarioId inválido en body:", usuarioId);
        return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
    }
    next();
}

// Middleware para validar usuarioId SOLO en req.body para PUT /modificacion/:servicioId
function validarUsuarioIdBody(req, res, next) {
    const usuarioId = req.body && req.body.usuarioId;
    console.log("usuarioId recibido en body (PUT /modificacion):", usuarioId);
    if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
        console.error("usuarioId inválido en body:", usuarioId);
        return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
    }
    next();
}

// Middleware para validar usuarioId SOLO en req.query para las demás rutas
function validarUsuarioIdQuery(req, res, next) {
    const usuarioId = req.query && req.query.usuarioId;
    console.log("usuarioId recibido en query:", usuarioId);
    if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
        console.error("usuarioId inválido en query:", usuarioId);
        return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
    }
    next();
}

// Alta de servicio (usuarioId en body)
router.post('/alta', validarUsuarioIdBody, serviciosCtrl.agregarServicio);

// Modificación de servicio (usuarioId en body)
router.put('/modificacion/:servicioId', validarUsuarioIdBody, validarObjectId, serviciosCtrl.modificarServicio);

// Baja lógica de servicio (usuarioId en query)
router.delete('/baja/:servicioId', validarUsuarioIdQuery, validarObjectId, serviciosCtrl.eliminarServicio);

// Activar servicio inactivo (usuarioId y servicioId en query)
router.patch('/activar/:servicioId', validarUsuarioIdQuery, validarObjectId, serviciosCtrl.activarServicio);

// Listar servicios activos (usuarioId en query)
router.get('/activos', validarUsuarioIdQuery, async (req, res) => {
    try {
        const usuarioId = req.query.usuarioId || req.body.usuarioId;
        console.log("usuarioId recibido en /activos:", usuarioId);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            console.error("Usuario no encontrado:", usuarioId);
            return res.status(404).json({ error: 'Usuario no encontrado.', usuarioIdBuscado: usuarioId });
        }
        if (!Array.isArray(usuario.stock)) {
            console.error("El campo stock no es un array para el usuario:", usuarioId);
            return res.status(500).json({ error: 'El campo stock no es un array.' });
        }
        const serviciosActivos = usuario.stock.filter(s =>
            s &&
            s.estado === "activo" &&
            s.tipo === "servicio" &&
            s.descripcion &&
            (s.precioCompra === undefined || s.precioCompra === null) &&
            (s.precioVenta === undefined || s.precioVenta === null) &&
            (s.cantidad === undefined || s.cantidad === null)
        );
        console.log("Cantidad de servicios activos encontrados:", serviciosActivos.length);
        res.json({ servicios: serviciosActivos });
    } catch (err) {
        console.error("Error en /activos (servicio):", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
});

// Listar servicios inactivos (usuarioId en query)
router.get('/inactivos', validarUsuarioIdQuery, async (req, res) => {
    try {
        const usuarioId = req.query.usuarioId || req.body.usuarioId;
        console.log("usuarioId recibido en /inactivos:", usuarioId);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            console.error("Usuario no encontrado:", usuarioId);
            return res.status(404).json({ error: 'Usuario no encontrado.', usuarioIdBuscado: usuarioId });
        }
        if (!Array.isArray(usuario.stock)) {
            console.error("El campo stock no es un array para el usuario:", usuarioId);
            return res.status(500).json({ error: 'El campo stock no es un array.' });
        }
        const serviciosInactivos = usuario.stock.filter(s =>
            s &&
            s.estado === "inactivo" &&
            s.tipo === "servicio" &&
            s.descripcion &&
            (s.precioCompra === undefined || s.precioCompra === null) &&
            (s.precioVenta === undefined || s.precioVenta === null) &&
            (s.cantidad === undefined || s.cantidad === null)
        );
        console.log("Cantidad de servicios inactivos encontrados:", serviciosInactivos.length);
        res.json({ servicios: serviciosInactivos });
    } catch (err) {
        console.error("Error en /inactivos (servicio):", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
});

// Obtener todos los servicios del usuario (usuarioId en query)
router.get('/todos', validarUsuarioIdQuery, async (req, res) => {
    try {
        const usuarioId = req.query.usuarioId || req.body.usuarioId;
        console.log("usuarioId recibido en /todos:", usuarioId);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            console.error("Usuario no encontrado:", usuarioId);
            return res.status(404).json({ error: 'Usuario no encontrado.', usuarioIdBuscado: usuarioId });
        }
        if (!Array.isArray(usuario.stock)) {
            console.error("El campo stock no es un array para el usuario:", usuarioId);
            return res.status(500).json({ error: 'El campo stock no es un array.' });
        }
        const servicios = usuario.stock.filter(s =>
            s &&
            s.tipo === "servicio" &&
            s.descripcion &&
            (s.precioCompra === undefined || s.precioCompra === null) &&
            (s.precioVenta === undefined || s.precioVenta === null) &&
            (s.cantidad === undefined || s.cantidad === null)
        );
        console.log("Cantidad de servicios encontrados:", servicios.length);
        res.json({ servicios });
    } catch (err) {
        console.error("Error en /todos (servicio):", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
});

module.exports = router;
