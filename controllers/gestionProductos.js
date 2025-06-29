const Usuario = require('../models/Usuario');
const mongoose = require('mongoose');

// Obtener usuarioId de diferentes fuentes, siempre verificando que req.body y req.query existen
const getUsuarioId = (req) => {
    // Log para depuración de estructura de req
    if (req.user && req.user.id) return req.user.id;
    if (typeof req.usuarioId === "string") return req.usuarioId;
    if (req.body && typeof req.body.usuarioId === "string") return req.body.usuarioId;
    if (req.query && typeof req.query.usuarioId === "string") return req.query.usuarioId;
    // Si no existe, loguea el req completo para depurar
    console.error("No se encontró usuarioId en req. req.body:", req.body, "req.query:", req.query);
    return undefined;
};

// Alta de producto
exports.agregarProducto = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        console.log("usuarioId recibido (agregarProducto):", usuarioId, typeof usuarioId);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        // Copiamos los datos y agregamos fechaRegistro siempre
        const nuevoProducto = {
            ...req.body,
            fechaRegistro: new Date()
        };

        // Validación básica
        if (!nuevoProducto.nombre || !nuevoProducto.tipo) {
            return res.status(400).json({ error: 'Nombre y tipo son requeridos.' });
        }

        // Verificar que el usuario existe y coincide el id
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
        if (usuario._id.toString() !== usuarioId.toString()) {
            return res.status(403).json({ error: 'No puedes agregar productos a otro usuario.' });
        }

        usuario.stock.push(nuevoProducto);
        await usuario.save();

        res.status(201).json({ mensaje: 'Producto agregado.', producto: usuario.stock[usuario.stock.length - 1] });
    } catch (err) {
        console.error("Error en agregarProducto:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Modificación de producto
exports.modificarProducto = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        const productoId = req.params.productoId;
        console.log("usuarioId recibido (modificarProducto):", usuarioId, typeof usuarioId);
        console.log("productoId recibido (modificarProducto):", productoId, typeof productoId);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        if (!productoId || !mongoose.Types.ObjectId.isValid(productoId)) {
            console.error("productoId inválido:", productoId);
            return res.status(400).json({ error: 'productoId es requerido y debe ser válido.' });
        }

        // Buscar usuario y producto por ID
        const usuario = await Usuario.findOne({ _id: usuarioId, "stock._id": productoId });
        if (!usuario) return res.status(404).json({ error: 'Usuario o producto no encontrado.' });

        const producto = usuario.stock.id(productoId);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });

        // Solo permitir modificar campos de producto
        const camposPermitidos = ["nombre", "precioCompra", "precioVenta", "cantidad", "estado"];
        const datosActualizados = req.body;
        Object.keys(datosActualizados).forEach(key => {
            if (camposPermitidos.includes(key)) {
                producto[key] = datosActualizados[key];
            }
        });

        await usuario.save();
        res.json({ mensaje: 'Producto modificado.', producto });
    } catch (err) {
        console.error("Error en modificarProducto:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Baja de producto (baja lógica)
exports.eliminarProducto = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        const productoId = req.params.productoId;
        console.log("usuarioId recibido (eliminarProducto):", usuarioId, typeof usuarioId);
        console.log("productoId recibido (eliminarProducto):", productoId, typeof productoId);

        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        if (!productoId || !mongoose.Types.ObjectId.isValid(productoId)) {
            console.error("productoId inválido:", productoId);
            return res.status(400).json({ error: 'productoId es requerido y debe ser válido.' });
        }

        // Buscar usuario y producto por ID
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            console.error("Usuario no encontrado:", usuarioId);
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        // Buscar el producto en el stock del usuario
        const producto = usuario.stock.id(productoId);
        if (!producto) {
            console.error("Producto no encontrado en el stock del usuario:", productoId);
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        // Verificar que sea un producto y no un servicio
        if (
            producto.tipo !== "producto" ||
            producto.precioCompra === undefined ||
            producto.precioVenta === undefined ||
            producto.cantidad === undefined ||
            (producto.descripcion && producto.descripcion !== "") ||
            (producto.costo !== undefined && producto.costo !== null)
        ) {
            console.error("Intento de baja de un servicio o producto inválido:", producto);
            return res.status(400).json({ error: 'Solo se pueden dar de baja productos, no servicios.' });
        }

        // Baja lógica: cambiar estado a "inactivo"
        producto.estado = "inactivo";
        await usuario.save();

        res.json({ mensaje: 'Producto dado de baja (lógica).', producto });
    } catch (err) {
        console.error("Error en eliminarProducto:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Activar producto inactivo
exports.activarProducto = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        const productoId = req.params.productoId;
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        if (!productoId || !mongoose.Types.ObjectId.isValid(productoId)) {
            return res.status(400).json({ error: 'productoId es requerido y debe ser válido.' });
        }

        const usuario = await Usuario.findOne({ _id: usuarioId, "stock._id": productoId });
        if (!usuario) return res.status(404).json({ error: 'Usuario o producto no encontrado.' });

        const producto = usuario.stock.id(productoId);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });

        if (producto.estado !== "inactivo") {
            return res.status(400).json({ error: 'El producto no está inactivo.' });
        }
        if (producto.tipo !== "producto") {
            return res.status(400).json({ error: 'Solo se pueden activar productos.' });
        }

        producto.estado = "activo";
        await usuario.save();

        res.json({ mensaje: 'Producto activado.', producto });
    } catch (err) {
        console.error("Error en activarProducto:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Modificar stock de producto agotado y reactivar si corresponde
exports.modificarStockProductoAgotado = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        const productoId = req.params.productoId;
        console.log("usuarioId recibido (modificarStockProductoAgotado):", usuarioId, typeof usuarioId);
        console.log("productoId recibido (modificarStockProductoAgotado):", productoId, typeof productoId);
        console.log("req.body recibido (modificarStockProductoAgotado):", req.body);

        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            console.error("usuarioId inválido:", usuarioId);
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        if (!productoId || !mongoose.Types.ObjectId.isValid(productoId)) {
            console.error("productoId inválido:", productoId);
            return res.status(400).json({ error: 'productoId es requerido y debe ser válido.' });
        }

        const { cantidad } = req.body;
        console.log("cantidad recibido:", cantidad, typeof cantidad);

        if (typeof cantidad !== "number" || isNaN(cantidad) || cantidad < 0) {
            console.error("Cantidad inválida:", cantidad, typeof cantidad);
            return res.status(400).json({ error: 'Cantidad inválida.', detalle: { cantidad, tipo: typeof cantidad } });
        }

        const usuario = await Usuario.findOne({ _id: usuarioId, "stock._id": productoId });
        if (!usuario) {
            console.error("Usuario o producto no encontrado en findOne:", usuarioId, productoId);
            return res.status(404).json({ error: 'Usuario o producto no encontrado.' });
        }

        const producto = usuario.stock.id(productoId);
        if (!producto) {
            console.error("Producto no encontrado en el stock del usuario:", productoId, usuario.stock);
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        // Cambia la condición: permitir modificar si el producto está "agotado" O su cantidad es 0
        if (producto.estado !== "agotado" && producto.cantidad !== 0) {
            console.error("El producto no está agotado ni tiene cantidad 0. Estado actual:", producto.estado, "Cantidad:", producto.cantidad);
            return res.status(400).json({ error: 'El producto no está agotado ni tiene cantidad 0.' });
        }
        if (producto.tipo !== "producto") {
            console.error("El item no es un producto:", producto);
            return res.status(400).json({ error: 'Solo se pueden modificar productos.' });
        }

        producto.cantidad = cantidad;
        if (cantidad > 0) {
            producto.estado = "activo";
        }
        await usuario.save();

        res.json({ mensaje: 'Stock modificado.', producto });
    } catch (err) {
        console.error("Error en modificarStockProductoAgotado:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Listar productos activos
exports.listarProductosActivos = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        console.log("usuarioId recibido (listarProductosActivos):", usuarioId, typeof usuarioId);
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
        console.error("Error en listarProductosActivos:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Listar productos agotados
exports.listarProductosAgotados = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

        // Solo productos: tienen los campos de producto y NO los de servicio
        const productosAgotados = usuario.stock.filter(p =>
            p.estado === "agotado" &&
            p.tipo === "producto" &&
            p.precioCompra !== undefined &&
            p.precioVenta !== undefined &&
            p.cantidad !== undefined &&
            (!p.descripcion || p.descripcion === "") &&
            (p.costo === undefined || p.costo === null)
        );
        res.json({ productos: productosAgotados });
    } catch (err) {
        console.error("Error en listarProductosAgotados:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

// Obtener todos los productos del usuario
exports.obtenerTodosLosProductos = async (req, res) => {
    try {
        const usuarioId = getUsuarioId(req);
        if (!usuarioId || !mongoose.Types.ObjectId.isValid(usuarioId)) {
            return res.status(400).json({ error: 'usuarioId es requerido y debe ser válido.' });
        }
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

        // Solo productos: tienen los campos de producto y NO los de servicio
        const productos = usuario.stock.filter(p =>
            p.tipo === "producto" &&
            p.precioCompra !== undefined &&
            p.precioVenta !== undefined &&
            p.cantidad !== undefined &&
            (!p.descripcion || p.descripcion === "") &&
            (p.costo === undefined || p.costo === null)
        );
        res.json({ productos });
    } catch (err) {
        console.error("Error en obtenerTodosLosProductos:", err);
        res.status(500).json({ error: "Error interno del servidor", detalle: err.message, stack: err.stack });
    }
};

module.exports = {
    agregarProducto: exports.agregarProducto,
    modificarProducto: exports.modificarProducto,
    eliminarProducto: exports.eliminarProducto,
    listarProductosActivos: exports.listarProductosActivos,
    listarProductosAgotados: exports.listarProductosAgotados,
    activarProducto: exports.activarProducto,
    modificarStockProductoAgotado: exports.modificarStockProductoAgotado,
    obtenerTodosLosProductos: exports.obtenerTodosLosProductos
};

