console.log('Notificacion vinculada');
// Comprobar si el navegador soporta las notificaciones
const ntfProcesoFinalizado = () => {
    if ("Notification" in window) {
        // Comprobar si las notificaciones están permitidas
        if (Notification.permission === "granted") {
            // Puedes crear notificaciones
            createNotification();
        } else if (Notification.permission !== "denied") {
            // Si las notificaciones no están permitidas ni denegadas, pedir permiso al usuario
            Notification.requestPermission().then(function (permission) {
                if (permission === "granted") {
                    createNotification();
                }
            });
        }

        // Función para crear una notificación personalizada
        function createNotification() {
            var notification = new Notification("ValiCom", {
                body: "El proceso de validación de comprobantes ha finalizado."
            });

            // Acción al hacer clic en la notificación
            notification.onclick = function () {
                // Enfocar la ventana actual al hacer clic en la notificación
                window.focus();
            };
        }
    }
}