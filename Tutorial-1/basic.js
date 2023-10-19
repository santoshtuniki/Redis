// module imports
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require("dotenv").config();

const app = express();
app.use(cors());

const URL = "https://jsonplaceholder.typicode.com/photos";

const { PORT } = process.env;

app.get("/photos", async (req, res) => {
    const { albumId } = req.query;
    const { data } = await axios.get(
        URL,
        { params: { albumId } }
    )

    res.json(data)
})

app.get("/photos/:id", async (req, res) => {
    const { data } = await axios.get(
        `${URL}/${req.params.id}`
    )

    res.json(data)
})

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`)
})