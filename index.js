require('dotenv').config()

const express = require('express')
const cors = require('cors')
require('./Connect/dbConnect')
const router = require('./Routes/routes')


const server = express()

server.use(express.json())
server.use(cors())
server.use(router)


server.use((err, req, res, next) => {
    console.error("❌ Global error:", err.stack || err);
    res.status(500).send("Internal Server Error");
});


PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log("Server Running on  PORT", PORT)
})
