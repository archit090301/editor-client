import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import './Editor.css';
import { useTheme } from '../ThemeContext';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';

// Determine if we are on local or deployed
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const BACKEND_URL = isLocal
  ? "http://localhost:5000"
  : "https://editor-server-te21.onrender.com";

// Initialize socket
const socket = io(BACKEND_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

const languageSamples = {
  71: `# Sample Python program
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))`,
  63: `// Sample JavaScript
function greet(name) {
  return "Hello, " + name;
}
console.log(greet("World"));`,
  54: `// Sample C++
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  62: `// Sample Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
};

const languageMap = { 71: python(), 63: javascript(), 54: cpp(), 62: java() };

const CollabRoom = () => {
  const { theme } = useTheme();
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [code, setCode] = useState('');
  const [languageId, setLanguageId] = useState(71);
  const [fileName, setFileName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [socketId, setSocketId] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => {
      setSocketId(socket.id);
    });

    socket.on('codeUpdate', (incomingCode) => {
      setCode(incomingCode);
    });

    socket.on('joinError', (msg) => {
      alert(msg);
      setJoined(false);
    });

    socket.on('roomJoined', ({ roomId, code }) => {
      setRoom(roomId);
      setCode(code);
      setJoined(true);
    });

    socket.on('roomCreated', (roomId) => {
      setRoom(roomId);
      setJoined(true);
      setCode(languageSamples[languageId] || '');
    });

    socket.on('newChatMessage', ({ message, timestamp, id, sender }) => {
      const time = new Date(timestamp).toLocaleTimeString();
      if (id === socket.id) return; // Already displayed locally
      setMessages((prev) => [...prev, {text: `${sender} [${time}]: ${message}`, type: 'message'}]);
    });

    socket.on('userJoined', (username) => {
      setMessages((prev) => [...prev, {text: `📢 ${username} joined the room`, type: 'notification'}]);
    });

    socket.on('userLeft', (username) => {
      setMessages((prev) => [...prev, {text: `📢 ${username} left the room`, type: 'notification'}]);
    });

    socket.on('userTyping', (data) => {
      if (data.userId !== socket.id) {
        setTypingUsers(prev => {
          const updated = {...prev};
          updated[data.userId] = data.username;
          return updated;
        });
        
        // Clear typing indicator after 2 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const updated = {...prev};
            delete updated[data.userId];
            return updated;
          });
        }, 2000);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('codeUpdate');
      socket.off('joinError');
      socket.off('roomJoined');
      socket.off('roomCreated');
      socket.off('newChatMessage');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('userTyping');
    };
  }, [languageId]);

  const generateRoomId = () => {
    if (!usernameInput.trim()) return alert('Please enter your name.');
    setUsername(usernameInput);
    const id = `room-${Math.random().toString(36).substring(2, 8)}`;
    socket.emit('createRoom', id);
  };

  const handleJoinRoom = () => {
    if (!usernameInput.trim()) return alert('Please enter your name.');
    if (!room.trim()) return alert('Please enter Room ID.');
    setUsername(usernameInput);
    socket.emit('joinRoom', room);
  };

  const handleLeaveRoom = () => {
    socket.emit('leaveRoom', room);
    setRoom('');
    setCode('');
    setMessages([]);
    setJoined(false);
    setUsername('');
    setTypingUsers({});
  };

  const handleCodeChange = (value) => {
    setCode(value);
    if (room && joined) {
      socket.emit('codeChange', { room, code: value });
      
      // Handle typing indicator
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { room, username, userId: socket.id });
      }
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('stopTyping', { room, userId: socket.id });
      }, 1000);
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = parseInt(e.target.value);
    setLanguageId(newLang);
    setCode(languageSamples[newLang] || '');
  };

  const sendChatMessage = () => {
    if (chatInput.trim()) {
      const timestamp = new Date().toISOString();
      const timeStr = new Date(timestamp).toLocaleTimeString();
      setMessages((prev) => [
        ...prev,
        {text: `You [${timeStr}]: ${chatInput}`, type: 'message'}
      ]);
      socket.emit('chatMessage', {
        room,
        message: chatInput,
        timestamp,
        id: socket.id,
        sender: username || 'Guest'
      });
      setChatInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const getLanguageExtension = () => {
    return languageMap[languageId] || python();
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(room);
    alert('Room ID copied to clipboard!');
  };

  return (
    <div className={`collab-container ${theme}`}>
      <div className="collab-header">
        <h1 className="collab-title">
          <span className="icon">🤝</span>
          Collaborative Room
        </h1>
        
        {joined && (
          <div className="room-info">
            <span className="room-status">🟢 In Room: {room}</span>
            <button onClick={copyRoomId} className="btn copy-btn" title="Copy Room ID">
              📋
            </button>
            <button
              onClick={handleLeaveRoom}
              className="btn leave-btn"
            >
              Leave Room
            </button>
          </div>
        )}
      </div>

      {!joined && (
        <div className="join-section">
          <div className="input-card">
            <h3>Join Collaboration Room</h3>
            <div className="input-group">
              <input
                placeholder="Your Name"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="text-input"
              />
            </div>
            <div className="input-group">
              <input
                placeholder="Enter Room ID"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="text-input"
              />
            </div>
            <div className="button-group">
              <button onClick={handleJoinRoom} className="btn primary-btn">Join Room</button>
              <button onClick={generateRoomId} className="btn secondary-btn">Create New Room</button>
            </div>
          </div>
        </div>
      )}

      {joined && (
        <div className="collab-content">
          <div className="editor-section">
            <div className="file-controls">
              <input
                placeholder="Filename (e.g., Main.java)"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="text-input"
              />
              <select value={languageId} onChange={handleLanguageChange} className="language-select">
                <option value={71}>Python</option>
                <option value={63}>JavaScript</option>
                <option value={54}>C++</option>
                <option value={62}>Java</option>
              </select>
            </div>

            <div className="code-editor-wrapper">
              <CodeMirror
                value={code}
                height="100%"
                theme={theme === 'dark' ? 'dark' : 'light'}
                extensions={[getLanguageExtension()]}
                onChange={handleCodeChange}
                className="collab-editor"
              />
            </div>
          </div>

          <div className="chat-section">
            <div className="chat-header">
              <h3>Chat</h3>
              <div className="typing-indicator">
                {Object.keys(typingUsers).length > 0 && (
                  <span>
                    {Object.values(typingUsers).join(', ')} 
                    {Object.keys(typingUsers).length === 1 ? ' is ' : ' are '}
                    typing...
                  </span>
                )}
              </div>
            </div>
            
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message ${msg.type === 'notification' ? 'notification' : ''}`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            
            <div className="chat-input-container">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="chat-input"
              />
              <button onClick={sendChatMessage} className="btn send-btn">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollabRoom;