const axios = require('axios');
const Queue = require('queue-fifo');

// Configura tus credenciales de Spotify
const clientId = 'TU_CLIENT_ID';
const clientSecret = 'TU_CLIENT_SECRET';

// Función para obtener el token de acceso
async function getAccessToken() {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        },
        params: {
            grant_type: 'client_credentials'
        }
    });
    return response.data.access_token;
}

// Función para obtener las 10 canciones más escuchadas
async function getTopTracks(accessToken) {
    const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        params: {
            limit: 10
        }
    });
    return response.data.items;
}

// Función principal
async function main() {
    try {
        const accessToken = await getAccessToken();
        const topTracks = await getTopTracks(accessToken);

        // Crear una cola y agregar las canciones
        const queue = new Queue();
        topTracks.forEach(track => queue.enqueue(track.name));

        // Simular la reproducción de las canciones en orden FIFO
        console.log('Reproduciendo canciones:');
        while (!queue.isEmpty()) {
            console.log('Reproduciendo:', queue.dequeue());
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();