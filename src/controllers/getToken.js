import fetch from "node-fetch"
import fs from "fs"


export async function getToken(req, res) {
    console.log('Generando Token');
    const business_id = req.body.business_id
    const business = JSON.parse(fs.readFileSync('./src/db/empresas.json', 'utf8'))
    let client_id = '';
    let client_secret = '';
    let client_name = ''
    business.forEach((b) => {
        if (b.id === business_id) {
            client_id = b.client_id
            client_secret = b.client_secret
            client_name = b.name
        }
    })


    const tokenOptions = {
        method: 'POST',
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            scope: 'https://api.sunat.gob.pe/v1/contribuyente/contribuyentes',
            client_id: client_id,
            client_secret: client_secret
        })
    };

    try {
        const tokenResponse = await fetch(`https://api-seguridad.sunat.gob.pe/v1/clientesextranet/${client_id}/oauth2/token/`, tokenOptions);
        const tokenData = await tokenResponse.json();
        console.log('Token Generado para: ' + client_name);
        res.status(200).json(tokenData);
    } catch (err) {
        console.error(err);
        res.status(504).json();
    }

};