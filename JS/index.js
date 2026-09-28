/**
 * Alessandro Lucchesi - index.js 
 * Gestione Tema e Inizializzazione Interfaccia
 */

let isLoggedIn = false;

// Gestione cambio vista
function showView(viewId) {
    closeSearch();
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('d-none')); 
    document.getElementById(viewId)?.classList.remove('d-none');
}

// Evidenzia pulsante attivo nella Sidebar
function setActiveNav(elementClicked) {
    document.querySelectorAll('.nav-link, .d-md-none a').forEach(link => {
        link.classList.remove('active-nav', 'text-body');
        link.classList.add('text-body-secondary');
    });
    if (elementClicked) {
        elementClicked.classList.add('active-nav', 'text-body');
        elementClicked.classList.remove('text-body-secondary');
    }
}

function navigate(viewId, elementClicked) {
    showView(viewId);
    if (elementClicked) setActiveNav(elementClicked);
}

function navigateSearch(elementClicked) {
    showView('view-home');
    document.getElementById('overlay-search').classList.remove('d-none');
    if (elementClicked) setActiveNav(elementClicked);
}

// utenti registrati
function requireLogin(elementClicked, actionCallback) {
    if (!isLoggedIn) {
        closeSearch();
        showView('view-auth');
        document.getElementById('auth-title').innerText = "Accedi per continuare";
        setActiveNav(null);
    } else {
        if (actionCallback) actionCallback();
        if (elementClicked) setActiveNav(elementClicked);
    }
}

const handleOpenCreatePlaylist = () => requireLogin(null, () => new bootstrap.Modal(document.getElementById('modalPlaylist')).show()); // se user fa il login istanza il componente tramite js e fa apparire a schermo


function closeSearch() {
    document.getElementById('overlay-search').classList.add('d-none');
    if (typeof targetPlaylistForAdd !== 'undefined') targetPlaylistForAdd = null;
}

// alterna la visulizzazione tra il form di login e il form di registrazione
function toggleAuthForms() {
    const login = document.getElementById('form-login');
    const register = document.getElementById('form-register');
    const title = document.getElementById('auth-title');
    login.classList.toggle('d-none');
    register.classList.toggle('d-none');
    title.innerText = login.classList.contains('d-none') ? "Crea un Account" : "Bentornato!";
}

// Tema Chiaro / Scuro
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    if (document.documentElement.getAttribute('data-bs-theme') === 'light') {
        themeIcon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme-override', newTheme); // salava preferenza nel browser
            themeIcon.className = newTheme === 'light' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
        });
    }

    // Gestione Eventi Player Audio
    const playBtn = document.getElementById('player-play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (document.getElementById('player-cover').src !== "") {
                isPlaying = !isPlaying;
                document.getElementById('player-play-icon').className = isPlaying ? 'bi bi-pause-fill fs-3' : 'bi bi-play-fill fs-3 ms-1';
            }
        });
    }
});

// Player Audio Grafico
let isPlaying = false;
function playTrack(encTitle, encArtist, imageSrc) {
    document.getElementById('player-title').innerText = decodeURIComponent(encTitle);
    document.getElementById('player-artist').innerText = decodeURIComponent(encArtist);

    const cover = document.getElementById('player-cover');
    cover.src = imageSrc;
    cover.classList.remove('d-none');
    cover.classList.add('d-block');

    const placeholder = document.getElementById('player-placeholder');
    placeholder.classList.remove('d-sm-block', 'd-block');
    placeholder.classList.add('d-none');

    isPlaying = true;
    document.getElementById('player-play-icon').className = 'bi bi-pause-fill fs-3';
    if (window.innerWidth < 768) closeSearch();
}