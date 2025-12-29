import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      // ✅ Use /batches and support different response shapes
      const response = await axios.get(`https://the-project-club-backend.onrender.com/api/batches`);
      console.log('Home - Batches response:', response.data);

      if (response.data?.success && response.data.batches) {
        setBatches(response.data.batches);
      } else if (response.data?.success && response.data.data) {
        setBatches(response.data.data);
      } else if (Array.isArray(response.data)) {
        setBatches(response.data);
      } else {
        setBatches([]);
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
        day: 'numeric',
      });
    } catch (error) {
      return 'Coming Soon';
    }
  };

  const getPrice = (batch) => {
    const price = batch?.price ?? batch?.fee ?? null;
    return price !== null ? `₹${price.toLocaleString('en-IN')}` : 'Free';
  };

  const getMaxSeats = (batch) => {
    return batch?.max_students || batch?.max_seats || batch?.max_se || 'N/A';
  };

  const getRegisteredCount = (batch) => {
    return batch?.registered_count || 0;
  };

  return (
    <div className="home">
      {/* Hero section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Build Real-World Projects</h1>
          <p>
            Learn by building practical applications: todo apps, e‑commerce sites, PDF converters,
            and more.
          </p>
          <button
            className="cta-btn"
            onClick={() => navigate('/courses')}
          >
            View All Courses
          </button>
        </div>
      </section>

      {/* Why us section (unchanged text, only layout from CSS) */}
      <section className="why-us">
        <h2>Why Learn With Us?</h2>
        <div className="features">
          <div className="feature">
            <h3>Project Based</h3>
            <p>Learn everything through real projects instead of just theory.</p>
          </div>
          <div className="feature">
            <h3>Live Guidance</h3>
            <p>Interactive sessions, live debugging, and clear explanations.</p>
          </div>
          <div className="feature">
            <h3>Career Focused</h3>
            <p>Deploy apps, use Git workflows, and build a strong portfolio.</p>
          </div>
        </div>
      </section>

      {/* Available batches */}
      <section className="batches-section">
        <h2>Available Batches</h2>

        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading batches...</p>
        ) : batches.length === 0 ? (
          <p style={{ textAlign: 'center' }}>
            No batches available at the moment. Check back soon!
          </p>
        ) : (
          <div className="batches-grid">
            {batches.map((batch) => (
              <div key={batch.id} className="batch-card">
                <h3>{batch.title}</h3>
                <p className="description">
                  {batch.description || 'Get to know more about this course.'}
                </p>

                <div className="batch-details">
                  <p>
                    <strong>Start Date:</strong> {formatDate(batch.start_date)}
                  </p>
                  <p>
                    <strong>Duration:</strong>{' '}
                    {batch.duration || 'Until completion of course.'}
                  </p>
                  <p>
                    <strong>Mode:</strong> {(batch.mode || 'online').toUpperCase()}
                  </p>
                  {batch.schedule && (
                    <p>
                      <strong>Schedule:</strong> {batch.schedule}
                    </p>
                  )}
                  <p>
                    <strong>Fee:</strong> {getPrice(batch)}
                  </p>
                  <p>
                    <strong>Spots:</strong> {getRegisteredCount(batch)}/{getMaxSeats(batch)}
                  </p>
                </div>

                {Array.isArray(batch.technologies) && batch.technologies.length > 0 && (
                  <div className="tech-stack">
                    {batch.technologies.map((t, i) => (
                      <span key={i} className="tech-badge">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  className="register-btn"
                  onClick={() => navigate(`/register?batch=${batch.id}`)}
                >
                  Register Now
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
