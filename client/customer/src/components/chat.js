class Chat extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.socket = new WebSocket(import.meta.env.VITE_WS_URL)
    this.threadId = null
    this.isOpen = false
    this.isTyping = false
    this.escalateToHuman = false
    this.pendingFile = null
    this.socketReady = false
    this.userName = '' // Nuevo: almacenar el nombre del usuario
    this.showNameInput = true // Nuevo: controlar si mostrar la entrada de nombre
  }

  connectedCallback () {
    this.socket.addEventListener('open', () => {
      this.socketReady = true
      this.wsSubscribe('colectivo')
    })

    this.socket.addEventListener('message', event => {
      const data = JSON.parse(event.data)

      console.log(data)

      // const sendButton = this.shadow.querySelector('.send-button')
      // const container = this.createHumanResponseContainer()
      // this.writeNewAnswer(data.message, container, true)
      // this.isTyping = false
      // sendButton.disabled = false
    })

    this.socket.addEventListener('close', () => { this.socketReady = false })
    this.socket.addEventListener('error', () => { this.socketReady = false })

    this.render()
  }

  wsSend (obj) {
    if (!this.socketReady) return
    this.socket.send(JSON.stringify(obj))
  }

  wsSubscribe (channel) { this.wsSend({ type: 'subscribe', channel }) }
  wsUnsubscribe (channel) { this.wsSend({ type: 'unsubscribe', channel }) }

  loadData = async () => {
    // try {
    //   const response = await fetch(`/api/customer/chats/${sessionStorage.getItem('threadId')}`)
    //   const data = await response.json()
    //   this.renderChat(data)
    // } catch (error) {
    //   console.error('Error loading chat data:', error)
    // }
  }

  renderChat (data) {
    const chatMessages = this.shadow.querySelector('.chat-messages')
    chatMessages.innerHTML = ''

    data.reverse().forEach(message => {
      if (message.role === 'user') {
        this.createUserMessage(message.content)
      } else if (message.role === 'assistant') {
        const container = this.createAssistantResponseContainer()
        // Mantenemos compatibilidad: el backend guarda assistant.content como JSON {text}
        try {
          const parsed = typeof message.content === 'string' ? JSON.parse(message.content) : message.content
          this.writeNewAnswer(parsed?.text ?? String(message.content), container, false)
        } catch {
          this.writeNewAnswer(String(message.content), container, false)
        }
      }
    })

    if (sessionStorage.getItem('escalateToHuman') === 'true') {
      this.escalateToHuman = true
    }
  }

  render () {
    this.shadow.innerHTML = /* html */`
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .chatbot-button {
          position: fixed; bottom: 30px; right: 30px;
          background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; border: none;
          padding: 15px 25px; border-radius: 25px; cursor: pointer; font-size: 14px; font-weight: 600;
          box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3); transition: all 0.3s ease; z-index: 1000;
          min-width: 280px; text-align: center; font-family: "SoehneBuch", sans-serif;
        }
        .chatbot-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(231,76,60,.4); background: linear-gradient(135deg, #c0392b, #a93226); }
        .chatbot-button:active { transform: translateY(0); }

        .chat-container {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: hsl(235, 7%, 31%); border: 1px solid hsl(0,0%,40%); 
          box-shadow: 0 10px 30px rgba(0,0,0,.2); display: none; flex-direction: column; z-index: 1001;
          overflow: hidden; animation: slideUp .3s ease-out; font-family: "SoehneBuch", sans-serif; color: #fff;
        }
        .chat-container.active { display: flex; }

        @keyframes slideUp { from {opacity:0; transform: translateY(20px);} to {opacity:1; transform: translateY(0);} }

        .name-input-container {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: hsl(235, 7%, 31%); display: flex; flex-direction: column; align-items: center; justify-content: center;
          z-index: 1002; padding: 20px; font-family: "SoehneBuch", sans-serif; color: #fff;
        }
        .name-input-container.hidden { display: none; }

        .name-input-box {
          background: hsl(235, 7%, 25%); border-radius: 15px; padding: 40px; max-width: 400px; width: 100%;
          box-shadow: 0 10px 30px rgba(0,0,0,.3); text-align: center; border: 1px solid hsl(0,0%,40%);
        }
        .name-input-box h3 { font-size: 24px; margin-bottom: 10px; color: #fff; }
        .name-input-box p { font-size: 14px; margin-bottom: 25px; color: hsl(0,0%,80%); }
        .name-input { 
          width: 100%; padding: 15px; border: 1px solid hsl(0,0%,40%); border-radius: 8px; 
          background: hsl(235,7%,20%); color: #fff; font-size: 16px; margin-bottom: 20px;
          font-family: "SoehneBuch", sans-serif; outline: none;
        }
        .name-input:focus { border-color: #e74c3c; }
        .name-input::placeholder { color: hsl(0,0%,60%); }
        .start-chat-button {
          background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; border: none;
          padding: 15px 30px; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: 600;
          width: 100%; transition: all 0.3s ease;
        }
        .start-chat-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(231,76,60,.4); }
        .start-chat-button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .chat-header { background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 20px; text-align: center; position: relative; }
        .chat-header h3 { font-size: 18px; font-weight: 600; margin-bottom: 5px; }
        .chat-header p { font-size: 12px; opacity: .9; }
        .close-button {
          position: absolute; top: 15px; right: 15px; background: none; border: none; color: white;
          font-size: 20px; cursor: pointer; width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; transition: background-color .2s;
        }
        .close-button:hover { background-color: rgba(255,255,255,.2); }

        .chat-messages {
          flex: 1; padding: 16px 20px; overflow-y: auto; background-color: hsl(235, 7%, 31%);
          display: flex; flex-direction: column; gap: 1rem;
        }
        .chat-messages::-webkit-scrollbar { width: 6px; }
        .chat-messages::-webkit-scrollbar-track { background: hsl(0,0%,20%); border-radius: 3px; }
        .chat-messages::-webkit-scrollbar-thumb { background: hsl(0,0%,50%); border-radius: 3px; }
        .chat-messages::-webkit-scrollbar-thumb:hover { background: hsl(0,0%,60%); }

        .prompt { display: flex; gap: 1rem; width: 100%; }
        .prompt:first-child { margin-top: 1rem; }
        .prompt:last-child { margin-bottom: 1rem; }

        .message { display: flex; flex-direction: column; gap: .5rem; width: 100%; }
        .message h3 { font-size: .9rem; margin: 0; color: #fff; }
        .message p { font-size: 1rem; margin: 0; color: #fff; line-height: 1.4; }

        .avatar {
          align-items: center; border: 1px solid hsl(0,0%,40%); border-radius: 50%;
          display: flex; height: 1.5rem; justify-content: center; min-width: 1.5rem; overflow: hidden; width: 1.5rem;
          background: linear-gradient(135deg, #3498db, #2980b9); color: white; font-size: 12px; font-weight: bold;
        }
        .avatar.assistant { background: linear-gradient(135deg, #27ae60, #229954); }

        .state { align-items: center; display: flex; gap: .5rem; }
        .state-bubble { background-color: #fff; border-radius: 50%; height: 1rem; width: 1rem; }
        .state-bubble.active { animation: pulse 1s infinite; }
        .state-message { font-size: .9rem; color: #fff; }
        @keyframes pulse { 0% { transform: scale(.8);} 50% { transform: scale(1);} 100% { transform: scale(.8);} }

        .chat-input-area {
          padding: 12px 12px 16px 12px; background: hsl(235, 7%, 31%); border-top: 1px solid hsl(0,0%,40%);
          display: flex; flex-direction: column; gap: 8px;
        }

        .input-row {
          display: grid;
          grid-template-columns: 40px 1fr 45px;
          gap: 8px;
          align-items: center;
        }

        .chat-input {
          padding: 12px 16px; border: 1px solid hsl(0,0%,40%); border-radius: 25px; font-size: 14px; outline: none;
          transition: border-color .2s; font-family: "SoehneBuch", sans-serif; background: hsl(235,7%,25%); color: #fff;
        }
        .chat-input:focus { border-color: #e74c3c; }
        .chat-input::placeholder { color: hsl(0,0%,60%); }

        .attach-button, .send-button {
          background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; border: none; height: 45px; border-radius: 50%;
          cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; font-size: 16px;
        }
        .attach-button:hover, .send-button:hover { transform: scale(1.05); box-shadow: 0 2px 8px rgba(231,76,60,.3); }
        .attach-button:disabled, .send-button:disabled { opacity: .6; cursor: not-allowed; transform: none; }

        .file-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; background: hsl(235,7%,25%); border: 1px dashed hsl(0,0%,40%); border-radius: 12px; padding: 8px 12px;
        }
        .file-meta { font-size: 12px; color: hsl(0,0%,85%); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-remove {
          background: none; color: #f1c40f; border: none; cursor: pointer; font-size: 12px; padding: 4px 6px; border-radius: 6px;
        }
        .file-remove:hover { text-decoration: underline; }

        .welcome-message { text-align: center; padding: 20px; color: hsl(0,0%,80%); font-size: 14px; }

        input[type="file"] { display: none; }
      </style>

      <button class="chatbot-button">¿Alguna duda? Hable con nosotros ahora</button>

      <!-- Ventana de introducción de nombre -->
      <div class="name-input-container ${this.showNameInput ? '' : 'hidden'}">
        <div class="name-input-box">
          <h3>¡Bienvenido!</h3>
          <p>Para comenzar el chat, por favor ingrese su nombre</p>
          <input type="text" class="name-input" placeholder="Ingrese su nombre..." maxlength="50">
          <button class="start-chat-button">Comenzar Chat</button>
        </div>
      </div>

      <!-- Ventana principal del chat -->
      <div class="chat-container">
        <div class="chat-header">
          <button class="close-button">×</button>
          <h3>Asistente Virtual</h3>
          <p>Estamos aquí para ayudarle</p>
        </div>

        <div class="chat-messages">
          <div class="welcome-message">
            ¡Hola! 👋 Soy su asistente virtual de Producto de Aquí.<br>
            ¿En qué puedo ayudarle hoy?
          </div>
        </div>

        <div class="chat-input-area">
          <div class="file-row" style="display:none">
            <span class="file-meta"></span>
            <button class="file-remove" type="button" title="Quitar archivo">Quitar</button>
          </div>

          <div class="input-row">
            <button class="attach-button" title="Adjuntar archivo" aria-label="Adjuntar archivo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 115.66 5.66l-9.2 9.2a2 2 0 11-2.83-2.83l8.49-8.49"/>
              </svg>
            </button>

            <input type="text" class="chat-input" name="prompt" placeholder="Escriba su mensaje..." required>

            <button class="send-button" title="Enviar" aria-label="Enviar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9"></polygon>
              </svg>
            </button>
          </div>

          <input class="file-input" type="file" accept="*/*">
        </div>
      </div>
    `

    const chatButton = this.shadow.querySelector('.chatbot-button')
    const closeButton = this.shadow.querySelector('.close-button')
    const chatInput = this.shadow.querySelector('.chat-input')
    const sendButton = this.shadow.querySelector('.send-button')
    const attachButton = this.shadow.querySelector('.attach-button')
    const fileInput = this.shadow.querySelector('.file-input')
    const fileRow = this.shadow.querySelector('.file-row')
    const fileMeta = this.shadow.querySelector('.file-meta')
    const fileRemove = this.shadow.querySelector('.file-remove')

    // Nuevos elementos para la ventana de nombre
    const nameInputContainer = this.shadow.querySelector('.name-input-container')
    const nameInput = this.shadow.querySelector('.name-input')
    const startChatButton = this.shadow.querySelector('.start-chat-button')

    chatButton.addEventListener('click', () => this.toggleChat())
    closeButton.addEventListener('click', () => this.closeChat())
    sendButton.addEventListener('click', () => this.sendMessage())
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.sendMessage() })

    // Evento para el botón de comenzar chat
    startChatButton.addEventListener('click', () => this.startChat(nameInput))
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.startChat(nameInput)
    })

    // Adjuntar archivo
    attachButton.addEventListener('click', () => {
      if (this.isTyping) return
      fileInput.click()
    })

    fileInput.addEventListener('change', () => {
      const [file] = fileInput.files || []
      if (file) {
        this.pendingFile = file
        fileMeta.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`
        fileRow.style.display = 'flex'
      }
    })

    fileRemove.addEventListener('click', () => {
      this.clearPendingFile()
    })
  }

  // Nuevo método para iniciar el chat con el nombre
  startChat (nameInput) {
    const name = nameInput.value.trim()
    if (!name) {
      nameInput.focus()
      return
    }

    this.userName = name
    this.showNameInput = false

    // Ocultar ventana de nombre y mostrar chat
    const nameInputContainer = this.shadow.querySelector('.name-input-container')
    const chatContainer = this.shadow.querySelector('.chat-container')

    if (nameInputContainer) nameInputContainer.classList.add('hidden')
    if (chatContainer) chatContainer.classList.add('active')

    this.isOpen = true

    // Actualizar mensaje de bienvenida con el nombre
    const welcomeMessage = this.shadow.querySelector('.welcome-message')
    if (welcomeMessage) {
      welcomeMessage.innerHTML = `
        ¡Hola ${this.userName}! 👋 Soy su asistente virtual de Producto de Aquí.<br>
        ¿En qué puedo ayudarle hoy?
      `
    }

    // Enfocar el input del chat
    const chatInput = this.shadow.querySelector('.chat-input')
    if (chatInput) chatInput.focus()
  }

  toggleChat () {
    if (this.isOpen) {
      this.closeChat()
    } else {
      this.openChat()
    }
  }

  openChat () {
    const chatContainer = this.shadow.querySelector('.chat-container')
    const chatButton = this.shadow.querySelector('.chatbot-button')
    const chatInput = this.shadow.querySelector('.chat-input')
    const nameInputContainer = this.shadow.querySelector('.name-input-container')

    // Mostrar ventana de nombre si no hay nombre guardado
    if (!this.userName) {
      if (nameInputContainer) nameInputContainer.classList.remove('hidden')
    } else {
      if (chatContainer) chatContainer.classList.add('active')
    }

    if (chatButton) chatButton.style.display = 'none'
    this.isOpen = true

    // Enfocar el input apropiado
    if (!this.userName) {
      const nameInput = this.shadow.querySelector('.name-input')
      if (nameInput) nameInput.focus()
    } else if (chatInput) {
      chatInput.focus()
    }
  }

  closeChat () {
    const chatContainer = this.shadow.querySelector('.chat-container')
    const chatButton = this.shadow.querySelector('.chatbot-button')
    const nameInputContainer = this.shadow.querySelector('.name-input-container')

    if (chatContainer) chatContainer.classList.remove('active')
    if (nameInputContainer) nameInputContainer.classList.add('hidden')
    if (chatButton) chatButton.style.display = 'block'
    this.isOpen = false
  }

  sendMessage () {
    const chatInput = this.shadow.querySelector('.chat-input')
    const message = chatInput.value.trim()

    // Permitir envío si hay texto o archivo (o ambos)
    if ((!message && !this.pendingFile) || this.isTyping) return

    if (message) this.createUserMessage(message)
    if (!message && this.pendingFile) this.createUserMessage('📎 Archivo adjunto')

    chatInput.value = ''

    if (this.escalateToHuman) {
      this.sendMessageToHuman(message)
    } else {
      const contents = this.createAssistantResponseContainer()
      this.createAssistantResponse(message, contents)
    }
  }

  createUserMessage = (newPrompt) => {
    const chatMessages = this.shadow.querySelector('.chat-messages')
    const promptContainer = document.createElement('div')
    const avatarContainer = document.createElement('div')
    const messageContainer = document.createElement('div')
    const userName = document.createElement('h3')
    const prompt = document.createElement('p')

    promptContainer.classList.add('prompt')
    avatarContainer.classList.add('avatar')
    messageContainer.classList.add('message', 'user')

    avatarContainer.textContent = this.userName ? this.userName.charAt(0).toUpperCase() : 'U'
    userName.textContent = this.userName || 'Usted' // Usar el nombre personalizado
    prompt.textContent = newPrompt

    messageContainer.appendChild(userName)
    messageContainer.appendChild(prompt)

    // Si hay archivo pendiente, muestre una línea auxiliar
    if (this.pendingFile) {
      const fileNote = document.createElement('p')
      fileNote.textContent = `Adjunto: ${this.pendingFile.name}`
      messageContainer.appendChild(fileNote)
    }

    promptContainer.appendChild(avatarContainer)
    promptContainer.appendChild(messageContainer)
    chatMessages.appendChild(promptContainer)
    this.scrollToBottom()
  }

  createAssistantResponseContainer = () => {
    const chatMessages = this.shadow.querySelector('.chat-messages')
    const promptContainer = document.createElement('div')
    const avatarContainer = document.createElement('div')
    const messageContainer = document.createElement('div')

    const modelName = document.createElement('h3')
    const container = document.createElement('div')
    const state = document.createElement('div')
    const stateBubble = document.createElement('div')
    const stateMessage = document.createElement('span')

    promptContainer.classList.add('prompt')
    avatarContainer.classList.add('avatar', 'assistant')
    messageContainer.classList.add('message', 'model')
    container.classList.add('contents')
    state.classList.add('state')
    stateBubble.classList.add('state-bubble', 'active')
    stateMessage.classList.add('state-message')

    avatarContainer.textContent = 'A'
    modelName.textContent = 'Asistente'
    stateMessage.textContent = 'Preparando respuesta...'

    container.appendChild(state)
    state.appendChild(stateBubble)
    state.appendChild(stateMessage)
    messageContainer.appendChild(modelName)
    messageContainer.appendChild(container)

    promptContainer.appendChild(avatarContainer)
    promptContainer.appendChild(messageContainer)

    chatMessages.appendChild(promptContainer)
    this.scrollToBottom()
    return container
  }

  createHumanResponseContainer = () => {
    const chatMessages = this.shadow.querySelector('.chat-messages')
    const promptContainer = document.createElement('div')
    const avatarContainer = document.createElement('div')
    const messageContainer = document.createElement('div')

    const modelName = document.createElement('h3')
    const container = document.createElement('div')

    promptContainer.classList.add('prompt')
    avatarContainer.classList.add('avatar', 'assistant')
    messageContainer.classList.add('message', 'model')
    container.classList.add('contents')

    avatarContainer.textContent = 'H'
    modelName.textContent = 'Humano'

    messageContainer.appendChild(modelName)
    messageContainer.appendChild(container)
    promptContainer.appendChild(avatarContainer)
    promptContainer.appendChild(messageContainer)
    chatMessages.appendChild(promptContainer)
    this.scrollToBottom()

    return container
  }

  createAssistantResponse = async (userMessage, container) => {
    this.isTyping = true
    const sendButton = this.shadow.querySelector('.send-button')
    const attachButton = this.shadow.querySelector('.attach-button')
    sendButton.disabled = true
    attachButton.disabled = true

    try {
      const response = await this.generateResponse(userMessage)
    } catch (err) {
      console.error(err)
      this.writeNewAnswer('Se ha producido un error al enviar el mensaje. Inténtelo de nuevo más tarde.', container, false)
    } finally {
      this.isTyping = false
      sendButton.disabled = false
      attachButton.disabled = false
      // Limpiar adjunto tras el envío
      this.clearPendingFile()
    }
  }

  sendMessageToHuman = async (message) => {
    try {
      await fetch('/api/customer/chats/human', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, threadId: this.threadId })
      })
    } catch (error) {
      console.error('Error sending message to human:', error)
    }
  }

  writeNewAnswer = async (answer, container, timeInterval) => {
    const state = container.querySelector('.state')
    if (state) state.remove()

    const responseElement = document.createElement('p')
    container.appendChild(responseElement)

    if (timeInterval) {
      let i = 0
      let text = ''
      const interval = setInterval(() => {
        if (i >= answer.length) { clearInterval(interval); return }
        text += answer[i++]
        responseElement.textContent = text
        this.scrollToBottom()
      }, 30)
    } else {
      responseElement.textContent = answer
    }
  }

  async generateResponse (userMessage) {
    let response

    if (this.pendingFile) {
      const form = new FormData()
      form.append('prompt', userMessage ?? '')
      if (this.threadId) form.append('threadId', this.threadId)
      form.append('file', this.pendingFile, this.pendingFile.name)

      response = await fetch('/api/customer/chats', { method: 'POST', body: form })
    } else {
      response = await fetch('/api/customer/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage, threadId: this.threadId })
      })
    }

    if (!response.ok) throw new Error('Network response was not ok')
  }

  clearPendingFile () {
    const fileInput = this.shadow.querySelector('.file-input')
    const fileRow = this.shadow.querySelector('.file-row')
    const fileMeta = this.shadow.querySelector('.file-meta')
    this.pendingFile = null
    if (fileInput) fileInput.value = ''
    if (fileRow) fileRow.style.display = 'none'
    if (fileMeta) fileMeta.textContent = ''
  }

  scrollToBottom () {
    const chatMessages = this.shadow.querySelector('.chat-messages')
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
}

customElements.define('chat-component', Chat)
