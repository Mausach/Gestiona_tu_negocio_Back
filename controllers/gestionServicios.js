const Usuario = require('../models/Usuario');
const mongoose = require('mongoose');

const getUsuarioId = (req) =>
    req.user?.id || req.usuarioId || req.body.usuarioId || req.query.usuarioId;

// Alta de servicio
exports.agregarServicio = async (req, res) => {
    try {
        // Para POST (alta), usuarioId debe venir SOLO en el body
        const usuarioId = req.body && req.body.usuarioId;
        console.log("usuarioId recibido (agregarServicio):", usuarioId, typeof usuarioId);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }

        // Forzar tipo y limpiar/normalizar campos de producto
        const nuevoServicio = {
            ...req.body,
            tipo: "servicio",
            precioCompra: null,
            precioVenta: null,
            cantidad: null,
            fechaRegistro: new Date()
        };

        // Validación básica
        if (!nuevoServicio.nombre || !nuevoServicio.descripcion) {
            return res.status(400).json({ error: 'Nombre y descripción son requeridos.' });
        }

        // Verificar que el usuario existe y coincide el id
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
        if (usuario._id.toString() !== usuarioId.toString()) {
            return res.status(403).json({ error: 'No puedes agregar servicios a otro usuario.' });
        }

        usuario.stock.push(nuevoServicio);
        await usuario.save();

        res.status(201).json({ mensaje: 'Servicio agregado.', servicio: usuario.stock[usuario.stock.length - 1] });
    } catch (err) {
        console.error("Error en agregarServicio:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Modificación de servicio
exports.modificarServicio = async (req, res) => {
    try {
        // Para PUT (modificación), usuarioId debe venir SOLO en el body
        const usuarioId = req.body && req.body.usuarioId;
        const servicioId = req.params.servicioId;
        console.log("usuarioId recibido (modificarServicio):", usuarioId, typeof usuarioId);
        console.log("servicioId recibido (modificarServicio):", servicioId, typeof servicioId);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        if (!servicioId || !mongoose.Types.ObjectId.isValid(servicioId)) {
            console.error("servicioId inválido:", servicioId);
            return res.status(400).json({ error: 'servicioId es requerido y debe ser válido.' });
        }

        // Buscar usuario y servicio por ID
        const usuario = await Usuario.findOne({ _id: usuarioId, "stock._id": servicioId });
        if (!usuario) return res.status(404).json({ error: 'Usuario o servicio no encontrado.' });

        const servicio = usuario.stock.id(servicioId);
        if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado.' });

        // Solo permitir modificar campos de servicio
        const camposPermitidos = ["nombre", "descripcion", "costo", "estado"];
        const datosActualizados = req.body;
        Object.keys(datosActualizados).forEach(key => {
            if (camposPermitidos.includes(key)) {
                servicio[key] = datosActualizados[key];
            }
        });

        // Forzar tipo y limpiar/normalizar campos de producto
        servicio.tipo = "servicio";
        servicio.precioCompra = null;
        servicio.precioVenta = null;
        servicio.cantidad = null;

        await usuario.save();
        res.json({ mensaje: 'Servicio modificado.', servicio });
    } catch (err) {
        console.error("Error en modificarServicio:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Baja lógica de servicio
exports.eliminarServicio = async (req, res) => {
    try {
        // Solo tomar usuarioId de req.query (como en productos)
        const usuarioId = req.query.usuarioId;
        const servicioId = req.params.servicioId;
        console.log("usuarioId recibido (eliminarServicio):", usuarioId, typeof usuarioId);
        console.log("servicioId recibido (eliminarServicio):", servicioId, typeof servicioId);

        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        if (!servicioId || !mongoose.Types.ObjectId.isValid(servicioId)) {
            console.error("servicioId inválido:", servicioId);
            return res.status(400).json({ error: 'servicioId es requerido y debe ser válido.' });
        }

        // Buscar usuario y servicio por ID
        const usuario = await Usuario.findOne({ _id: usuarioId, "stock._id": servicioId });
        if (!usuario) return res.status(404).json({ error: 'Usuario o servicio no encontrado.' });

        const servicio = usuario.stock.id(servicioId);
        if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado.' });

        // Verificar que sea un servicio y no un producto
        if (
            servicio.tipo !== "servicio"
        ) {
            return res.status(400).json({ error: 'Solo se pueden dar de baja servicios, no productos.' });
        }

        // Baja lógica: cambiar estado a "inactivo"
        servicio.estado = "inactivo";
        await usuario.save();

        res.json({ mensaje: 'Servicio dado de baja (lógica).', servicio });
    } catch (err) {
        console.error("Error en eliminarServicio:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Activar servicio inactivo
exports.activarServicio = async (req, res) => {
    try {
        // usuarioId debe venir SOLO en req.query para PATCH /servicio/activar/:servicioId
        const usuarioId = req.query.usuarioId;
        const servicioId = req.params.servicioId;
        console.log("usuarioId recibido (activarServicio):", usuarioId, typeof usuarioId);
        console.log("servicioId recibido (activarServicio):", servicioId, typeof servicioId);

        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        if (!servicioId || !mongoose.Types.ObjectId.isValid(servicioId)) {
            return res.status(400).json({ error: 'servicioId es requerido y debe ser válido.' });
        }

        const usuario = await Usuario.findOne({ _id: usuarioId, "stock._id": servicioId });
        if (!usuario) return res.status(404).json({ error: 'Usuario o servicio no encontrado.' });

        const servicio = usuario.stock.id(servicioId);
        if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado.' });

        if (servicio.estado !== "inactivo") {
            return res.status(400).json({ error: 'El servicio no está inactivo.' });
        }
        if (servicio.tipo !== "servicio") {
            return res.status(400).json({ error: 'Solo se pueden activar servicios.' });
        }

        servicio.estado = "activo";
        await usuario.save();

        res.json({ mensaje: 'Servicio activado.', servicio });
    } catch (err) {
        console.error("Error en activarServicio:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Listar servicios activos
exports.listarServiciosActivos = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        console.log("usuarioId recibido (listarServiciosActivos):", usuarioId, typeof usuarioId);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            console.error("Usuario no encontrado:", usuarioId);
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        if (!Array.isArray(usuario.stock)) {
            console.error("El campo stock no es un array para el usuario:", usuarioId, usuario.stock);
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
        console.error("Error en listarServiciosActivos:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Listar servicios inactivos o dados de baja
exports.listarServiciosInactivos = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

        // Solo servicios: tienen los campos de servicio y NO los de producto
        const serviciosInactivos = usuario.stock.filter(s =>
            s.estado === "inactivo" &&
            s.tipo === "servicio" &&
            s.descripcion &&
            (s.precioCompra === undefined || s.precioCompra === null) &&
            (s.precioVenta === undefined || s.precioVenta === null) &&
            (s.cantidad === undefined || s.cantidad === null)
        );
        res.json({ servicios: serviciosInactivos });
    } catch (err) {
        console.error("Error en listarServiciosInactivos:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Obtener todos los servicios del usuario
exports.obtenerTodosLosServicios = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

        // Solo servicios: tienen los campos de servicio y NO los de producto
        const servicios = usuario.stock.filter(s =>
            s.tipo === "servicio" &&
            s.descripcion &&
            (s.precioCompra === undefined || s.precioCompra === null) &&
            (s.precioVenta === undefined || s.precioVenta === null) &&
            (s.cantidad === undefined || s.cantidad === null)
        );
        res.json({ servicios });
    } catch (err) {
        console.error("Error en obtenerTodosLosServicios:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

module.exports = {
    agregarServicio: exports.agregarServicio,
    modificarServicio: exports.modificarServicio,
    eliminarServicio: exports.eliminarServicio,
    listarServiciosActivos: exports.listarServiciosActivos,
    listarServiciosInactivos: exports.listarServiciosInactivos,
    activarServicio: exports.activarServicio,
    obtenerTodosLosServicios: exports.obtenerTodosLosServicios
};
