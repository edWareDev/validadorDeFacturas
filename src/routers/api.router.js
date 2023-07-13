import { Router } from "express";
import { getToken } from "../controllers/getToken.js";
import { validateCmp } from "../controllers/validateCmp.js";

export const routerApi = Router();

routerApi.get('/getToken', getToken)
routerApi.post('/validateCmp', validateCmp);