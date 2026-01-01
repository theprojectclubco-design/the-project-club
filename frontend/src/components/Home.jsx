import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
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
            <h3>🚀 Learn the Art of Building Projects</h3>
            <p className="description">
              Understand what projects really are and why they matter in
              academics, placements, and real-world problem solving. Learn about
              mini projects, major projects, innovative ideas, and real-time
              applications.
            </p>
          </div>

          <div className="batch-card">
            <h3>🔄 Master the Complete Project Lifecycle</h3>
            <p className="description">
              Gain an end-to-end understanding of how a project is built:
              identifying real problems, generating and selecting ideas,
              planning workflows, designing solutions, implementing and testing,
              documenting and presenting your work. You’ll know what to do at
              every stage, not just code blindly.
            </p>
          </div>

          <div className="batch-card">
            <h3>🛠 Build Strong Technical & Tool Skills</h3>
            <p className="description">
              Learn the essential skills required to work on modern projects:
              programming fundamentals, development tools & GitHub, UI/UX design
              basics, no-code & low-code tools, and research/teamwork tools.
              Perfect for both coders and non-coders.
            </p>
          </div>

          <div className="batch-card">
            <h3>📌 Build Real Mini Projects (Step-by-Step)</h3>
            <p className="description">
              We guide you in building complete mini projects from scratch:
              choosing the right idea, breaking it into modules, developing it
              step by step, creating documentation & presentations, and
              publishing your project on GitHub. No confusion. No guesswork.
            </p>
          </div>

          <div className="batch-card">
            <h3>🌐 Showcase Your Work Professionally</h3>
            <p className="description">
              Learn how to present your projects to the world: build a strong
              project portfolio, create a clean GitHub profile, share projects
              on LinkedIn, and explain your work confidently in interviews. Turn
              your project into a career asset.
            </p>
          </div>

          <div className="batch-card">
            <h3>🏆 Get Ready for Hackathons & Competitions</h3>
            <p className="description">
              Understand how hackathons work and how to win them: selecting
              problem statements, forming effective teams, pitching ideas
              clearly, and building demos that impress.
            </p>
          </div>

          <div className="batch-card">
            <h3>💡 Support for Innovative & Real-Time Projects</h3>
            <p className="description">
              For students who want to go beyond basics, we provide guidance on
              real-world and innovative project ideas, advanced tools and
              technologies, and preparing for symposiums, tech events, and
              competitions.
            </p>
          </div>

          <div className="batch-card">
            <h3>🎯 Our Goal</h3>
            <p className="description">
              To transform students from learners into creators, and from ideas
              into impactful projects.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
