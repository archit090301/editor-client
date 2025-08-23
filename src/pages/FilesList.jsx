import { useEffect, useState } from 'react';
import axios from 'axios';
import './FilesList.css';

function FilesList({ projectId, selectedFileId, onSelectFile, onFileCreated }) {
  const [files, setFiles] = useState([]);
  const [newFileName, setNewFileName] = useState('');

  useEffect(() => {
    if (projectId) fetchFiles();
  }, [projectId]);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}/files`);
      setFiles(res.data);
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    try {
      const res = await axios.post(`/api/projects/${projectId}/files`, {
        filename: newFileName
      });
      setNewFileName('');
      fetchFiles(); // refresh
      onFileCreated(res.data.id); // optional callback
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create file');
    }
  };

  return (
    <div className="files-container">
      <h4>📄 Files</h4>
      {files.map((file) => (
        <div
          key={file.id}
          className={`file-item ${selectedFileId === file.id ? 'active' : ''}`}
          onClick={() => onSelectFile(file)}
        >
          {file.filename}
        </div>
      ))}

      <div className="create-file">
        <input
          type="text"
          placeholder="New file name"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
        />
        <button onClick={handleCreateFile}>Create</button>
      </div>
    </div>
  );
}

export default FilesList;
