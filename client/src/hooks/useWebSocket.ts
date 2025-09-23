import { useState, useEffect, useRef, useCallback } from 'react'

export interface WebSocketMessage {
  type: string
  [key: string]: unknown
}

export interface UseWebSocketReturn {
  socket: WebSocket | null
  isConnected: boolean
  sendMessage: (message: WebSocketMessage) => void
  lastMessage: WebSocketMessage | null
  error: string | null
}

interface WebSocketEvent {
  type: string
  data?: unknown
}

// Singleton to prevent multiple connections
class WebSocketManager {
  private static instance: WebSocketManager
  private socket: WebSocket | null = null
  private url: string = ''
  private listeners: Set<(event: WebSocketEvent) => void> = new Set()
  private isConnecting = false
  private reconnectTimeoutId: number | undefined
  private shouldConnect = true
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager()
    }
    return WebSocketManager.instance
  }

  connect(url: string) {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('WebSocket already connected or connecting, skipping...')
      return // Already connected or connecting
    }

    this.url = url
    this.shouldConnect = true
    this.isConnecting = true

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId)
    }

    try {
      console.log('Creating WebSocket connection to:', url)
      this.socket = new WebSocket(url)

      this.socket.onopen = () => {
        console.log('WebSocket connected successfully')
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.notifyListeners({ type: 'open' })
      }

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.notifyListeners({ type: 'message', data })
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        this.isConnecting = false
        this.socket = null
        this.notifyListeners({ type: 'close' })

        // Auto-reconnection logic
        if (this.shouldConnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)
          console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
          
          this.reconnectTimeoutId = setTimeout(() => {
            this.connect(this.url)
          }, delay) as unknown as number
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.notifyListeners({ type: 'error', data: 'Max reconnection attempts reached' })
        }
      }

      this.socket.onerror = (event) => {
        console.error('WebSocket error:', event)
        this.isConnecting = false
        this.notifyListeners({ type: 'error', data: 'WebSocket connection error' })
      }

    } catch (err) {
      console.error('Failed to create WebSocket:', err)
      this.isConnecting = false
      this.notifyListeners({ type: 'error', data: 'Failed to create WebSocket connection' })
    }
  }

  disconnect() {
    this.shouldConnect = false
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId)
    }
    if (this.socket) {
      this.socket.close()
    }
  }

  sendMessage(message: WebSocketMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected or ready')
    }
  }

  addListener(listener: (event: WebSocketEvent) => void) {
    this.listeners.add(listener)
  }

  removeListener(listener: (event: WebSocketEvent) => void) {
    this.listeners.delete(listener)
  }

  private notifyListeners(event: WebSocketEvent) {
    this.listeners.forEach(listener => listener(event))
  }

  getConnectionState() {
    return {
      isConnected: this.socket?.readyState === WebSocket.OPEN,
      socket: this.socket
    }
  }
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const managerRef = useRef<WebSocketManager | null>(null)

  useEffect(() => {
    const manager = WebSocketManager.getInstance()
    managerRef.current = manager

    const listener = (event: WebSocketEvent) => {
      switch (event.type) {
        case 'open':
          setIsConnected(true)
          setError(null)
          break
        case 'close':
          setIsConnected(false)
          break
        case 'message':
          setLastMessage(event.data as WebSocketMessage)
          break
        case 'error':
          setError(event.data as string)
          break
      }
    }

    manager.addListener(listener)
    manager.connect(url)

    // Get initial state
    const state = manager.getConnectionState()
    setIsConnected(state.isConnected)

    return () => {
      manager.removeListener(listener)
      // Don't disconnect here as other components might be using it
    }
  }, [url])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    managerRef.current?.sendMessage(message)
  }, [])

  return {
    socket: managerRef.current?.getConnectionState().socket || null,
    isConnected,
    sendMessage,
    lastMessage,
    error
  }
}