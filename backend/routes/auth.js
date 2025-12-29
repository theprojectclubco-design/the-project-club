const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ✅ Helper: Generate student ID on signup
const generateStudentId = async () => {
  try {
    const year = new Date().getFullYear();
    
    // Count existing users with student_id
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('student_id', 'is', null);

    if (error) throw error;

    const nextNumber = (count || 0) + 1;
    return `STU${year}${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('❌ Error generating student ID:', error);
    return `STU${new Date().getFullYear()}${Date.now()}`;
  }
};

// POST /api/auth/signup - Register new user
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate student ID
    const studentId = await generateStudentId();

    // Create user with student_id
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          name: name,
          email: email,
          password: hashedPassword,
          phone: phone || null,
          student_id: studentId, // ✅ Add student_id
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`✅ New user created: ${name} | Student ID: ${studentId}`);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;

    res.json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account',
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
});

// GET /api/auth/verify - Verify JWT token
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, phone, created_at, student_id')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token verification failed',
    });
  }
});

// GET /api/auth/profile - Get user profile with enrollments
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, phone, created_at, student_id')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Fetch registrations/enrollments WITH batch details
    const { data: enrollments, error: enrollError } = await supabase
      .from('registrations')
      .select(`
        id,
        batch_id,
        amount,
        payment_status,
        paid_at,
        created_at,
        user_id,
        email,
        batches!registrations_batch_id_fkey (
          id,
          title,
          description,
          start_date,
          duration,
          technologies,
          instructor_name
        )
      `)
      .or(`user_id.eq.${userId},email.eq.${userData.email}`)
      .eq('payment_status', 'PAID')
      .order('created_at', { ascending: false });

    if (enrollError) {
      console.error('Enrollment fetch error:', enrollError);
    }

    // Format enrollment data for frontend
    const formattedEnrollments = (enrollments || []).map((enrollment) => ({
      id: enrollment.id,
      batch_id: enrollment.batch_id,
      amount: enrollment.amount,
      payment_status: enrollment.payment_status,
      paid_at: enrollment.paid_at,
      created_at: enrollment.created_at,
      batch: enrollment.batches,
      batch_title: enrollment.batches?.title,
    }));

    res.json({
      success: true,
      user: {
        ...userData,
        enrollments: formattedEnrollments,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Update user data
    const { data: updated, error } = await supabase
      .from('users')
      .update({
        name: name,
        phone: phone,
      })
      .eq('id', req.userId)
      .select('id, name, email, phone, created_at, student_id')
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile',
      });
    }

    res.json({
      success: true,
      user: updated,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// Export both router and middleware
module.exports = { router, verifyToken };
