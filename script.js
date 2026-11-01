/* CONEXION A GOOGLE SHEETS */
const SPREADSHEET_ID = '15Wmk0ufjZv8mQWY80jt6AXSmMX-H2TqxGYVfGuBPmeU'; 
const SHEETS_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

let indexActual = 0;
let totalSlides = 0;
let intervaloCarrusel = null;

async function cargarSlidesDesdeSheets() {
    const loading = document.getElementById('loadingCarrusel');
    const containerSlides = document.getElementById('carruselSlides');
    const containerPuntos = document.getElementById('carruselPuntos');

    if (!SPREADSHEET_ID || SPREADSHEET_ID.trim() === '' || SPREADSHEET_ID === 'TU_ID_DE_GOOGLE_SHEETS_AQUI') {
        usarRespaldoPorDefecto(loading, containerSlides, containerPuntos);
        return;
    }

    try {
        const response = await fetch(SHEETS_URL);
        const text = await response.text();

        const jsonMatch = text.match(/\{.*\}/s);
        if (!jsonMatch) {
            throw new Error('Formato JSON no valido en la respuesta de Google Sheets');
        }

        const data = JSON.parse(jsonMatch[0]);
        const rows = data.table ? data.table.rows : [];

        if (!rows || rows.length === 0) {
            usarRespaldoPorDefecto(loading, containerSlides, containerPuntos);
            return;
        }

        let slidesHTML = '';
        let puntosHTML = '';
        let contadorValid = 0;

        rows.forEach((row) => {
            let imgUrl = row.c && row.c[0] && row.c[0].v ? String(row.c[0].v).trim() : '';
            const caption = row.c && row.c[1] && row.c[1].v ? String(row.c[1].v).trim() : '';

            if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
                slidesHTML += `
                    <div class="slide">
                        <img src="${imgUrl}" alt="Aviso Sindicato" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80';">
                        ${caption ? `<div class="slide-caption">${caption}</div>` : ''}
                    </div>`;
                puntosHTML += `<span class="punto ${contadorValid === 0 ? 'activo' : ''}" onclick="irASlide(${contadorValid})"></span>`;
                contadorValid++;
            }
        });

        if (contadorValid > 0) {
            if (loading) loading.style.display = 'none';
            containerSlides.innerHTML = slidesHTML;
            containerPuntos.innerHTML = puntosHTML;
            totalSlides = contadorValid;
            intervaloCarrusel = setInterval(moverCarrusel, 4000);
        } else {
            usarRespaldoPorDefecto(loading, containerSlides, containerPuntos);
        }

    } catch (error) {
        console.error('Error cargando Google Sheets, usando respaldo:', error);
        usarRespaldoPorDefecto(loading, containerSlides, containerPuntos);
    }
}

function usarRespaldoPorDefecto(loading, containerSlides, containerPuntos) {
    if (loading) loading.style.display = 'none';
    if (containerSlides) {
        containerSlides.innerHTML = `
            <div class="slide">
                <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80" alt="Flota de buses">
                <div class="slide-caption">&#128227; Salidas continuas todos los dias del ano</div>
            </div>
            <div class="slide">
                <img src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80" alt="Terminal de buses">
                <div class="slide-caption">&#127970; Atencion personalizada en todas nuestras paradas</div>
            </div>`;
    }
    if (containerPuntos) {
        containerPuntos.innerHTML = `
            <span class="punto activo" onclick="irASlide(0)"></span>
            <span class="punto" onclick="irASlide(1)"></span>`;
    }
    totalSlides = 2;
    if (!intervaloCarrusel) {
        intervaloCarrusel = setInterval(moverCarrusel, 4000);
    }
}

function moverCarrusel() {
    if (totalSlides <= 1) return;
    indexActual = (indexActual + 1) % totalSlides;
    actualizarCarrusel();
}

function irASlide(index) {
    indexActual = index;
    actualizarCarrusel();
    reiniciarIntervalo();
}

function actualizarCarrusel() {
    const slides = document.getElementById('carruselSlides');
    const puntos = document.querySelectorAll('.punto');
    if (!slides) return;
    slides.style.transform = `translateX(-${indexActual * 100}%)`;
    puntos.forEach((punto, i) => {
        punto.classList.toggle('activo', i === indexActual);
    });
}

function reiniciarIntervalo() {
    if (totalSlides <= 1) return;
    clearInterval(intervaloCarrusel);
    intervaloCarrusel = setInterval(moverCarrusel, 4000);
}

window.addEventListener('DOMContentLoaded', cargarSlidesDesdeSheets);

/* --- LOGICA CORREGIDA DEL MODAL DEL MAPA --- */
function abrirUbicacion(nombreOficina, lat, lng) {
    const modal = document.getElementById('mapModal');
    const titulo = document.getElementById('modalTitulo');
    const iframe = document.getElementById('mapIframe');
    const btnRuta = document.getElementById('btnRuta');

    if (!modal || !titulo || !iframe || !btnRuta) return;

    let latClean = lat;
    let lngClean = lng;
    if (!lng && typeof lat === 'string' && lat.includes(',')) {
        const parts = lat.split(',');
        latClean = parts[0].trim();
        lngClean = parts[1].trim();
    } else {
        latClean = String(lat).trim();
        lngClean = String(lng).trim();
    }

    const coordsStr = `${latClean},${lngClean}`;

    titulo.innerText = nombreOficina;
    iframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(coordsStr)}&t=&z=16&ie=UTF-8&iwloc=&output=embed`;
    btnRuta.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(coordsStr)}`;

    modal.classList.add('activo');
}

function cerrarModal() {
    const modal = document.getElementById('mapModal');
    const iframe = document.getElementById('mapIframe');
    if (modal) modal.classList.remove('activo');
    if (iframe) iframe.src = ''; 
}

window.onclick = function(event) {
    const modal = document.getElementById('mapModal');
    if (event.target === modal) {
        cerrarModal();
    }
};

/* --- COMPARTIR --- */
function compartirWeb() {
    const urlActual = window.location.href;
    const texto = "*Sindicato de Transporte del Oriente*
 Aqui tienes nuestra Tarjeta Digital con todas nuestras ubicaciones de Google Maps y numeros de WhatsApp oficiales:

" + urlActual;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
}

function compartirOficina(nombre, telf, coords) {
    const linkMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
    const texto = `*Sindicato de Transporte del Oriente*

*${nombre}*
 WhatsApp de contacto: ${telf}
 Ubicacion en Google Maps:
${linkMaps}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
}
