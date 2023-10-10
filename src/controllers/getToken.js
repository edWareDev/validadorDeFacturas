import fetch from "node-fetch"

export async function getToken(req, res) {
    const client_id = req.body.client_id;
    const client_secret = req.body.client_secret;
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
        res.status(200).json(tokenData);
    } catch (err) {
        console.error(err);
    }

};