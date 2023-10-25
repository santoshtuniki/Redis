// module imports
const express = require("express");
const redis = require("redis");
const { Server } = require("socket.io");

// module inbuilt
const { createServer } = require("http");

const app = express();
const PORT = 8080;

app.use(express.json());

// set the view engine to ejs
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

const redisClient = redis.createClient();

const server = createServer(app);
const io = new Server(server, () => {
    console.log('Socket initialized')
})

redisClient.on('connect', () => {
    console.log('Redis connected');
});

redisClient.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

const start = async () => {
    await redisClient.connect()
}
start()

async function sendMessages(socket) {
    try {
        const data = await redisClient.lRange("messages", "0", "-1");

        data?.map(x => {
            const dataArray = x.split(":");
            const redisUsername = dataArray[0];
            const redisMessage = dataArray[1];

            socket.emit("message", {
                from: redisUsername,
                message: redisMessage
            })
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

io.on("connection", async (socket) => {

    await sendMessages(socket);

    socket.on("message", async ({ message, from }) => {

        await redisClient.rPush("messages", `${from}: ${message}`);

        io.emit("message", { message, from });

    })

})

// use res.render to load up an ejs view file
app.get("/", (req, res) => {
    res.render("index");
})

app.get("/chat", (req, res) => {

    const { userName } = req.query;

    io.emit("joined", userName);

    res.render("chat", { userName });
    
})

redisClient.on('end', () => {
    console.log('Redis connection closed');
});


server.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`)
})