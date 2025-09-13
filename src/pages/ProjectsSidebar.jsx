import { useEffect, useState } from 'react';
import axios from 'axios';
import './ProjectsSidebar.css';

function ProjectsSidebar({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await axios.post('/api/projects', { name: newProjectName });
      setNewProjectName('');
      fetchProjects(); // refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="sidebar">
      <h3>Your Projects</h3>
      <div className="project-list">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="project-item"
            onClick={() => onSelectProject(proj.id)}
          >
            📁 {proj.name}
          </div>
        ))}
      </div>

      <div className="create-project">
        <input
          type="text"
          placeholder="New project name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
        />
        <button onClick={handleCreateProject}>Create</button>
      </div>
    </div>
  );
}

export default ProjectsSidebar;
