import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Pages.css';

function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, [location.key]);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your profile');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `https://the-project-club-backend.onrender.com/api/auth/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setProfileData(response.data.user);
        setEditData({
          name: response.data.user.name,
          phone: response.data.user.phone || '',
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData({
        name: profileData.name,
        phone: profileData.phone || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `https://the-project-club-backend.onrender.com/api/auth/profile`,
        { name: editData.name, phone: editData.phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setProfileData(response.data.user);
        setIsEditing(false);
        alert('✅ Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('❌ Failed to update profile');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // ✅ FIXED: Changed from /courses/ to /course/
  const handleViewDetails = (enrollment) => {
    console.log('🔍 Navigating to batch ID:', enrollment.batch_id);
    navigate(`/course/${enrollment.batch_id}`);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-box">
          <div className="spinner"></div>
          <p style={{ color: '#333', fontSize: '1.1rem' }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-box">
          <p style={{ color: '#dc3545', fontSize: '1.2rem', fontWeight: 'bold' }}>❌ {error}</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        {/* PROFILE HEADER CARD */}
        <div className="profile-card">
          <div className="profile-header-section">
            <div className="avatar-large">
              {getInitials(profileData.name)}
            </div>
            <div className="profile-title">
              <h1>{profileData.name}</h1>
              <p className="join-date">Member since {formatDate(profileData.created_at)}</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <button className="btn-edit" onClick={handleEditToggle}>
                {isEditing ? '❌ Cancel' : '✏️ Edit Profile'}
              </button>
              <button className="btn-logout" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {/* STUDENT INFORMATION CARD */}
        <div className="profile-card">
          <div className="card-header">
            <h2>📋 Student Information</h2>
          </div>

          <div className="info-grid">
            <div className="info-field student-id-highlight">
              <label>🎓 Student ID</label>
              <p className="student-id-value">{profileData.student_id || 'N/A'}</p>
              <span className="note">Use this ID for all communications</span>
            </div>

            <div className="info-field">
              <label>👤 Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  className="input-edit"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              ) : (
                <p>{profileData.name}</p>
              )}
            </div>

            <div className="info-field">
              <label>📧 Email</label>
              <p>{profileData.email}</p>
            </div>

            <div className="info-field">
              <label>📱 Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  className="input-edit"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              ) : (
                <p>{profileData.phone || 'Not provided'}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <button
              className="btn-save"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? '💾 Saving...' : '✅ Save Changes'}
            </button>
          )}
        </div>

        {/* ENROLLED COURSES CARD */}
        <div className="profile-card">
          <div className="card-header">
            <h2>📚 Enrolled Courses</h2>
          </div>

          <div className="courses-list">
            {profileData.enrollments && profileData.enrollments.length > 0 ? (
              profileData.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="course-item">
                  <div className="course-main-info">
                    <div
                      className="course-name-clickable"
                      onClick={() => handleViewDetails(enrollment)}
                    >
                      <h3>{enrollment.batch_title}</h3>
                      <span className="view-details">👁️ View Details →</span>
                    </div>
                    <span className={`badge-status ${enrollment.payment_status.toLowerCase()}`}>
                      {enrollment.payment_status}
                    </span>
                  </div>

                  <div className="course-meta">
                    <span>📅 Enrolled: {formatDate(enrollment.created_at)}</span>
                    <span>💰 Amount Paid: ₹{enrollment.amount}</span>
                    {enrollment.batch.experience_level && (
                      <span>📊 Level: {enrollment.batch.experience_level}</span>
                    )}
                  </div>

                  {enrollment.batch.description && (
                    <p style={{ color: '#666', fontSize: '0.95rem', marginTop: '10px' }}>
                      {enrollment.batch.description}
                    </p>
                  )}

                  {enrollment.batch.instructor_name && (
                    <div className="instructor-info-card">
                      <p className="instructor-label">👨‍🏫 Instructor</p>
                      <p className="instructor-name">{enrollment.batch.instructor_name}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>🎓 No courses enrolled yet.</p>
                <button className="btn-primary" onClick={() => navigate('/courses')}>
                  Browse Courses
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
