import fetch from "node-fetch"

export async function validateCmp(req, res) {
    const token = req.body.token;
    const cmpData = req.body.comprobante
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
        const respuesta = await fetchComprobante('20518777646', validateOptions, numero)
        res.status(200).json(respuesta);
    } catch (err) {
        console.error(err);
        res.status(504).json({});
    }
};

async function fetchComprobante(businessRuc, validateOptions) {
    try {

        const response = await fetch(`https://api.sunat.gob.pe/v1/contribuyente/contribuyentes/${businessRuc}/validarcomprobante`, validateOptions);
        if (response.status === 200) {
            const responseData = await response.json();
            if (responseData.success) {
                if (responseData.data?.estadoCp) {
                    if (responseData.data.estadoRuc && responseData.data.condDomiRuc) {
                        return responseData;
                    } else {
                        console.log('INTENTAR EXTERNAMENTE');
                        const RUC = JSON.parse(validateOptions.body)?.numRuc
                        console.log(RUC);
                        const responseRuc = await fetch(`https://api.perudevs.com/api/v1/ruc?document=${RUC}&key=cGVydWRldnMucHJvZHVjdGlvbi5maXRjb2RlcnMuNjUyZGM4NmIxZTRjZmUyNGY0ZjZjNWNk`)
                        if (response.status === 200) {
                            const responseDataRuc = await responseRuc.json()
                            responseDataRuc.resultado.estado === 'ACTIVO' ? responseDataRuc.resultado.estado = '00' : responseDataRuc.resultado.estado = 'F'
                            responseData.data.estadoRuc = responseDataRuc.resultado.estado
                            responseDataRuc.resultado.condicion === 'HABIDO' ? responseDataRuc.resultado.condicion = '00' : responseDataRuc.resultado.condicion = 'F'
                            responseData.data.condDomiRuc = responseDataRuc.resultado.condicion
                            return responseData;
                        } else {
                            return fetchComprobante(businessRuc, validateOptions);
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
