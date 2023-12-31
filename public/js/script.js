const business = document.querySelector('#business')
const loader = document.querySelector('.loader')
const businessSelection = document.querySelector('.businessSelection')
const showAllBusiness = async () => {
    try {
        const response = await fetch("/api/getBusiness", {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        });

        if (response.ok) {
            const result = await response.json();
            let allEmpresasTemplate = ''
            if (result.length > 0) {
                result.forEach((bus) => {
                    allEmpresasTemplate += `<option value="${bus.id}">${bus.name}</option>`
                })
            }
            // console.log(allEmpresasTemplate);
            business.innerHTML = allEmpresasTemplate
            loader.classList.add('inv')
            businessSelection.classList.remove('inv')
        } else {
            throw new Error('Error en la solicitud HTTP');
        }
    } catch (error) {
        console.log('error', error);
        throw error; // Puedes lanzar el error si necesitas manejarlo en otro lugar
    }
}

const buttonLoadFile = document.querySelector('.loadOptions')
const buttonLoadFileHidden = document.querySelector('#excelFileInput')
buttonLoadFile.addEventListener('click', () => {
    document.querySelector('#excelFileInput').click()
})
buttonLoadFileHidden.addEventListener('change', () => {
    document.querySelector('.filename').innerHTML = buttonLoadFileHidden.files[0]?.name
    handleFile()
});

const buttonChangeBusiness = document.querySelector('#changeBusiness')
buttonChangeBusiness.addEventListener('click', () => {
    const cambiarEmpresa = confirm('¿Estás seguro que deseas salir?')

    if (cambiarEmpresa) {
        location.reload()
    }
})

// const checkFile = document.querySelector('#checkFile')
// checkFile.addEventListener('click', () => {
//     handleFile()
// })

showAllBusiness()
