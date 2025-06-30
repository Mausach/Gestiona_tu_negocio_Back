const Usuario = require("../models/Usuario");


const obtenerUsuarios = async (req, res) => {
    try {
        // 1. Buscar usuarios filtrando por rol != "creador"
        const usuarios = await Usuario.find(
            { rol: { $ne: "creador" } },  // $ne = not equal
            { password: 0 }  // Excluir el campo password de los resultados
        ).lean();  // Convertir a objetos JS simples

        // 2. Si no hay usuarios, retornar mensaje
        if (usuarios.length === 0) {
            return res.status(200).json({ mensaje: "No hay usuarios registrados." });
        }

        // 3. Retornar los usuarios encontrados
          res.status(200).json({
            ok: true,
            usuarios:usuarios,
            message: "Usuarios cargados",
        });

    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
};

//cambiar estado de usuario
const CambiarEstadoUsuario = async (req, res) => {
    try {
        // 1. Buscar usuario por ID
        const usuario = await Usuario.findById(req.body._id); // Soporta ambos formatos

        // 2. Verificar existencia
        if (!usuario) {
            return res.status(404).json({
                ok: false,
                message: 'No existe ningún usuario con este ID',
            });
        }

       // 3. Alternar estado (true → false, false → true)
       usuario.estado = !usuario.estado;

       // 4. Guardar cambios
       await usuario.save();

       // 5. Respuesta con nuevo estado
       res.status(200).json({
           ok: true,
           msg: usuario.estado 
               ? 'Usuario habilitado correctamente' 
               : 'Usuario deshabilitado correctamente',
           usuario: {
               _id: usuario._id,
               nombre: usuario.nombre,
               estado: usuario.estado
           }
       });


    } catch (error) {
        console.error('Error al deshabilitar usuario:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno. Por favor contacte al administrador',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Modifica datos personales del usuario empleado
const actualizarUsuario = async (req, res) => {
    const { _id } = req.body; // Obtener el ID del cuerpo de la solicitud
    
    try {
        // 1. Verificar existencia
        const usuario = await Usuario.findById(_id);
        if (!usuario) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }

        // 2. Extraer campos editables
        const { nombre, apellido, email, password, } = req.body;

        const updates = { 
            nombre, apellido, email, 
        };

        // 3. Solo incluir password si se proporciona
        if (password) {
            const salt = bcryptjs.genSaltSync(10);
            updates.password = bcryptjs.hashSync(password, salt);
        }

        // 4. Validar unicidad solo si cambian email/dni
        if (updates.email && updates.email !== usuario.email) {
            const existe = await usuario.findOne({ email: updates.email, _id: { $ne: _id } });
            if (existe) return res.status(400).json({ ok: false, msg: "Email ya en uso" });
        }
        

        // 6. Actualizar usuario
        const usuarioActualizado = await Usuario.findByIdAndUpdate(_id, updates, { 
            new: true,
            select: '-password -__v' // Excluir campos sensibles
        });

        res.json({
            ok: true,
            message: 'Usuario actualizado correctamente',
            usuario: usuarioActualizado,
            camposActualizados: Object.keys(updates)
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            ok: false, 
            msg: "Error interno del servidor",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { 
    obtenerUsuarios,
    CambiarEstadoUsuario,
    actualizarUsuario
 };