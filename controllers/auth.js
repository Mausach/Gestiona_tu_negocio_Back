const bcryptjs = require('bcrypt');
const jwt = require("jsonwebtoken");
const Usuario = require('../models/Usuario');



const loginUsuario = async (req, res) => {
    const { emailOrUsername, password } = req.body; // Cambiamos el nombre del campo

    try {
        // 1. Buscar usuario por email O username
        const user = await Usuario.findOne({
            $or: [
                { email: emailOrUsername },
                { userName: emailOrUsername }
            ]
        });

        if (!user) {
            return res.status(400).json({
                ok: false,
                msg: "Credenciales inválidas" // Mensaje genérico por seguridad
            });
        }

        // 2. Validar contraseña
        const validPassword = bcryptjs.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                ok: false,
                msg: "Credenciales inválidas" // Mismo mensaje para evitar filtraciones
            });
        }

        // 3. Validar estado (ahora es booleano según tu schema)
        if (!user.estado) {
            return res.status(403).json({
                ok: false,
                msg: "Usuario inhabilitado. Contacte al administrador"
            });
        }

        // 4. Generar JWT
        const payload = {
            id: user._id,
            name: user.nombre, // Cambiado de 'name' a 'nombre' (consistente con tu schema)
            rol: user.rol,
        };

        const token = jwt.sign(payload, process.env.SECRET_JWT, {
            expiresIn: "2h",
        });

        // 5. Respuesta exitosa
        res.status(200).json({
            ok: true,
            usuario:user,
            token,
            msg: "Inicio de sesión exitoso",
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            ok: false,
            msg: "Error interno. Contacte al administrador"
        });
    }
};

const crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body;

    // Validación 1: Campos obligatorios
    if (!nombre || !apellido || !email || !userName || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Faltan campos obligatorios: nombre, apellido, email, userName o password.' 
      });
    }

    // Validación 2: Email único
    const existeEmail = await Usuario.findOne({ email });
    if (existeEmail) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado.'
      });
    }

    // Validación 3: userName único
    const existeUserName = await Usuario.findOne({ userName });
    if (existeUserName) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso.'
      });
    }

    // Hash de la contraseña (seguridad)
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Crear el nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email,
      userName,
      password: passwordHash, // Guardamos el hash, no la contraseña en texto plano
      rol: rol || 'usuario' // Si no se especifica, será 'usuario'
    });

    // Guardar en MongoDB
    await nuevoUsuario.save();

    // Respuesta exitosa (sin enviar el password)
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente.',
      usuario: {
        _id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
      error: error.message // Solo para desarrollo, en producción evita enviar detalles del error.
    });
  }
};



module.exports = {
    loginUsuario,
    crearUsuario
   
};