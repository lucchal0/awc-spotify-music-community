/**
 * Alessandro Lucchesi - playlist.js 
 * Gestione Playlist Private e Condivisione
 */

let currentViewedPlaylistId = null;
let targetPlaylistForAdd = null;
let tempSelectedSongs = [];
let selectedPlaylistTags = [];
let categoriesLoaded = false;

let pendingSongToAdd = null;

function selectSongFromSearch(id, eTitle, eArtist, anno, durata, img) {
    if (!currentUser) return requireLogin(null); 

    // nuovvo oggetto song formato da id, titolo, cantante, aano, durata, immagine
    const song = { 
        id,
        titolo: decodeURIComponent(eTitle),
        cantante: decodeURIComponent(eArtist),
        anno,
        durata,
        immagine: img
    };

    //se utente è già dentro in playlist aggiungi canzone direttamente
    if (targetPlaylistForAdd) {
        addSongToPlaylist(targetPlaylistForAdd, song);
    } else {
        pendingSongToAdd = song;
        const listContainer = document.getElementById('modal-choose-playlist-list');

        if (!currentUser.playlists || currentUser.playlists.length === 0) {
            listContainer.innerHTML = '<p class="text-center text-danger small mt-3 fw-bold">Non hai ancora creato nessuna playlist!</p>';
        } else {
            listContainer.innerHTML = currentUser.playlists.map(pl => `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 border border-secondary-subtle rounded hover-card bg-body-tertiary" style="cursor: pointer;" onclick="addSelectedSongToPlaylist('${pl.id}')">
                    <div class="d-flex align-items-center overflow-hidden">
                        <img src="${pl.cover}" class="rounded me-3 shadow-sm" style="width:40px; height:40px; object-fit: cover;">
                        <span class="fw-bold text-truncate" style="max-width: 130px;">${pl.name}</span>
                    </div>
                    <i class="bi bi-plus-circle-fill text-brand fs-5"></i>
                </div>
            `).join('');
        }
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalChoosePlaylist')).show();
    }
}

// Inserisce il brano nella playlist scelta 
function addSelectedSongToPlaylist(playlistId) {
    if (!pendingSongToAdd) return;
    addSongToPlaylist(playlistId, pendingSongToAdd);
    bootstrap.Modal.getInstance(document.getElementById('modalChoosePlaylist'))?.hide();
    pendingSongToAdd = null;
}

// --- CREAZIONE E RICERCA BRANI ---
function openSearchForPlaylist() {
    targetPlaylistForAdd = currentViewedPlaylistId;
    document.getElementById('overlay-search').classList.remove('d-none');
    if (typeof setActiveNav === 'function') setActiveNav(null);
}

async function searchSongsForNewPlaylist() {
    const query = document.getElementById('modal-search-input').value.trim();
    const resDiv = document.getElementById('modal-search-results');
    if (!query) return;

    resDiv.innerHTML = '<div class="text-center small py-2"><div class="spinner-border spinner-border-sm text-brand"></div></div>';
    resDiv.classList.remove('d-none');

    try {
        const token = await APIController.getToken();
        const tracks = await APIController.searchTrack(token, query);

        // risultati nella colonna a sinistra 
        if (!tracks.length) return resDiv.innerHTML = '<div class="small text-center py-2 text-body-secondary">Nessun risultato.</div>';

        resDiv.innerHTML = tracks.map(t => `
            <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary-subtle">
                <div class="d-flex align-items-center overflow-hidden">
                    <img src="${t.immagine}" class="rounded me-2 shadow-sm" style="width:36px; height:36px;">
                    <div class="text-truncate">
                        <div class="fw-bold small text-truncate">${t.titolo}</div>
                        <div class="text-body-secondary small text-truncate">${t.cantante}</div>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-brand rounded-circle" onclick="addSongToTempList('${t.id}', '${encodeURIComponent(t.titolo).replace(/'/g, "%27")}', '${encodeURIComponent(t.cantante).replace(/'/g, "%27")}', '${t.anno}', '${t.durata}', '${t.immagine}')">
                    <i class="bi bi-plus-lg"></i>
                </button>
            </div>`).join('');
    } catch (e) { resDiv.innerHTML = '<div class="small text-center py-2 text-danger">Errore API.</div>'; }
}

// funzioni lista temporanea 
function addSongToTempList(id, eTitle, eArtist, anno, durata, img) {
    if (tempSelectedSongs.some(s => s.id === id)) return alert("Brano già aggiunto!");
    tempSelectedSongs.push({ id, titolo: decodeURIComponent(eTitle), cantante: decodeURIComponent(eArtist), anno, durata, immagine: img });
    updateSelectedSongsUI();
}

function removeSongFromTempList(id) {
    tempSelectedSongs = tempSelectedSongs.filter(s => s.id !== id);
    updateSelectedSongsUI();
}


