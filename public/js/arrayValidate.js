const buttonStartScan = document.querySelector('#startScan')
buttonStartScan.addEventListener('click', () => {
    const lista = []
    const itemsHTML = []
    const allRegistros = document.querySelector('.tableBody').querySelectorAll('.registro')
    allRegistros.forEach(itemRegistro => {
        if (itemRegistro.querySelector('#regCheckbox').checked === true) {
            const newObjectRegister =
            {
                numRuc: itemRegistro.querySelector('.RUC').innerText,
                codComp: itemRegistro.querySelector('.codigoComprobante').innerText,
                numeroSerie: itemRegistro.querySelector('.numeroSerie').innerText,
                numero: itemRegistro.querySelector('.numeroComprobante').innerText,
                fechaEmision: itemRegistro.querySelector('.fechaComprobante').innerText,
                monto: itemRegistro.querySelector('.montoTotal').innerText
            }
            lista.push(newObjectRegister)
            itemsHTML.push(itemRegistro)
        }
    })

    if (lista.length > 0) {
        document.querySelector('.currentPos').style.width = '0%'
        document.querySelector('#current').innerHTML = 0
        document.querySelector('#separator').innerHTML = '/'
        document.querySelector('#totalSelected').innerHTML = lista.length
        disableAllCheckbox(true)
        validateLista(lista, itemsHTML, document.querySelector('#turbo').checked, Number(document.querySelector('#turboPower').value))
        buttonStartScan.classList.add('disabled');
        buttonStartScan.classList.add('inv');
        document.querySelector('#checkFile').style.display = 'none';
        // document.querySelector('.buttonFile').style.display = 'none';
    }
})

function disableAllCheckbox(boolean) {
    // const allCbxs = document.querySelectorAll('input[type="checkbox"]')
    const allCbxs = document.querySelectorAll('input')
    allCbxs.forEach(cbx => {
        cbx.disabled = boolean
    })
}

const credencialesEmpresas = {
    sate: {
        client_id: 'cbeebb7e-79a9-4d1d-b2eb-9e087cb3a70d',
        client_secret: 'MKdoAjoyeNVJdEFXT22rlA==',
        name: 'SATELITAL TELECOMUNICACIONES'
    },
    gf: {
        client_id: '9249c845-f8fd-4220-a390-78cf2c05cbc1',
        client_secret: 'tkiMf9gM6H/2I/aYk8FTMA==',
        name: 'GLOBAL FIBER PERU'
    },
    oye: {
        client_id: 'cc981d4c-cd89-4b4f-acc3-979eb5d03dd2',
        client_secret: '0/R/DF/rFsjAUYfuFrX04A==',
        name: 'INVERSIONES O & E'
    },
    cyg: {
        client_id: '15c21086-68ab-40a6-b5a3-a085c57d7298',
        client_secret: 'Y8yLmsbn4sOCSZGAoZlCLQ==',
        name: 'OPERACIONES C & G'
    },
    syr: {
        client_id: 'e0b657ea-0920-4689-ad74-058b76c5fa1e',
        client_secret: 'YrgozGqYcKbzMXgdtm6OjQ==',
        name: 'INVERSIONES Y OPERACIONES S & R'
    },
    myr: {
        client_id: '3fd1323d-d31d-4f88-8c1e-b0257c3ddac3',
        client_secret: '0gKwKe3aIZ1h5U1FQR9YpQ==',
        name: 'OPERACIONES M & R'
    },
    foa: {
        client_id: 'f62e9e01-9785-4aa1-b777-cc374c5a61ba',
        client_secret: '+QmKau6xgyZ0Vz0/2EE/zw==',
        name: 'FIBRA ÓPTICA AMAZONICA DEL PERU'
    },
    contelco: {
        client_id: '02e70c2b-eb6c-4e40-8eaf-97ce0f1d3563',
        client_secret: 'HkV9dZD4F+KJppclEhhrzg==',
        name: 'CONTRATISTAS Y CONSULTORES TELCO S.A.C. - CONTELCO S.A.C.'
    }
}

let tokenData = '';
const areaInicio = document.querySelector('.inicio')
const buttonSetBusiness = document.querySelector('#setBusiness')
buttonSetBusiness.addEventListener('click', async (e) => {
    e.preventDefault()
    const businessSelected = document.querySelector('#business')
    areaInicio.classList.add('inv')
    const credenciales = credencialesEmpresas[businessSelected.value]
    document.querySelector('h1').innerText = credenciales.name
    tokenData = await getToken(credenciales.client_id, credenciales.client_secret);
})

