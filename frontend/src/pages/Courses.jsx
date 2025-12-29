import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Pages.css';

function Courses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await axios.get(`https://the-project-club-backend.onrender.com/api/batches`);
      console.log('✅ Batches response:', response.data);
      
      // Handle correct backend response format
      if (response.data.success && response.data.batches) {
        setBatches(response.data.batches);
      } else if (response.data && response.data.data) {
        setBatches(response.data.data);
      } else if (Array.isArray(response.data)) {
        setBatches(response.data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Coming Soon';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Coming Soon';
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Coming Soon';
    }
  };

  const handleEnroll = async (batchId) => {
    try {
      if (!user) {
        alert('Please login to enroll in courses');
        navigate('/login');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to enroll in courses');
        navigate('/login');
        return;
      }

      navigate(`/register?batch=${batchId}`);
    } catch (error) {
      console.error('Enrollment error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to enroll. Please try again.';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="hero-section">
          <h1>📚 Our Courses</h1>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="hero-section">
        <h1>📚 Our Courses</h1>
        <p>Master real-world development skills with our project-based courses</p>
      </div>

      <div className="content-section">
        {batches.length === 0 ? (
          <div className="content-box" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>🚀 Coming Soon!</h2>
            <p>No courses available at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="courses-grid">
            {batches.map((batch) => {
              const maxSeats = batch.max_students || batch.max_seats || batch.max_se || 0;
              const registeredCount = batch.registered_count || 0;
              const price = batch.price ?? batch.fee ?? null;
              
              return (
                <div key={batch.id} className="course-card">
                  <div className="course-header">
                    <h3>{batch.title}</h3>
                    {registeredCount >= maxSeats ? (
                      <span className="course-badge">FULL</span>
                    ) : (
                      <span className="course-badge">{batch.mode || 'OPEN'}</span>
                    )}
                  </div>

                  <div className="course-description">
                    {batch.description || 'No description available'}
                  </div>

                  <div className="course-details">
                    <div className="detail-item">
                      <span className="label">📅 Start Date:</span>
                      <span>{formatDate(batch.start_date)}</span>
                    </div>

                    <div className="detail-item">
                      <span className="label">⏱️ Duration:</span>
                      <span>{batch.duration || 'TBA'}</span>
                    </div>

                    {batch.schedule && (
                      <div className="detail-item">
                        <span className="label">🗓️ Schedule:</span>
                        <span>{batch.schedule}</span>
                      </div>
                    )}

                    <div className="detail-item">
                      <span className="label">💻 Mode:</span>
                      <span>{batch.mode || 'ONLINE'}</span>
                    </div>

                    <div className="detail-item">
                      <span className="label">👥 Enrolled:</span>
                      <span>{registeredCount}/{maxSeats}</span>
                    </div>

                    <div className="detail-item">
                      <span className="label">💰 Price:</span>
                      <span className="price">
                        {price !== null ? `₹${price.toLocaleString('en-IN')}` : 'Free'}
                      </span>
                    </div>
                  </div>

                  {/* Tech Stack Section */}
                  {batch.tech_stack && batch.tech_stack.length > 0 && (
                    <div className="tech-stack">
                      <p className="tech-label">🛠️ Tech Stack:</p>
                      <div className="tech-badges">
                        {batch.tech_stack.map((tech, index) => (
                          <span key={index} className="tech-badge">{tech}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects Section */}
                  {batch.projects && batch.projects.length > 0 && (
                    <div className="projects-section">
                      <p className="projects-label">📂 Projects:</p>
                      <ul className="projects-list">
                        {batch.projects.map((project, index) => (
                          <li key={index}>✓ {project}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button 
                    onClick={() => handleEnroll(batch.id)} 
                    className="enroll-btn"
                    disabled={registeredCount >= maxSeats}
                  >
                    {registeredCount >= maxSeats 
                      ? '🔒 Course Full' 
                      : '🎓 Enroll Now →'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Courses;
