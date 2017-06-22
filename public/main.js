'use strict'

const inputUrl = document.querySelector('#github-url')
const urlSubmit = document.querySelector('#url-submit')
const processing = document.querySelector('#processing')
const upToDateUl = document.querySelector('#uptodate').querySelector('ul')
const minorOutateUl = document.querySelector('#minoroutdate').querySelector('ul')
const majorOutdateUl = document.querySelector('#majoroutdate').querySelector('ul')
const errorDateUl = document.querySelector('#errordate').querySelector('ul')

function validURL (str) {
  var pattern = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/i
  return pattern.test(str)
}

inputUrl.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) return
  processing.innerHTML = ''
  inputUrl.classList.remove('error')
  upToDateUl.innerHTML = ''
  minorOutateUl.innerHTML = ''
  majorOutdateUl.innerHTML = ''
  errorDateUl.innerHTML = ''
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
    let li = document.createElement('li')
    li.innerHTML = `<span class='name'>${data.name}</span><span class="version">${data.version}</span><span class="latest">${data.latest}</span>`
    switch (data.status) {
      case 'update':
        upToDateUl.appendChild(li)
        break
      case 'minor':
        minorOutateUl.appendChild(li)
        break
      case 'major':
        majorOutdateUl.appendChild(li)
        break
      case 'error':
        errorDateUl.appendChild(li)
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
