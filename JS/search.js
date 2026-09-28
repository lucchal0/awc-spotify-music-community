/**
 * Alessandro Lucchesi - search.js 
 * Gestione della UI e Ricerca Globale Live
 */

let currentSpotifyToken = "";

// Avvio della ricerca al caricamento della pagina
document.addEventListener('DOMContentLoaded', async () => {
    try {
        currentSpotifyToken = await APIController.getToken(); 
    } catch (e) {
        console.error("Errore Token API Spotify");
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim(); 
            const emptyState = document.getElementById('search-empty-state');
            const resultsGrid = document.getElementById('search-results-grid');

            if (query.length < 2) {
                emptyState.innerHTML = '<i class="bi bi-music-note-list" style="font-size: 4rem; opacity: 0.5;"></i><p class="mt-3 fs-5">Digita qualcosa per cercare canzoni.</p>';
                emptyState.classList.remove('d-none');
                resultsGrid.classList.add('d-none');
                return;
            }

            if (currentSpotifyToken) {
                const tracks = await APIController.searchTrack(currentSpotifyToken, query);
                renderSongSearchResults(tracks);
            }
        });
    }
});

// Stampa i risultati nel DOM
function renderSongSearchResults(tracks) {
    const resultsContainer = document.getElementById('search-results-grid');
    const emptyState = document.getElementById('search-empty-state');

    emptyState.classList.add('d-none');
    resultsContainer.classList.remove('d-none');

    // nessun brano trovato
    if (tracks.length === 0) {
        emptyState.innerHTML = '<i class="bi bi-emoji-frown" style="font-size: 4rem; opacity: 0.5;"></i><p class="mt-3 fs-5">Nessun brano trovato.</p>';
        emptyState.classList.remove('d-none');
        resultsContainer.classList.add('d-none');
        return;
    }


    resultsContainer.innerHTML = tracks.map(track => {
        const sTitle = encodeURIComponent(track.titolo).replace(/'/g, "%27");
        const sArtist = encodeURIComponent(track.cantante).replace(/'/g, "%27");
        // creazione carte
        return `
            <div class="col-6 col-md-4 col-lg-3 col-xl-2">
                <div class="card bg-body-tertiary text-body h-100 p-3 border-0 shadow rounded-3 position-relative hover-card">
                    <img src="${track.immagine}" class="card-img-top mb-3 rounded-2" alt="${track.titolo}" style="aspect-ratio: 1/1; object-fit: cover;">
                    <button class="btn btn-light rounded-circle position-absolute shadow-sm d-flex justify-content-center align-items-center" style="width: 32px; height: 32px; top: 25px; right: 25px; z-index: 2;" onclick="selectSongFromSearch('${track.id}', '${sTitle}', '${sArtist}', '${track.anno}', '${track.durata}', '${track.immagine}')"><i class="bi bi-plus-lg text-body"></i></button>
                    <button class="btn btn-brand rounded-circle position-absolute shadow-lg d-flex justify-content-center align-items-center" style="width: 48px; height: 48px; right: 20px; bottom: 85px; z-index: 2;" onclick="playTrack('${sTitle}', '${sArtist}', '${track.immagine}')"><i class="bi bi-play-fill fs-3 ms-1"></i></button>
                    <div class="card-body p-0">
                        <h3 class="card-title fs-6 fw-bold mb-1 text-truncate" title="${track.titolo}">${track.titolo}</h3>
                        <p class="card-text text-body-secondary small text-truncate mb-0" title="${track.cantante}">${track.cantante}</p>
                    </div>
                </div>
            </div>`;
    }).join('');
}
