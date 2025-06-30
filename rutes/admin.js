const express = require('express');
const { crearProducto, editarProducto, eliminarProducto, cargarProducto, cargarUsuarios, cargarPedidos, confirmarPedido, inhabilitarUsuario, cargarProducto_Aleatorio, habilitarUsuario, obtenerUsuarios, CambiarEstadoUsuario, actualizarUsuario } = require('../controllers/admin');

const { check } = require('express-validator');

//const { validarJWTAdmin } = require('../Midelwares/validarJwtAdmin');
const { validarCampos } = require('../midelwares/validarCampos');
const { validarJWTAdmin } = require('../midelwares/calidarJWTAdmins');

const routerAdmin = express.Router();

//editar datos del usuario
routerAdmin.put(
  '/update-user',
  validarJWTAdmin,
  [
    check("nombre", "El nombre es obligatorio").optional().not().isEmpty().trim(),
    check("apellido", "El apellido es obligatorio").optional().not().isEmpty().trim(),
    check("email", "El email debe ser válido").optional().isEmail(),
    check("password", "La contraseña debe tener mínimo 5 caracteres").optional().isLength({ min: 8 }),
    validarCampos
  ],
  actualizarUsuario
);

routerAdmin.put('/change-state', validarJWTAdmin, CambiarEstadoUsuario);

routerAdmin.get('/usuarios',validarJWTAdmin, obtenerUsuarios);

module.exports = routerAdmin;