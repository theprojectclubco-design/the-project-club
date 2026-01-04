import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './RegistrationForm.css';

function RegistrationForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { batchId: urlBatchId } = useParams();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experienceLevel: '',
    referralSource: '',
    gender: '',
  });

  const [selectedBatch, setSelectedBatch] = useState('');
  const [batches, setBatches] = useState([]);
  const [batchDetails, setBatchDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [studentId, setStudentId] = useState(null); // ✅ Add student ID state

  // ✅ Fetch user profile data when logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && !userDataLoaded) {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const response = await axios.get(
              `https://the-project-club-backend.onrender.com/api/auth/profile`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
              const userData = response.data.user;

              // ✅ Pre-fill form with user data
              setFormData({
                fullName: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || '',
                experienceLevel: formData.experienceLevel,
                referralSource: formData.referralSource,
                gender: formData.gender,
              });

              // ✅ Set student ID
              setStudentId(userData.student_id);
              setUserDataLoaded(true);
              console.log('✅ Auto-filled user data:', userData);
            }
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const loadRazorpay = () => {
      if (typeof window.Razorpay !== 'undefined') {
        setRazorpayLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => setError('Payment system failed to load. Please refresh the page.');
      document.body.appendChild(script);
    };

    loadRazorpay();
    fetchBatches();

    const batchId = urlBatchId || searchParams.get('batch');
    if (batchId) {
      setSelectedBatch(batchId);
      fetchBatchDetails(batchId);
    }
  }, [searchParams, urlBatchId]);

  const fetchBatches = async () => {
    try {
      const response = await axios.get(`https://the-project-club-backend.onrender.com/api/batches`);

      if (response.data?.success && response.data.batches) {
        setBatches(response.data.batches);
      } else if (response.data?.success && response.data.data) {
        setBatches(response.data.data);
      } else if (Array.isArray(response.data)) {
        setBatches(response.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchBatchDetails = async (batchId) => {
    try {
      const response = await axios.get(
        `https://the-project-club-backend.onrender.com/api/batches/${batchId}`
      );

      if (response.data && response.data.batch) {
        setBatchDetails(response.data.batch);
      } else if (response.data) {
        setBatchDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching batch details:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    setSelectedBatch(batchId);

    if (batchId) {
      fetchBatchDetails(batchId);
    } else {
      setBatchDetails(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'TBA';
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'TBA';
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.gender|| !formData.experienceLevel) {
      setError('Please fill in all required fields including gender');
      return;
    }

    if (!selectedBatch) {
      setError('Please select a batch');
      return;
    }

    if (!razorpayLoaded || typeof window.Razorpay === 'undefined') {
      setError('Payment system is still loading. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if already enrolled
      if (user) {
        const token = localStorage.getItem('token');
        try {
          const profileResponse = await axios.get(
            `https://the-project-club-backend.onrender.com/api/auth/profile`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (profileResponse.data.success) {
            const enrollments = profileResponse.data.user.enrollments || [];
            const alreadyEnrolled = enrollments.some(
              (enrollment) =>
                String(enrollment.batch_id) === String(selectedBatch) &&
                enrollment.payment_status === 'PAID'
            );

            if (alreadyEnrolled) {
              setError('⚠️ You are already enrolled in this course! Check your Profile page.');
              setLoading(false);
              setTimeout(() => navigate('/profile'), 2000);
              return;
            }
          }
        } catch (profileError) {
          console.log('Could not check enrollment status:', profileError);
        }
      }

      const registrationData = {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        experienceLevel: formData.experienceLevel,
        batchId: selectedBatch,
        referralSource: formData.referralSource,
        gender: formData.gender,
      };

      const response = await axios.post(
        `https://the-project-club-backend.onrender.com/api/registration`,
        registrationData
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Registration failed');
      }

      const { orderId, amount, currency, meta} = response.data;
      const metaToSend = {
        // always send the required fields expected by backend
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        experienceLevel: formData.experienceLevel,
        batchId: selectedBatch,
        gender: formData.gender,

        // optional fields (safe)
        referralSource: formData.referralSource || null,
        notes: meta?.notes || null,
      };
      console.log("Sending metaToSend:", metaToSend);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency || 'INR',
        name: 'Course Registration',
        description: `Registration for ${batchDetails?.title || 'Course'}`,
        order_id: orderId,
        handler: async function (paymentResponse) {
          console.log("meta being sent", meta);
          try {
            const verifyResponse = await axios.post(
              `https://the-project-club-backend.onrender.com/api/registration/verify-payment`,
              {
                orderId: orderId,
                paymentId: paymentResponse.razorpay_payment_id,
                signature: paymentResponse.razorpay_signature,
                meta: metaToSend,
                
              }
            );
            console.log("verifyResponse:", verifyResponse.data);
            if (verifyResponse.data.success) {
              const reg = verifyResponse.data.data;
              navigate('/success', {
                state: {
                  registrationId: reg.id,
                  paymentId: reg.razorpay_payment_id,
                  batchTitle: reg.batch_title,
                  amount: reg.amount,
                  gender: reg.gender,
                  studentId: reg.student_id,
                  isDemo: reg.amount <= 1,
                  whatsappLink: reg.whatsapp_link,
                },
              });
            } else {
              setError('Payment verification failed. Please contact support.');
              setLoading(false);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            const msg = error?.response?.data?.message || 'Payment verification failed.';
            console.error('Payment verification error:', error?.response?.data || error);
            setError(msg);
            setLoading(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#667eea',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError('Payment cancelled. You can try again when ready.');
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (response) {
        const errorMsg = response.error?.description || 'Payment failed. Please try again.';
        setError(`Payment failed: ${errorMsg}`);
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-header">
          <h1>Course Registration</h1>
          <p>Join our courses and start your learning journey with expert instructors.</p>
          <p>Fill out the form below to enroll in your chosen batch</p>

          {/* ✅ Display logged in user message with student ID */}
          {user && (
            <div className="user-logged-in-message">
              ✅ Logged in as <strong>{user.name || user.email}</strong>
              {studentId && (
                <span style={{ marginLeft: '10px' }}>
                  | Student ID: <strong>{studentId}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          {error && <div className="error-message">{error}</div>}

          {/* Student Information */}
          <div className="form-section">
            <h2>Student Information</h2>

            {/* ✅ Display Student ID field (read-only if user is logged in) */}
            {user && studentId && (
              <div className="form-group">
                <label>
                  Student ID <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={studentId}
                  disabled
                  className="prefilled"
                  style={{
                    backgroundColor: '#e8f5e9',
                    cursor: 'not-allowed',
                    fontWeight: 'bold',
                    color: '#2e7d32',
                  }}
                />
                <small className="prefilled-note">✅ Auto-assigned during signup</small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="fullName">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={user && formData.fullName ? 'prefilled' : ''}
                required
              />
              {user && formData.fullName && (
                <small className="prefilled-note">✅ Pre-filled from your profile</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={user && formData.email ? 'prefilled' : ''}
                required
              />
              {user && formData.email && (
                <small className="prefilled-note">✅ Pre-filled from your profile</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                Phone Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={user && formData.phone ? 'prefilled' : ''}
                required
              />
              {user && formData.phone && (
                <small className="prefilled-note">✅ Pre-filled from your profile</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="gender">
                Gender <span className="required">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Prefer not to say</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="experienceLevel">
                Experience Level <span className="required">*</span>
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
                required
              >
                <option value="">Select Experience Level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Batch Selection */}
          <div className="form-section">
            <h2>Batch Selection</h2>
            <div className="form-group">
              <label htmlFor="batch">
                Select Batch <span className="required">*</span>
              </label>
              <select
                id="batch"
                name="batch"
                value={selectedBatch}
                onChange={handleBatchChange}
                required
              >
                <option value="">-- Choose a Batch --</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.title} - {formatDate(batch.start_date)}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Batch Details Card - Collapsible */}
            {batchDetails && (
              <div className="batch-details-card">
                <div className="batch-details-header">
                  <h3>{batchDetails.course_name || batchDetails.title}</h3>
                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    className="toggle-details-btn"
                  >
                    {showDetails ? '▼ Hide Details' : '▶ Show Details'}
                  </button>
                </div>

                {showDetails && (
                  <div className="batch-details-content">
                    {batchDetails.description && (
                      <div className="batch-description">
                        <p>{batchDetails.description}</p>
                      </div>
                    )}

                    <div className="batch-info">
                      <div className="info-item">
                        <span className="label">💰 Price:</span>
                        <span className="value">{getPrice(batchDetails)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">📅 Start Date:</span>
                        <span className="value">{formatDate(batchDetails.start_date)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">📅 End Date:</span>
                        <span className="value">{formatDate(batchDetails.end_date)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">👥 Available Seats:</span>
                        <span className="value">
                          {getMaxSeats(batchDetails) - getRegisteredCount(batchDetails)} /{' '}
                          {getMaxSeats(batchDetails)}
                        </span>
                      </div>
                      {batchDetails.instructor && (
                        <div className="info-item">
                          <span className="label">👨‍🏫 Instructor:</span>
                          <span className="value">{batchDetails.instructor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="form-section">
            <h2>Additional Information (Optional)</h2>

            <div className="form-group">
              <label htmlFor="referralSource">How did you hear about us?</label>
              <select
                id="referralSource"
                name="referralSource"
                value={formData.referralSource}
                onChange={handleChange}
              >
                <option value="">Select an option</option>
                <option value="friend">Friend/Colleague</option>
                <option value="social">Social Media</option>
                <option value="search">Search Engine</option>
                <option value="advertisement">Advertisement</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading && <span className="spinner"></span>}
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegistrationForm;
