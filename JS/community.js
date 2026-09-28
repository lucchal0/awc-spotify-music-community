/**
 * Alessandro Lucchesi - community.js 
 * Gestione Comunità, Bacheca Condivisioni e Membri
 */

let currentCommunityId = null;

// --- STAMPA COMUNITÀ ---
function renderUserCommunities() {
    let htmlToRender = '';

    if (!currentUser) {
        htmlToRender = `<div class="col-12 text-center py-5 bg-body-tertiary rounded-4 border border-secondary-subtle border-dashed"><i class="bi bi-globe text-body-secondary mb-3 d-inline-block" style="font-size: 3rem; opacity: 0.5;"></i><h4 class="fw-bold text-body">Accedi per vedere le comunità</h4></div>`;
    } else {
        
        const myComm = getFromLocalStorage(DB_COMMUNITIES).filter(c => c.members?.includes(currentUser.id));

        if (myComm.length === 0) {
            htmlToRender = `<div class="col-12 text-center py-5 bg-body-tertiary rounded-4 border border-secondary-subtle border-dashed"><i class="bi bi-globe text-body-secondary mb-3 d-inline-block" style="font-size: 3rem; opacity: 0.5;"></i><h4 class="fw-bold text-body">Nessuna comunità</h4><p class="text-body-secondary mb-0">Esplora o crea nuovi gruppi!</p></div>`;
        } else {
            htmlToRender = myComm.map(c => `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card bg-body-tertiary text-body h-100 p-3 border border-secondary-subtle rounded-3 hover-card">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h3 class="card-title fs-5 fw-bold mb-0 text-truncate"><i class="bi bi-globe text-brand me-2"></i>${c.name}</h3>
                            <span class="badge bg-secondary rounded-pill"><i class="bi bi-people-fill me-1"></i>${c.members.length}</span>
                        </div>
                        <p class="card-text text-body-secondary small mb-2 text-truncate">${c.description || 'Nessuna descrizione.'}</p>
                        ${c.tags?.length ? `<div class="mt-2 text-truncate">${c.tags.map(t => `<span class="badge text-bg-secondary me-1" style="font-size: 0.65rem;">${t}</span>`).join('')}</div>` : ''}
                        <button class="btn btn-outline-primary btn-sm rounded-pill w-100 mt-3 fw-bold" onclick="openCommunityBoard('${c.id}')">Entra nella Bacheca</button>
                    </div>
                </div>`).join('');
        }
    }

    ['home-communities-grid', 'my-communities-grid'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = htmlToRender;
    });
}

// --- (Esplora / Crea) ---
let selectedCommTags = [];
let commCategoriesLoaded = false;

function openCommunityModal() {
    if (!currentUser) return requireLogin(null);
    document.getElementById('search-community-input').value = '';
    showCommunityTab('esplora');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCommunity')).show();
}

function showCommunityTab(tab) {
    const isEsplora = (tab === 'esplora');
    document.getElementById('tab-esplora').classList.toggle('d-none', !isEsplora);
    document.getElementById('tab-crea').classList.toggle('d-none', isEsplora);
    document.querySelector('#communityTabs a:nth-child(1)').classList.toggle('active', isEsplora);
    document.querySelector('#communityTabs li:nth-child(2) a').classList.toggle('active', !isEsplora);

    if (isEsplora) {
        document.getElementById('form-community').reset();
        document.getElementById('comm-edit-id').value = '';
        document.getElementById('btn-save-comm').innerText = "Crea Comunità";
        selectedCommTags = [];
        updateCommunityTagsUI();
        renderCommunitySearchResults();
    }
}

function renderCommunitySearchResults() {
    const query = document.getElementById('search-community-input').value.trim().toLowerCase();
    let allComm = getFromLocalStorage(DB_COMMUNITIES);

    if (query) {
        allComm = allComm.filter(c => c.name.toLowerCase().includes(query) || c.tags?.some(t => t.toLowerCase().includes(query)));
    }

    const listDiv = document.getElementById('modal-communities-list');
    if (allComm.length === 0) return listDiv.innerHTML = '<p class="text-center text-body-secondary small mt-4">Nessuna comunità trovata.</p>';

    listDiv.innerHTML = allComm.map(c => {
        const isMember = c.members?.includes(currentUser.id);
        const isCreator = c.creatorId === currentUser.id;

        let buttonsHtml = `<button class="btn btn-sm btn-brand rounded-pill shadow-sm" onclick="joinCommunity('${c.id}')">+ Unisciti</button>`;
        if (isMember) {
            buttonsHtml = isCreator
                ? `<button class="btn btn-sm btn-outline-secondary rounded-pill me-1 shadow-sm" onclick="editCommunity('${c.id}')"><i class="bi bi-pencil"></i></button>
                   <button class="btn btn-sm btn-danger rounded-pill shadow-sm" onclick="deleteCommunity('${c.id}')"><i class="bi bi-trash"></i></button>`
                : `<button class="btn btn-sm btn-outline-danger rounded-pill shadow-sm" onclick="leaveCommunity('${c.id}')">Abbandona</button>`;
        }

        return `
            <div class="d-flex flex-column mb-3 p-3 border border-secondary-subtle rounded bg-body-tertiary">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div style="flex: 1;">
                        <h6 class="fw-bold mb-1"><i class="bi bi-globe text-brand me-1"></i> ${c.name}</h6>
                        <div class="small text-body-secondary mb-2 pe-3">${c.description || ''}</div>
                        <span class="badge bg-light text-dark border"><i class="bi bi-people-fill me-1"></i> ${c.members.length} membri</span>
                    </div>
                    <div class="d-flex align-items-center">${buttonsHtml}</div>
                </div>
            </div>`;
    }).join('');
}

