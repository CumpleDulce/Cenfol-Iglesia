const API_KEY = 'patKFSIiZsDRUcpCT.fea19d847e458cf66e66934b32758219746c73e023e128d27190810eb37f51c4';
        const BASE_ID = 'appLnefkDTpLYto7R';
        const INSTRUMENTALES_TABLE = 'Músicas Instrumentales'; 

        async function cargarInstrumentales() {
            try {
                const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${INSTRUMENTALES_TABLE}`, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                const instrumentales = data.records;

                const contenedor = document.getElementById('instrumentalesList');
                let html = '';

                instrumentales.forEach(instrumental => {
                    const campos = instrumental.fields;
                    const nombre = campos.Nombre || "Sin nombre";
                    const enlace = campos.Enlace || "#";
                    const duracion = campos.Duracion ? `${campos.Duracion} min` : "Duración no especificada";

                    html += `
                        <div class="card">
                            <h3>${nombre}</h3>
                            <p><strong>Duración:</strong> ${duracion}</p>
                            <a href="${enlace}" target="_blank" class="btn">Escuchar</a>
                        </div>
                    `;
                });

                contenedor.innerHTML = html;
            } catch (error) {
                console.error("Error al cargar las músicas instrumentales:", error);
                document.getElementById('instrumentalesList').innerHTML = `<p>Error al cargar las músicas instrumentales. Inténtalo de nuevo más tarde.</p>`;
            }
        }

        document.addEventListener('DOMContentLoaded', cargarInstrumentales);