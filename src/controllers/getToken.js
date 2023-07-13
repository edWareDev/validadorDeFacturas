import fetch from "node-fetch"

export async function getToken(req, res) {
    const tokenOptions = {
        method: 'POST',
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            scope: 'https://api.sunat.gob.pe/v1/contribuyente/contribuyentes',
            client_id: 'c208d046-75f0-4ac5-bee6-b55475ad7247',
            client_secret: 'nWYv9H0PXB2ZgL1UyIcNnw=='
        })
    };

    try {
        const tokenResponse = await fetch('https://api-seguridad.sunat.gob.pe/v1/clientesextranet/c208d046-75f0-4ac5-bee6-b55475ad7247/oauth2/token/', tokenOptions);
        const tokenData = await tokenResponse.json();
        res.status(200).json(tokenData);
    } catch (err) {
        console.error(err);
    }

};