function handleSaveCommunity(e) {
    e.preventDefault();
    if (!currentUser) return;

    const id = document.getElementById('comm-edit-id').value;
    let all = getFromLocalStorage(DB_COMMUNITIES);

    if (id) {
        const idx = all.findIndex(c => c.id === id);
        if (idx !== -1) {
            all[idx].name = document.getElementById('comm-name').value.trim();
            all[idx].description = document.getElementById('comm-desc').value.trim();
            all[idx].tags = [...selectedCommTags];
        }
    } else {
        all.push({
            id: 'comm_' + Date.now(),
            name: document.getElementById('comm-name').value.trim(),
            description: document.getElementById('comm-desc').value.trim(),
            tags: [...selectedCommTags],
            creatorId: currentUser.id,
            members: [currentUser.id]
        });
    }
    saveToLocalStorage(DB_COMMUNITIES, all);
    renderUserCommunities();
    showCommunityTab('esplora');
}

function editCommunity(id) {
    const c = getFromLocalStorage(DB_COMMUNITIES).find(x => x.id === id);
    if (!c) return;
    showCommunityTab('crea');
    document.querySelector('#communityTabs li:nth-child(2) a').innerText = "Modifica";
    document.getElementById('btn-save-comm').innerText = "Salva Modifiche";
    document.getElementById('comm-edit-id').value = c.id;
    document.getElementById('comm-name').value = c.name;
    document.getElementById('comm-desc').value = c.description || '';
    selectedCommTags = [...(c.tags || [])];
    updateCommunityTagsUI();
}

function joinCommunity(id) {
    let all = getFromLocalStorage(DB_COMMUNITIES);
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1 && !all[idx].members.includes(currentUser.id)) {
        all[idx].members.push(currentUser.id);
        saveToLocalStorage(DB_COMMUNITIES, all);
        renderCommunitySearchResults(); renderUserCommunities();
    }
}

function leaveCommunity(id) {
    let all = getFromLocalStorage(DB_COMMUNITIES);
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1) {
        all[idx].members = all[idx].members.filter(m => m !== currentUser.id);
        saveToLocalStorage(DB_COMMUNITIES, all);
        let shared = getFromLocalStorage(DB_SHARED).filter(s => !(s.ownerId === currentUser.id && s.communityId === id));
        saveToLocalStorage(DB_SHARED, shared);
        renderCommunitySearchResults(); renderUserCommunities();
    }
}

function deleteCommunity(id) {
    if (!confirm("Eliminare la comunità eliminerà anche tutte le playlist condivise. Procedere?")) return;
    saveToLocalStorage(DB_COMMUNITIES, getFromLocalStorage(DB_COMMUNITIES).filter(c => c.id !== id));
    saveToLocalStorage(DB_SHARED, getFromLocalStorage(DB_SHARED).filter(s => s.communityId !== id)); // cancellazione a cascata delle condivisioni
    renderCommunitySearchResults(); renderUserCommunities();
}

// ---TAG CATEGORIE ---
async function loadCommSpotifyCategories() {
    if (commCategoriesLoaded) return;
    const menu = document.getElementById('commTagsMenu');
    try {
        const token = await APIController.getToken();
        const categories = await APIController.getCategories(token);
        menu.innerHTML = categories.map(cat => `<li><label class="dropdown-item d-flex align-items-center gap-2"><input type="checkbox" class="form-check-input mt-0 comm-tag-cb" value="${cat.name}"> ${cat.name}</label></li>`).join('');
        menu.querySelectorAll('.comm-tag-cb').forEach(cb => cb.addEventListener('change', (e) => {
            if (e.target.checked && !selectedCommTags.includes(e.target.value)) selectedCommTags.push(e.target.value);
            else selectedCommTags = selectedCommTags.filter(t => t !== e.target.value);
            updateCommunityTagsUI();
        }));
        commCategoriesLoaded = true;
        updateCommunityTagsUI();
    } catch (e) { menu.innerHTML = '<li><span class="text-danger">Errore API</span></li>'; }
}

