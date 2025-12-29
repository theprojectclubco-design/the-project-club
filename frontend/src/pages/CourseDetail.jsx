import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './CourseDetail.css';

function CourseDetail() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courseData, setCourseData] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, user]);

  const fetchCourseDetails = async () => {
    try {
      console.log('Fetching course details for batch ID:', batchId);
      const token = localStorage.getItem('token');

      // Fetch batch details
      const batchResponse = await axios.get(
        `https://the-project-club-backend.onrender.com/api/batches/${batchId}`
      );
      console.log('Batch response:', batchResponse.data);

      if (batchResponse.data.success) {
        setCourseData(batchResponse.data.batch);

        // Check enrollment if user is logged in
        if (token && user) {
          try {
            const profileResponse = await axios.get(
              `https://the-project-club-backend.onrender.com/api/auth/profile`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (profileResponse.data.success) {
              const enrollments = profileResponse.data.user.enrollments;
              // FIX: Convert both to string for comparison
              const enrolled = enrollments.some(
                (enrollment) =>
                  String(enrollment.batch_id) === String(batchId) &&
                  enrollment.payment_status === 'PAID'
              );
              setIsEnrolled(enrolled);
              console.log('Enrollment status:', enrolled);
            }
          } catch (profileError) {
            console.log('Profile check failed, user may not be logged in', profileError);
            setIsEnrolled(false);
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching course details:', error);
      setError('Failed to load course details');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'To be announced';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'To be announced';
    }
  };

  const handleEnroll = () => {
    if (!user) {
      alert('Please login to enroll in this course');
      navigate('/login');
      return;
    }
    navigate(`/register?batch=${batchId}`);
  };

  const handleAccessCourse = () => {
    navigate(`/my-courses/${batchId}`);
  };

  if (loading) {
    return (
      <div className="course-detail-container">
        <div className="loading">Loading course details...</div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="course-detail-container">
        <div className="error">{error || 'Failed to load course details'}</div>
        <button onClick={() => navigate('/courses')} className="back-btn">
          ← Back to Courses
        </button>
      </div>
    );
  }

  const {
    title,
    course_name,
    description,
    start_date,
    end_date,
    duration,
    fee,
    max_seats,
    registered_count,
    technologies,
    projects,
    instructor_name,
    instructor_bio,
    instructor_image,
  } = courseData;

  return (
    <div className="course-detail-page">
      {/* Hero Section */}
      <div className="course-detail-hero">
        {/* ✅ FIX: Show course_name first, then fallback to title */}
        <h1>{course_name || title || 'Untitled Course'}</h1>
        <p className="course-subtitle">{description}</p>

        {Number(fee) <= 1 && (
          <div>
            <div className="demo-badge">🎓 Demo Class - Experience Before You Commit</div>
            <p className="demo-description">
              This demo class will walk you through the core concepts of the program and show you
              how the live sessions and projects work.
            </p>
          </div>
        )}
      </div>

      <div className="course-detail-container">
        <div className="course-main-content">
          {/* Course Info */}
          <div className="course-info-card">
            <h2>📚 Course Overview</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">📅 Start Date:</span>
                <span className="info-value">{formatDate(start_date)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">🏁 End Date:</span>
                <span className="info-value">{formatDate(end_date)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">⏱️ Duration:</span>
                <span className="info-value">{duration || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">💰 Fee:</span>
                <span className="info-value">₹{fee}</span>
              </div>
              <div className="info-item">
                <span className="info-label">👥 Available Seats:</span>
                <span className="info-value">
                  {(max_seats || 0) - (registered_count || 0)} / {max_seats || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Technologies */}
          {technologies && technologies.length > 0 && (
            <div className="course-info-card">
              <h2>💻 Technologies You'll Learn</h2>
              <div className="tech-tags">
                {technologies.map((tech, index) => (
                  <span key={index} className="tech-tag">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <div className="course-info-card">
              <h2>🚀 Projects</h2>
              <ul className="projects-list">
                {projects.map((project, index) => (
                  <li key={index}>{project}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructor */}
          {instructor_name && (
            <div className="course-info-card instructor-section">
              <h2>👨‍🏫 Your Instructor</h2>
              <div className="instructor-profile">
                {instructor_image && (
                  <img
                    src={instructor_image}
                    alt={instructor_name}
                    className="instructor-avatar"
                  />
                )}
                <div>
                  <h3>{instructor_name}</h3>
                  <p>
                    {instructor_bio ||
                      'Experienced professional who has guided multiple students through real-world projects.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="course-sidebar">
          <div className="enrollment-card">
            {isEnrolled ? (
              <>
                <div className="enrolled-badge">✅ You're Enrolled!</div>
                <button onClick={handleAccessCourse} className="access-btn">
                  Access Course
                </button>
              </>
            ) : (
              <>
                <div className="price-display">
                  <span className="price-label">Course Fee</span>
                  <span className="price-amount">₹{fee}</span>
                </div>
                <button onClick={handleEnroll} className="enroll-btn">
                  Enroll Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;
