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
    if ((req.query.hasOwnProperty(albumId) && isNaN(photoId) || photoId <= 0)) {
        return res.status(400).json({ error: "Invalid photo ID" });
    }

    try {
        const photosKey = `photos?albumId=${albumId}`;
        const photos = await redisClient.GET(photosKey);
        if (photos !== null) {
            return res.json(JSON.parse(photos));
        } else {
            const { data } = await axios.get(EXTERNAL_API_URL, { params: { albumId } });
            await redisClient.SETEX(`photos?albumId=${albumId}`, DEFAULT_EXPIRATION, JSON.stringify(data));
            return res.json(data);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }

})

app.get("/photos/:id", async (req, res) => {
    const photoId = parseInt(req.params.id);
    if (isNaN(photoId) || photoId <= 0) {
        return res.status(400).json({ error: "Invalid photo ID" });
    }

    try {
        const { data } = await axios.get(`${EXTERNAL_API_URL}/${photoId}`);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

redisClient.on('end', () => {
    console.log('Redis connection closed');
});


app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`)
})