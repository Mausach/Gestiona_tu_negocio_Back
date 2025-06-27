const { model, Schema } = require('mongoose');

const ventaSchema = new Schema({
    // === Referencia al Usuario y su Stock ===
    usuarioId: {
        type: Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now,
        required: true
    },

    // === Items Vendidos (similar a tu "menu" pero con referencia al stock) ===
    items: [{
        stockId: { // _id del item en el array "stock" del usuario
            type: Schema.Types.ObjectId,
            required: true
        },
        tipo: { // "producto" o "servicio"
            type: String,
            enum: ["producto", "servicio"],
            required: true
        },
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        cantidad: {
            type: Number,
            required: true,
            min: 1
        },
        precioUnitario: { // Precio en el momento de la venta (por si cambia después)
            type: Number,
            required: true,
            min: 0
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],

    // === Totales y Estado ===
    precioTotal: {
        type: Number,
        required: true
    },

    // === Método de Pago (opcional) ===
 

}, { timestamps: true });

module.exports = model("Venta", ventaSchema);