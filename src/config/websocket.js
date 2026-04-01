// src/config/websocket.js
const getWebSocketUrl = () => {
  // Use the current window location for WebSocket
  // This will automatically use the correct domain on Railway
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host; // This will be gestionstock-production.up.railway.app on Railway
  
  // For development, you can still override with environment variable
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_WS_HOST) {
    const wsHost = process.env.REACT_APP_WS_HOST;
    const wsPort = process.env.REACT_APP_WS_PORT || '8000';
    return `${protocol}//${wsHost}:${wsPort}`;
  }
  
  // For production, use the same host as the page
  return `${protocol}//${host}`;
};

export const getChatWebSocketUrl = (roomId, token) => {
  const baseUrl = getWebSocketUrl();
  const encodedRoomId = encodeURIComponent(roomId);
  // Add token as query parameter
  return `${baseUrl}/ws/chat/${encodedRoomId}/?token=${token}`;
};