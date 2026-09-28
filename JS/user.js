/**
 * Alessandro Lucchesi - user.js 
 * Gestione Utenti, Sessione, Profilo
 */

const DB_USERS = 'sn4m_users';
const DB_COMMUNITIES = 'sn4m_communities';
const DB_SHARED = 'sn4m_shared_playlists';

function getFromLocalStorage(key) { return JSON.parse(localStorage.getItem(key)) || []; } 
function saveToLocalStorage(key, data) { localStorage.setItem(key, JSON.stringify(data)); }  

let currentUser = JSON.parse(localStorage.getItem('sn4m_currentUser')) || null;

//aggiorna dati utente loggato
function saveCurrentUser(updatedUser) {
    let users = getFromLocalStorage(DB_USERS);
    const index = users.findIndex(u => u.id === updatedUser.id);

    if (index !== -1) {
        users[index] = updatedUser;
        saveToLocalStorage(DB_USERS, users);
        currentUser = updatedUser;
        localStorage.setItem('sn4m_currentUser', JSON.stringify(currentUser));

        // Se aggiungi o togli un brano da una tua playlist, si aggiorna anche nella Bacheca
        let shared = getFromLocalStorage(DB_SHARED);
        let sharedUpdated = false;

        shared.forEach(s => {
            if (s.ownerId === currentUser.id) {
                const updatedPl = currentUser.playlists.find(p => p.id === s.playlistId);
                if (updatedPl) {
                    s.playlist = JSON.parse(JSON.stringify(updatedPl)); 
                    sharedUpdated = true;
                }
            }
        });

        if (sharedUpdated) saveToLocalStorage(DB_SHARED, shared);
    }
}

// --- GESTIONE GENERI & ARTISTI (REGISTRAZIONE) ---
let selectedRegGenres = [];
let selectedRegArtists = [];
let regCategoriesLoaded = false;
let regArtistTimeout = null;

const genreBadgeClass = "text-bg-primary"; 
const artistBadgeClass = "text-bg-dark";  

// scarica in modo asincrono le categorie musicali di spotify
async function loadRegSpotifyCategories() {
    if (regCategoriesLoaded) return; 

    const menu = document.getElementById('regTagsMenu');

    try {
        const token = await APIController.getToken();
        const categories = await APIController.getCategories(token);
        menu.innerHTML = categories.map(cat => `<li><label class="dropdown-item d-flex align-items-center gap-2"><input type="checkbox" class="form-check-input mt-0 reg-tag-cb" value="${cat.name}"> ${cat.name}</label></li>`).join('');
        menu.querySelectorAll('.reg-tag-cb').forEach(cb => cb.addEventListener('change', (e) => {
            if (e.target.checked && !selectedRegGenres.includes(e.target.value)) selectedRegGenres.push(e.target.value);
            else selectedRegGenres = selectedRegGenres.filter(t => t !== e.target.value);
             updateRegistrationGenresUI();
        }));
        regCategoriesLoaded = true;
    } catch (e) { menu.innerHTML = '<li><span class="text-danger">Errore API</span></li>'; }
}
function updateRegistrationGenresUI() {
    const container = document.getElementById('reg-selected-tags-container');
    const btnText = document.getElementById('regTagsBtn');
    if (selectedRegGenres.length === 0) {
        container.innerHTML = '';
        btnText.innerHTML = 'Seleziona Generi Preferiti... <i class="bi bi-chevron-down"></i>';
    } else {
        btnText.innerHTML = `${selectedRegGenres.length} generi <i class="bi bi-chevron-down"></i>`;
        container.innerHTML = selectedRegGenres.map(tag => `
            <span class="badge badge-tag-selected d-flex align-items-center gap-1 p-2 rounded-pill">
                ${tag} <i class="bi bi-x-circle-fill hover-light" style="cursor:pointer;" onclick="removeRegTag('${tag}')"></i>
            </span>`).join('');
    }
    document.querySelectorAll('.reg-tag-cb').forEach(cb => cb.checked = selectedRegGenres.includes(cb.value));
}

function removeRegTag(tag) { selectedRegGenres = selectedRegGenres.filter(t => t !== tag); updateRegistrationGenresUI(); }

// Ricerca Live Artisti (Registrazione)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('reg-artist-search')?.addEventListener('input', (e) => handleArtistSearch(e, 'reg'));
    document.getElementById('edit-artist-search')?.addEventListener('input', (e) => handleArtistSearch(e, 'edit'));

    // Chiude le tendine se clicchi fuori
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#reg-artist-search') && !e.target.closest('#reg-artist-results')) document.getElementById('reg-artist-results')?.classList.add('d-none');
        if (!e.target.closest('#edit-artist-search') && !e.target.closest('#edit-artist-results')) document.getElementById('edit-artist-results')?.classList.add('d-none');
    });
});

