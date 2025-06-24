const { model, Schema } = require('mongoose');

const userSchema = new Schema({
    // === Datos Básicos ===
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

   
    // === Contacto ===
    email: {
        type: String,
        required: true,
        unique: true
    },


    // === Datos Laborales ===
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


    // === Autenticación ===
    userName: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    // === Roles y Jerarquía ===
    rol: {
        type: String,
        enum: ["creador", "usuario" ],
        default: "usuario"
    },


}, { timestamps: true });//lo dejamos por si hay consultas de fecha de creacion o fechas de actualizacion con (createdAt,updatedAt)

module.exports = model("Usuario", userSchema);