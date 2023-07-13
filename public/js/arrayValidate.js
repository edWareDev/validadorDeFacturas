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
        document.querySelector('#checkFile').style.display = 'none';
        document.querySelector('.buttonFile').style.display = 'none';
    }
})

function disableAllCheckbox(boolean) {
    // const allCbxs = document.querySelectorAll('input[type="checkbox"]')
    const allCbxs = document.querySelectorAll('input')
    allCbxs.forEach(cbx => {
        cbx.disabled = boolean
    })
}

const tokenData = await getToken();
// CODIGO DE FUNCIONAMIENTO EN INDIVIDUAL
async function validateLista(lista, itemsHTML, turbo, batchSize = 50) {
    console.time("Tiempo De Procesamiento");
    const estadoCpMapping = {
        '0': 'NO EXISTE',
        '1': 'ACEPTADO',
        '2': 'ANULADO',
        '3': 'AUTORIZADO',
        '4': 'NO AUTORIZADO'
    };

    if (!turbo) {
        for (let index = 0; index < lista.length; index++) {
            const item = lista[index];
            itemsHTML[index].querySelector('.estado').innerText = "En proceso";
            itemsHTML[index].querySelector('.resultado').innerText = "En proceso";
            document.querySelector('#current').innerHTML = index + 1;

            item.status = await runValidation(tokenData.access_token, item);
            console.log(item);
            const currenPercent = ((100 / lista.length) * (index + 1)) + '%';
            document.querySelector('.currentPos').style.width = currenPercent;

            if (item.status?.success === false) {
                itemsHTML[index].querySelector('.estado').innerText = item.status.message;
            } else if (item.status?.estadoCp) {
                itemsHTML[index].querySelector('.estado').innerText = estadoCpMapping[item.status.estadoCp];
                itemsHTML[index].querySelector('.observaciones').innerHTML = `<p title="${item.status.observaciones || 'Sin Observaciones'}">${item.status.observaciones || 'Sin Observaciones'}</p>`;
            } else if (!item.status.estadoCp) {
                index--
            }
            itemsHTML[index].querySelector('.resultado').innerText = "Procesado";
        }
        createXLSFile(itemsHTML)
    } else if (turbo) {
        const totalItems = lista.length;
        const estadoElements = [];
        const resultadoElements = [];
        const observacionesElements = [];
        const currentPosElement = document.querySelector('.currentPos');
        const currentElement = document.querySelector('#current');

        let currentIndex = 0;

        async function processBatch() {
            const endIndex = Math.min(currentIndex + batchSize, totalItems);
            const batch = lista.slice(currentIndex, endIndex);
            const itemPromises = batch.map(async (item, index) => {
                estadoElements[currentIndex + index] = itemsHTML[currentIndex + index].querySelector('.estado');
                resultadoElements[currentIndex + index] = itemsHTML[currentIndex + index].querySelector('.resultado');
                observacionesElements[currentIndex + index] = itemsHTML[currentIndex + index].querySelector('.observaciones');
                estadoElements[currentIndex + index].innerText = "En proceso";
                resultadoElements[currentIndex + index].innerText = "En proceso";
                currentElement.innerHTML = currentIndex + index + 1;

                item.status = await runValidation(tokenData.access_token, item);
                return item.status;
            });

            await Promise.all(itemPromises);

            for (let i = currentIndex; i < endIndex; i++) {
                const item = lista[i];
                const itemStatus = await item.status;
                const currentPercent = ((100 / totalItems) * (i + 1)).toFixed(2) + "%";
                currentPosElement.style.width = currentPercent;

                if (itemStatus.success === false) {
                    estadoElements[i].innerText = itemStatus.message;
                } else if (itemStatus?.estadoCp) {
                    estadoElements[i].innerText = estadoCpMapping[itemStatus.estadoCp];
                    const observaciones = itemStatus.observaciones || 'Sin Observaciones';
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

async function getToken() {
    try {
        const response = await fetch("/api/getToken", {
            method: 'GET',
            redirect: 'follow'
        });

        if (response.ok) {
            const result = await response.json();
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
            return result; // Puedes devolver el resultado si lo necesitas en otro lugar
        } else {
            throw new Error('Error en la solicitud HTTP');
        }
    } catch (error) {
        console.log('error', error);
        throw error; // Puedes lanzar el error si necesitas manejarlo en otro lugar
    }
}

const runValidation = async (token, datosFactura) => {
    const respuestaDeConsultaComprobante = await validateComprobante(token, datosFactura);
    if (respuestaDeConsultaComprobante.success === false) {
        return respuestaDeConsultaComprobante;
    } else {
        const estadoCp = respuestaDeConsultaComprobante.data.estadoCp
        if (!estadoCp) {
            return runValidation(token, datosFactura); // Llamada recursiva hasta obtener un estado válido
        } else {
            return respuestaDeConsultaComprobante.data;
        }
    }
};

function createXLSFile(itemsHTML) {
    console.timeEnd("Tiempo De Procesamiento");
    const buttonDownload = document.querySelector("#downloadFile")
    buttonDownload.classList.remove('disabled');
    buttonDownload.addEventListener('click', () => {
        // console.log(itemsHTML);
        const newXlsObject = []
        itemsHTML.forEach(itemRegistro => {
            const newObjectRegister =
            {
                "Fecha Comprobante": itemRegistro.querySelector('.fechaComprobante').innerText,
                "Código de Comprobante": itemRegistro.querySelector('.codigoComprobante').innerText,
                "Número de Serie": itemRegistro.querySelector('.numeroSerie').innerText,
                "Número de Comprobante": itemRegistro.querySelector('.numeroComprobante').innerText,
                "RUC": itemRegistro.querySelector('.RUC').innerText,
                "Nombre de Empresa": itemRegistro.querySelector('.nombreEmpresa').innerText,
                "SubTotal": itemRegistro.querySelector('.montoSubTotal').innerText,
                "Exonerado": itemRegistro.querySelector('.montoExonerado').innerText,
                "Inafecto": itemRegistro.querySelector('.montoInafecto').innerText,
                "Total": itemRegistro.querySelector('.montoTotal').innerText,
                "Auto. Imprenta": itemRegistro.querySelector('.autorizacionImprenta').innerText,
                "Estado": itemRegistro.querySelector('.estado').innerText,
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