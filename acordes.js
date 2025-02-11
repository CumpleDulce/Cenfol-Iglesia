const API_KEY = 'patKFSIiZsDRUcpCT.fea19d847e458cf66e66934b32758219746c73e023e128d27190810eb37f51c4';
const BASE_ID = 'appLnefkDTpLYto7R';
const CANCIONES_TABLE = 'Canciones';
const AGENDA_TABLE = 'Agenda';

let offset = 0;
const pageSize = 10;
let cargando = false;

// Función para corregir la fecha (problema de zona horaria)
function corregirFecha(fecha) {
    const fechaObj = new Date(fecha);
    const offset = fechaObj.getTimezoneOffset();
    fechaObj.setMinutes(fechaObj.getMinutes() + offset);
    return fechaObj;
}

// Función para verificar si un evento es próximo (dentro de 1 semana)
function esEventoProximo(fecha) {
    const hoy = new Date();
    const fechaEvento = corregirFecha(fecha);
    const diferenciaDias = Math.ceil((fechaEvento - hoy) / (1000 * 60 * 60 * 24));
    return diferenciaDias <= 7 && diferenciaDias >= 0;
}

// Usamos delegación de eventos para que los botones "Letras" funcionen en elementos cargados dinámicamente
document.addEventListener('DOMContentLoaded', () => {
    const lista = document.getElementById("lista");
    lista.addEventListener("click", function(e) {
        if (e.target && e.target.classList.contains("btn-letras")) {
            const pdfItem = e.target.closest(".pdf-item");
            const letraContainer = pdfItem.querySelector(".letra-container");
            const letraTexto = letraContainer.querySelector(".letra-texto");
            
            // Toggle: si ya está visible, se oculta; de lo contrario, se muestra
            if (letraTexto.style.maxHeight) {
                letraTexto.style.maxHeight = null;
                letraContainer.style.display = "none";
            } else {
                letraContainer.style.display = "block";
                letraTexto.style.maxHeight = letraTexto.scrollHeight + "px";
            }
        }
    });
});

