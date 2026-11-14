# 🎵 SN4M - Social Network For Music

**SN4M (Social Network For Music)** is a Web Application developed as a **Single Page Application (SPA)** that combines a Spotify-style music listening and search experience with the social interaction features of a community.

The application allows users to search for tracks and artists via the **official Spotify API**, create and manage personal playlists, join thematic communities, and share/import playlists among users.

## 🚀 Live Demo

[🌐 View Live Demo](https://lucchal0.github.io/awc-spotify-music-community/)

---

## ✨ Main Features

- 🚀 **Single Page Application (SPA):** Seamless navigation without ever reloading the page (`index.html`), ensuring continuous UI and audio player functionality.
- 🎧 **Persistent Audio Player:** Fixed bottom playback bar (`footer`) with media controls (Play/Pause, previous/next track) always active during navigation.
- 🔍 **Global Live Search (Overlay):** Full-screen interface with a *glassmorphism* effect for real-time track searches on Spotify.
- 👥 **Authentication and Profile System:**
    - Registration with official music genre selection and live search for favorite artists (using **Debouncing**).
    - Session and profile management, including the ability to edit or permanently delete the account (with cascade deletion).
- 📂 **Personal Playlist Management:**
    - Two-column guided creation (metadata and on-the-fly track search).
    - Automatic cover assignment based on the first inserted track.
    - Detailed track table with duration, year, and interactive controls.
- 🌐 **Community and Shared Board:**
    - Explore and create thematic communities based on music genres.
    - *Join* and *Leave* groups.
    - Shared board displaying enrolled members, their musical tastes, and published playlists.
    - **Playlist Import (Deep Clone):** Ability to clone and save shared playlists from other users into your personal library.
- 🌓 **Dark / Light Theme:** Quick visual theme toggle with preference saved in the browser.

---

## 🛠️ Technologies Used

- **Frontend:** Semantic HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Framework & Icons:** [Bootstrap 5.3.0](https://getbootstrap.com/) (12-column responsive Grid System, Modals, Dropdowns) and [Bootstrap Icons](https://icons.getbootstrap.com/).
- **External APIs:** [Spotify Web API](https://developer.spotify.com/documentation/web-api) (OAuth Token with *Client Credentials Flow*, track, artist, and category search).
- **Data Storage:** Browser `localStorage` to simulate a local relational database (users, playlists, communities, and shares).

---

## 📁 Project Structure

```text
SN4M/
│
├── index.html            # Main SPA structure, sections, and modals
├── CSS/
│   └── style.css         # Custom styles, animations, and brand classes
├── JS/
│   ├── index.js          # SPA routing, theme management, and coordination
│   ├── SpotifyAPI.js     # REST communication module with the Spotify API
│   ├── search.js         # Live search engine and card rendering
│   ├── user.js           # User management, auth, session, and profile
│   ├── playlist.js       # Personal playlist CRUD and tracks table
│   └── community.js      # Community management, boards, and playlist import
└── README.md             # Project documentation
```

## ⚙️ Setup and Running the Project
For security reasons, private Spotify credentials (clientId and clientSecret) have been removed from the public repository.
To run the application locally with all features enabled:

1. Clone the repository:
  ```bash
    git clone [https://github.com/YOUR-USERNAME/SN4M.git (https://github.com/YOUR-USERNAME/SN4M.git)
cd SN4M
```
2. Get Spotify Developer credentials:
    - Go to the Spotify Developer Dashboard.
    - Create a new application (Create App).
    - Copy the Client ID and Client Secret.
    - 
3. Configure the JS/SpotifyAPI.js file:
  Open the file and insert your keys at the top of the object:
  ```JavaScript
    const clientId = "INSERT_YOUR_CLIENT_ID_HERE";
    const clientSecret = "INSERT_YOUR_CLIENT_SECRET_HERE";
```
4. Start the application:
Simply open the index.html file in any modern browser, or run it via a local server (like the Live Server extension in VS Code).

## 👤Author 
Alessandro Lucchesi
University project created for the Web Technologies / Web Programming course.
