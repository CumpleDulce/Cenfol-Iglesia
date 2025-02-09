const API_KEY = 'patKFSIiZsDRUcpCT.fea19d847e458cf66e66934b32758219746c73e023e128d27190810eb37f51c4';
const BASE_ID = 'appLnefkDTpLYto7R';
const AGENDA_TABLE = 'Agenda';

// Función para corregir la fecha (problema de zona horaria)
function corregirFecha(fecha) {
    const fechaObj = new Date(fecha);
    const offset = fechaObj.getTimezoneOffset(); // Obtener el offset en minutos
    fechaObj.setMinutes(fechaObj.getMinutes() + offset); // Ajustar la fecha
    return fechaObj;
}

// Función para verificar si un evento es próximo (dentro de 1 semana)
function esEventoProximo(fecha) {
    const hoy = new Date();
    const fechaEvento = corregirFecha(fecha);
    const diferenciaDias = Math.ceil((fechaEvento - hoy) / (1000 * 60 * 60 * 24));
    return diferenciaDias <= 7 && diferenciaDias >= 0;
}

async function cargarAgenda() {
    try {
        // Obtener la agenda ORDENADA POR FECHA
        const responseAgenda = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${AGENDA_TABLE}?sort[0][field]=Fecha&sort[0][direction]=asc`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const dataAgenda = await responseAgenda.json();
        const eventos = dataAgenda.records;

        // Obtener todas las canciones
        const responseCanciones = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Canciones`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const dataCanciones = await responseCanciones.json();
        const cancionesMap = new Map(dataCanciones.records.map(cancion => [
            cancion.id, // ID de la canción
            cancion.fields.Nombre // Nombre de la canción
        ]));

        const hoy = new Date().toISOString().split('T')[0]; // Fecha actual
        const eventosFuturos = eventos.filter(evento => evento.fields.Fecha >= hoy);

        // Función para mostrar eventos
        const mostrarEventos = (eventos) => {
            let html = '';
            eventos.forEach(evento => {
                const campos = evento.fields;

                // Corregir la fecha
                const fechaCorregida = corregirFecha(campos.Fecha);

                // Verifica si los campos existen
                const nombreEvento = campos.Evento || "Sin nombre";
                const idsCanciones = campos.Canciones || []; // IDs de las canciones
                const nombresCanciones = idsCanciones.map(id => cancionesMap.get(id) || "Canción no encontrada"); // Nombres de las canciones
                const encargados = campos.Encargados || "No definido";
                const notas = campos.Notas || "No hay notas";
                const esProximo = esEventoProximo(campos.Fecha); // Verificar si es próximo

                html += `
                    <div class="agenda-card">
                        <div class="agenda-date">
                            <span class="day">${fechaCorregida.getDate()}</span>
                            <span class="month">${fechaCorregida.toLocaleDateString('es-PY', { month: 'short' })}</span>
                        </div>
                        <div class="agenda-content">
                            <h3>${nombreEvento}</h3>
                            <p><strong>🎵 Canciones:</strong></p>
                            <ul class="song-list">
                                ${nombresCanciones.map(nombre => `<li>${nombre}</li>`).join('')}
                            </ul>
                            <p><strong>👥 Encargados:</strong> ${encargados}</p>
                            ${notas ? `<p><strong>📌 Notas:</strong> ${notas}</p>` : ''}
                        </div>
                    </div>
                `;
            });

            document.getElementById('agendaList').innerHTML = html;
        };

        // Mostrar todos los eventos al inicio
        mostrarEventos(eventosFuturos);

        // Filtro por mes
        const monthFilter = document.getElementById('monthFilter');
        monthFilter.addEventListener('input', () => {
            const [year, month] = monthFilter.value.split('-');
            const eventosFiltrados = eventosFuturos.filter(evento => {
                const fechaEvento = corregirFecha(evento.fields.Fecha);
                return fechaEvento.getFullYear() === parseInt(year) && 
                       (fechaEvento.getMonth() + 1) === parseInt(month);
            });
            mostrarEventos(eventosFiltrados);
        });

        // Filtro por canción
        const songFilter = document.getElementById('songFilter');
        songFilter.addEventListener('input', () => {
            const termino = songFilter.value.toLowerCase();
            const eventosFiltrados = eventosFuturos.filter(evento => {
                const nombresCanciones = evento.fields.Canciones.map(id => cancionesMap.get(id) || "").join(' ').toLowerCase();
                return nombresCanciones.includes(termino);
            });
            mostrarEventos(eventosFiltrados);
        });

    } catch (error) {
        console.error("Error al cargar la agenda:", error);
        document.getElementById('agendaList').innerHTML = `<p>Error al cargar la agenda. Inténtalo de nuevo más tarde.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', cargarAgenda);