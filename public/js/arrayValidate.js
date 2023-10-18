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
        validateLista(lista, itemsHTML)
        buttonStartScan.classList.add('disabled');
        buttonStartScan.classList.add('inv');
        disableAllCheckbox(true)
        // document.querySelector('#checkFile').style.display = 'none';
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

let tokenData = '';
let idBusinessSelected = ''
const areaInicio = document.querySelector('.inicio')
const buttonSetBusiness = document.querySelector('#setBusiness')
buttonSetBusiness.addEventListener('click', async (e) => {
    const loader = document.querySelector('.loader')
    const businessSelection = document.querySelector('.businessSelection')
    loader.classList.remove('inv')
    businessSelection.classList.add('inv')
    e.preventDefault()
    const businessSelected = document.querySelector('#business')
    // Obtener el valor seleccionado

    // Buscar la opción con el valor seleccionado
    var opciones = businessSelected.options;
    for (var i = 0; i < opciones.length; i++) {
        if (opciones[i].value === businessSelected.value) {
            // Mostrar el nombre de la opción en un elemento HTML
            document.querySelector('h1').innerText = opciones[i].text
            break; // Salir del bucle una vez que se encuentre la opción
        }
    }
    idBusinessSelected = businessSelected.value
    tokenData = await getToken(businessSelected.value);
    if (tokenData) {
        areaInicio.classList.add('inv')
    }
})

// CODIGO DE FUNCIONAMIENTO EN INDIVIDUAL
async function validateLista(lista, itemsHTML, batchSize = 20) {
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
            item.status = await validateComprobante(tokenData.access_token, item, idBusinessSelected);
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
            actionsToDoOnFinish()
        }
    }

    await processBatch();
    return lista;
}

async function getToken(businessId) {
    try {
        const response = await fetch("/api/getToken", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "business_id": businessId,
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
        alert('SUNAT no ha devuelto el token, actualiza la página y vuelve a intentarlo.')
    }
}

async function validateComprobante(token, datosFactura, idBusinessSelected) {
    try {
        console.log('Haciendo Solicitud');
        const response = await fetch("/api/validateCmp", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "token": `${token}`,
                "comprobante": datosFactura,
                "business_id": idBusinessSelected
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

let listenerDownloadEnabled = false
function actionsToDoOnFinish() {

    console.timeEnd("Tiempo De Procesamiento");
    disableAllCheckbox(false)
    document.querySelector('#checkFile').style.display = 'flex';

    const buttonDownload = document.querySelector("#downloadFile");
    buttonStartScan.classList.remove('disabled');
    buttonStartScan.classList.remove('inv');
    buttonDownload.classList.remove('disabled');
    alert('Proceso Finalizado')
    if (!listenerDownloadEnabled) {
        listenerDownloadEnabled = true
        buttonDownload.addEventListener('click', () => {
            createXLSFile()
        })
    }
}


function createXLSFile() {
    const itemsHTML = []
    const allRegistros = document.querySelector('.tableBody').querySelectorAll('.registro')
    allRegistros.forEach(itemRegistro => {
        if (itemRegistro.querySelector('#regCheckbox').checked === true) {
            itemsHTML.push(itemRegistro)
        }
    })

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
    const filename = document.querySelector('.filename')
    XLSX.writeFile(workbook, 'val_' + filename.innerText);
}