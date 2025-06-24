const express = require('express');

const { check } = require('express-validator');

const { loginUsuario } = require('../controllers/auth');
const { validarCampos } = require('../midelwares/validarCampos');
const { crearUsuario } = require('../controllers/auth');

const routerAuth = express.Router();


//para logear usuario
routerAuth.post('/login',
    [
        check("emailOrUsername", "El email o nombre de usuario es obligatorio").not().isEmpty(),
        check("password", "La contraseña es obligatoria").not().isEmpty(),
        validarCampos
    ],
    loginUsuario
);

routerAuth.post('/new-user',
    [
        check("emailOrUsername", "El email o nombre de usuario es obligatorio").not().isEmpty(),
        check("password", "La contraseña es obligatoria").not().isEmpty(),
        validarCampos
    ],
    crearUsuario
);


module.exports = routerAuth;