import React from 'react';
import './Pages.css';

function About() {
  // Founders data - CUSTOMIZE THIS with your actual founders
  const founders = [
    {
      name: 'Shaik Mahiya',
      role: 'Founder & Lead Instructor',
      bio: 'Full-stack development with 2 years of experience. Passionate about teaching and building real-world projects.',
      expertise: ['EDA', 'Flutter', 'Frontend'],
      linkedin: 'https://www.linkedin.com/in/shaik-mahiya-242p ',
      github: 'https://github.com/SHAIKMAHIYA',
      image: '/founder1.jpg' // Add founder image in public folder
    },
    {
      name: 'P Gnana Rajeswara Reddy',
      role: 'Co-Founder & Tech Lead',
      bio: 'Expert in mobile and web devolepment. Focused on creating intuitive learning experiences.',
      expertise: ['Web Applications', 'AI TOOLS', 'Mobile Apps'],
      linkedin: 'https://www.linkedin.com/in/rajesh-ponnapureddy-a62572223/',
      github: 'https://github.com/Rajeshponnapure',
      image: '/founder2.jpg'
    }
  ];

  return (
    <div className="page-container">
      <section className="hero-section">
        <h1>About THE PROJECT CLUB</h1>
        <p>Learn Real Development Through Real Projects</p>
      </section>

      <section className="content-section">
        <div className="content-box">
          <h2>🎯 Our Mission</h2>
          <p>
            We believe the best way to learn programming is by building real-world projects. 
            Our mission is to transform aspiring developers into job-ready professionals through 
            hands-on, project-based learning.
          </p>
        </div>

        <div className="content-box">
          <h2>🚀 Why Choose Us?</h2>
          <ul>
            <li><strong>Project-Based Learning:</strong> Build 2+ real projects in each course</li>
            <li><strong>Live Coding Sessions:</strong> Interactive classes with live debugging</li>
            <li><strong>Job-Ready Portfolio:</strong> Deploy projects and showcase to employers</li>
            <li><strong>Community Support:</strong> 24/7 WhatsApp group for peer support</li>
            <li><strong>Affordable:</strong> Quality education at fair prices</li>
          </ul>
        </div>

        <div className="content-box">
          <h2>🎓 Our Teaching Approach</h2>
          <ol>
            <li><strong>Foundations:</strong> Core concepts and best practices</li>
            <li><strong>Live Coding:</strong> Follow along with instructor in real-time</li>
            <li><strong>Hands-On Projects:</strong> Build projects independently with guidance</li>
            <li><strong>Code Review:</strong> Get feedback from mentors on your code</li>
            <li><strong>Deployment:</strong> Learn to deploy and showcase projects</li>
          </ol>
        </div>

        {/* NEW SECTION: Meet Our Founders */}
        <div className="content-box">
          <h2>👥 Meet Our Founders</h2>
          <p className="founders-intro">
            The Project Club was founded by passionate developers who believe in learning by doing. 
            With years of Project experience, our founders are committed to providing quality education 
            and mentorship to aspiring developers.
          </p>
          
          <div className="founders-grid">
            {founders.map((founder, index) => (
              <div key={index} className="founder-card">
                
                <div className="founder-info">
                  <h3 className="founder-name">{founder.name}</h3>
                  <p className="founder-role">{founder.role}</p>
                  <p className="founder-bio">{founder.bio}</p>
                  
                  <div className="founder-expertise">
                    <p className="expertise-label">Expertise:</p>
                    <div className="expertise-tags">
                      {founder.expertise.map((skill, idx) => (
                        <span key={idx} className="expertise-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="founder-social">
                    {founder.linkedin && (
                      <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                        <span className="social-icon">💼</span> LinkedIn
                      </a>
                    )}
                    {founder.github && (
                      <a href={founder.github} target="_blank" rel="noopener noreferrer" className="social-link">
                        <span className="social-icon">🔗</span> GitHub
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}

export default About;