function updateSelectedSongsUI() {
    const list = document.getElementById('modal-selected-songs');
    // array vuoto 
    if (!tempSelectedSongs.length) return list.innerHTML = '<li class="list-group-item text-body-secondary small text-center">Nessun brano aggiunto</li>';
    // se contiene
    list.innerHTML = tempSelectedSongs.map(s => `
        <li class="list-group-item d-flex justify-content-between align-items-center py-1 px-2">
            <div class="text-truncate small"><span class="fw-bold text-body">${s.titolo}</span> <span class="text-body-secondary">- ${s.cantante}</span></div>
            <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-2" onclick="removeSongFromTempList('${s.id}')"><i class="bi bi-x-circle-fill fs-6"></i></button>
        </li>`).join('');
}

// crea nuova playlist 
function handleCreatePlaylist(e) {
    e.preventDefault();
    if (!currentUser) return;
    if (!currentUser.playlists) currentUser.playlists = [];

    currentUser.playlists.push({
        id: 'pl_' + Date.now(),
        name: document.getElementById('new-playlist-name').value.trim(),
        description: document.getElementById('new-playlist-desc').value.trim(),
        tags: [...selectedPlaylistTags],
        songs: [...tempSelectedSongs],
        cover: tempSelectedSongs.length ? tempSelectedSongs[0].immagine : 'https://via.placeholder.com/150'
    });

    saveCurrentUser(currentUser);
    bootstrap.Modal.getInstance(document.getElementById('modalPlaylist'))?.hide();  
    resetPlaylistModal();
    renderUserPlaylists();
}

function resetPlaylistModal() {
    document.getElementById('form-create-playlist').reset(); // svuota form 
    document.getElementById('modal-search-input').value = '';
    document.getElementById('modal-search-results').classList.add('d-none');
    tempSelectedSongs = []; selectedPlaylistTags = [];
    updatePlaylistTagsUI(); updateSelectedSongsUI();
}

// --- STAMPA PLAYLIST ---
// griglia delle playlist
function renderUserPlaylists() {
    const grid = document.getElementById('my-playlists-grid');
    const sidebarList = document.getElementById('user-playlists');
    if (!grid || !sidebarList) return;

    // se utente non ha playlist 
    if (!currentUser?.playlists?.length) {
        grid.innerHTML = `<div class="col-12 text-center py-5 bg-body-tertiary rounded-4 border border-secondary-subtle border-dashed"><i class="bi bi-collection-play text-body-secondary mb-3 d-inline-block" style="font-size: 3rem; opacity: 0.5;"></i><h4 class="fw-bold text-body">Nessuna playlist</h4></div>`;
        sidebarList.innerHTML = `<li class="nav-item"><span class="nav-link text-body-secondary px-0 py-1 small">Nessuna playlist</span></li>`;
        return;
    }

    // crea card delle playlist 
    grid.innerHTML = currentUser.playlists.map(pl => `
        <div class="col-6 col-md-4 col-lg-3 col-xl-2">
            <div class="card bg-body-tertiary text-body h-100 p-3 border rounded-3 position-relative hover-card" onclick="openPlaylist('${pl.id}')">
                <img src="${pl.cover}" class="card-img-top mb-2 rounded-2 shadow" style="aspect-ratio: 1/1; object-fit: cover;">
                <div class="card-body p-0">
                    <h3 class="card-title fs-6 fw-bold mb-0 text-truncate">${pl.name}</h3>
                    <p class="card-text text-body-secondary small mb-0">${pl.songs?.length || 0} brani</p>
                    ${pl.tags?.length ? `<div class="mt-2 text-truncate">${pl.tags.map(t => `<span class="badge text-bg-secondary me-1" style="font-size: 0.65rem;">${t}</span>`).join('')}</div>` : ''}
                </div>
            </div>
        </div>`).join('');

    sidebarList.innerHTML = currentUser.playlists.map(pl => `
        <li class="nav-item"><a href="#" class="nav-link text-body-secondary px-0 py-1 small text-truncate" onclick="openPlaylist('${pl.id}')"><i class="bi bi-music-note-list me-2"></i>${pl.name}</a></li>
    `).join('');
}

// --- DETTAGLIO PLAYLIST  ---
function addSongToPlaylist(playlistId, passedSong) {
    if (!passedSong || !currentUser) return;
    const pl = currentUser.playlists.find(p => p.id === playlistId);
    if (!pl) return;
    if (!pl.songs) pl.songs = [];

    // controllo brano già presente
    if (pl.songs.some(s => s.id === passedSong.id)) return alert("Brano già presente!");

    pl.songs.push(passedSong);
    if (pl.cover === 'https://via.placeholder.com/150') pl.cover = passedSong.immagine;

    saveCurrentUser(currentUser);
    renderUserPlaylists();
    if (currentViewedPlaylistId === playlistId) openPlaylist(playlistId);
    alert(`Brano aggiunto a "${pl.name}"!`);
}