function updateCommunityTagsUI() {
    const container = document.getElementById('comm-selected-tags-container');
    const btnText = document.getElementById('commTagsBtn');
    if (selectedCommTags.length === 0) {
        container.innerHTML = '';
        btnText.innerHTML = 'Seleziona tag... <i class="bi bi-chevron-down"></i>';
    } else {
        btnText.innerHTML = `${selectedCommTags.length} tag <i class="bi bi-chevron-down"></i>`;
        container.innerHTML = selectedCommTags.map(tag => `
            <span class="badge badge-tag-selected d-flex align-items-center gap-1 p-2 rounded-pill">
                ${tag} <i class="bi bi-x-circle-fill hover-light" style="cursor:pointer;" onclick="removeCommTag('${tag}')"></i>
            </span>`).join('');
    }
    document.querySelectorAll('.comm-tag-cb').forEach(cb => cb.checked = selectedCommTags.includes(cb.value));
}

function removeCommTag(tag) { selectedCommTags = selectedCommTags.filter(t => t !== tag); updateCommunityTagsUI(); }

// --- BACHECA DELLA COMUNITÀ E GESTIONE MEMBRI  ---
// bachaca pubblica della commuity
function openCommunityBoard(communityId, query = '') {
    currentCommunityId = communityId;

    const comm = getFromLocalStorage(DB_COMMUNITIES).find(c => c.id === communityId);
    if (!comm) return;

    document.getElementById('board-title').innerText = comm.name;
    document.getElementById('board-desc').innerText = comm.description || 'Nessuna descrizione.';

    document.getElementById('board-info').innerHTML = `
        <button class="btn btn-sm btn-outline-secondary mt-2 rounded-pill fw-bold shadow-sm" onclick="showCommunityMembers('${comm.id}')">
            <i class="bi bi-people-fill me-1"></i> Vedi i ${comm.members.length} iscritti e i loro gusti musicali
        </button>`;

    let boardPlaylists = getFromLocalStorage(DB_SHARED).filter(s => s.communityId === communityId);

    if (query) {
        query = query.toLowerCase();

        boardPlaylists = boardPlaylists.filter(s => {
            const tags = s.playlist.tags || [];
            const songs = s.playlist.songs || [];

            const matchTag = tags.some(tag =>
                tag.toLowerCase().includes(query)
            );

            const matchSong = songs.some(song =>
                song.titolo.toLowerCase().includes(query) ||
                song.cantante.toLowerCase().includes(query)
            );

            return matchTag || matchSong;
        });
    }
    const grid = document.getElementById('board-playlists-grid');

    if (boardPlaylists.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center py-5 bg-body-tertiary rounded-4 border border-secondary-subtle border-dashed"><i class="bi bi-music-note-list mb-3 text-body-secondary d-inline-block" style="font-size: 3rem; opacity: 0.5;"></i><h5 class="fw-bold text-body">Nessuna playlist condivisa</h5></div>`;
    } else {
        grid.innerHTML = boardPlaylists.map(s => `
            <div class="col-6 col-md-4 col-lg-3 col-xl-2">
                <div class="card bg-body-tertiary text-body h-100 p-3 border border-secondary-subtle rounded-3 hover-card" onclick="openSharedPlaylist('${s.id}')">
                    <img src="${s.playlist.cover}" class="card-img-top mb-2 rounded-2 shadow" style="aspect-ratio: 1/1; object-fit: cover;">
                    <div class="card-body p-0">
                        <h3 class="card-title fs-6 fw-bold mb-1 text-truncate">${s.playlist.name}</h3>
                        <p class="card-text text-body-secondary small mb-0 text-truncate"><i class="bi bi-person-circle me-1"></i> ${s.ownerId === currentUser.id ? 'Tu' : s.ownerName}</p>
                        <p class="card-text text-body-secondary small mt-1">${s.playlist.songs?.length || 0} brani</p>
                    </div>
                </div>
            </div>`).join('');
    }
    showView('view-community-board');
}

