const express = require('express');

const { check } = require('express-validator');

const { loginUsuario, obtenerVentasPorUsuario } = require('../controllers/auth');
const { validarCampos } = require('../midelwares/validarCampos');
const { crearUsuario } = require('../controllers/auth');
const { validarJWT } = require('../midelwares/validarJWT');

const routerAuth = express.Router();


//para logear usuario
routerAuth.post('/login',
    [
        check("email", "El email o nombre de usuario es obligatorio").not().isEmpty(),
        check("password", "La contraseña es obligatoria").not().isEmpty(),
        validarCampos
    ],
    loginUsuario
);

routerAuth.post('/new-user',
    [
        check("email", "El email o nombre de usuario es obligatorio").not().isEmpty(),
        check("password", "La contraseña es obligatoria").not().isEmpty(),
        validarCampos
    ],
    crearUsuario
);


// Obtener ventas por usuario (GET /api/ventas/usuario/:usuarioId)
routerAuth.get('/usuario/:usuarioId',validarJWT, obtenerVentasPorUsuario);


module.exports = routerAuth;