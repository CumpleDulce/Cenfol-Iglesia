const API_KEY = 'patKFSIiZsDRUcpCT.fea19d847e458cf66e66934b32758219746c73e023e128d27190810eb37f51c4';
const BASE_ID = 'appLnefkDTpLYto7R';
const VIDEOS_TABLE = 'Videos'; // Nombre de tu tabla de videos en Airtable

async function cargarVideos() {
    try {
        const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${VIDEOS_TABLE}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        const videos = data.records;

        const contenedor = document.getElementById('videosList');
        let html = '';

        videos.forEach(video => {
            const campos = video.fields;
            const titulo = campos.Titulo || "Sin título";
            const artista = campos.Artista || "Ministerio de Alabanza";
            const url = campos.URL || "#";
            const id = campos.ID || "";
            const thumbnail = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

            html += `
                <div class="video-card">
                    <img src="${thumbnail}" alt="${titulo}" class="video-thumbnail">
                    <div class="video-info">
                        <h3>${titulo}</h3>
                        <p>${artista}</p>
                        <a href="${url}" target="_blank" class="btn btn-youtube">▶ Reproducir</a>
                    </div>
                </div>
            `;
        });

        contenedor.innerHTML = html;
    } catch (error) {
        console.error("Error al cargar los videos:", error);
        document.getElementById('videosList').innerHTML = `<p>Error al cargar los videos. Inténtalo de nuevo más tarde.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', cargarVideos);