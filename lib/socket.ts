import { io, type Socket } from 'socket.io-client'
import { getAccessToken } from './api'

const URL = (process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '')
let socket: Socket | null = null

export function getSocket(): Socket {
  if (socket) {
    if (!socket.connected && !socket.active) {
      socket.auth = { token: getAccessToken() }
      socket.connect()
    }
    return socket
  }
  socket = io(URL, { auth: { token: getAccessToken() }, autoConnect: true, transports: ['websocket', 'polling'], withCredentials: true })
  return socket
}

export function disconnectSocket() { if (socket) { socket.disconnect(); socket = null } }
