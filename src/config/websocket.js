// src/config/websocket.js
const getWebSocketUrl = () => {
  // Use Railway backend for WebSocket
  // Since your backend is on Railway, always connect to it
  const protocol = 'wss:'; // Railway uses HTTPS, so WebSocket must use WSS
  const host = 'gestionstock-production.up.railway.app';
  
  // For local development with local backend, you can use this instead
  // if (process.env.NODE_ENV === 'development') {
  //   return `ws://localhost:8000`;
  // }
  
  return `${protocol}//${host}`;
};

export const getChatWebSocketUrl = (roomId, token) => {
  const baseUrl = getWebSocketUrl();
  const encodedRoomId = encodeURIComponent(roomId);
  return `${baseUrl}/ws/chat/${encodedRoomId}/?token=${token}`;
};