// CODIGO DE FUNCIONAMIENTO EN INDIVIDUAL
async function validateLista(lista, itemsHTML, turbo, batchSize = 50) {
    console.time("Tiempo De Procesamiento");
    const estadoCpMapping = {
        '0': 'NO EXISTE',
        '1': 'ACEPTADO',
        '2': 'ANULADO',
        '3': 'AUTORIZADO',
        '4': 'NO AUTORIZADO',
        'F': 'ERROR'
    };
    const estadoRucMapping = {
        '00': 'ACTIVO',
        '01': 'BAJA PROVISIONAL',
        '02': 'BAJA PROVISIONAL POR OFICIO',
        '03': 'SUSPENSIÓN TEMPORAL',
        '10': 'BAJA DEFINITIVA',
        '11': 'BAJA DE OFICIO',
        '22': 'INHABILITADO-VENT.UNICA',
        'F': 'ERROR'
    };
    const estadoCondDomiRuc = {
        '00': 'HABIDO',
        '09': 'PENDIENTE',
        '11': 'POR VERIFICAR',
        '12': 'NO HABIDO',
        '20': 'NO HALLADO',
        'F': 'ERROR'
    }

    if (!turbo) {
        for (let index = 0; index < lista.length; index++) {
            const item = lista[index];
            itemsHTML[index].querySelector('.estadoCp').innerText = "En proceso";
            itemsHTML[index].querySelector('.estadoRuc').innerText = "En proceso";
            itemsHTML[index].querySelector('.estadoCondDomiRuc').innerText = "En proceso";
            itemsHTML[index].querySelector('.resultado').innerText = "En proceso";
            document.querySelector('#current').innerHTML = index + 1;

            // item.status = await runValidation(tokenData.access_token, item);
            item.status = await validateComprobante(tokenData.access_token, item);

            const currenPercent = ((100 / lista.length) * (index + 1)) + '%';
            document.querySelector('.currentPos').style.width = currenPercent;

            if (item.status?.success === false) {
                itemsHTML[index].querySelector('.estadoCp').innerText = item.status.message;
                itemsHTML[index].querySelector('.estadoRuc').innerText = '';
                itemsHTML[index].querySelector('.estadoCondDomiRuc').innerText = '';
                itemsHTML[index].querySelector('.observaciones').innerHTML = '';
                itemsHTML[index].querySelector('.resultado').innerText = "Procesado";

            } else if (item.status?.estadoCp) {
                if (item.status?.estadoCP === '0') {
                    itemsHTML[index].querySelector('.estadoCp').innerText = estadoCpMapping[item.status.estadoCp];
                    itemsHTML[index].querySelector('.estadoRuc').innerText = estadoRucMapping[item.status.estadoRuc] || '';
                    itemsHTML[index].querySelector('.estadoCondDomiRuc').innerText = estadoCondDomiRuc[item.status.condDomiRuc] || '';
                    itemsHTML[index].querySelector('.observaciones').innerHTML = `<p title="${item.status.observaciones || 'Sin Observaciones'}">${item.status.observaciones || 'Sin Observaciones'}</p>`;
                    itemsHTML[index].querySelector('.resultado').innerText = "Procesado";

                } else {
                    if (!item.status?.estadoRuc || !item.status.condDomiRuc) {
                        index--
                    } else {
                        itemsHTML[index].querySelector('.estadoCp').innerText = estadoCpMapping[item.status.estadoCp];
                        itemsHTML[index].querySelector('.estadoRuc').innerText = estadoRucMapping[item.status.estadoRuc] || '';
                        itemsHTML[index].querySelector('.estadoCondDomiRuc').innerText = estadoCondDomiRuc[item.status.condDomiRuc] || '';
                        itemsHTML[index].querySelector('.observaciones').innerHTML = `<p title="${item.status.observaciones || 'Sin Observaciones'}">${item.status.observaciones || 'Sin Observaciones'}</p>`;
                        itemsHTML[index].querySelector('.resultado').innerText = "Procesado";

                    }
                }
            } else if (!item.status.estadoCp) {
                index--
            }
        }
        createXLSFile(itemsHTML)
    } else if (turbo) {
        const totalItems = lista.length;
        const estadoCpElements = [];
        const estadoRUCElements = [];
        const estadoDomElements = [];
        const resultadoElements = [];
        const observacionesElements = [];
        const currentPosElement = document.querySelector('.currentPos');
        const currentElement = document.querySelector('#current');

        let currentIndex = 0;

        async function processBatch() {
            const endIndex = Math.min(currentIndex + batchSize, totalItems);
            const batch = lista.slice(currentIndex, endIndex);
            const itemPromises = batch.map(async (item, index) => {
                estadoCpElements[currentIndex + index] = itemsHTML[currentIndex + index].querySelector('.estadoCp');
                estadoRUCElements[currentIndex + index] = itemsHTML[currentIndex + index].querySelector('.estadoRuc');
                estadoDomElements[currentIndex + index] = itemsHTML[currentIndex + index].querySelector('.estadoCondDomiRuc');
                resultadoElements[currentIndex + index] = itemsHTML[currentIndex + index].querySelector('.resultado');
                observacionesElements[currentIndex + index] = itemsHTML[currentIndex + index].querySelector('.observaciones');
                estadoCpElements[currentIndex + index].innerText = "En proceso";
                estadoRUCElements[currentIndex + index].innerText = "En proceso";
                estadoDomElements[currentIndex + index].innerText = "En proceso";
                resultadoElements[currentIndex + index].innerText = "En proceso";
                currentElement.innerHTML = currentIndex + index + 1;

                item.status = await validateComprobante(tokenData.access_token, item);
                return item.status;
            });

            await Promise.all(itemPromises);

            for (let i = currentIndex; i < endIndex; i++) {
                const item = lista[i];
                const itemStatus = await item.status;
                const currentPercent = ((100 / totalItems) * (i + 1)).toFixed(2) + "%";
                currentPosElement.style.width = currentPercent;

                if (itemStatus.success === false) {
                    estadoCpElements[i].innerText = itemStatus.message;
                } else if (itemStatus?.estadoCp) {
                    estadoCpElements[i].innerText = estadoCpMapping[itemStatus.estadoCp];
                    estadoRUCElements[i].innerText = estadoRucMapping[itemStatus.estadoRuc] || '';
                    estadoDomElements[i].innerText = estadoCondDomiRuc[itemStatus.condDomiRuc] || '';
                    const observaciones = itemStatus?.observaciones?.length > 0 ? itemStatus.observaciones.join('/') : 'Sin observaciones';
                    observacionesElements[i].innerHTML = `<p title="${observaciones}">${observaciones}</p>`;
                } else if (!itemStatus.estadoCp) {
                    i--;
                }

                resultadoElements[i].innerText = "Procesado";
            }

            currentIndex += batchSize;

            if (currentIndex < totalItems) {
                setTimeout(processBatch, 500); //Espera de 1 segundo entre lotes
            } else {
                createXLSFile(itemsHTML)
            }
        }

        await processBatch();
    }
    return lista;
}