function openPlaylist(playlistId) {
    const pl = currentUser?.playlists?.find(p => p.id === playlistId);
    if (!pl) return;
    currentViewedPlaylistId = playlistId;

    // Ripristina UI privata
    ['btn-pl-share', 'btn-pl-add', 'btn-pl-delete', 'btn-pl-edit-name'].forEach(id => document.getElementById(id)?.classList.remove('d-none'));
    document.getElementById('btn-pl-import')?.classList.add('d-none');

    document.getElementById('pl-detail-image').src = pl.cover;
    document.getElementById('pl-detail-title').innerText = pl.name;
    document.getElementById('pl-detail-desc').innerText = pl.description || 'Nessuna descrizione';
    document.getElementById('pl-detail-info').innerHTML = `${pl.tags?.length ? `<div class="mb-2">${pl.tags.map(t => `<span class="badge bg-secondary me-1">${t}</span>`).join('')}</div>` : ''}<i class="bi bi-person-circle me-1"></i> ${currentUser.username} • ${pl.songs?.length || 0} brani`;

    // generazione della tabella dati 
    const tbody = document.getElementById('pl-detail-tbody');
    if (!pl.songs?.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-body-secondary"><i class="bi bi-music-note-beamed d-block mb-3 fs-1"></i><h4 class="fw-bold">Playlist vuota</h4></td></tr>`;
    } else {
        tbody.innerHTML = pl.songs.map((s, i) => `
            <tr class="hover-card align-middle" onclick="playTrack('${encodeURIComponent(s.titolo)}', '${encodeURIComponent(s.cantante)}', '${s.immagine}')">
                <td class="text-body-secondary text-center">${i + 1}</td>
                <td><div class="d-flex align-items-center"><img src="${s.immagine}" class="me-3 rounded shadow-sm" style="width:40px;height:40px;"><div><div class="fw-bold text-body">${s.titolo}</div><div class="small text-body-secondary">${s.cantante}</div></div></div></td>
                <td class="text-body-secondary d-none d-md-table-cell">${s.anno}</td>
                <td class="text-body-secondary text-end">${s.durata}</td>
                <td class="text-end"><button class="btn btn-sm btn-outline-danger rounded-circle" onclick="event.stopPropagation(); removeSongFromPlaylist('${playlistId}', '${s.id}')"><i class="bi bi-trash"></i></button></td>
            </tr>`).join('');
    }
    showView('view-playlist');
}

function removeSongFromPlaylist(playlistId, songId) {
    const pl = currentUser.playlists.find(p => p.id === playlistId); // Elimina l'elemento dall'array
    if (!pl) return;
    pl.songs = pl.songs.filter(s => s.id !== songId);
    pl.cover = pl.songs.length ? pl.songs[0].immagine : 'https://via.placeholder.com/150';
    saveCurrentUser(currentUser);
    renderUserPlaylists();
    openPlaylist(playlistId);
}

function deleteCurrentPlaylist() {
    if (!currentUser || !currentViewedPlaylistId || !confirm("Sei sicuro di eliminare questa playlist?")) return;

    const playlistIdToDelete = currentViewedPlaylistId;

    currentUser.playlists = currentUser.playlists.filter(p => p.id !== playlistIdToDelete);
    saveCurrentUser(currentUser);

    let shared = getFromLocalStorage(DB_SHARED);
    let updatedShared = shared.filter(s => !(s.ownerId === currentUser.id && s.playlistId === playlistIdToDelete));
    saveToLocalStorage(DB_SHARED, updatedShared);

    currentViewedPlaylistId = null;
    renderUserPlaylists();
    // aggiorna sedebar e torna alla home 
    showView('view-home');
}

