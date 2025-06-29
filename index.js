const express = require('express');
require('dotenv').config()
const cors= require("cors");
const { dbConeccion } = require('./dataBase/config');
const app= express();


//llamar al servidor
app.listen(process.env.PORT, ()=>{
    console.log(`server corriendo en ${process.env.PORT}`)
})

//base de datos
dbConeccion();

//cors
app.use(cors());

//directorio publico
app.use(express.static('public'));

//lectura y parseo del body
app.use(express.json());

//midelwars son procesos que se van a correr durante la ejecucion
app.use("/auth",require('./rutes/auth'))

//para el admin
app.use("/admin",require('./rutes/admin'))

//para productos
app.use('/producto', require('./rutes/producto'));

//para los servicios
app.use('/servicio', require('./rutes/servicio'));

//para las ventas
app.use('/venta', require('./rutes/venta'));

//para aplicar mercadopago
//app.use("/rend",require('./rutes/rendiciones'))

//para los cobros
//app.use("/cobro",require('./rutes/regCobranza'))

//para las notificaciones
//app.use("/notifi",require('./rutes/noti'))

//para las notificaciones
//app.use("/inventario",require('./rutes/inventario'))

//app.listen(process.env.PORT),()=>{
  //  console.log('server corriendo en puerto 4k');
//};

if (process.env.CREAR_USUARIO_EJEMPLO === "true") {
    const crearUsuarioEjemplo = require('./scripts/crearUsuarioEjemplo');
    crearUsuarioEjemplo.crearUsuarioEjemplo && crearUsuarioEjemplo.crearUsuarioEjemplo();
}