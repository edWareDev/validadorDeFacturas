import express from "express";
import { PORT } from "../config/server.config.js";
import { engine } from "express-handlebars";
import { routerApi } from "../routers/api.router.js";
import { routerVistas } from "../routers/views.router.js";
import cors from 'cors';
import open from "open";

const app = express();
app.use(cors());
app.engine('handlebars', engine())
app.set('views', './views')
app.set('view engine', 'handlebars')

app.use(express.static('./public'))
app.use(express.json())

app.use('/api', routerApi)
app.use('/', routerVistas)
app.listen(PORT, () => {
    console.log(`Servidor web escuchando en http://127.0.0.1:${PORT}`);
    open(`http://127.0.0.1:${PORT}`);
});