// --- GESTIONE CONDIVISIONI ---
function openShareModal() {
    if (!currentUser || !currentViewedPlaylistId) return;

    const allComm = getFromLocalStorage(DB_COMMUNITIES);
    const shared = getFromLocalStorage(DB_SHARED);

    const myCommunities = allComm.filter(c => c.members?.includes(currentUser.id));
    const listContainer = document.getElementById('modal-share-list');

    // mostra il messaggio + il bottone per creare comunità se non si partecipa neanche a una 
    if (myCommunities.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center mt-3 pb-2">
                <p class="text-body-secondary small mb-3">Non fai ancora parte di nessuna comunità.</p>
                <button class="btn btn-brand rounded-pill fw-bold w-100 shadow-sm" onclick="goToCreateCommunityFromShare()">
                    <i class="bi bi-plus-lg me-2"></i> Crea una Comunità
                </button>
            </div>`;
    } else {
        // Altrimenti mostra la lista classica
        listContainer.innerHTML = myCommunities.map(comm => {
            const isShared = shared.some(s => s.ownerId === currentUser.id && s.playlistId === currentViewedPlaylistId && s.communityId === comm.id);
            const actionBtn = isShared
                ? `<button class="btn btn-sm btn-danger rounded-pill shadow-sm" onclick="removePlaylistShare('${comm.id}')">Rimuovi</button>`
                : `<button class="btn btn-sm btn-outline-primary rounded-pill shadow-sm" onclick="sharePlaylistWithCommunity('${comm.id}')">Condividi</button>`;

            return `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 border border-secondary-subtle rounded ${isShared ? 'bg-body-tertiary' : ''}">
                    <span class="fw-bold text-truncate" style="max-width: 140px;" title="${comm.name}"><i class="bi bi-globe me-2 text-brand"></i>${comm.name}</span>
                    ${actionBtn}
                </div>`;
        }).join('');
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCondividi')).show();
}

// chiudere il condividi e apre la creazione comunità
function goToCreateCommunityFromShare() {
    bootstrap.Modal.getInstance(document.getElementById('modalCondividi'))?.hide();
    openCommunityModal();

    setTimeout(() => {
        showCommunityTab('crea');
    }, 250);
}

// Aggiungono o rimuovono la playlist dalla tabella DB_SHARED
function sharePlaylistWithCommunity(communityId) {
    const pl = currentUser.playlists.find(p => p.id === currentViewedPlaylistId);
    let shared = getFromLocalStorage(DB_SHARED);
    shared.push({ id: 'sh_' + Date.now(), ownerId: currentUser.id, ownerName: currentUser.username, playlistId: pl.id, communityId: communityId, playlist: JSON.parse(JSON.stringify(pl)) });
    saveToLocalStorage(DB_SHARED, shared);
    openShareModal();
}

function removePlaylistShare(communityId) {
    let shared = getFromLocalStorage(DB_SHARED).filter(s => !(s.ownerId === currentUser.id && s.playlistId === currentViewedPlaylistId && s.communityId === communityId));
    saveToLocalStorage(DB_SHARED, shared);
    openShareModal();
}

// GESTIONE TAG SPOTIFY -> 
async function loadSpotifyCategories() {
    if (categoriesLoaded) return;
    const menu = document.getElementById('dropdownTagsMenu');
    try {
        const token = await APIController.getToken();
        const categories = await APIController.getCategories(token);
        menu.innerHTML = categories.map(cat => `<li><label class="dropdown-item d-flex align-items-center gap-2"><input type="checkbox" class="form-check-input mt-0 tag-checkbox" value="${cat.name}"> ${cat.name}</label></li>`).join('');
        menu.querySelectorAll('.tag-checkbox').forEach(cb => cb.addEventListener('change', (e) => {
            if (e.target.checked && !selectedPlaylistTags.includes(e.target.value)) selectedPlaylistTags.push(e.target.value);
            else selectedPlaylistTags = selectedPlaylistTags.filter(t => t !== e.target.value);
            updatePlaylistTagsUI();
        }));
        categoriesLoaded = true;
    } catch (e) { menu.innerHTML = '<li><span class="text-danger">Errore API</span></li>'; }
}

function updatePlaylistTagsUI() {
    const container = document.getElementById('selected-tags-container');
    const btnText = document.getElementById('dropdownTagsBtn');
    if (selectedPlaylistTags.length === 0) {
        container.innerHTML = '';
        btnText.innerHTML = 'Seleziona tag... <i class="bi bi-chevron-down"></i>';
    } else {
        btnText.innerHTML = `${selectedPlaylistTags.length} tag <i class="bi bi-chevron-down"></i>`;
        container.innerHTML = selectedPlaylistTags.map(tag => `
            <span class="badge badge-tag-selected d-flex align-items-center gap-1 p-2 rounded-pill">
                ${tag} <i class="bi bi-x-circle-fill hover-light" style="cursor:pointer;" onclick="removeTag('${tag}')"></i>
            </span>`).join('');
    }
    document.querySelectorAll('.tag-checkbox').forEach(cb => cb.checked = selectedPlaylistTags.includes(cb.value));
}

function removeTag(tag) { selectedPlaylistTags = selectedPlaylistTags.filter(t => t !== tag); updatePlaylistTagsUI(); }

// rinominare al volo la playlist
function editCurrentPlaylistName() {
    if (!currentUser || !currentViewedPlaylistId) return;

    const pl = currentUser.playlists.find(p => p.id === currentViewedPlaylistId);
    if (!pl) return;

    const newName = prompt("Inserisci il nuovo nome della playlist:", pl.name);

    if (!newName || !newName.trim()) return;

    pl.name = newName.trim();

    saveCurrentUser(currentUser);
    renderUserPlaylists();
    openPlaylist(currentViewedPlaylistId);
}