// mostra preferenze musicali degli altri utenti della comunità
function showCommunityMembers(commId) {
    const comm = getFromLocalStorage(DB_COMMUNITIES).find(c => c.id === commId);
    if (!comm) return;

    const allUsers = getFromLocalStorage(DB_USERS);
    const membersHtml = comm.members.map(memberId => {
        const u = allUsers.find(x => x.id === memberId);
        if (!u) return '';
        const isMe = currentUser && u.id === currentUser.id;
        const genres = u.genres && u.genres.length > 0 ? u.genres.join(', ') : 'Nessuno';
        const artists = u.artists && u.artists.length > 0 ? u.artists.join(', ') : 'Nessuno';

        return `
            <div class="p-3 mb-3 border border-secondary-subtle rounded bg-body-tertiary hover-card">
                <div class="fw-bold fs-6 text-brand mb-2"><i class="bi bi-person-circle me-1"></i> ${u.username} ${isMe ? '<span class="badge bg-secondary ms-2 small">Tu</span>' : ''}</div>
                <div class="small text-body mb-1"><strong>Generi Preferiti:</strong> <span class="text-body-secondary">${genres}</span></div>
                <div class="small text-body"><strong>Artisti Preferiti:</strong> <span class="text-body-secondary">${artists}</span></div>
            </div>`;
    }).join('');

    let existingModal = document.getElementById('modalMembers');
    if (existingModal) existingModal.remove();

    const modalHtml = `
    <div class="modal fade" id="modalMembers" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content bg-body border-secondary-subtle shadow-lg">
                <div class="modal-header border-bottom border-secondary-subtle">
                    <h5 class="modal-title fw-bold"><i class="bi bi-people me-2"></i> Membri della Comunità</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body py-3">
                    ${membersHtml}
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalMembers')).show();
}

let currentSharedPlaylistData = null;

function openSharedPlaylist(sharedId) {
    const s = getFromLocalStorage(DB_SHARED).find(x => x.id === sharedId);
    if (!s) return;
    currentSharedPlaylistData = s;
    const pl = s.playlist;
    const isMine = (s.ownerId === currentUser.id);

    document.getElementById('pl-detail-image').src = pl.cover;
    document.getElementById('pl-detail-title').innerText = pl.name;
    document.getElementById('pl-detail-desc').innerText = pl.description || 'Nessuna descrizione';
    document.getElementById('pl-detail-info').innerHTML = `<i class="bi bi-person-circle me-1"></i> Condivisa da: <strong>${isMine ? 'Te' : s.ownerName}</strong> • ${pl.songs?.length || 0} brani`;

    ['btn-pl-share', 'btn-pl-add', 'btn-pl-delete', 'btn-pl-edit-name'].forEach(id => document.getElementById(id).classList.add('d-none'));

    const importBtn = document.getElementById('btn-pl-import');
    if (isMine) {
        importBtn.classList.add('d-none');
    } else {
        importBtn.classList.remove('d-none');
        if ((currentUser.playlists || []).some(myPl => myPl.originalId === pl.id)) {
            importBtn.innerHTML = `<i class="bi bi-check-circle me-2"></i> Già Importata`;
            importBtn.disabled = true;
            importBtn.className = "btn btn-outline-success rounded-pill fw-bold px-3 d-flex align-items-center";
        } else {
            importBtn.innerHTML = `<i class="bi bi-download me-2"></i> Importa`;
            importBtn.disabled = false;
            importBtn.className = "btn btn-success rounded-pill fw-bold px-3 d-flex align-items-center";
        }
    }

    const tbody = document.getElementById('pl-detail-tbody');
    if (!pl.songs?.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-body-secondary">Nessun brano in questa playlist.</td></tr>`;
    } else {
        tbody.innerHTML = pl.songs.map((song, i) => `
            <tr class="hover-card align-middle" onclick="playTrack('${encodeURIComponent(song.titolo)}', '${encodeURIComponent(song.cantante)}', '${song.immagine}')">
                <td class="text-body-secondary text-center">${i + 1}</td>
                <td><div class="d-flex align-items-center"><img src="${song.immagine}" class="me-3 rounded shadow-sm" style="width:40px;height:40px;"><div><div class="fw-bold text-body">${song.titolo}</div><div class="small text-body-secondary">${song.cantante}</div></div></div></td>
                <td class="text-body-secondary d-none d-md-table-cell">${song.anno}</td>
                <td class="text-body-secondary text-end">${song.durata}</td>
                <td class="text-end"></td>
            </tr>`).join('');
    }
    showView('view-playlist');
}

function importCurrentSharedPlaylist() {
    if (!currentSharedPlaylistData || !currentUser) return;
    if (!currentUser.playlists) currentUser.playlists = [];

    let imported = JSON.parse(JSON.stringify(currentSharedPlaylistData.playlist));
    imported.id = 'pl_' + Date.now();
    imported.originalId = currentSharedPlaylistData.playlist.id;
    imported.name += ' (Importata)';

    currentUser.playlists.push(imported);
    saveCurrentUser(currentUser);
    alert('Playlist importata con successo!');
    openSharedPlaylist(currentSharedPlaylistData.id);
    renderUserPlaylists();
}

function filterSharedPlaylists() {
    const query = document
        .getElementById('search-shared-playlists')
        .value
        .trim();

    if (currentCommunityId) {
        openCommunityBoard(currentCommunityId, query);
    }
}