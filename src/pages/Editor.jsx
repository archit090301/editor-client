import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './Editor.css';
import { useTheme } from '../ThemeContext';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';

function Editor() {
  const { theme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [languageId, setLanguageId] = useState(71);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileAnimation, setFileAnimation] = useState('');
  const [projectAnimation, setProjectAnimation] = useState('');
  const fileInputRef = useRef();
  const editorRef = useRef();
  const codeMirrorRef = useRef();

  const languageMap = { 71: 'py', 63: 'js', 54: 'cpp', 62: 'java' };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const res = await axios.get('/api/projects');
    setProjects(res.data);
  };

  const fetchFiles = async (projectId) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/projects/${projectId}/files`);
      setFiles(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCode = async (fileId) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/files/${fileId}`);
      setCode(res.data.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = async (project) => {
    setProjectAnimation('fade-out');
    
    setTimeout(async () => {
      setSelectedProject(project);
      setSelectedFile(null);
      setCode('');
      await fetchFiles(project.id);
      setProjectAnimation('fade-in');
    }, 300);
  };

  const handleFileSelect = async (file) => {
    setFileAnimation('slide-out');
    
    setTimeout(async () => {
      setSelectedFile(file);
      await fetchCode(file.id);
      setFileAnimation('slide-in');
    }, 300);
  };

  const handleRun = async () => {
    try {
      setOutput('');
      setIsLoading(true);
      const res = await axios.post('/api/run-code', { code, languageId });
      const { stdout, stderr } = res.data;
      setOutput(stdout || `Error:\n${stderr}` || 'Execution finished with no output.');
    } catch {
      setOutput('Error executing code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName) return;
    await axios.post('/api/projects', { name: newProjectName });
    setNewProjectName('');
    fetchProjects();
  };

  const handleCreateFile = async () => {
    if (!newFileName || !selectedProject) return;

    let sampleCode = '';
    switch (languageId) {
      case 71:
        sampleCode = `# Sample Python program\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))`;
        break;
      case 63:
        sampleCode = `// Sample JavaScript program\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("World"));`;
        break;
      case 62:
        sampleCode = `// Sample Java program\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}`;
        break;
      case 54:
        sampleCode = `// Sample C++ program\n#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, World!" << endl;\n  return 0;\n}`;
        break;
      default:
        sampleCode = `// Sample code`;
    }

    const res = await axios.post(`/api/projects/${selectedProject.id}/files`, {
      name: newFileName,
      content: sampleCode
    });

    setNewFileName('');
    fetchFiles(selectedProject.id);
    setSelectedFile({ id: res.data.fileId, name: newFileName });
    setCode(sampleCode);
  };

  const handleSave = async () => {
    if (selectedFile) {
      await axios.put(`/api/files/${selectedFile.id}`, { content: code });
      const saveBtn = document.querySelector('.save-btn');
      if (saveBtn) {
        saveBtn.classList.add('saved-animation');
        setTimeout(() => {
          saveBtn.classList.remove('saved-animation');
        }, 2000);
      }
    }
  };

  const handleExport = () => {
    const ext = languageMap[languageId] || 'txt';
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedFile?.name || 'untitled'}.${ext}`;
    document.body.appendChild(element);
    element.click();
  };

  const handleImportClick = () => fileInputRef.current.click();

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setCode(event.target.result);
      if (selectedFile) {
        await axios.put(`/api/files/${selectedFile.id}`, { content: event.target.result });
        const importBtn = document.querySelector('.import-btn');
        if (importBtn) {
          importBtn.classList.add('imported-animation');
          setTimeout(() => {
            importBtn.classList.remove('imported-animation');
          }, 2000);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteFile = async () => {
    if (!selectedFile || !window.confirm("Delete this file?")) return;
    await axios.delete(`/api/files/${selectedFile.id}`);
    setSelectedFile(null);
    setCode('');
    fetchFiles(selectedProject.id);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject || !window.confirm("Delete this project and its files?")) return;
    await axios.delete(`/api/projects/${selectedProject.id}`);
    setSelectedProject(null);
    setSelectedFile(null);
    setCode('');
    fetchProjects();
    setFiles([]);
  };

  const getLanguageExtension = () => {
    switch (languageId) {
      case 71: return python();
      case 63: return javascript();
      case 62: return java();
      case 54: return cpp();
      default: return [];
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      editorRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={`editor-app ${theme}`}>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isFullScreen ? 'hidden' : ''}`}>
        <button 
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '→' : '←'}
        </button>
        
        {!isCollapsed && (
          <>
            <div className="sidebar-section">
              <h2>
                <span className="icon">📁</span>
                Projects
              </h2>
              <div className="input-group">
                <input
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="New project name"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                />
                <button 
                  onClick={handleCreateProject} 
                  className="icon-btn add-btn"
                  disabled={!newProjectName}
                  title="Create new project"
                >
                  +
                </button>
              </div>
              <div className="scroll-container">
                {projects.map(project => (
                  <div 
                    key={project.id} 
                    className={`list-item ${selectedProject?.id === project.id ? 'active' : ''} ${projectAnimation}`}
                  >
                    <span 
                      onClick={() => handleProjectSelect(project)}
                      className="item-label"
                    >
                      <span className="icon">📂</span>
                      {project.name}
                    </span>
                    {selectedProject?.id === project.id && (
                      <button 
                        onClick={handleDeleteProject} 
                        className="icon-btn danger"
                        title="Delete project"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedProject && (
              <div className="sidebar-section">
                <h3>
                  <span className="icon">📄</span>
                  Files in {selectedProject.name}
                </h3>
                <div className="input-group">
                  <input
                    value={newFileName} 
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="New file name"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
                  />
                  <button 
                    onClick={handleCreateFile} 
                    className="icon-btn add-btn"
                    disabled={!newFileName}
                    title="Create new file"
                  >
                    +
                  </button>
                </div>
                <div className="scroll-container">
                  {files.map(file => (
                    <div 
                      key={file.id} 
                      className={`list-item ${selectedFile?.id === file.id ? 'active' : ''} ${fileAnimation}`}
                    >
                      <span 
                        onClick={() => handleFileSelect(file)}
                        className="item-label"
                      >
                        <span className="icon">📝</span>
                        {file.name}
                      </span>
                      {selectedFile?.id === file.id && (
                        <button 
                          onClick={handleDeleteFile} 
                          className="icon-btn danger"
                          title="Delete file"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="sidebar-section">
              <label>
                <span className="icon">🌐</span>
                Language:
              </label>
              <select 
                value={languageId} 
                onChange={(e) => setLanguageId(parseInt(e.target.value))}
                className="language-select"
              >
                <option value={71}>Python</option>
                <option value={63}>JavaScript</option>
                <option value={54}>C++</option>
                <option value={62}>Java</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="editor-main" ref={editorRef}>
        <div className="editor-header">
          <h1>
            <span className="icon">🧑‍💻</span>
            Workspace Code Editor
            {selectedFile && ` - ${selectedFile.name}`}
          </h1>
          <div className="editor-actions">
            <button onClick={handleSave} className="btn save-btn" title="Save file">
              <span className="icon">💾</span> Save
            </button>
            <button onClick={handleRun} className="btn run-btn" title="Run code">
              <span className="icon">▶️</span> Run
            </button>
            <button onClick={handleExport} className="btn" title="Export file">
              <span className="icon">📤</span> Export
            </button>
            <button onClick={handleImportClick} className="btn import-btn" title="Import file">
              <span className="icon">📥</span> Import
            </button>
            <button 
              onClick={toggleFullScreen} 
              className="btn" 
              title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <span className="icon">
                {isFullScreen ? '📱' : '📺'}
              </span>
              {isFullScreen ? 'Exit Full' : 'Full Screen'}
            </button>
            <input 
              type="file" 
              accept=".py,.txt,.js,.java,.cpp" 
              ref={fileInputRef} 
              onChange={handleImport} 
              style={{ display: 'none' }} 
            />
          </div>
        </div>

        <div className="code-editor-container">
          {isLoading && <div className="loading-overlay"><div className="spinner"></div></div>}
          <CodeMirror
            value={code}
            height="100%"
            theme={theme === 'dark' ? 'dark' : 'light'}
            extensions={[getLanguageExtension()]}
            onChange={setCode}
            ref={codeMirrorRef}
            className={fileAnimation}
          />
        </div>

        <div className="output-container">
          <div className="output-header">
            <h3>Output</h3>
            <button 
              onClick={() => setOutput('')} 
              className="icon-btn"
              title="Clear output"
            >
              🗑️
            </button>
          </div>
          <pre className="output-content">
            {isLoading ? <div className="loading-dots">Running<span>.</span><span>.</span><span>.</span></div> : output || 'Output will appear here after code execution...'}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default Editor;