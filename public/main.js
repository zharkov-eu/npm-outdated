'use strict'

const inputUrl = document.querySelector('#github-url')
const urlSubmit = document.querySelector('#url-submit')
const processing = document.querySelector('#processing')
const upToDateTable = document.querySelector('#uptodate').querySelector('table')
const minorOutateTable = document.querySelector('#minoroutdate').querySelector('table')
const majorOutdateTable = document.querySelector('#majoroutdate').querySelector('table')
const errorDateTable = document.querySelector('#errordate').querySelector('table')

function validURL (str) {
  var pattern = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/i
  return pattern.test(str)
}

function clearTable (element) {
  let heading = element.querySelector('tr')
  let rows = element.querySelectorAll('tr')
  Array.prototype.forEach.call(rows, function (node) {
    node.parentNode.removeChild(node)
  })
  element.appendChild(heading)
}

inputUrl.addEventListener('keyup', (e) => {
  if (e.keyCode !== 13) {
    processing.innerHTML = ''
    inputUrl.classList.remove('error')
  }
  clearTable(upToDateTable)
  clearTable(minorOutateTable)
  clearTable(majorOutdateTable)
  errorDateTable.parentNode.style.display = 'none'
  clearTable(errorDateTable)
})

urlSubmit.addEventListener('click', (e) => {
  e.preventDefault()
  if (!window.WebSocket) {
    processing.innerHTML = 'Ваш браузер не поддерживает WebSocket, нужен браузер с поддержкой.'
    return
  }
  if (!validURL(inputUrl.value)) {
    inputUrl.classList.add('error')
    processing.innerHTML = 'Пожалуйста, введите валидный url-адрес'
    return
  }
  processing.innerHTML = 'Устанавливается соединение'
  const socket = new window.WebSocket(`ws://${document.location.host}/ws`)
  socket.onopen = () => {
    processing.innerHTML = 'Соединение установлено'
    socket.send(inputUrl.value)
  }
  socket.onmessage = (e) => {
    let data = {}
    try {
      data = JSON.parse(e.data)
    } catch (error) {
      processing.innerHTML = 'Возникла ошибка связи с сервером, пожалуйста, повторите запрос'
    }
    let tr = document.createElement('tr')
    tr.innerHTML = `<td>${data.name}</td><td class="center">${data.version}</td><td class="center">${data.latest}</td>`
    switch (data.status) {
      case 'update':
        upToDateTable.appendChild(tr)
        break
      case 'minor':
        minorOutateTable.appendChild(tr)
        break
      case 'major':
        majorOutdateTable.appendChild(tr)
        break
      case 'error':
        errorDateTable.parentNode.style.display = 'block'
        errorDateTable.appendChild(tr)
        break
    }
  }
  socket.onclose = (e) => {
    if (!e.wasClean) {
      processing.innerHTML = `Обрыв соединения. Код: ${e.code}, причина: ${e.reason || 'не установлена'}`
    } else if (e.code !== 1000) {
      processing.innerHTML = `Завершено с ошибкой. Код: ${e.code}, причина: ${e.reason || 'не установлена'}`
    } else {
      processing.innerHTML = 'Зависимости проверены успешно'
    }
  }
})
