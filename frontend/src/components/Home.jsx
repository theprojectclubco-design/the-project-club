import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="home-container">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Build Real Projects. Learn Real Skills.</h1>

          <p>
            Learn by building practical applications: todo apps, e‑commerce
            sites, PDF converters, and more.
            <br />
            Learn everything through real projects instead of just theory.
          </p>

          <button className="cta-btn" onClick={() => navigate("/courses")}>
            Explore Courses
          </button>
        </div>
      </section>

      {/* Why Us */}
      <section className="why-us">
        <h2>Why Project Club?</h2>

        <div className="features">
          <div className="feature">
            <h3>Project-First Learning</h3>
            <p>
              Learn by building complete projects instead of only watching
              lectures.
            </p>
          </div>

          <div className="feature">
            <h3>Hands-on Guidance</h3>
            <p>Interactive sessions, live debugging, and clear explanations.</p>
          </div>

          <div className="feature">
            <h3>Portfolio Ready</h3>
            <p>Deploy apps, use Git workflows, and build a strong portfolio.</p>
          </div>
        </div>
      </section>

      {/* What You'll Learn (Replaces Available Batches) */}
      <section className="batches-section">
        <h2>What You’ll Learn With Us</h2>

        <p className="learn-intro">
          At Project Club, we don’t just teach projects — we help you think,
          build, and present like a real developer. From your first idea to
          showcasing your work confidently, we guide you at every step.
        </p>

        <div className="batches-grid">
          <div className="batch-card">
            {/* 1 */}
            <div className="learn-card">
              <h3>🚀 Learn the Art of Building Projects</h3>
              <ul className="learn-list">
                <li>Understand what projects are and why they matter.</li>
                <li>Choose between mini, major, and real-time projects.</li>
                <li>Learn how projects help in academics and placements.</li>
                <li>Explore innovative ideas and real-world problem solving.</li>
              </ul>
            </div>
          </div>
        </div>

          <div className="batch-card">
            {/* 2 */}
            <div className="learn-card">
              <h3>🧩 Master the Complete Project Lifecycle</h3>
              <ul className="learn-list">
                <li>Identify real problems and pick the right idea.</li>
                <li>Plan workflow, modules, and solution design.</li>
                <li>Build, test, and improve step-by-step.</li>
                <li>Document and present your work confidently.</li>
              </ul>
            </div>
          </div>

          <div className="batch-card">
            {/* 3 */}
            <div className="learn-card">
              <h3>🛠️ Build Strong Technical & Tool Skills</h3>
              <ul className="learn-list">
                <li>Strengthen programming fundamentals.</li>
                <li>Use dev tools + GitHub the right way.</li>
                <li>Learn UI/UX basics and product thinking.</li>
                <li>Work with teamwork + research tools.</li>
              </ul>
            </div>
          </div>

          <div className="batch-card">
            {/* 4 */}
            <div className="learn-card">
              <h3>📌 Build Real Mini Projects (Step-by-Step)</h3>
              <ul className="learn-list">
                <li>Pick a good project idea with guidance.</li>
                <li>Break it into modules and build in order.</li>
                <li>Create documentation + presentation.</li>
                <li>Publish your work on GitHub (no guesswork).</li>
              </ul>
            </div>
            </div>

          <div className="batch-card">
            {/* 5 */}
            <div className="learn-card">
              <h3>🌐 Showcase Your Work Professionally</h3>
              <ul className="learn-list">
                <li>Build a portfolio that looks professional.</li>
                <li>Improve your GitHub profile structure.</li>
                <li>Share projects on LinkedIn effectively.</li>
                <li>Explain your work better in interviews.</li>
              </ul>
            </div>
          </div>


          <div className="batch-card">
            {/* 6 */}
            <div className="learn-card">
              <h3>🏆 Get Ready for Hackathons & Competitions</h3>
              <ul className="learn-list">
                <li>Choose better problem statements.</li>
                <li>Form teams and pitch ideas clearly.</li>
                <li>Build demos that impress judges.</li>
                <li>Learn how to stand out in competitions.</li>
              </ul>
            </div>
          </div>

          <div className="batch-card">
            {/* 7 */}
            <div className="learn-card">
              <h3>💡 Support for Innovative & Real-Time Projects</h3>
              <ul className="learn-list">
                <li>Get guidance for innovative project ideas.</li>
                <li>Explore advanced tools and technologies.</li>
                <li>Prepare for symposiums and tech events.</li>
                <li>Build projects beyond the basics.</li>
              </ul>
            </div>
          </div>

          <div className="batch-card">
            {/* 8 */}
            <div className="learn-card">
              <h3>🎯 Our Goal</h3>
              <ul className="learn-list">
                <li>Turn learners into confident creators.</li>
                <li>Convert ideas into impactful projects.</li>
              </ul>
            </div>
          </div>
        
      </section>
      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <h3>The Project Club</h3>
            <p>Build projects. Build confidence. Build your career.</p>
          </div>

          <div className="footer-meta">
            <p>© {new Date().getFullYear()} The Project Club. All rights reserved.</p>
            <p className="footer-tagline">
              Crafted for students who want to ship real work, not just “complete a course”.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

export default Home;
