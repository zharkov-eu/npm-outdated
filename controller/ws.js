'use strict'

const request = require('./request')
const EventEmitter = require('events')
class NpmCheckEmitter extends EventEmitter {}

function validURL (str) {
  var pattern = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/i
  return pattern.test(str)
}

class WSController {
  constructor (ws) {
    this.socket = ws
  }
  init () {
    this.socket.on('message', this.handleMessage)
  }
  handleMessage (message) {
    if (!validURL(message)) return this.close(1003, 'Невалидный url адрес')
    request.getPackageJSON(message)
      .then((packageJSON) => {
        try {
          packageJSON = JSON.parse(packageJSON)
        } catch (error) {
          return this.close(1003, 'В package.json невалидный JSON')
        }
        const npmCheckEmitter = new NpmCheckEmitter()
        npmCheckEmitter.on('dependency', (data) => {
          const version = data.version.replace(/[^0-9.]/g, '').split('.')
          const latest = data.latest.split('.')
          data.status = 'update'
          if (version[1] < latest[1]) data.status = 'minor'
          if (version[0] < latest[0]) data.status = 'major'
          this.send(JSON.stringify(data))
        })
        npmCheckEmitter.on('error', (data) => {
          data.status = 'error'
          this.send(JSON.stringify(data))
        })
        npmCheckEmitter.on('end', () => {
          this.close(1000)
        })
        request.reqPackageJSON(packageJSON, npmCheckEmitter)
      })
      .catch((error) => {
        let message = ''
        if (~error.message.indexOf('404: Not Found')) message = 'В репозиторий не найден package.json'
        return this.close(1003, message || error.message)
      })
  }
}

module.exports = WSController
