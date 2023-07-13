import { Router } from "express";

export const routerVistas = Router()

routerVistas.get('/', async (req, res, next) => {
    res.render('inicio', {
        cssName: 'inicio',
        pageTitle: 'Inicio',
    });
});