require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { router: authRouter } = require('./routes/auth');
const batchRouter = require('./routes/batch');
const contactRoutes = require('./routes/contact'); // ⭐ ADD THIS
const auth = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', auth.router);

// Log all requests (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/registration', require('./routes/registration'));
app.use('/api/batch', require('./routes/batch'));
app.use('/api/auth', authRouter);
app.use('/api/batches', batchRouter); // ⭐ Make sure this line exists
app.use('/api/contact', contactRoutes);


// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '✅ Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 The Project Club API',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      batches: '/api/batch',
      registration: '/api/registration'
    }
  });
});

// 404 handler - must be after all routes
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handling middleware - must be last
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: error.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n🚀 ================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📍 Test: http://localhost:${PORT}/`);
  console.log(`📍 Batches: http://localhost:${PORT}/api/batch`);
  console.log('🔧 Press Ctrl+C to stop');
  console.log('==================================\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});
