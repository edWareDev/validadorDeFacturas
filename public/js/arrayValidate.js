function disableAllCheckbox(boolean) {
    // const allCbxs = document.querySelectorAll('input[type="checkbox"]')
    const allCbxs = document.querySelectorAll('input')
    allCbxs.forEach(cbx => {
        cbx.disabled = boolean
    })
}

let tokenData = '';
let idBusinessSelected = ''

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
    'F': '--'
};
const estadoCondDomiRuc = {
    '00': 'HABIDO',
    '09': 'PENDIENTE',
    '11': 'POR VERIFICAR',
    '12': 'NO HABIDO',
    '20': 'NO HALLADO',
    'F': '--'
}

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

const buttonStartScan = document.querySelector('#startScan')
buttonStartScan.addEventListener('click', () => {
    cantidadSolicitudesResueltas = 0
    const lista = []
    const itemsHTML = []
    const allRegistros = document.querySelector('.tableBody').querySelectorAll('.registro')
    showModals('2')
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

// CODIGO DE FUNCIONAMIENTO EN INDIVIDUAL
async function validateLista(lista, itemsHTML, batchSize = 20) {
    console.time("Tiempo De Procesamiento");

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
            observacionesElements[currentIndex + index].innerText = "En proceso";
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
                observacionesElements[i].innerHTML = `<p title="${itemStatus.message}">${itemStatus.message}</p>`;
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
        // console.log('Haciendo Solicitud');
        updateInformante('+')
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
            // console.log('RESUELTO');
            updateInformante('-')
            return result.data; // Puedes devolver el resultado si lo necesitas en otro lugar
        } else {
            updateInformante('-')
            return {
                estadoCp: 'F',
                estadoRuc: 'F',
                condDomiRuc: 'F',
                observaciones: ['No se obtuvo respuesta de Sunat']
            }
        }
    } catch (error) {
        console.log('error', error);
        updateInformante('-')
        return {
            estadoCp: 'F',
            estadoRuc: 'F',
            condDomiRuc: 'F',
            observaciones: ['No se obtuvo respuesta de Sunat.']
        }
    }
}

let listenerDownloadEnabled = false
function actionsToDoOnFinish() {

    console.timeEnd("Tiempo De Procesamiento");
    disableAllCheckbox(false)
    document.querySelector('#checkFile').style.display = 'flex';
    showModals('1')

    const buttonDownload = document.querySelector("#downloadFile");
    buttonStartScan.classList.remove('disabled');
    buttonStartScan.classList.remove('inv');
    buttonDownload.classList.remove('disabled');
    // alert('Proceso Finalizado')
    ntfProcesoFinalizado()
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

function showModals(state) {
    const validacionIndividual = document.querySelector(".validacionIndividual")
    const informante = document.querySelector('.informante')
    if (state === '0') {
        validacionIndividual.classList.add('inv')
        informante.classList.add('inv')
    } else if (state === '1') {
        validacionIndividual.classList.remove('inv')
        informante.classList.add('inv')
    } else if (state === '2') {
        validacionIndividual.classList.add('inv')
        informante.classList.remove('inv')
    }
}

var cantidadSolicitudesResueltas = 0
const informanteMsg = document.querySelector('.informante .msgContainer .msg')
function updateInformante(tipo) {

    if (tipo === '+') {
        cantidadSolicitudesResueltas++
    } else if (tipo === '-') {
        cantidadSolicitudesResueltas--
    }
    const mensaje = cantidadSolicitudesResueltas === 1 ? 'Espera un poco más por favor. Estoy a la espera de un comprobante.' : `Espera por favor. Estoy esperando el estado de ${cantidadSolicitudesResueltas} comprobantes.`
    informanteMsg.innerText = mensaje
}
function enableIndivudualValidation() {
    const individualButton = document.querySelector('.validacionIndividual .imgContainer')
    const modalValidatiionIndividual = document.querySelector('.modalVI')
    individualButton.addEventListener('click', () => {
        modalValidatiionIndividual.classList.remove('inv')
        individualButton.classList.add('inv')
    })
    const evaluarButton = document.querySelector('.evaluarIV')
    const formIV = document.querySelector('.individualValidation')
    const areaRespuesta = document.querySelector('.resultIndividualValidation')
    const loaderRespuesta = document.querySelector('.resultIndividualValidation .loader')
    const estadoComprobante = document.querySelector('.estadoComprobante')
    const estadoRuc = document.querySelector('.estadoRuc')
    const estadoDomicilioRuc = document.querySelector('.estadoDomicilioRuc')
    const observaciones = document.querySelector('.observaciones')
    evaluarButton.addEventListener('click', async (e) => {
        e.preventDefault()
        evaluarButton.classList.add('inv')
        areaRespuesta.classList.remove('inv')
        loaderRespuesta.classList.remove('inv')
        const datosFormulario = new FormData(formIV)
        const datosCliente = {
            numRuc: datosFormulario.get('rucEmisor'),
            fechaEmision: datosFormulario.get('fechaEmision'),
            codComp: datosFormulario.get('codigoComprobante'),
            numeroSerie: datosFormulario.get('numeroSerie'),
            numero: datosFormulario.get('numeroComprobante'),
            monto: datosFormulario.get('montoTotal')
        }
        datosCliente.fechaEmision = datosCliente.fechaEmision.split('-').reverse().join('/');
        const respuesta = await validateComprobante(tokenData.access_token, datosCliente, idBusinessSelected);
        evaluarButton.classList.remove('inv')
        loaderRespuesta.classList.add('inv')
        if (respuesta) {
            estadoComprobante.innerHTML = `Estado Comprobante: <span>${estadoCpMapping[respuesta.estadoCp]}</span>`
            estadoRuc.innerHTML = `Estado RUC: <span>${estadoRucMapping[respuesta.estadoRuc]}</span>`
            estadoDomicilioRuc.innerHTML = `Estado Domicilio: <span>${estadoCondDomiRuc[respuesta.condDomiRuc]}</span>`
            const strObservaciones = observaciones.length > 0 ? observaciones.join(',') : 'Sin Observaciones'
            observaciones.innerHTML = `Observaciones: <span>${strObservaciones}</span>`
        } else {
            areaRespuesta.innerText = 'ERROR'
        }
    })
    const closeButton = document.querySelector('.closeButton')
    closeButton.addEventListener('click', () => {
        modalValidatiionIndividual.classList.add('inv')
        individualButton.classList.remove('inv')
        areaRespuesta.classList.add('inv')
    })
}
enableIndivudualValidation()