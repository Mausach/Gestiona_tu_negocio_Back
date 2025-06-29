const Usuario = require('../models/Usuario');
const Venta = require('../models/Venta');
const mongoose = require('mongoose');

const getUsuarioId = (req) =>
    req.user?.id || req.usuarioId || req.body.usuarioId || req.query.usuarioId;

// Crear una nueva venta (carrito de compras)
exports.crearVenta = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        console.log("usuarioId recibido (crearVenta):", usuarioId, typeof usuarioId);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        const items = req.body.items; // [{ stockId, cantidad }]
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Debes enviar al menos un producto o servicio.' });
        }

        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

        let precioTotal = 0;
        const itemsVenta = [];

        // Verifica y descuenta stock SOLO después de validar todos los productos
        for (const item of items) {
            const stock = usuario.stock.id(item.stockId);
            if (!stock) {
                return res.status(404).json({ error: `Item con id ${item.stockId} no encontrado en el stock del usuario.` });
            }
            if (stock.estado !== "activo") {
                return res.status(400).json({ error: `El item ${stock.nombre} no está activo.` });
            }
            if (stock.tipo === "producto") {
                if (typeof item.cantidad !== "number" || item.cantidad < 1) {
                    return res.status(400).json({ error: `Cantidad inválida para el producto ${stock.nombre}.` });
                }
                if (stock.cantidad < item.cantidad) {
                    return res.status(400).json({ error: `Stock insuficiente para el producto ${stock.nombre}.` });
                }
            }
        }

        // Si todas las validaciones pasan, descuenta stock y arma itemsVenta
        for (const item of items) {
            const stock = usuario.stock.id(item.stockId);
            let precioUnitario, subtotal, nombre, tipo;

            if (stock.tipo === "producto") {
                precioUnitario = stock.precioVenta;
                subtotal = precioUnitario * item.cantidad;
                nombre = stock.nombre;
                tipo = "producto";
                // Descontar stock
                stock.cantidad -= item.cantidad;
                // Si queda en 0, marcar como agotado
                if (stock.cantidad === 0) {
                    stock.estado = "agotado";
                }
            } else if (stock.tipo === "servicio") {
                precioUnitario = stock.costo;
                subtotal = precioUnitario * item.cantidad;
                nombre = stock.nombre;
                tipo = "servicio";
            } else {
                return res.status(400).json({ error: `Tipo de item desconocido para ${stock.nombre}.` });
            }

            itemsVenta.push({
                stockId: item.stockId,
                tipo,
                nombre,
                cantidad: item.cantidad,
                precioUnitario,
                subtotal
            });
            precioTotal += subtotal;
        }

        // Guardar la venta
        const venta = new Venta({
            usuarioId,
            items: itemsVenta,
            precioTotal
        });
        await venta.save();
        await usuario.save();

        res.status(201).json({ mensaje: 'Venta realizada con éxito.', venta });
    } catch (err) {
        console.error("Error en crearVenta:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Cancelar venta y restaurar stock
exports.cancelarVenta = async (req, res) => {
    try {
        const ventaId = req.params.ventaId;
        console.log("ventaId recibido (cancelarVenta):", ventaId, typeof ventaId);
        if (!ventaId || !mongoose.Types.ObjectId.isValid(ventaId)) {
            console.error("ventaId inválido:", ventaId);
            return res.status(400).json({ error: 'ventaId es requerido y debe ser válido.' });
        }

        const venta = await Venta.findById(ventaId);
        if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });

        const usuario = await Usuario.findById(venta.usuarioId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

        // Restaurar stock solo para productos
        for (const item of venta.items) {
            if (item.tipo === "producto") {
                const producto = usuario.stock.id(item.stockId);
                if (producto) {
                    producto.cantidad += item.cantidad;
                    // Si estaba agotado o inactivo y ahora hay stock, poner activo
                    if (producto.cantidad > 0) {
                        producto.estado = "activo";
                    }
                }
            }
        }

        await usuario.save();
        await Venta.findByIdAndDelete(ventaId);

        res.json({ mensaje: 'Venta cancelada y stock restaurado.' });
    } catch (err) {
        console.error("Error en cancelarVenta:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Obtener todas las ventas del usuario
exports.obtenerTodasLasVentas = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        console.log("usuarioId recibido (obtenerTodasLasVentas):", usuarioId, typeof usuarioId);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        const ventas = await Venta.find({ usuarioId });
        res.json({ ventas });
    } catch (err) {
        console.error("Error en obtenerTodasLasVentas:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

module.exports = {
    crearVenta: exports.crearVenta,
    cancelarVenta: exports.cancelarVenta,
    obtenerTodasLasVentas: exports.obtenerTodasLasVentas
};
