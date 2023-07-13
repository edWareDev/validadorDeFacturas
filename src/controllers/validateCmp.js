import fetch from "node-fetch"

export async function validateCmp(req, res) {
    const token = req.body.token;
    const cmpData = req.body.comprobante
    const { numRuc, codComp, numeroSerie, numero, fechaEmision, monto } = cmpData
    let validateOptions
    console.log(numero);
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
        const response = await fetch('https://api.sunat.gob.pe/v1/contribuyente/contribuyentes/20486496372/validarcomprobante', validateOptions);
        const responseData = await response.json();
        console.log(responseData);
        res.status(200).json(responseData);
    } catch (err) {
        console.error(err);
    }

};