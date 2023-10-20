import fetch from "node-fetch"
import fs from "fs"

export async function validateCmp(req, res) {
    const token = req.body.token;
    const cmpData = req.body.comprobante
    let client_ruc = ''
    const business_id = req.body.business_id
    const business = JSON.parse(fs.readFileSync('./src/db/empresas.json', 'utf8'))
    business.forEach((b) => {
        if (b.id === business_id) {
            client_ruc = b.ruc
        }
    })

    const { numRuc, codComp, numeroSerie, numero, fechaEmision, monto } = cmpData
    let validateOptions
    if (numeroSerie === '0001' || numeroSerie === '0002' || numeroSerie === '0003') {
        validateOptions = {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                numRuc,
                codComp,
                numeroSerie,
                numero,
                fechaEmision,
            })
        };
    } else {
        validateOptions = {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                numRuc,
                codComp,
                numeroSerie,
                numero,
                fechaEmision,
                monto
            })
        };
    }
    try {
        const respuesta = await fetchComprobante(client_ruc, validateOptions)
        res.status(200).json(respuesta);
    } catch (err) {
        console.error(err);
        res.status(504).json({});
    }
};

async function fetchComprobante(businessRuc, validateOptions, intentos = 0) {
    try {
        const response = await fetch(`https://api.sunat.gob.pe/v1/contribuyente/contribuyentes/${businessRuc}/validarcomprobante`, validateOptions);
        if (response.status === 200) {
            const responseData = await response.json();
            if (responseData.success) {
                console.log(JSON.parse(validateOptions.body).numero);
                console.log(responseData);
                if (responseData.data?.estadoCp) {
                    if (responseData.data.estadoRuc && responseData.data.condDomiRuc) {
                        return responseData;
                    } else {
                        if (intentos <= 0) {
                            console.log('INTENTANDO EXTERNAMENTE');
                            const RUC = JSON.parse(validateOptions.body)?.numRuc
                            console.log(RUC);
                            const responseRuc = await fetch(`https://api.perudevs.com/api/v1/ruc?document=${RUC}&key=cGVydWRldnMucHJvZHVjdGlvbi5maXRjb2RlcnMuNjUyZGM4NmIxZTRjZmUyNGY0ZjZjNWNk`)
                            if (response.status === 200) {
                                const responseDataRuc = await responseRuc.json()
                                responseDataRuc.resultado.estado === 'ACTIVO' ? responseData.data.estadoRuc = '00' : responseData.data.estadoRuc = 'F'
                                responseDataRuc.resultado.condicion === 'HABIDO' ? responseData.data.condDomiRuc = '00' : responseData.data.condDomiRuc = 'F'
                            }
                            return responseData;

                        } else {
                            return fetchComprobante(businessRuc, validateOptions, intentos - 1);
                        }

                    }
                } else {
                    return fetchComprobante(businessRuc, validateOptions);
                }
            } else {
                // Manejo de errores si la respuesta no es 200
                throw new Error(`Failed to fetch. Status: ${response.status}`);
            }
        }
    } catch (err) {
        console.error(err);
        throw new Error('Failed to fetch');
    }
}
