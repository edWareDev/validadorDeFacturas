function handleFile() {
  let fileInput = document.getElementById('excelFileInput');
  let file = fileInput.files[0];
  let reader = new FileReader();

  reader.onload = function (e) {
    let data = new Uint8Array(e.target.result);
    let workbook = XLSX.read(data, { type: 'array' });
    let worksheet = workbook.Sheets[workbook.SheetNames[0]];
    let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let headers = jsonData[0];
    let dataArray = jsonData.slice(1);

    let resultArray = dataArray.map(function (row) {
      let obj = {};
      headers.forEach(function (header, index) {
        obj[header] = row[index];
      });
      return obj;
    });
    let plantilla = ``
    resultArray.forEach((item, i) => {
      if (item.n_comp) {
        const fecha = new Date(1900, 0, item.f_comp - 1);
        const fechaBoleta = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const montoTotal = item.s_tota || 0
        plantilla += `
      <div class="registro">
      <div>${i + 1}</div>
        <div>
        <label for="regCheckbox">
        <input type="checkbox" name="regCheckbox" id="regCheckbox" checked>
        </label>
        </div>
        <div class="fechaComprobante" title="${fechaBoleta}">${fechaBoleta.trim()}</div>
        <div class="codigoComprobante">${(item.c_comp).trim()}</div>
        <div class="numeroSerie">${(item.n_seri).trim()}</div>
        <div class="numeroComprobante">${item.n_comp}</div>
        <div class="RUC">${item.n_ruc}</div>
        <div class="montoTotal">${(montoTotal.toFixed(2) || 0).trim()}</div>
        <div class="estadoCp"></div>
        <div class="estadoRuc"></div>
        <div class="estadoCondDomiRuc"></div>
        <div class="resultado"></div>
        <div class="observaciones"></div>
      </div>
      `
      }
    })
    document.querySelector('.tableBody').innerHTML = plantilla
    document.querySelector('#total').innerHTML = resultArray.length
    document.querySelector('#labelAllRegCheckbox').innerHTML = `<input type="checkbox" name="regCheckbox" id="allRegCheckbox">`
    const chkbxAllRegCheckbox = document.querySelector('#allRegCheckbox')
    chkbxAllRegCheckbox.checked = false
    chkbxAllRegCheckbox.addEventListener('change', () => {
      const allCbxs = document.querySelector('.tableBody').querySelectorAll('input[type="checkbox"]')
      allCbxs.forEach(cbx => {
        cbx.checked = chkbxAllRegCheckbox.checked
        cbx.addEventListener('change', () => {
          chkbxAllRegCheckbox.checked = false
        })
      })
    })
    chkbxAllRegCheckbox.click()
  };
  reader.readAsArrayBuffer(file);
}