// Función para cargar las canciones (inicialmente con agenda y canciones próximas)
async function cargarCanciones() {
    if (cargando) return;
    cargando = true;
    
    try {
        // Obtener las canciones desde Airtable
        const responseCanciones = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${CANCIONES_TABLE}?pageSize=${pageSize}&offset=${offset}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        const dataCanciones = await responseCanciones.json();
        const canciones = dataCanciones.records.map(record => ({
            id: record.id,
            Nombre: record.fields.Nombre || "Sin nombre",
            Artista: record.fields.Artistas || "Artista desconocido", // Nuevo campo
            Letra: record.fields.Letra || "Letra no disponible",
            Enlace: record.fields.Enlace || "#"
        }));
        
        // Obtener la agenda para identificar canciones próximas
        const responseAgenda = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${AGENDA_TABLE}?sort[0][field]=Fecha&sort[0][direction]=asc`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        const dataAgenda = await responseAgenda.json();
        
        const hoy = new Date().toISOString().split('T')[0];
        const eventosFuturos = dataAgenda.records.filter(evento => evento.fields.Fecha >= hoy);
        const eventosProximos = eventosFuturos.filter(evento => esEventoProximo(evento.fields.Fecha));
        
        // Crear un MAP para agrupar la información de los eventos por canción
        const cancionesProximasMap = new Map();
        eventosProximos.forEach(evento => {
            const fechaEvento = corregirFecha(evento.fields.Fecha).toLocaleDateString('es-PY', { 
                weekday: 'long', day: 'numeric', month: 'short' 
            });
            evento.fields.Canciones.forEach(idCancion => {
                if (!cancionesProximasMap.has(idCancion)) {
                    cancionesProximasMap.set(idCancion, []);
                }
                cancionesProximasMap.get(idCancion).push({
                    fecha: fechaEvento,
                    evento: evento.fields.Evento
                });
            });
        });
        
        // Construir HTML para las canciones próximas
        let htmlProximas = '';
        const cancionesProximas = [];
        if (eventosProximos.length > 0) {
            htmlProximas = `<h2>Canciones de esta semana</h2>`;
            eventosProximos.forEach(evento => {
                evento.fields.Canciones.forEach(idCancion => {
                    const cancion = canciones.find(c => c.id === idCancion);
                    if (cancion && !cancionesProximas.includes(cancion)) {
                        cancionesProximas.push(cancion);
                        const eventosList = cancionesProximasMap.get(idCancion);
                        const eventosHTML = eventosList.map(e => `<li>${e.evento} (${e.fecha})</li>`).join('');
                        htmlProximas += `
                            <div class="pdf-item cancion-proxima">
                                <div class="etiqueta-proxima">Próxima esta semana</div>
                                <h3>${cancion.Nombre}</h3>
                                <p class="artista">${cancion.Artista}</p> <!-- Nueva línea -->
                                <div class="eventos-relacionados">
                                    <p>Se tocará en:</p>
                                    <ul>${eventosHTML}</ul>
                                </div>
                                <div class="buttons">
                                    <a href="${cancion.Enlace}" target="_blank" class="btn">Descargar</a>
                                    <button class="btn btn-letras" data-letra="${cancion.Letra}">Letras</button>
                                </div>
                                <div class="letra-container" style="display: none;">
                                    <pre class="letra-texto">${cancion.Letra}</pre>
                                </div>
                            </div>
                        `;
                    }
                });
            });
        }
        
        // Construir HTML para el resto de las canciones
        let htmlTodas = `<h2>Todas las canciones</h2>`;
        canciones.forEach(cancion => {
            if (!cancionesProximas.includes(cancion)) {
                htmlTodas += `
                    <div class="pdf-item">
                        <h3>${cancion.Nombre}</h3>
                        <p class="artista">${cancion.Artista}</p> <!-- Nueva línea -->
                        <div class="buttons">
                            <a href="${cancion.Enlace}" target="_blank" class="btn">Descargar</a>
                            <button class="btn btn-letras" data-letra="${cancion.Letra}">Letras</button>
                        </div>
                        <div class="letra-container" style="display: none;">
                            <pre class="letra-texto">${cancion.Letra}</pre>
                        </div>
                    </div>
                `;
            }
        });
        
        // Reemplazar el contenido del contenedor "lista"
        document.getElementById("lista").innerHTML = htmlProximas + htmlTodas;
        
        // Actualizar el offset para la próxima carga (si lo hay)
        offset = dataCanciones.offset || null;
    } catch (error) {
        console.error("Error al cargar canciones:", error);
    } finally {
        cargando = false;
    }
}

// Función para cargar más canciones (al hacer scroll)
async function cargarMasCanciones() {
    if (cargando) return;
    cargando = true;
    
    try {
        const responseCanciones = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${CANCIONES_TABLE}?pageSize=${pageSize}&offset=${offset}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        const dataCanciones = await responseCanciones.json();
        const nuevasCanciones = dataCanciones.records.map(record => ({
            id: record.id,
            Nombre: record.fields.Nombre || "Sin nombre",
            Artista: record.fields.Artistas || "Artista desconocido", // Nuevo campo
            Letra: record.fields.Letra || "Letra no disponible",
            Enlace: record.fields.Enlace || "#"
        }));
        
        // Agregar las nuevas canciones al final de la lista
        const lista = document.getElementById("lista");
        nuevasCanciones.forEach(cancion => {
            const htmlCancion = `
                <div class="pdf-item">
                    <h3>${cancion.Nombre}</h3>
                    <p class="artista">${cancion.Artista}</p> <!-- Nueva línea -->
                    <div class="buttons">
                        <a href="${cancion.Enlace}" target="_blank" class="btn">Descargar</a>
                        <button class="btn btn-letras" data-letra="${cancion.Letra}">Letras</button>
                    </div>
                    <div class="letra-container" style="display: none;">
                        <pre class="letra-texto">${cancion.Letra}</pre>
                    </div>
                </div>
            `;
            lista.insertAdjacentHTML('beforeend', htmlCancion);
        });
        
        // Actualizar el offset para la siguiente carga (si lo hay)
        offset = dataCanciones.offset || null;
    } catch (error) {
        console.error("Error al cargar más canciones:", error);
    } finally {
        cargando = false;
    }
}

// Verificar si el usuario ha llegado al final de la página para cargar más canciones
function verificarScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        cargarMasCanciones();
    }
}

// Al iniciar el documento se cargan las primeras canciones y se asocia el scroll
document.addEventListener('DOMContentLoaded', () => {
    cargarCanciones();
    window.addEventListener('scroll', verificarScroll);
});


// Función para implementar el buscador de canciones
function configurarBuscador() {
    const buscador = document.getElementById('buscar');
    
    buscador.addEventListener('input', () => {
        const termino = buscador.value.toLowerCase();
        const canciones = document.querySelectorAll('.pdf-item');
        
        canciones.forEach(cancion => {
            const nombre = cancion.querySelector('h3').textContent.toLowerCase();
            const artista = cancion.querySelector('.artista').textContent.toLowerCase();
            
            if (nombre.includes(termino) || artista.includes(termino)) {
                cancion.style.display = 'block';
            } else {
                cancion.style.display = 'none';
            }
        });
    });
}
// Modificar el evento DOMContentLoaded para incluir el buscador
document.addEventListener('DOMContentLoaded', () => {
    cargarCanciones();
    configurarBuscador(); // Nueva línea
    window.addEventListener('scroll', verificarScroll);
});
