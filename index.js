'use strict'

const express = require('express')
const app = express()
const server = require('http').createServer(app)
const WebSocketServer = require('ws').Server
const webSocketApp = new WebSocketServer({server: server, path: '/ws'})
const WSController = require('./controller/ws')

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('index.html')
})

server.listen(3000, () => {
  console.log('Npm-Outdated started and listen on port 3000')
})

webSocketApp.on('connection', (ws) => {
  const wsController = new WSController(ws)
  wsController.init()
})
