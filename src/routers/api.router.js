import { Router } from "express";
import { getToken } from "../controllers/getToken.js";
import { validateCmp } from "../controllers/validateCmp.js";
import { getBusiness } from "../controllers/getBusiness.js";

export const routerApi = Router();

routerApi.get('/getBusiness', getBusiness);
routerApi.post('/getToken', getToken)
routerApi.post('/validateCmp', validateCmp);