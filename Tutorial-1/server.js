// module imports
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require("dotenv").config();

const Redis = require("redis");
const redisClient = Redis.createClient();

const app = express();

app.use(express.urlencoded({ extended: true }))
app.use(cors());

const { PORT, DEFAULT_EXPIRATION, EXTERNAL_API_URL } = process.env;

const start = async () => {
    await redisClient.connect()
}
start()

redisClient.on('connect', () => {
    console.log('Redis connected');
});

redisClient.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

app.get("/photos", async (req, res) => {
    const albumId = req.query.albumId;

    // check if query exists & if exists ensure that it is valid
    const photoId = parseInt(albumId);
    if ((req.query.hasOwnProperty("albumId") && isNaN(photoId) || photoId <= 0)) {
        return res.status(400).json({ error: "Invalid album ID" });
    }

    const photosKey = `photos?albumId=${albumId}`;

    const photos = await getOrSetCache(photosKey, async () => {
        const { data } = await axios.get(EXTERNAL_API_URL, { params: { albumId } });
        return data
    })

    res.json(photos)
})

app.get("/photos/:id", async (req, res) => {
    // check if param exists & ensure that it is valid
    const photoId = parseInt(req.params.id);
    if (isNaN(photoId) || photoId <= 0) {
        return res.status(400).json({ error: "Invalid photo ID" });
    }

    const photosKey = `photos:${photoId}`;

    const photo = await getOrSetCache(photosKey, async () => {
        const { data } = await axios.get(`${EXTERNAL_API_URL}/${photoId}`);
        return data
    })

    res.json(photo)
});

async function getOrSetCache(key, callback) {
    try {
        // Get DATA from redis
        const data = await redisClient.GET(key);

        // Check if data is not NULL
        if (data !== null) {
            return JSON.parse(data)
        }

        /* Get FRESHDATA, either because of :
            1. First usage of QUERY 
            2. Reuse after DEFAULT_EXPIRATION
        */
        const freshData = await callback()

        // Store freshData as CACHE using redis
        redisClient.SETEX(key, DEFAULT_EXPIRATION, JSON.stringify(freshData))

        return freshData

    } catch (error) {
        console.error(error);

        res.status(500).json({ error: "Internal Server Error" });
    }
}

redisClient.on('end', () => {
    console.log('Redis connection closed');
});


app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`)
})