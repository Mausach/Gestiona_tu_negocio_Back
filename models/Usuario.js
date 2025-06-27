const { model, Schema } = require('mongoose');

const userSchema = new Schema({
    // === Datos Básicos (manteniendo tus campos originales) ===
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    fechaIngreso: {
        type: Date,
        default: Date.now
    },
    fechaSalida: {
        type: Date
    },
    estado: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        required: true
    },
    rol: {
        type: String,
        enum: ["creador", "usuario"],
        default: "usuario"
    },

    // === STOCK (reemplazando "inventario") ===
    stock: {
        type: [{
            nombre: {
                type: String,
                required: true,
                trim: true,
                maxlength: 50
            },
            tipo: {
                type: String,
                enum: ["producto", "servicio"],
                required: true
            },
            // Campos para PRODUCTOS
            precioCompra: {
                type: Number,
                min: 0
            },
            precioVenta: {
                type: Number,
                min: 0,
            },
            cantidad: {
                type: Number,
                min: 0,
                default: 0
            },
            // Campos para SERVICIOS
            descripcion: {
                type: String,
                trim: true
            },
            costo: {
                type: Number,
                min: 0
            },
            // Campos comunes (opcionales)
            estado: {
                type: String,
                enum: ["activo", "inactivo", "agotado"],
                default: "activo"
            },
            fechaRegistro: {
                type: Date,
                default: Date.now
            }
        }],
        default: [] // Inicializar como array vacío
    }

}, { timestamps: true });

module.exports = model("Usuario", userSchema);