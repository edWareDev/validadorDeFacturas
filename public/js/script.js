const buttonLoadFile = document.querySelector('.buttonFile')
const buttonLoadFileHidden = document.querySelector('#excelFileInput')
buttonLoadFile.addEventListener('click', () => {
    document.querySelector('#excelFileInput').click()
    buttonLoadFileHidden
})
buttonLoadFileHidden.addEventListener('change', () => {
    document.querySelector('.filename').innerHTML = buttonLoadFileHidden.files[0]?.name
    document.querySelector('#checkFile').classList.remove('inv')
});

const buttonSettings = document.querySelector('#settings')
buttonSettings.addEventListener('click', () => {
    document.querySelector('.modals').classList.remove('inv')
})

const buttonSaveSettings = document.querySelector('#saveSettings')
buttonSaveSettings.addEventListener('click', () => {
    ((Number(document.querySelector('#turboPower').value) > 100) && (document.querySelector('#turbo').checked)) ? alert('El valor de turbo solo puede ser de máximo 100') : document.querySelector('.modals').classList.add('inv')
})

const checkFile = document.querySelector('#checkFile')
checkFile.addEventListener('click', () => {
    handleFile()
})