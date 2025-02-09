const API_KEY = 'patKFSIiZsDRUcpCT.fea19d847e458cf66e66934b32758219746c73e023e128d27190810eb37f51c4';
const BASE_ID = 'appLnefkDTpLYto7R';
const AGENDA_TABLE = 'Agenda';
const CONTRASENA = "CenfolRosa";

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('verificarBtn').addEventListener('click', verificarContrasena);
});

function verificarContrasena() {
    const contrasenaIngresada = document.getElementById('passwordInput').value;

    if (contrasenaIngresada === CONTRASENA) {
        document.getElementById('notificaciones').style.display = 'block';
        document.getElementById('accesoRestringido').style.display = 'none';
        mostrarEventos();
        configurarBotonNuevo();
    } else {
        document.getElementById('mensajeError').style.display = 'block';
    }
}

function configurarBotonNuevo() {
    const nuevoBtn = document.getElementById('nuevoBtn');
    if (nuevoBtn) {
        nuevoBtn.addEventListener('click', () => {
            const formulariosContainer = document.getElementById('formulariosContainer');
            formulariosContainer.style.display = formulariosContainer.style.display === 'none' ? 'block' : 'none';
        });
    }
}

async function mostrarEventos() {
    try {
        const responseAgenda = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${AGENDA_TABLE}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const dataAgenda = await responseAgenda.json();
        const eventos = dataAgenda.records;

        const responseCanciones = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Canciones`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const dataCanciones = await responseCanciones.json();
        const cancionesMap = new Map(dataCanciones.records.map(cancion => [
            cancion.id,
            cancion.fields.Nombre
        ]));

        const contenedor = document.getElementById('notificationsList');
        let html = '';

        if (eventos.length === 0) {
            html = `<p>No hay eventos próximos.</p>`;
        } else {
            eventos.forEach(evento => {
                const campos = evento.fields;
                const nombreEvento = campos.Evento || "Sin nombre";
                const fechaEvento = campos.Fecha || "Fecha no definida";
                const idsCanciones = campos.Canciones || [];
                const nombresCanciones = idsCanciones.map(id => cancionesMap.get(id) || "Canción no encontrada");
                const encargados = campos.Encargados || "No definido";
                const notas = campos.Notas || "No hay notas";

                html += `
                    <div class="notification-card">
                        <h3>${nombreEvento}</h3>
                        <p><strong>Fecha:</strong> ${fechaEvento}</p>
                        <p><strong>Canciones:</strong> ${nombresCanciones.join(', ')}</p>
                        <p><strong>Encargados:</strong> ${encargados}</p>
                        ${notas ? `<p><strong>Notas:</strong> ${notas}</p>` : ''}
                        <button class="btn whatsapp-btn" data-evento='${JSON.stringify(campos)}'> Enviar Recordatorio</button>
                    </div>
                `;
            });
        }

        contenedor.innerHTML = html;

        document.querySelectorAll('.whatsapp-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const evento = JSON.parse(btn.dataset.evento);
                const mensaje = `Recordatorio: ${evento.Evento}\nFecha: ${evento.Fecha}\nCanciones: ${evento.Canciones}\nEncargados: ${evento.Encargados}\nNotas: ${evento.Notas || "Ninguna"}`;
                const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
                window.open(url, '_blank');
            });
        });
    } catch (error) {
        console.error("Error al obtener eventos:", error);
        document.getElementById('notificationsList').innerHTML = `<p>Error al cargar los eventos. Inténtalo de nuevo más tarde.</p>`;
    }
}