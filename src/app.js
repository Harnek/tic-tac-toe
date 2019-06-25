const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()
const server = require('http').createServer(app)
const io = require('./utils/socket')(server)

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server started at port ${port}`))