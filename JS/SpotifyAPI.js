/**
 * Alessandro Lucchesi - SpotifyAPI.js 
 * comunicazione API REST Spotify
 */

const APIController = (function () {


    /* *
     * 
     *  inserire il proprio client_id e client_secreat dall'api di spotify
     *  const clientId = "INSERT_YOUR_CLIENT_ID";
     *  const clientSecret = "INSERT_YOUR_CLIENT_SECREAT ";
     * 
     * */

    let cachedToken = null;
    let tokenExpiration = 0;

    const msToMinSec = (ms) => {
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
        return `${min}:${sec}`;
    };

    return {
        getToken: async () => {
            if (cachedToken && Date.now() < tokenExpiration) {
                return cachedToken;
            }

            const res = await fetch("https://accounts.spotify.com/api/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
            });
            const data = await res.json();

            cachedToken = data.access_token;
            tokenExpiration = Date.now() + (data.expires_in - 300) * 1000; // -300 sec di margine 

            return cachedToken;
        },
        getCategories: async (token) => {
            const res = await fetch("https://api.spotify.com/v1/browse/categories?limit=50", {
                headers: { Authorization: "Bearer " + token }
            });
            const data = await res.json();
            return data.categories.items.map(cat => ({ id: cat.id, name: cat.name }));
        },
        searchTrack: async (token, query) => {
            const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`, {
                headers: { Authorization: "Bearer " + token }
            });
            const data = await res.json();
            if (!data.tracks || !data.tracks.items) return [];
            return data.tracks.items.map(track => ({
                id: track.id,
                titolo: track.name,
                cantante: track.artists.map(a => a.name).join(", "),
                anno: track.album.release_date ? track.album.release_date.split("-")[0] : "N/A",
                durata: msToMinSec(track.duration_ms),
                immagine: track.album.images.length > 0 ? track.album.images[0].url : 'https://via.placeholder.com/150'
            }));
        },
        searchArtist: async (token, query) => {
            const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`, {
                headers: { Authorization: "Bearer " + token }
            });
            const data = await res.json();
            if (!data.artists || !data.artists.items) return [];
            return data.artists.items.map(artist => ({
                id: artist.id,
                name: artist.name,
                immagine: artist.images.length > 0 ? artist.images[0].url : 'https://via.placeholder.com/40'
            }));
        }
    };
})();