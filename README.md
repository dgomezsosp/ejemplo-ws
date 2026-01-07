# Ejemplo WebSocket - Aplicación de Chat en Tiempo Real

Aplicación de chat en tiempo real desarrollada con Node.js, Express, WebSockets y Web Components. Permite la comunicación instantánea entre clientes a través de canales de suscripción.

## Características

- Chat en tiempo real usando WebSockets
- Sistema de canales pub/sub para mensajes
- Interfaz moderna con Web Components
- Soporte para adjuntar archivos
- Nombres de usuario personalizados
- Proxy de desarrollo integrado

## Estructura del Proyecto

```
ejemplo-ws/
├── api/                    # Backend de la aplicación
│   ├── src/
│   │   ├── app.js         # Configuración de Express
│   │   ├── controllers/   # Controladores de chat
│   │   ├── middlewares/   # Middleware de errores
│   │   ├── routes/        # Rutas de la API
│   │   └── services/      # Servicio de WebSocket
│   ├── index.js           # Punto de entrada del servidor
│   └── package.json
├── client/                 # Frontend de la aplicación
│   └── customer/
│       ├── src/
│       │   ├── components/ # Componentes web (Chat)
│       │   └── index.js    # Punto de entrada
│       ├── vite.config.js
│       └── package.json
├── proxy.js               # Servidor proxy para desarrollo
└── package.json           # Scripts principales
```

## Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express 5** - Framework web
- **ws** - Librería de WebSockets
- **ESLint** con **neostandard** - Linting de código

### Frontend
- **Vite** - Build tool y dev server
- **Web Components** - Componentes nativos del navegador
- **WebSocket API** - Cliente WebSocket nativo

### Desarrollo
- **http-proxy-middleware** - Proxy HTTP para desarrollo
- **npm-run-all** - Ejecución de scripts en paralelo

## Requisitos Previos

- Node.js (versión 16 o superior recomendada)
- npm (incluido con Node.js)

## Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd ejemplo-ws
```

2. Instalar dependencias:
```bash
npm install
```

Este comando instalará las dependencias del proyecto raíz y del cliente frontend automáticamente.

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la carpeta `api/` con las siguientes variables:

```env
PORT=8080
```

### Configuración del Cliente

El cliente usa variables de entorno de Vite. Asegúrate de configurar:

```
VITE_WS_URL=ws://localhost/api/ws
```

## Uso

### Modo Desarrollo

Para iniciar la aplicación en modo desarrollo (frontend + proxy):

```bash
npm run dev
```

Este comando ejecutará:
- El servidor proxy en el puerto 80
- El cliente frontend en el puerto 5177

### Iniciar Solo el Backend

```bash
cd api
npm run dev
```

El servidor API se iniciará en el puerto 8080 con recarga automática.

### Iniciar Solo el Frontend

```bash
npm run dev:front-customer
```

El cliente se iniciará en el puerto 5177.

## Arquitectura del Sistema

### Sistema de WebSocket

La aplicación utiliza un sistema de canales pub/sub:

- Los clientes se conectan al WebSocket
- Pueden suscribirse a canales específicos
- Los mensajes se transmiten a todos los suscriptores del canal
- Soporte para múltiples canales simultáneos

#### Mensajes del Cliente

```javascript
// Suscribirse a un canal
{ type: 'subscribe', channel: 'nombre-canal' }

// Cancelar suscripción
{ type: 'unsubscribe', channel: 'nombre-canal' }
```

#### Mensajes del Servidor

```javascript
{ channel: 'nombre-canal', data: {...} }
```

### API REST

#### POST `/api/customer/chats`

Enviar un mensaje de chat.

**Body (JSON):**
```json
{
  "prompt": "Mensaje del usuario",
  "threadId": "id-opcional-del-hilo"
}
```

**Body (FormData con archivo):**
```
prompt: "Mensaje del usuario"
threadId: "id-opcional-del-hilo"
file: [archivo]
```

### Componente de Chat

El componente `<chat-component>` es un Web Component que proporciona:

- Interfaz de chat completa
- Captura de nombre de usuario
- Envío de mensajes de texto
- Adjuntar archivos
- Conexión WebSocket automática
- Animaciones y efectos visuales

## Proxy de Desarrollo

El archivo `proxy.js` configura un proxy que:

- Redirige `/api/*` al backend (puerto 8080)
- Redirige `/*` al frontend (puerto 5177)
- Configura cookies y headers apropiados
- Escucha en el puerto 80

## Scripts Disponibles

### Proyecto Raíz

- `npm run dev` - Inicia frontend y proxy en paralelo
- `npm run install` - Instala todas las dependencias
- `npm run dev:front-customer` - Inicia solo el frontend
- `npm run proxy` - Inicia solo el proxy

### API

- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor en modo desarrollo con recarga automática

### Cliente

- `npm run dev` - Inicia el servidor de desarrollo de Vite
- `npm run build` - Construye para producción
- `npm run preview` - Previsualiza el build de producción

## Desarrollo

### Añadir Nuevos Canales

Para añadir soporte para nuevos canales de chat:

1. Añade las rutas necesarias en `api/src/routes/`
2. Crea el controlador correspondiente en `api/src/controllers/`
3. Usa el servicio `broadcast(channel, data)` para enviar mensajes

### Estilo de Código

El proyecto usa ESLint con la configuración neostandard. Para verificar el código:

```bash
cd api
npx eslint .
```

## Producción

Para desplegar en producción:

1. Construir el frontend:
```bash
cd client/customer
npm run build
```

2. Configurar un servidor web (nginx, Apache) para servir los archivos estáticos

3. Iniciar el backend:
```bash
cd api
npm start
```

4. Configurar variables de entorno apropiadas para producción

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Añade nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## Licencia

ISC

## Autor

Desarrollado como ejemplo de aplicación con WebSockets.