function handleArtistSearch(e, mode) {
    clearTimeout(regArtistTimeout);
    const query = e.target.value.trim();
    const resultsDiv = document.getElementById(`${mode}-artist-results`);

    if (query.length < 2) return resultsDiv.classList.add('d-none');

    resultsDiv.innerHTML = '<div class="text-center p-2 small"><div class="spinner-border spinner-border-sm text-brand"></div></div>';
    resultsDiv.classList.remove('d-none');

    regArtistTimeout = setTimeout(async () => {
        try {
            const token = await APIController.getToken();
            const artists = await APIController.searchArtist(token, query);
            if (artists.length === 0) return resultsDiv.innerHTML = '<div class="p-2 small text-body-secondary text-center">Nessun artista trovato</div>';

            resultsDiv.innerHTML = artists.map(a => {
                const safeName = a.name.replace(/'/g, "\\'"); 
                return `
                <div class="d-flex align-items-center p-2 border-bottom border-secondary-subtle hover-card" style="cursor:pointer;" onclick="addArtist('${safeName}', '${mode}')">
                    <img src="${a.immagine}" class="rounded-circle me-2 shadow-sm" style="width:30px; height:30px; object-fit:cover;">
                    <span class="small fw-bold text-body">${a.name}</span>
                </div>`;
            }).join('');
        } catch (err) { resultsDiv.innerHTML = '<div class="p-2 small text-danger text-center">Errore API</div>'; }
    }, 400);
}

function addArtist(name, mode) {
    if (mode === 'reg') {
        if (!selectedRegArtists.includes(name)) selectedRegArtists.push(name);
        document.getElementById('reg-artist-search').value = '';
        document.getElementById('reg-artist-results').classList.add('d-none');
        updateRegistrationArtistsUI();
    } else {
        if (!selectedEditArtists.includes(name)) selectedEditArtists.push(name);
        document.getElementById('edit-artist-search').value = '';
        document.getElementById('edit-artist-results').classList.add('d-none');
        updateProfileArtistsUI();
    }
}

// badge con nume artista
function updateRegistrationArtistsUI() {
    const container = document.getElementById('reg-selected-artists-container');
    container.innerHTML = selectedRegArtists.map(a => `<span class="badge ${artistBadgeClass} d-flex align-items-center gap-1 p-2">${a} <i class="bi bi-x-circle-fill hover-light" style="cursor:pointer;" onclick="removeArtist('${a.replace(/'/g, "\\'")}', 'reg')"></i></span>`).join('');
}
function updateProfileArtistsUI() {
    const container = document.getElementById('edit-selected-artists-container');
    container.innerHTML = selectedEditArtists.map(a => `<span class="badge ${artistBadgeClass} d-flex align-items-center gap-1 p-2">${a} <i class="bi bi-x-circle-fill hover-light" style="cursor:pointer;" onclick="removeArtist('${a.replace(/'/g, "\\'")}', 'edit')"></i></span>`).join('');
}
function removeArtist(name, mode) {
    if (mode === 'reg') { selectedRegArtists = selectedRegArtists.filter(a => a !== name); updateRegistrationArtistsUI(); }
    else { selectedEditArtists = selectedEditArtists.filter(a => a !== name); updateProfileArtistsUI(); }
}


// --- REGISTRAZIONE E LOGIN ---
function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    let users = getFromLocalStorage(DB_USERS);
    if (users.some(u => u.email === email)) return alert("Questa email è già registrata. Effettua il login!");

    users.push({
        id: 'user_' + Date.now(),
        username, email, password,
        genres: [...selectedRegGenres],
        artists: [...selectedRegArtists],
        playlists: []
    });

    saveToLocalStorage(DB_USERS, users);
    alert("Registrazione completata! Ora puoi fare il login.");

    document.getElementById('form-register').reset();
    selectedRegGenres = []; selectedRegArtists = [];
    updateRegistrationGenresUI(); updateRegistrationArtistsUI();
    toggleAuthForms();
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const user = getFromLocalStorage(DB_USERS).find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('sn4m_currentUser', JSON.stringify(user));
        updateUIAfterLogin();
        document.getElementById('form-login').reset();
    } else alert("Email o password errati.");
}

// --- GESTIONE PROFILO (MODIFICA / ELIMINA) ---
let selectedEditGenres = [];
let selectedEditArtists = [];
let editCategoriesLoaded = false;

