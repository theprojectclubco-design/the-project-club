import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './pages/About';
import Courses from './pages/Courses';
import ContactUs from './pages/ContactUs';
import RegistrationForm from './components/RegistrationForm';
import SuccessPage from './components/SuccessPage';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CourseDetail from './pages/CourseDetail';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/course/:batchId" element={<CourseDetail />} /> {/* ✅ SINGULAR */}
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/register" element={<RegistrationForm />} />
            <Route path="/success" element={<SuccessPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* 404 Page */}
            <Route
              path="*"
              element={
                <div style={{ padding: '100px', textAlign: 'center' }}>
                  <h1>404 - Page Not Found</h1>
                  <p>Sorry, the page you're looking for doesn't exist.</p>
                  <a href="/">← Go back to Home</a>
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
