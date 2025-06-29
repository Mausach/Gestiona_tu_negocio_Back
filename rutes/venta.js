const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const ventaCtrl = require('../controllers/gestionVenta');
const Venta = require('../models/Venta');

// Middleware para validar ObjectId de venta
function validarObjectId(req, res, next) {
    const id = req.params.ventaId;
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
        console.error("ventaId inválido:", id);
        return res.status(400).json({ error: 'ventaId inválido.' });
    }
    next();
}

// Middleware para validar usuarioId
function validarUsuarioId(req, res, next) {
    const usuarioId = req.query.usuarioId || req.body.usuarioId;
    console.log("usuarioId recibido en ruta:", usuarioId);
    if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
        console.error("usuarioId inválido:", usuarioId);
        return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
    }
    next();
}

// Crear venta (usuarioId en body o query)
router.post('/crearVenta', validarUsuarioId, ventaCtrl.crearVenta);

// Obtener todas las ventas del usuario (usuarioId)
router.get('/todas', validarUsuarioId, async (req, res) => {
    try {
        const usuarioId = req.query.usuarioId || req.body.usuarioId;
        console.log("usuarioId recibido en /todas:", usuarioId);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        const ventas = await Venta.find({ usuarioId });
        console.log("Cantidad de ventas encontradas:", ventas.length);
        res.json({ ventas });
    } catch (err) {
        console.error("Error en /todas (venta):", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
});

// Cancelar venta (ventaId)
router.delete('/cancelar/:ventaId', validarObjectId, ventaCtrl.cancelarVenta);

module.exports = router;
