import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './Editor.css';
import { useTheme } from '../ThemeContext';

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
      setMessages((prev) => [...prev, `${sender} [${time}]: ${message}`]);
    });

    return () => {
      socket.off('connect');
      socket.off('codeUpdate');
      socket.off('joinError');
      socket.off('roomJoined');
      socket.off('roomCreated');
      socket.off('newChatMessage');
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
  };

  const handleCodeChange = (e) => {
    const updatedCode = e.target.value;
    setCode(updatedCode);
    if (room && joined) {
      socket.emit('codeChange', { room, code: updatedCode });
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
        `You [${timeStr}]: ${chatInput}`
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

  return (
    <div
      className="editor-container"
      style={{
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
        color: theme === 'dark' ? '#eee' : '#000'
      }}
    >
      <h1 className="editor-title">🤝 Collaborative Room</h1>

      {!joined && (
        <div className="project-controls">
          <input
            placeholder="Your Name"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
          />
          <input
            placeholder="Enter Room ID"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button onClick={handleJoinRoom}>Join Room</button>
          <button onClick={generateRoomId}>Create Room</button>
        </div>
      )}

      {joined && (
        <>
          <div className="project-controls">
            <span style={{ fontWeight: '600', color: 'green' }}>🟢 In Room: {room}</span>
            <button
              onClick={handleLeaveRoom}
              style={{ marginLeft: '10px', backgroundColor: '#dc3545', color: 'white' }}
            >
              Leave Room
            </button>
          </div>

          <div className="file-controls">
            <input
              placeholder="Filename (e.g., Main.java)"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
            <select value={languageId} onChange={handleLanguageChange}>
              <option value={71}>Python</option>
              <option value={63}>JavaScript</option>
              <option value={54}>C++</option>
              <option value={62}>Java</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <textarea
              className="editor-textarea"
              value={code}
              onChange={handleCodeChange}
              placeholder="// Start coding"
              style={{
                width: '65%',
                backgroundColor: theme === 'dark' ? '#2c2c2c' : '#fff',
                color: theme === 'dark' ? '#eee' : '#000'
              }}
            />

            <div style={{ width: '35%', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  flex: 1,
                  border: '1px solid #ccc',
                  padding: '10px',
                  borderRadius: '6px',
                  height: '300px',
                  overflowY: 'auto',
                  background: theme === 'dark' ? '#2a2a2a' : '#f9f9f9',
                  color: theme === 'dark' ? '#fff' : '#000'
                }}
              >
                {messages.map((msg, index) => (
                  <div key={index} style={{ marginBottom: '8px' }}>{msg}</div>
                ))}
              </div>

              <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message"
                  style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button onClick={sendChatMessage} style={{ padding: '6px 12px' }}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CollabRoom;
