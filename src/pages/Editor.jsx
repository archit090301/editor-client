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
  const [languageId, setLanguageId] = useState(71); // Default: Python
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef();

  const languageMap = { 71: 'py', 63: 'js', 54: 'cpp', 62: 'java' };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const res = await axios.get('/api/projects');
    setProjects(res.data);
  };

  const fetchFiles = async (projectId) => {
    const res = await axios.get(`/api/projects/${projectId}/files`);
    setFiles(res.data);
  };

  const fetchCode = async (fileId) => {
    const res = await axios.get(`/api/files/${fileId}`);
    setCode(res.data.content);
  };

  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    setSelectedFile(null);
    setCode('');
    await fetchFiles(project.id);
  };

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    await fetchCode(file.id);
  };

  const handleRun = async () => {
    try {
      setOutput('Running...');
      const res = await axios.post('/api/run-code', { code, languageId });
      const { stdout, stderr } = res.data;
      setOutput(stdout || `Error:\n${stderr}` || 'Execution finished with no output.');
    } catch {
      setOutput('Error executing code.');
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
      // Show a temporary success message instead of alert
      const saveBtn = document.querySelector('.save-btn');
      if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved';
        setTimeout(() => {
          saveBtn.textContent = originalText;
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
        // Show a temporary success message instead of alert
        const importBtn = document.querySelector('.import-btn');
        if (importBtn) {
          const originalText = importBtn.textContent;
          importBtn.textContent = '✓ Imported';
          setTimeout(() => {
            importBtn.textContent = originalText;
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

  return (
    <div className={`editor-app ${theme}`}>
      {/* Sidebar with toggle */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
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
                  className="icon-btn"
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
                    className={`list-item ${selectedProject?.id === project.id ? 'active' : ''}`}
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
                    className="icon-btn"
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
                      className={`list-item ${selectedFile?.id === file.id ? 'active' : ''}`}
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

      {/* Main Editor Area */}
      <div className="editor-main">
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
          <CodeMirror
            value={code}
            height="100%"
            theme={theme === 'dark' ? 'dark' : 'light'}
            extensions={[getLanguageExtension()]}
            onChange={setCode}
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
            {output || 'Output will appear here after code execution...'}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default Editor;