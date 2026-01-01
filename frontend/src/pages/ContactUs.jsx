import React, { useState } from 'react';
import axios from 'axios';
import "./Pages.css";

function Contact() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.fullName || !formData.email || !formData.phone || !formData.message) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `https://the-project-club-backend.onrender.com/api/contact`,
        formData
      );

      if (response.data.success) {
        setSuccess('Message sent successfully! We\'ll get back to you within 24 hours.');
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          message: '',
        });
      } else {
        setError(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setError(
        error.response?.data?.message ||
        'Failed to send message. Please try again or contact us directly via WhatsApp.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="hero-section">
        <h1>📧 Contact Us</h1>
        <p>We'd love to hear from you! Get in touch with us.</p>
      </div>

      {/* Content Section */}
      <div className="content-section">
        {/* Contact Form */}
        <div className="contact-form-container">
          <h2 className="section-title">📩 Send Us a Message</h2>
          <p className="section-subtitle">
            Fill out the form below and we'll get back to you within 24 hours
          </p>

          <div className="contact-form-main">
            {/* Success Message */}
            {success && (
              <div className="success-message">
                ✅ {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Name and Email Row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Please enter your name"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="enter your email please"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your mobile number"
                  required
                  disabled={loading}
                />
              </div>

              {/* Message */}
              <div className="form-group">
                <label htmlFor="message">Your Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="please enter your message"
                  rows="6"
                  required
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>

              <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
                We'll respond within 24 hours
              </p>
            </form>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="contact-info-bottom">
          <h2 className="section-title">Other Ways to Reach Us</h2>
          
          <div className="contact-methods">
            {/* WhatsApp */}
            <div className="contact-method">
              <div className="contact-icon">📱</div>
              <div className="contact-details">
                <h3>WhatsApp</h3>
                <a href="https://wa.me/919381265797">+91 9381265797</a>
                <a href="https://wa.me/917670893094">+91 7670893094</a>
                <p className="contact-desc">
                  Quick responses during business hours
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="contact-method">
              <div className="contact-icon">📧</div>
              <div className="contact-details">
                <h3>Email</h3>
                <a href="mailto:theprojectclub@gmail.com">theprojectclub@gmail.com</a>
                <p className="contact-desc">
                  We'll respond within 24 hours
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="contact-method">
              <div className="contact-icon">☎️</div>
              <div className="contact-details">
                <h3>Phone</h3>
                <a href="tel:+919381265797">+91 9381265797</a>
                <a href="tel:+919381265797">+91 7670893094</a>
                <p className="contact-desc">
                  Monday - Saturday: 9 AM - 7 PM IST
                </p>
              </div>
            </div>
            {/* Instagram Card */}
            <div className="contact-method">
              <div className="contact-icon">📷</div>
              <div className="contact-details">
                <h3>Instagram</h3>
                <a 
                  href="https://www.instagram.com/theprojectclub.co.in?igsh=MTR50Gg4M2hiN2kag%3D%3D" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  @theprojectclub.co.in
                </a>
                <p className="contact-desc">
                  Follow us for updates, tips, and behind-the-scenes content!
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>How long does it take to get a response?</h4>
              <p>We typically respond within 24 hours during business days.</p>
            </div>
            <div className="faq-item">
              <h4>Can I schedule a call?</h4>
              <p>Yes! Mention your preferred time in the message and we'll arrange it.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
