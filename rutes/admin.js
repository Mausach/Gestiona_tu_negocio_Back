const express = require('express');
const { crearProducto, editarProducto, eliminarProducto, cargarProducto, cargarUsuarios, cargarPedidos, confirmarPedido, inhabilitarUsuario, cargarProducto_Aleatorio, habilitarUsuario } = require('../controllers/admin');

const { check } = require('express-validator');

//const { validarJWTAdmin } = require('../Midelwares/validarJwtAdmin');
const { validarCampos } = require('../midelwares/validarCampos');

const routerAdmin = express.Router();

/*
routerAdmin.post( 
  '/new', validarJWTAdmin, [ 

  check("name", "el nombre es obligatorio").not().isEmpty(),
  check("precio", "el precio es obligatorio").not().isEmpty(),
  check("cantidad", "la cantidad es obligatoria").not().isEmpty(),
  check("detalle", "el detalle es obligatorio").not().isEmpty(),
  check("categoria", "la categoria es obligatoria").not().isEmpty(),
  validarCampos,

], crearProducto
);



routerAdmin.put(
  '/edit', validarJWTAdmin, [ 

  check("name", "el nombre es obligatorio").not().isEmpty(),
  check("precio", "el precio es obligatorio").not().isEmpty(),
  check("cantidad", "la cantidad es obligatoria").not().isEmpty(),
  check("detalle", "el detalle es obligatorio").not().isEmpty(),
  check("categoria", "la categoria es obligatoria").not().isEmpty(),
  validarCampos,

], editarProducto
);

routerAdmin.delete('/eliminar/:id', validarJWTAdmin, eliminarProducto);

routerAdmin.get('/productos', cargarProducto);

routerAdmin.get('/productos/aleatorios', cargarProducto_Aleatorio);

routerAdmin.get('/usuarios', validarJWTAdmin, cargarUsuarios);

routerAdmin.get('/pedidos', validarJWTAdmin, cargarPedidos);

routerAdmin.put('/confirmar', validarJWTAdmin, confirmarPedido);

routerAdmin.put('/Deshabilitar', validarJWTAdmin, inhabilitarUsuario);

routerAdmin.put('/Habilitar', validarJWTAdmin, habilitarUsuario);
*/

module.exports = routerAdmin;