import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, User, Users, MessageCircle, Plus, X, Loader2,
  ChevronLeft, ChevronRight, Smile, Paperclip, FileText,
  Download, Heart, ThumbsUp, Laugh, Frown, Trash2, Edit2,
  UserPlus, UserMinus, LogOut, MoreVertical, Info, MoreHorizontal,
  AlertTriangle, Check, CheckCheck, Search, Image, Video, File,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import axios from '../../api/axiosInstance';
import EmojiPicker from 'emoji-picker-react';

// ✅ WebSocket configuration - Railway production only
const getWebSocketUrl = (roomId, token) => {
  // Always use Railway production URL for WebSocket
  return `wss://gestionstock-production.up.railway.app/ws/chat/${roomId}/?token=${token}`;
};

// Base API URL - always use Railway production
const API_BASE_URL = 'https://gestionstock-production.up.railway.app';

export default function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showAddUsersModal, setShowAddUsersModal] = useState(false);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState(null);
  const [messageStatus, setMessageStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
 
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const fileInputRef = useRef(null);
  const isConnectingRef = useRef(false);
  const mountedRef = useRef(true);
  const sendingRef = useRef(false);
  const messageIdCounter = useRef(0);
  const userRef = useRef(null);
  const tokenRef = useRef(null);
 
  // Get current user ID from token
  if (!userRef.current) {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          ).join(''));
          const decoded = JSON.parse(jsonPayload);
          console.log('🔑 Decoded token:', decoded);
          userRef.current = { 
            id: parseInt(decoded.user_id),
            username: decoded.username || 'User', 
            role: decoded.role || 'user'
          };
        } catch { 
          console.error('Failed to decode token');
          userRef.current = {}; 
        }
      } else { 
        userRef.current = {}; 
      }
    } catch { 
      userRef.current = {}; 
    }
  }
  
  if (!tokenRef.current) {
    tokenRef.current = localStorage.getItem('access_token');
  }
 
  const user = userRef.current;
  const token = tokenRef.current;
  const headers = { Authorization: `Bearer ${token}` };
 
  console.log('👤 Current user:', user);
  console.log('📊 Current user ID:', user?.id, 'Type:', typeof user?.id);

  // Avatar helpers
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
 
  const getAvatarColor = (username = '') => {
    const colors = ['from-blue-500 to-blue-700','from-violet-500 to-violet-700','from-emerald-500 to-emerald-700',
      'from-orange-500 to-orange-700','from-pink-500 to-pink-700','from-indigo-500 to-indigo-700',
      'from-rose-500 to-rose-700','from-teal-500 to-teal-700'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) { hash = ((hash << 5) - hash) + username.charCodeAt(i); hash = hash & hash; }
    return colors[Math.abs(hash) % colors.length];
  };
 
  const UserAvatar = ({ username, size = 'w-8 h-8', textSize = 'text-xs' }) => (
    <div className={`${size} rounded-full bg-gradient-to-br ${getAvatarColor(username)} flex items-center justify-center text-white font-bold ${textSize} shadow-md flex-shrink-0 select-none`}>
      {getInitials(username)}
    </div>
  );
 
  // Notification
  const showNotification = useCallback((title, body) => {
    if (Notification.permission === 'granted') new Notification(title, { body });
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, body }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);
 
  useEffect(() => { if (Notification.permission === 'default') Notification.requestPermission(); }, []);
 
  // API calls - Using Railway URLs
  const fetchUnreadCount = useCallback(async () => {
    if (!token || !mountedRef.current) return;
    try { 
      const r = await axios.get(`${API_BASE_URL}/chat/unread/`, { headers }); 
      setUnreadCount(r.data.unread_count || 0); 
    } catch {}
  }, [token]);
 
  const fetchRooms = useCallback(async () => {
    if (!token || !mountedRef.current) return;
    setLoading(true); setError(null);
    try {
      const r = await axios.get(`${API_BASE_URL}/chat/rooms/`, { headers });
      const data = r.data?.results ?? (Array.isArray(r.data) ? r.data : []);
      setRooms(data);
      if (data.length > 0 && !selectedRoom) setSelectedRoom(data[0]);
    } catch (e) {
      setError('فشل تحميل المحادثات');
      if (e.response?.status === 401) window.location.href = '/login';
      setRooms([]);
    } finally { setLoading(false); }
  }, [token, selectedRoom]);
 
  const fetchUsers = useCallback(async () => {
    if (!token || !mountedRef.current) return;
    try {
      const r = await axios.get(`${API_BASE_URL}/auth/users/`, { headers });
      const data = r.data?.results ?? (Array.isArray(r.data) ? r.data : []);
      setUsers(data.filter(u => u.id !== user?.id));
    } catch { setUsers([]); }
  }, [token, user?.id]);
 
  const fetchMessages = useCallback(async (roomId) => {
    if (!token || !mountedRef.current || !roomId) return;
    setLoadingMessages(true);
    try {
      const r = await axios.get(`${API_BASE_URL}/chat/rooms/${roomId}/messages/`, { headers });
      const data = r.data?.results ?? (Array.isArray(r.data) ? r.data : []);
      const unique = data.reduce((acc, cur) => { 
        if (!acc.find(m => m.id === cur.id)) acc.push(cur); 
        return acc; 
      }, []);
      console.log(`📨 Loaded ${unique.length} messages for room ${roomId}`);
      setMessages(unique);
    } catch { setMessages([]); } finally { setLoadingMessages(false); }
  }, [token, user?.id]);
 
  const markMessagesAsRead = useCallback(async (roomId) => {
    if (!token) return;
    try {
      await axios.post(`${API_BASE_URL}/chat/rooms/${roomId}/mark-read/`, {}, { headers });
      fetchUnreadCount();
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, unread_count: 0 } : r));
    } catch {}
  }, [token, fetchUnreadCount]);
 
  // Room management
  const addUsersToRoom = async (userIds) => {
    if (!selectedRoom || !token) return;
    try {
      await axios.post(`${API_BASE_URL}/chat/rooms/${selectedRoom.id}/add-participants/`, { user_ids: userIds }, { headers });
      toast.success('تم إضافة المستخدمين'); setShowAddUsersModal(false); setSelectedUsers([]); fetchRooms();
    } catch (e) { toast.error(e.response?.data?.error || 'فشل إضافة المستخدمين'); }
  };
 
  const removeUserFromRoom = async (userId, username) => {
    if (!selectedRoom || !token) return;
    try {
      await axios.post(`${API_BASE_URL}/chat/rooms/${selectedRoom.id}/remove-participant/`, { user_id: userId }, { headers });
      toast.success(`تم إزالة ${username}`); fetchRooms();
    } catch (e) { toast.error(e.response?.data?.error || 'فشل إزالة المستخدم'); }
  };
 
  const leaveRoom = async () => {
    if (!selectedRoom || !token) return;
    try {
      await axios.post(`${API_BASE_URL}/chat/rooms/${selectedRoom.id}/leave/`, {}, { headers });
      toast.success('غادرت المحادثة');
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      fetchRooms(); setSelectedRoom(null); setMessages([]); setShowRoomMenu(false);
    } catch (e) { toast.error(e.response?.data?.error || 'فشل المغادرة'); }
  };
 
  const deleteRoom = async () => {
    if (!selectedRoom || !token) return;
    if (selectedRoom.created_by !== user?.id) { toast.error('يمكن فقط للمنشئ حذف المحادثة'); return; }
    if (!window.confirm('هل أنت متأكد من حذف هذه المحادثة؟')) return;
    try {
      await axios.delete(`${API_BASE_URL}/chat/rooms/${selectedRoom.id}/`, { headers });
      toast.success('تم حذف المحادثة');
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      fetchRooms(); setSelectedRoom(null); setMessages([]); setShowRoomMenu(false);
    } catch (e) { toast.error(e.response?.data?.error || 'فشل حذف المحادثة'); }
  };
 
  // Message management
  const editMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;
    try {
      await axios.put(`${API_BASE_URL}/chat/messages/${editingMessage.id}/`, { content: editContent, message_type: 'text' }, { headers });
      setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, content: editContent, updated_at: new Date().toISOString() } : m));
      toast.success('تم التعديل'); setEditingMessage(null); setEditContent(''); setActiveMessageMenu(null);
    } catch (e) { toast.error(e.response?.data?.error || 'فشل التعديل'); }
  };
 
  const confirmDeleteMessage = (msg) => { setDeleteConfirmMessage(msg); setActiveMessageMenu(null); };
  const executeDeleteMessage = async () => {
    if (!deleteConfirmMessage) return;
    try {
      await axios.delete(`${API_BASE_URL}/chat/messages/${deleteConfirmMessage.id}/`, { headers });
      setMessages(prev => prev.filter(m => m.id !== deleteConfirmMessage.id));
      toast.success('تم حذف الرسالة'); setDeleteConfirmMessage(null);
    } catch (e) { toast.error(e.response?.data?.error || 'فشل حذف الرسالة'); }
  };
 
  // File upload
  const uploadFile = async (file) => {
    if (!selectedRoom || !token) { 
      toast.error('اختر محادثة أولاً'); 
      return; 
    }
    
    if (file.size > 10 * 1024 * 1024) { 
      toast.error('حجم الملف يتجاوز 10MB'); 
      return; 
    }
    
    setUploadingFile(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', selectedRoom.id);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/upload/`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      toast.success('تم رفع الملف بنجاح');
      
      if (response.data) {
        setMessages(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.error || 'فشل رفع الملف');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };
 
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      toast.warning('بعض الملفات تجاوزت 10MB');
    }
    validFiles.forEach(uploadFile);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
 
  // Get file icon based on file type
  const getFileIcon = (fileName) => {
    if (!fileName) return <File className="w-5 h-5" />;
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
      return <Image className="w-5 h-5" />;
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      return <Video className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };
 
  // Get file URL
  const getFileUrl = (msg) => {
    if (msg.file_url) {
      return msg.file_url;
    }
    if (msg.file && typeof msg.file === 'string') {
      return `${API_BASE_URL}${msg.file}`;
    }
    return '';
  };
 
  // Download file
  const downloadFile = async (messageId, fileName) => {
    try {
      toast.loading('جاري تحميل الملف...', { id: 'download' });
      
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/chat/download/${messageId}/`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success('تم تحميل الملف بنجاح', { id: 'download' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('فشل تحميل الملف', { id: 'download' });
    }
  };
 
  // Check if file is image
  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  };
 
  // Reactions
  const addReaction = async (messageId, reaction) => {
    if (!token) return;
    try {
      await axios.post(`${API_BASE_URL}/chat/messages/${messageId}/react/`, { reaction }, { headers });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: [...(m.reactions || []), { user_id: user?.id, reaction }] } : m));
    } catch {}
  };
 
  // WebSocket - Always use Railway URL
  const connectWebSocket = useCallback(() => {
    if (!selectedRoom || !token || isConnectingRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    isConnectingRef.current = true;
    
    // ✅ Always use Railway production WebSocket URL
    const wsUrl = getWebSocketUrl(selectedRoom.id, token);
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
 
    ws.onopen = () => {
      if (!mountedRef.current) return;
      setIsConnected(true);
      reconnectAttempts.current = 0;
      isConnectingRef.current = false;
      console.log('✅ WebSocket connected to Railway');
      
      // Send initial ping to verify connection
      ws.send(JSON.stringify({ type: 'ping' }));
    };
    
    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message:', data);
        
        if (data.type === 'chat_message') {
          setMessages(prev => {
            const exists = prev.some(m => m.id === data.message_id);
            if (!exists) {
              const newMsg = {
                id: data.message_id || Date.now(),
                content: data.message,
                username: data.username,
                user_id: data.user_id,
                created_at: data.timestamp,
                message_type: 'text',
                can_edit: data.user_id === user?.id,
                can_delete: data.user_id === user?.id || selectedRoom?.created_by === user?.id
              };
              return [...prev, newMsg];
            }
            return prev;
          });
          
          if (data.user_id !== user?.id && selectedRoom) {
            markMessagesAsRead(selectedRoom.id);
            showNotification('رسالة جديدة', `${data.username}: ${data.message}`);
          }
        } else if (data.type === 'message_read') {
          setMessageStatus(p => ({ ...p, [data.message_id]: 'read' }));
        } else if (data.type === 'typing') {
          setTypingUsers(p => ({ ...p, [data.username]: data.is_typing }));
          if (data.is_typing) setTimeout(() => setTypingUsers(p => ({ ...p, [data.username]: false })), 3000);
        } else if (data.type === 'connection') {
          console.log('Connection established:', data.message);
        } else if (data.type === 'pong') {
          console.log('🏓 Pong received - connection alive');
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    ws.onclose = (e) => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      isConnectingRef.current = false;
      console.log(`🔴 WebSocket disconnected: ${e.code} - ${e.reason || 'No reason'}`);
      if (e.code !== 1000 && reconnectAttempts.current < 5) {
        setTimeout(() => {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/5)...`);
          connectWebSocket();
        }, 3000);
      }
    };
    
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      isConnectingRef.current = false;
    };
    
    wsRef.current = ws;
  }, [selectedRoom, token, user?.id, markMessagesAsRead, showNotification]);
 
  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || sendingRef.current) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('غير متصل. جاري إعادة الاتصال...'); 
      return;
    }
    sendingRef.current = true;
    const content = newMessage;
    const tempId = `temp_${Date.now()}_${++messageIdCounter.current}`;
    const tempMsg = {
      id: tempId, content, username: user?.username, user_id: user?.id,
      created_at: new Date().toISOString(), message_type: 'text',
      can_edit: true, can_delete: true, is_temp: true
    };
    setMessageStatus(p => ({ ...p, [tempId]: 'sending' }));
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage(''); setShowEmojiPicker(false);
    try {
      const r = await axios.post(`${API_BASE_URL}/chat/rooms/${selectedRoom.id}/send/`, { content, message_type: 'text' }, { headers });
      if (r.data?.id) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setMessages(prev => [...prev, { ...r.data, can_edit: true, can_delete: true }]);
        setMessageStatus(p => ({ ...p, [r.data.id]: 'delivered', [tempId]: undefined }));
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('فشل إرسال الرسالة');
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(content);
      setMessageStatus(p => { const s = { ...p }; delete s[tempId]; return s; });
    } finally { setTimeout(() => { sendingRef.current = false; }, 500); }
  };
 
  const handleTyping = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: true }));
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN)
        wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
    }, 1000);
  }, []);
 
  const handleEmojiClick = (e) => { setNewMessage(prev => prev + e.emoji); setShowEmojiPicker(false); };
  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
 
  // Create new room
  const createRoom = async () => {
    if (!newRoomName.trim()) { 
      toast.error('أدخل اسم المحادثة'); 
      return; 
    }
    
    const payload = {
      name: newRoomName,
      is_private: isPrivate,
      participants: isPrivate ? selectedUsers.map(u => u.id) : []
    };
    
    console.log('📤 Creating room with payload:', payload);
    
    try {
      const r = await axios.post(`${API_BASE_URL}/chat/rooms/`, payload, { headers });
      console.log('✅ Room created response:', r.data);
      setRooms(prev => [r.data, ...prev]); 
      setSelectedRoom(r.data);
      setShowCreateRoom(false); 
      setNewRoomName(''); 
      setSelectedUsers([]); 
      setIsPrivate(false);
      toast.success('تم إنشاء المحادثة');
    } catch (e) {
      console.error('❌ Error creating room:', e.response?.data);
      toast.error(e.response?.data?.message || 'فشل إنشاء المحادثة');
    }
  };
 
  const getRoomDisplayName = (room) => {
    if (!room) return '';
    if (!room.is_private) return room.name;
    const others = room.participants_detail?.filter(p => p.id !== user?.id) || [];
    if (!others.length) return room.name;
    if (others.length === 1) return others[0].username;
    return `${others[0].username} و ${others.length - 1} آخرين`;
  };
 
  const getStatusIcon = (msgId, isMe) => {
    if (!isMe) return null;
    const s = messageStatus[msgId];
    if (s === 'sending') return <Loader2 className="w-3 h-3 animate-spin text-slate-400" />;
    if (s === 'sent') return <Check className="w-3 h-3 text-slate-400" />;
    if (s === 'delivered') return <CheckCheck className="w-3 h-3 text-slate-400" />;
    if (s === 'read') return <CheckCheck className="w-3 h-3 text-blue-300" />;
    return null;
  };
 
  const formatTime = (ts) => { try { return new Date(ts).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
  const formatDate = (ts) => {
    try {
      const d = new Date(ts), t = new Date(), y = new Date(t); y.setDate(y.getDate() - 1);
      if (d.toDateString() === t.toDateString()) return 'اليوم';
      if (d.toDateString() === y.toDateString()) return 'أمس';
      return d.toLocaleDateString('ar-DZ');
    } catch { return ''; }
  };
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const s = ['B','KB','MB','GB'], i = Math.floor(Math.log(bytes)/Math.log(1024));
    return `${(bytes/Math.pow(1024,i)).toFixed(1)} ${s[i]}`;
  };
 
  const filteredRooms = rooms.filter(r => getRoomDisplayName(r).toLowerCase().includes(searchTerm.toLowerCase()));
  const reactions = [{ emoji:'👍', icon:ThumbsUp },{ emoji:'❤️', icon:Heart },{ emoji:'😂', icon:Laugh },{ emoji:'😮', icon:Frown }];
 
  // Lifecycle
  useEffect(() => {
    mountedRef.current = true;
    if (token && user?.username) { fetchRooms(); fetchUnreadCount(); fetchUsers(); }
    const iv = setInterval(() => { if (mountedRef.current) fetchUnreadCount(); }, 30000);
    return () => {
      mountedRef.current = false; clearInterval(iv);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (wsRef.current) wsRef.current.close(1000, 'unmount');
    };
  }, []);
 
  useEffect(() => {
    if (selectedRoom && token && user && mountedRef.current) {
      if (wsRef.current) { wsRef.current.close(1000, 'room changed'); wsRef.current = null; }
      isConnectingRef.current = false;
      fetchMessages(selectedRoom.id);
      markMessagesAsRead(selectedRoom.id);
      setTimeout(() => { if (mountedRef.current) connectWebSocket(); }, 100);
    }
  }, [selectedRoom]);
 
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const fn = () => setActiveMessageMenu(null);
    document.addEventListener('click', fn);
    return () => document.removeEventListener('click', fn);
  }, []);
 
  if (!token) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-10 h-10 text-blue-400 animate-spin" /></div>;
  }
 
  // Message Bubble Component
  const MessageBubble = ({ msg, index }) => {
    const currentUserId = parseInt(user?.id);
    const messageUserId = parseInt(msg.user_id);
    const isMe = messageUserId === currentUserId;
    
    const isTemp = !!msg.is_temp;
    const canEdit = !!msg.can_edit && msg.message_type !== 'file';
    const canDelete = !!msg.can_delete;
    const isFile = msg.message_type === 'file';
    const isImage = isFile && isImageFile(msg.file_name);
    const fileUrl = getFileUrl(msg);
 
    const showDate = index === 0 || formatDate(msg.created_at) !== formatDate(messages[index - 1]?.created_at);
    const prev = messages[index - 1];
    const groupWithPrev = prev && prev.user_id === msg.user_id && !showDate &&
      Math.abs(new Date(msg.created_at) - new Date(prev.created_at)) < 60000;
 
    return (
      <>
        {showDate && (
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-700/50" />
            <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full whitespace-nowrap">
              {formatDate(msg.created_at)}
            </span>
            <div className="flex-1 h-px bg-slate-700/50" />
          </div>
        )}
 
        <div className={`flex items-end gap-2 mb-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="w-8 flex-shrink-0 self-end">
            {!groupWithPrev && (
              <UserAvatar username={msg.username} size="w-8 h-8" textSize="text-xs" />
            )}
          </div>
 
          <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
            {!isMe && !groupWithPrev && selectedRoom && !selectedRoom.is_private && (
              <span className="text-[11px] font-medium text-slate-400 mb-1 px-1">{msg.username}</span>
            )}
 
            <div className="relative group">
              {editingMessage?.id === msg.id ? (
                <div className="bg-slate-700 border border-slate-600 rounded-2xl p-3 space-y-2 min-w-[220px]">
                  <textarea 
                    value={editContent} 
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-slate-600 text-white rounded-xl p-2 text-sm resize-none outline-none" 
                    rows={2} 
                    autoFocus 
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingMessage(null)} className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded-lg text-white transition">إلغاء</button>
                    <button onClick={editMessage} className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-400 rounded-lg text-white transition font-medium">حفظ</button>
                  </div>
                </div>
              ) : (
                <div className={`relative rounded-2xl px-4 py-2.5 shadow-sm ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-700 text-slate-100 rounded-bl-none border border-slate-600/40'
                } ${isTemp ? 'opacity-60' : ''}`}>
               
                  {isFile ? (
                    <div className="space-y-2">
                      {isImage ? (
                        <>
                          <img 
                            src={fileUrl} 
                            alt={msg.file_name}
                            className="max-w-[220px] max-h-[220px] rounded-xl cursor-pointer hover:opacity-90 transition object-cover"
                            onClick={() => window.open(fileUrl)}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                            }}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(fileUrl);
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> عرض
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(msg.id, msg.file_name);
                              }}
                              className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> تحميل
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <div className={`p-2 rounded-xl ${isMe ? 'bg-blue-500' : 'bg-slate-600'}`}>
                            {getFileIcon(msg.file_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{msg.file_name}</p>
                            {msg.file_size && <p className="text-xs opacity-60 mt-0.5">{formatFileSize(msg.file_size)}</p>}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFile(msg.id, msg.file_name);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition flex-shrink-0"
                            title="تحميل الملف"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  )}
                </div>
              )}
 
              {(canEdit || canDelete) && !isTemp && editingMessage?.id !== msg.id && (
                <div className={`absolute top-1 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id); }}
                    className="p-1 bg-slate-700 hover:bg-slate-600 rounded-full shadow-lg"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5 text-slate-300" />
                  </button>
 
                  {activeMessageMenu === msg.id && (
                    <div className={`absolute top-6 ${isMe ? 'right-0' : 'left-0'} bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[130px]`}>
                      {canEdit && (
                        <button onClick={() => { setEditingMessage(msg); setEditContent(msg.content); setActiveMessageMenu(null); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-cyan-400 hover:bg-slate-700 transition-colors whitespace-nowrap">
                          <Edit2 className="w-3.5 h-3.5" /> تعديل
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => confirmDeleteMessage(msg)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors whitespace-nowrap">
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
 
            <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <span className="text-[10px] text-slate-500 tabular-nums">{formatTime(msg.created_at)}</span>
              {msg.updated_at && msg.updated_at !== msg.created_at && (
                <span className="text-[10px] text-slate-600">· معدّل</span>
              )}
              {getStatusIcon(msg.id, isMe)}
              {isTemp && <span className="text-[10px] text-blue-400">جاري الإرسال...</span>}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {reactions.map(r => (
                  <button key={r.emoji} onClick={() => addReaction(msg.id, r.emoji)} title={r.emoji}
                    className="hover:scale-125 transition-transform p-0.5">
                    <r.icon className="w-3 h-3 text-slate-500 hover:text-blue-400" />
                  </button>
                ))}
              </div>
            </div>
 
            {msg.reactions?.length > 0 && (
              <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                {msg.reactions.map((r, i) => (
                  <span key={i} className="text-xs bg-slate-700 border border-slate-600 px-1.5 py-0.5 rounded-full">{r.reaction}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };
 
  // Render
  return (
    <div className="h-full bg-slate-900" dir="rtl">
      {/* Notifications */}
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div key={n.id} initial={{ opacity:0, x:-80 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-80 }}
            className="fixed top-20 left-4 z-50 bg-blue-600 border border-blue-400/30 rounded-xl shadow-xl p-3 min-w-[260px]">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-white flex-shrink-0" />
              <div><p className="text-white text-sm font-semibold">{n.title}</p><p className="text-blue-100 text-xs">{n.body}</p></div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
 
      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteConfirmMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
              className="bg-slate-800 rounded-2xl w-[360px] overflow-hidden shadow-2xl border border-red-500/30">
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-5 py-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h2 className="text-white font-bold">تأكيد الحذف</h2>
              </div>
              <div className="p-5">
                <p className="text-slate-300 mb-1">هل تريد حذف هذه الرسالة؟</p>
                <p className="text-slate-500 text-sm mb-5">لا يمكن التراجع عن هذا.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirmMessage(null)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition text-sm">إلغاء</button>
                  <button onClick={executeDeleteMessage} className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-white rounded-xl transition text-sm font-medium">حذف</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
 
      {/* Main layout - LTR for flex alignment */}
      <div className="h-full flex" dir="ltr">
 
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ width:0, opacity:0 }} animate={{ width:288, opacity:1 }} exit={{ width:0, opacity:0 }}
              className="bg-slate-800/80 border-r border-slate-700/50 flex flex-col overflow-hidden flex-shrink-0">
 
              <div className="p-4 border-b border-slate-700/50" dir="rtl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-bold text-sm">المحادثات</span>
                    {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>}
                  </div>
                  <button onClick={() => setShowCreateRoom(true)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-xl transition">
                    <Plus className="w-4 h-4 text-blue-400" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="بحث..." dir="rtl"
                    className="w-full bg-slate-700/60 border border-slate-600 focus:border-blue-500 rounded-xl pr-9 pl-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition" />
                </div>
              </div>
 
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5" dir="rtl">
                {loading ? (
                  <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>
                ) : error ? (
                  <div className="text-center text-red-400 py-8 text-sm">
                    <p>{error}</p>
                    <button onClick={fetchRooms} className="mt-2 text-xs text-blue-400 hover:text-blue-300">إعادة المحاولة</button>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">لا توجد محادثات</p>
                    <button onClick={() => setShowCreateRoom(true)} className="mt-2 text-xs text-blue-400">ابدأ جديدة</button>
                  </div>
                ) : filteredRooms.map(room => {
                  const active = selectedRoom?.id === room.id;
                  const otherUser = room.is_private ? room.participants_detail?.find(p => p.id !== user?.id) : null;
                  const name = getRoomDisplayName(room);
                  return (
                    <button key={room.id} onClick={() => { setSelectedRoom(room); markMessagesAsRead(room.id); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-right ${active ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-slate-700/50'}`}>
                      {otherUser
                        ? <UserAvatar username={otherUser.username} size="w-11 h-11" textSize="text-sm" />
                        : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${active ? 'text-blue-300' : 'text-white'}`}>{name}</p>
                          <div className="flex items-center gap-1 flex-shrink-0 mr-1">
                            {room.unread_count > 0 && <span className="bg-blue-500 text-white text-[10px] px-1.5 rounded-full font-bold">{room.unread_count}</span>}
                            <span className="text-[10px] text-slate-600">{formatTime(room.last_message?.created_at)}</span>
                          </div>
                        </div>
                        {room.last_message && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {room.last_message.message_type === 'file' ? `📎 ${room.last_message.file_name || 'ملف'}` : room.last_message.content}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
 
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
 
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 bg-slate-800/60 flex-shrink-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-700 rounded-xl transition flex-shrink-0">
              {sidebarOpen ? <ChevronLeft className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
 
            {selectedRoom ? (
              <>
                {(() => {
                  const other = selectedRoom.is_private ? selectedRoom.participants_detail?.find(p => p.id !== user?.id) : null;
                  return other
                    ? <UserAvatar username={other.username} size="w-9 h-9" textSize="text-sm" />
                    : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-white" />
                      </div>;
                })()}
 
                <div className="flex-1 min-w-0" dir="rtl">
                  <p className="text-white font-semibold text-sm truncate">{getRoomDisplayName(selectedRoom)}</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {isConnected ? 'متصل' : 'غير متصل'}
                    </span>
                    {Object.values(typingUsers).some(Boolean) && (
                      <span className="text-xs text-blue-400 animate-pulse">
                        {Object.keys(typingUsers).find(k => typingUsers[k])} يكتب...
                      </span>
                    )}
                  </div>
                </div>
 
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setShowDetailsDrawer(!showDetailsDrawer)} className="p-2 hover:bg-slate-700 rounded-xl transition">
                    <Info className="w-4 h-4 text-slate-400" />
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowRoomMenu(!showRoomMenu)} className="p-2 hover:bg-slate-700 rounded-xl transition">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                    {showRoomMenu && (
                      <div className="absolute top-10 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 min-w-[210px] overflow-hidden" dir="rtl">
                        <div className="px-3 py-2.5 border-b border-slate-700">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">المشاركون</p>
                          {selectedRoom.participants_detail?.map(p => (
                            <div key={p.id} className="flex items-center justify-between py-1.5">
                              <div className="flex items-center gap-2">
                                <UserAvatar username={p.username} size="w-6 h-6" textSize="text-[10px]" />
                                <span className="text-sm text-white">{p.username}</span>
                                {p.id === selectedRoom.created_by && <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1 rounded">منشئ</span>}
                              </div>
                              {p.id !== user?.id && selectedRoom.created_by === user?.id && (
                                <button onClick={() => removeUserFromRoom(p.id, p.username)} className="p-1 text-red-400 hover:text-red-300 transition">
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="p-1">
                          <button onClick={() => { setShowAddUsersModal(true); setShowRoomMenu(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cyan-400 hover:bg-slate-700 rounded-lg transition">
                            <UserPlus className="w-4 h-4" /> إضافة مستخدمين
                          </button>
                          {selectedRoom.created_by === user?.id
                            ? <button onClick={deleteRoom} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-lg transition">
                                <Trash2 className="w-4 h-4" /> حذف المحادثة
                              </button>
                            : <button onClick={leaveRoom} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-400 hover:bg-slate-700 rounded-lg transition">
                                <LogOut className="w-4 h-4" /> مغادرة المحادثة
                              </button>
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 text-center">
                <p className="text-slate-500 text-sm">اختر محادثة</p>
              </div>
            )}
          </div>
 
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3" dir="ltr"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30,58,138,0.07) 0%, transparent 70%)' }}>
            {!selectedRoom ? (
              <div className="flex flex-col items-center justify-center h-full" dir="rtl">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-blue-400/50" />
                </div>
                <p className="text-slate-400 font-medium mb-1">مرحباً بك</p>
                <p className="text-slate-600 text-sm mb-4">اختر محادثة أو ابدأ جديدة</p>
                <button onClick={() => setShowCreateRoom(true)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition">
                  محادثة جديدة
                </button>
              </div>
            ) : loadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full" dir="rtl">
                <MessageCircle className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">لا توجد رسائل بعد</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto pb-2">
                {messages.map((msg, i) => <MessageBubble key={msg.id || i} msg={msg} index={i} />)}
 
                {/* Typing indicator */}
                {Object.entries(typingUsers).map(([uname, typing]) =>
                  typing && uname !== user?.username && (
                    <div key={uname} className="flex items-end gap-2 mt-3">
                      <UserAvatar username={uname} size="w-7 h-7" textSize="text-[10px]" />
                      <div className="bg-slate-700 border border-slate-600/40 rounded-2xl rounded-bl-none px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          {[0,150,300].map(delay => (
                            <span key={delay} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${delay}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
 
          {/* Input */}
          {selectedRoom && (
            <div className="border-t border-slate-700/50 px-4 py-3 bg-slate-800/50 flex-shrink-0">
              <div className="max-w-2xl mx-auto flex items-end gap-2" dir="ltr">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-slate-700 rounded-xl transition flex-shrink-0">
                  <Smile className="w-5 h-5 text-slate-400" />
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="p-2 hover:bg-slate-700 rounded-xl transition flex-shrink-0 disabled:opacity-40 relative">
                  <Paperclip className="w-5 h-5 text-slate-400" />
                  {uploadingFile && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 rounded-lg px-2 py-1 text-xs text-blue-400 whitespace-nowrap">
                      {uploadProgress}%
                    </div>
                  )}
                </button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
 
                <div className="flex-1 relative">
                  <textarea 
                    value={newMessage} 
                    onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
                    onKeyPress={handleKeyPress} 
                    placeholder="اكتب رسالة..." 
                    rows={1} 
                    dir="rtl" 
                    disabled={!isConnected}
                    className="w-full bg-slate-700/70 border border-slate-600 focus:border-blue-500 text-white placeholder-slate-500 rounded-2xl px-4 py-2.5 text-sm outline-none resize-none transition-colors"
                    style={{ minHeight: '42px', maxHeight: '120px' }} 
                  />
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
                        className="absolute bottom-14 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden">
                        <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
 
                <button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || !isConnected}
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl transition shadow-lg flex-shrink-0">
                  <Send className="w-5 h-5" />
                </button>
              </div>
              {uploadingFile && (
                <div className="max-w-2xl mx-auto flex items-center gap-2 mt-2 text-xs text-blue-400" dir="rtl">
                  <Loader2 className="w-3 h-3 animate-spin" /> جاري رفع الملف... {uploadProgress}%
                </div>
              )}
            </div>
          )}
        </div>
 
        {/* Details Drawer */}
        <AnimatePresence>
          {showDetailsDrawer && selectedRoom && (
            <motion.div initial={{ width:0, opacity:0 }} animate={{ width:264, opacity:1 }} exit={{ width:0, opacity:0 }}
              className="bg-slate-800/80 border-l border-slate-700/50 flex flex-col overflow-hidden flex-shrink-0" dir="rtl">
              <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <span className="text-white font-semibold text-sm">التفاصيل</span>
                <button onClick={() => setShowDetailsDrawer(false)} className="p-1.5 hover:bg-slate-700 rounded-xl transition">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div className="text-center">
                  {(() => {
                    const other = selectedRoom.is_private ? selectedRoom.participants_detail?.find(p => p.id !== user?.id) : null;
                    return other
                      ? <UserAvatar username={other.username} size="w-16 h-16 mx-auto" textSize="text-xl" />
                      : <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto">
                          <Users className="w-8 h-8 text-white" />
                        </div>;
                  })()}
                  <h4 className="text-white font-semibold mt-3 text-sm">{getRoomDisplayName(selectedRoom)}</h4>
                  <p className="text-slate-500 text-xs">{selectedRoom.is_private ? 'خاصة' : 'مجموعة'}</p>
                </div>
 
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">المشاركون · {selectedRoom.participants_detail?.length || 0}</span>
                    <button onClick={() => { setShowAddUsersModal(true); setShowDetailsDrawer(false); }} className="text-blue-400 hover:text-blue-300 transition">
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {selectedRoom.participants_detail?.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar username={p.username} size="w-8 h-8" textSize="text-xs" />
                          <div>
                            <p className="text-white text-sm">{p.username}</p>
                            <p className="text-slate-500 text-xs">{p.id === selectedRoom.created_by ? 'المنشئ' : 'عضو'}</p>
                          </div>
                        </div>
                        {p.id !== user?.id && selectedRoom.created_by === user?.id && (
                          <button onClick={() => removeUserFromRoom(p.id, p.username)} className="text-red-400 hover:text-red-300 p-1 transition">
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
 
                <div className="pt-2 border-t border-slate-700/50">
                  {selectedRoom.created_by === user?.id
                    ? <button onClick={deleteRoom} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition">
                        <Trash2 className="w-4 h-4" /> حذف المحادثة
                      </button>
                    : <button onClick={leaveRoom} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition">
                        <LogOut className="w-4 h-4" /> مغادرة المحادثة
                      </button>
                  }
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
 
      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
              className="bg-slate-800 rounded-2xl w-[460px] overflow-hidden shadow-2xl border border-slate-700" dir="rtl">
              <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
                <h2 className="text-white font-bold">محادثة جديدة</h2>
                <button onClick={() => setShowCreateRoom(false)} className="p-1.5 hover:bg-white/20 rounded-xl transition">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">الاسم</label>
                  <input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="أدخل اسماً..."
                    className="w-full bg-slate-700 border border-slate-600 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="rounded border-slate-600 text-blue-500" />
                  <span className="text-sm text-slate-300">محادثة خاصة</span>
                </label>
                {isPrivate && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">المشاركون</label>
                    <div className="max-h-48 overflow-y-auto border border-slate-600 rounded-xl p-2 space-y-1">
                      {users.map(u => (
                        <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-700 rounded-xl cursor-pointer transition">
                          <input type="checkbox" checked={selectedUsers.some(su => su.id === u.id)}
                            onChange={e => { if(e.target.checked) setSelectedUsers([...selectedUsers,u]); else setSelectedUsers(selectedUsers.filter(su=>su.id!==u.id)); }}
                            className="rounded border-slate-600 text-blue-500" />
                          <UserAvatar username={u.username} size="w-8 h-8" textSize="text-xs" />
                          <span className="text-white text-sm">{u.username}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowCreateRoom(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition text-sm">إلغاء</button>
                  <button onClick={createRoom} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition text-sm font-medium">إنشاء</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
 
      {/* Add Users Modal */}
      <AnimatePresence>
        {showAddUsersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
              className="bg-slate-800 rounded-2xl w-[460px] overflow-hidden shadow-2xl border border-slate-700" dir="rtl">
              <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
                <h2 className="text-white font-bold">إضافة مستخدمين</h2>
                <button onClick={() => { setShowAddUsersModal(false); setSelectedUsers([]); }} className="p-1.5 hover:bg-white/20 rounded-xl transition">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="p-5">
                <div className="max-h-72 overflow-y-auto border border-slate-600 rounded-xl p-2 space-y-1 mb-5">
                  {users.map(u => {
                    const inRoom = selectedRoom?.participants_detail?.some(p => p.id === u.id);
                    return (
                      <label key={u.id} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${inRoom ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-700'}`}>
                        <input type="checkbox" checked={selectedUsers.some(su => su.id === u.id)} disabled={inRoom}
                          onChange={e => { if(e.target.checked&&!inRoom) setSelectedUsers([...selectedUsers,u]); else setSelectedUsers(selectedUsers.filter(su=>su.id!==u.id)); }}
                          className="rounded border-slate-600 text-blue-500" />
                        <UserAvatar username={u.username} size="w-8 h-8" textSize="text-xs" />
                        <span className="text-white text-sm flex-1">{u.username}</span>
                        {inRoom && <span className="text-[10px] text-green-400">موجود</span>}
                      </label>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowAddUsersModal(false); setSelectedUsers([]); }} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition text-sm">إلغاء</button>
                  <button onClick={() => { if(selectedUsers.length) addUsersToRoom(selectedUsers.map(u=>u.id)); }} disabled={!selectedUsers.length}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition text-sm font-medium">
                    إضافة {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}