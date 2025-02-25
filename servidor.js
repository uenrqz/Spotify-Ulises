const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const app = express();
const port = 3001;
const clientId = 'colocar tu client id';
const clientSecret = 'colocar tu client secret';
const redirectUri = 'http://localhost:3001/callback';
const scope = 'user-top-read streaming user-read-email user-read-private';
const cors = require('cors');
app.use(cors());

let accessToken = '';

// Ruta principal para servir el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Configura tus credenciales de Spotify
app.get('/login', (req, res) => {
    // Ampliar el scope para asegurar que tenemos acceso a lo que necesitamos
    const scope = 'user-top-read user-read-email user-read-private user-read-recently-played';

    const authUrl = 'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: clientId,
            scope: scope,
            redirect_uri: redirectUri,
            show_dialog: true // Esto fuerza el diálogo de autenticación
        });

    console.log("Redirigiendo a URL de autenticación:", authUrl);
    res.redirect(authUrl);
});
// Función para obtener el token de acceso
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    try {
        console.log("Código recibido, solicitando token...");

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
        console.log("Token obtenido con éxito:", accessToken.substring(0, 10) + "...");

        // Verificar que el token funciona haciendo una petición a la API
        try {
            const userResponse = await axios.get('https://api.spotify.com/v1/me', {
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                }
            });
            console.log("Verificación de token exitosa, usuario:", userResponse.data.display_name);
        } catch (userError) {
            console.error("El token se obtuvo pero parece no ser válido:", userError.message);
        }

        res.redirect('/');
    } catch (error) {
        console.error('Error en callback:', error.response?.data || error.message);
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

        // Agregar registro para verificar la estructura de los datos
        console.log("Datos recibidos de Spotify:", JSON.stringify(response.data, null, 2).substring(0, 500));

        // Verificación adicional y manejo de datos nulos o indefinidos
        const tracks = response.data.items || [];
        return tracks.map(track => {
            // Comprobamos que track y sus propiedades existen antes de acceder
            if (!track) return { name: "Canción desconocida", artist: "Artista desconocido", url: "#" };

            const name = track.name || "Canción sin título";
            const artist = track.artists && track.artists[0] ? track.artists[0].name : "Artista desconocido";
            const url = track.external_urls && track.external_urls.spotify ? track.external_urls.spotify : "#";

            return {
                name: name,
                artist: artist,
                url: url,
                uri: track.uri || ""
            };
        });
    } catch (error) {
        console.error("Error detallado:", error.response ? error.response.data : error.message);
        throw new Error('No se pudieron recuperar las pistas de Spotify');
    }
}

// Función principal actualizada
app.get('/top-tracks', async (req, res) => {
    try {
        console.log("Obteniendo token de acceso...");
        const accessToken = await getAccessToken();
        console.log("Token de acceso recuperado:", accessToken);

        console.log("Recuperando las mejores pistas...");
        const topTracks = await getTopTracks(accessToken);
        console.log("¡Las mejores pistas se obtuvieron con éxito!");

        res.json({
            tracks: topTracks
        });
    } catch (error) {
        console.error("Error al buscar las pistas principales:", error.message);
        res.status(500).json({ error: error.message });
    }
});
// Función principal
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
        res.redirect('http://localhost:3000'); // Redirect to your frontend
    } catch (error) {
        console.error('Error in callback:', error.response?.data || error.message);
        res.status(500).json({
            error: 'No se pudo obtener el token de acceso',
            details: error.response?.data || error.message
        });
    }
});
// Iniciar el servidor
app.listen(port, () => {
    console.log(`El servidor se está ejecutando en: http://localhost:${port}`);
    console.log(`Abre tu navegador y ve a: http://localhost:${port}`);
});