async function getToken(clientId, clientSecret) {
    try {
        const response = await fetch("/api/getToken", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "client_id": clientId,
                "client_secret": clientSecret
            }),
            redirect: 'follow'
        });

        if (response.ok) {
            const result = await response.json();
            console.log(result);
            return result; // Puedes devolver el resultado si lo necesitas en otro lugar
        } else {
            throw new Error('Error en la solicitud HTTP');
        }
    } catch (error) {
        console.log('error', error);
        throw error; // Puedes lanzar el error si necesitas manejarlo en otro lugar
    }
}

async function validateComprobante(token, datosFactura) {
    try {
        console.log('Haciendo Solicitud');
        const response = await fetch("/api/validateCmp", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "token": `${token}`,
                "comprobante": datosFactura
            }),
            redirect: 'follow'
        });
        if (response.ok) {
            const result = await response.json();
            console.log('RESUELTO');
            return result.data; // Puedes devolver el resultado si lo necesitas en otro lugar
        } else {
            return {
                estadoCp: 'F',
                estadoRuc: 'F',
                conDomiRuc: 'F'
            }
        }
    } catch (error) {
        console.log('error', error);
        return {
            estadoCp: 'F',
            estadoRuc: 'F',
            conDomiRuc: 'F'
        }
    }
}


function createXLSFile(itemsHTML) {
    console.timeEnd("Tiempo De Procesamiento");
    alert('Proceso Finalizado')
    const buttonDownload = document.querySelector("#downloadFile")
    buttonDownload.classList.remove('disabled');
    buttonDownload.addEventListener('click', () => {
        const newXlsObject = []
        itemsHTML.forEach(itemRegistro => {
            const newObjectRegister =
            {
                "Fecha Comprobante": itemRegistro.querySelector('.fechaComprobante').innerText,
                "Código de Comprobante": itemRegistro.querySelector('.codigoComprobante').innerText,
                "Número de Serie": itemRegistro.querySelector('.numeroSerie').innerText,
                "Número de Comprobante": itemRegistro.querySelector('.numeroComprobante').innerText,
                "RUC": itemRegistro.querySelector('.RUC').innerText,
                "Total": itemRegistro.querySelector('.montoTotal').innerText,
                "Estado Comprobante": itemRegistro.querySelector('.estadoCp').innerText,
                "Estado del Contribuyente": itemRegistro.querySelector('.estadoRuc').innerText,
                "Condición del Domicilio": itemRegistro.querySelector('.estadoCondDomiRuc').innerText,
                "Resultado": itemRegistro.querySelector('.resultado').innerText,
                "Observaciones": itemRegistro.querySelector('.observaciones').innerText
            }
            newXlsObject.push(newObjectRegister)
        })

        // Crear un libro de Excel
        const workbook = XLSX.utils.book_new();
        // Crear una hoja de cálculo
        const worksheet = XLSX.utils.json_to_sheet(newXlsObject);
        // Agregar la hoja de cálculo al libro de Excel
        XLSX.utils.book_append_sheet(workbook, worksheet, "Consultas");
        // Guardar el libro de Excel como archivo
        XLSX.writeFile(workbook, +new Date() + ".xlsx");
    })
}