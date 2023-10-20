// module imports
const express = require("express");
const redis = require("redis");

// component imports
const config = require("./config");

// inbuilt
const process = require("process");

const { redisHost, redisPort } = config;
const app = express();
const PORT = 8000;

const redisClient = redis.createClient(redisHost, redisPort);

redisClient.on('connect', () => {
    console.log('Redis connected');
});

redisClient.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

const start = async () => {
    await redisClient.connect();
    await redisClient.SET("count", 0);
};
start()

app.get("/", async (req, res) => {
    try {
        await redisClient.INCR("count");

        const data = await redisClient.GET("count");

        res.json({
            count: data
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

redisClient.on('end', () => {
    console.log('Redis connection closed');
});

// app.listen(PORT, () => {
//     console.log(`Server is running on PORT ${PORT}`)
// })

app.listen(process.argv[2], () => {
    console.log(`Server is running on PROCESS ${process.argv[2]}`)
})