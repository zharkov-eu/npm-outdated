'use strict'

const path = require('path')
const { URL } = require('url')
const rp = require('request-promise')

/**
 * Пытается получить package.json репозитория
 * @param {*} url - url-адрес
 * @returns {Promise.object} - Promisepackage.json или {'error': 'описание ошибки'}
 */
function getPackageJSON (url) {
  url = new URL(url)
  if (!~url.host.indexOf('github.com') || url.host.indexOf('github.com')) return Promise.reject(new Error('Это не репозиторий GitHub'))
  const packageUrl = 'https://' + path.join('raw.githubusercontent.com', url.pathname, '/master/package.json')
  return rp(packageUrl)
}

/**
 * Отправляет запросы и вызывает событие dependency при удачном запросе и error при неудачном
 * @param {*} packageJSON - package.json репозитория
 * @param {*} eventEmitter - eventEmmiter который будет вызываться
 */
function reqPackageJSON (packageJSON, eventEmitter) {
  let counter = Object.keys(packageJSON.dependencies).length
  for (let i = 0, keys = Object.keys(packageJSON.dependencies); i < keys.length; i++) {
    let rpath = 'http://' + path.join('registry.npmjs.org/', keys[i])
    rp(rpath).then((data) => {
      try {
        data = JSON.parse(data)
      } catch (error) {
        eventEmitter.emit('error', {name: keys[i], version: packageJSON.dependencies[keys[i]]})
      }
      eventEmitter.emit('dependency', {name: keys[i], version: packageJSON.dependencies[keys[i]], latest: data['dist-tags'].latest})
      if (!--counter) eventEmitter.emit('end')
    })
    .catch(() => {
      eventEmitter.emit('error', {name: keys[i], version: packageJSON.dependencies[keys[i]]})
      if (!--counter) eventEmitter.emit('end')
    })
  }
}

const request = {
  getPackageJSON: getPackageJSON,
  reqPackageJSON: reqPackageJSON
}

module.exports = request
