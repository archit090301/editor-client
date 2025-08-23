import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './Editor.css';
import { useTheme } from '../ThemeContext';

function Editor() {
  const { theme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [languageId, setLanguageId] = useState(71); // Default: Python
  const fileInputRef = useRef();

  const languageMap = {
    71: 'py',
    63: 'js',
    54: 'cpp',
    62: 'java'
  };

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

  const handleProjectSelect = (e) => {
    const id = e.target.value;
    setSelectedProject(id);
    setSelectedFile('');
    setCode('');
    fetchFiles(id);
  };

  const handleFileSelect = (e) => {
    const id = e.target.value;
    setSelectedFile(id);
    fetchCode(id);
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
    await axios.post('/api/projects', { name: newProjectName });
    setNewProjectName('');
    fetchProjects();
  };

  const handleCreateFile = async () => {
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

    const res = await axios.post(`/api/projects/${selectedProject}/files`, {
      name: newFileName,
      content: sampleCode
    });

    setNewFileName('');
    fetchFiles(selectedProject);
    setSelectedFile(res.data.fileId);
    setCode(sampleCode);
  };

  const handleSave = async () => {
    if (selectedFile) {
      await axios.put(`/api/files/${selectedFile}`, { content: code });
      alert('Saved!');
    }
  };

  const handleExport = () => {
    const ext = languageMap[languageId] || 'txt';
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedFile || 'untitled'}.${ext}`;
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
        await axios.put(`/api/files/${selectedFile}`, { content: event.target.result });
        alert('File imported and saved!');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteFile = async () => {
    if (!selectedFile || !window.confirm("Delete this file?")) return;
    await axios.delete(`/api/files/${selectedFile}`);
    setSelectedFile('');
    setCode('');
    fetchFiles(selectedProject);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject || !window.confirm("Delete this project and its files?")) return;
    await axios.delete(`/api/projects/${selectedProject}`);
    setSelectedProject('');
    setSelectedFile('');
    setCode('');
    fetchProjects();
    setFiles([]);
  };

  return (
    <div
      className="editor-container"
      style={{
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
        color: theme === 'dark' ? '#eee' : '#000'
      }}
    >
      <h1 className="editor-title">🧑‍💻 Workspace Code Editor</h1>

      <div className="project-controls">
        <label>Select Language: </label>
        <select value={languageId} onChange={(e) => setLanguageId(parseInt(e.target.value))}>
          <option value={71}>Python</option>
          <option value={63}>JavaScript (Node.js)</option>
          <option value={54}>C++</option>
          <option value={62}>Java</option>
        </select>
      </div>

      <div className="project-controls">
        <select value={selectedProject} onChange={handleProjectSelect}>
          <option value="">-- Select Project --</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="New Project Name" />
        <button onClick={handleCreateProject}>Create Project</button>
        {selectedProject && <button onClick={handleDeleteProject}>🗑️ Delete Project</button>}
      </div>

      {selectedProject && (
        <div className="file-controls">
          <select value={selectedFile} onChange={handleFileSelect}>
            <option value="">-- Select File --</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} placeholder="New File Name" />
          <button onClick={handleCreateFile}>Create File</button>
          {selectedFile && <button onClick={handleDeleteFile}>🗑️ Delete File</button>}
        </div>
      )}

      <textarea
        className="editor-textarea"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="// Start coding"
        style={{
          backgroundColor: theme === 'dark' ? '#2c2c2c' : '#fff',
          color: theme === 'dark' ? '#eee' : '#000'
        }}
      />

      <div className="editor-buttons">
        <button onClick={handleSave}>💾 Save</button>
        <button onClick={handleRun}>▶️ Run</button>
        <button onClick={handleExport}>📤 Export</button>
        <button onClick={handleImportClick}>📥 Import</button>
        <input type="file" accept=".py,.txt,.js,.java,.cpp" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} />
      </div>

      <h3 className="output-label">Output:</h3>
      <pre className="output-box">{output}</pre>
    </div>
  );
}

export default Editor;
