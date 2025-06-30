const jwt = require('jsonwebtoken');

const validarJWTAdmin = (req, res, next) => {
    
    const token = req.header('x-token');

    if (!token) {
        return res.status(401).json({
            ok: false,
            message: 'No hay token en la peticion',
        });
    }

    try {
        const payload = jwt.verify(token, process.env.SECRET_JWT);
        if (payload.rol != "creador") {
            return res.status(404).json({
                ok: false,
                message: 'usted no tiene rol de administrador',
            });
        }

        req.id = payload.id;
        req.name = payload.name;
        req.rol = payload.rol;
    } catch (error) {
        return res.status(401).json({
            ok: false,
            message: 'token no valido',
        });
    }

    next();
};

module.exports = {
    validarJWTAdmin,
};