function updateUIAfterLogin() {
    isLoggedIn = true;
    document.getElementById('btn-login-header').classList.add('d-none');

    const profileBtn = document.getElementById('btn-profile-header');
    profileBtn.classList.remove('d-none');
    profileBtn.innerHTML = `<i class="bi bi-person-circle fs-5 me-2"></i> ${currentUser.username}`;

    document.getElementById('profile-modal-username').innerText = currentUser.username;
    document.getElementById('edit-username').value = currentUser.username || '';
    document.getElementById('edit-email').value = currentUser.email || '';

    selectedEditGenres = [...(currentUser.genres || [])];
    selectedEditArtists = [...(currentUser.artists || [])];
    updateProfileGenresUI();
    updateProfileArtistsUI();

    // cambio della UI: swap benvenuto con dashbord utente
    document.getElementById('home-guest')?.classList.add('d-none');
    document.getElementById('home-logged')?.classList.remove('d-none');

    showView('view-home');
    if (typeof renderUserPlaylists === 'function') renderUserPlaylists();
    if (typeof renderUserCommunities === 'function') renderUserCommunities();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('sn4m_currentUser'); // Distrugge il token/oggetto di sessione dal browser,
    isLoggedIn = false;

    document.getElementById('btn-login-header').classList.remove('d-none');
    document.getElementById('btn-profile-header').classList.add('d-none');
    document.getElementById('home-guest').classList.remove('d-none');
    document.getElementById('home-logged').classList.add('d-none');

    bootstrap.Modal.getInstance(document.getElementById('modalProfilo'))?.hide();
    showView('view-home');
    setActiveNav(document.querySelector('.nav-link'));
}

async function loadEditSpotifyCategories() {
    if (editCategoriesLoaded) return;
    const menu = document.getElementById('editTagsMenu');
    try {
        const token = await APIController.getToken();
        const categories = await APIController.getCategories(token);
        menu.innerHTML = categories.map(cat => `<li><label class="dropdown-item d-flex align-items-center gap-2"><input type="checkbox" class="form-check-input mt-0 edit-tag-cb" value="${cat.name}"> ${cat.name}</label></li>`).join('');
        menu.querySelectorAll('.edit-tag-cb').forEach(cb => cb.addEventListener('change', (e) => {
            if (e.target.checked && !selectedEditGenres.includes(e.target.value)) selectedEditGenres.push(e.target.value);
            else selectedEditGenres = selectedEditGenres.filter(t => t !== e.target.value);
            updateProfileGenresUI();
        }));
        editCategoriesLoaded = true; updateProfileGenresUI();
    } catch (e) { menu.innerHTML = '<li><span class="text-danger">Errore API</span></li>'; }
}

function updateProfileGenresUI() {
    const container = document.getElementById('edit-selected-tags-container');
    const btnText = document.getElementById('editTagsBtn');
    if (!container || !btnText) return;
    if (selectedEditGenres.length === 0) {
        container.innerHTML = '';
        btnText.innerHTML = 'Seleziona Generi... <i class="bi bi-chevron-down"></i>';
    } else {
        btnText.innerHTML = `${selectedEditGenres.length} generi <i class="bi bi-chevron-down"></i>`;
        container.innerHTML = selectedEditGenres.map(tag => `
            <span class="badge badge-tag-selected d-flex align-items-center gap-1 p-2 rounded-pill">
                ${tag} <i class="bi bi-x-circle-fill hover-light" style="cursor:pointer;" onclick="removeEditTag('${tag}')"></i>
            </span>`).join('');
    }
    document.querySelectorAll('.edit-tag-cb').forEach(cb => cb.checked = selectedEditGenres.includes(cb.value));
}

function removeEditTag(tag) {
    selectedEditGenres = selectedEditGenres.filter(t => t !== tag);
    updateProfileGenresUI();
}

// salva modifiche apportate dall'utente al profilo
function handleUpdateProfile(e) {
    e.preventDefault();
    if (!currentUser) return;

    const newEmail = document.getElementById('edit-email').value.trim();
    if (getFromLocalStorage(DB_USERS).some(u => u.email === newEmail && u.id !== currentUser.id)) return alert("Questa email è già in uso.");

    currentUser.username = document.getElementById('edit-username').value.trim();
    currentUser.email = newEmail;
    currentUser.genres = [...selectedEditGenres];
    currentUser.artists = [...selectedEditArtists];

    saveCurrentUser(currentUser);
    document.getElementById('profile-modal-username').innerText = currentUser.username;
    document.getElementById('btn-profile-header').innerHTML = `<i class="bi bi-person-circle fs-5 me-2"></i> ${currentUser.username}`;

    alert("Profilo aggiornato con successo!");
    bootstrap.Modal.getInstance(document.getElementById('modalProfilo'))?.hide();
}

function handleDeleteAccount() {
    if (!currentUser || !confirm("Sei sicuro di voler eliminare definitivamente il tuo account?")) return;
    const myId = currentUser.id;
    saveToLocalStorage(DB_USERS, getFromLocalStorage(DB_USERS).filter(u => u.id !== myId));

    let communities = getFromLocalStorage(DB_COMMUNITIES).map(c => { c.members = c.members.filter(m => m !== myId); return c; });
    saveToLocalStorage(DB_COMMUNITIES, communities.filter(c => c.creatorId !== myId)); // elimina tutte le communities create
    saveToLocalStorage(DB_SHARED, getFromLocalStorage(DB_SHARED).filter(s => s.ownerId !== myId)); // elimina communities condivise

    alert("Il tuo account è stato eliminato.");
    handleLogout(); // ripulisce tutto
}

document.addEventListener('DOMContentLoaded', () => { if (currentUser) updateUIAfterLogin(); }); // se utente è gia resgistro e accede al sito è già loggato