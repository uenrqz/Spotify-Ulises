const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const app = express();
const port = 3001;
const clientId = 'colocar token de spotify';
const clientSecret = 'colocar token de spotify';
const redirectUri = 'http://localhost:3001/callback';
const scope = 'user-top-read streaming user-read-email user-read-private';
const cors = require('cors');
app.use(cors());

let accessToken = '';
// Configura tus credenciales de Spotify
app.get('/login', (req, res) => {
    const scope = 'user-top-read';
    const authUrl = 'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: clientId,
            scope: scope,
            redirect_uri: redirectUri
        });
    res.redirect(authUrl);
});
// Función para obtener el token de acceso
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    try {
        const tokenResponse = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            data: querystring.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            }),
            headers: {
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        accessToken = tokenResponse.data.access_token;
        res.redirect('/');
    } catch (error) {
        console.error('Error in callback:', error.response?.data || error.message);
        res.status(500).json({
            error: 'No se pudo obtener el token de acceso',
            details: error.response?.data || error.message
        });
    }
});
// Función para obtener el token de acceso
app.get('/token', (req, res) => {
    if (accessToken) {
        res.json({ accessToken });
    } else {
        res.status(500).json({ error: 'Token de acceso no disponible' });
    }
});
// Función para obtener las 10 canciones más escuchadas
async function getAccessToken() {
    try {
        const response = await axios.get('http://localhost:3001/token');
        return response.data.accessToken;
    } catch (error) {
        throw new Error('No se pudo obtener el token de acceso del servidor');
    }
}
// Función para obtener las 10 canciones más escuchadas en Spotify y devolverlas como un objeto JSON desde la API de Spotify
async function getTopTracks(accessToken) {
    try {
        const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            params: {
                limit: 10
            }
        });
        return response.data.items.map(track => ({
            name: track.name,
            artist: track.artists[0].name,
            url: track.external_urls.spotify,
            uri: track.uri
        }));
    } catch (error) {
        throw new Error('No se pudieron recuperar las pistas de Spotify');
    }
}
// Función principal
app.get('/top-tracks', async (req, res) => {
    try {
        console.log("Obteniendo token de acceso...");
        const accessToken = await getAccessToken();
        console.log("Token de acceso recuperado:", accessToken);

        console.log("Recuperando las mejores pistas...");
        const topTracks = await getTopTracks(accessToken);
        console.log("¡Las mejores pistas se obtuvieron con éxito!");

        res.json({
            tracks: topTracks.map(track => ({
                name: track.name,
                artist: track.artists[0].name,
                url: track.external_urls.spotify,
            }))
        });
    } catch (error) {
        console.error("Error al buscar las pistas principales:", error.message);
        res.status(500).json({ error: error.message });
    }
});
// Iniciar el servidor
app.listen(port, () => {
    console.log(`El servidor se está ejecutando en: http://localhost:${port}`);
});