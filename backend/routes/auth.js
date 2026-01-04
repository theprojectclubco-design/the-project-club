const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const supabase = require('../supabaseClient');

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Standardized sender env var
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

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

const buildVerifyEmailHtml = (verifyUrl) => `
Click the link below to verify your email for The Project Club:

${verifyUrl}

This link will expire in 30 minutes.

If you did not create this account, you can ignore this email.
`;

async function sendVerificationEmail({ email, token }) {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyUrl = `${frontend}/verify-email?token=${encodeURIComponent(token)}`;

  const { error } = await resend.emails.send({
    from: `The Project Club <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
    to: [email],
    subject: 'Verify your email - The Project Club',
    html: buildVerifyEmailHtml(verifyUrl),
  });

  if (error) throw error;
}

// POST /api/auth/signup - Register new user (now requires email verification)
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


    // Create email verification token + expiry (30 minutes)
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Create user with student_id + email verification fields
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          created_at: new Date().toISOString(),

          email_verified: false,
          email_verify_token: emailVerifyToken,
          email_verify_expires_at: emailVerifyExpiresAt,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ New user created: ${name} | Student ID: ${studentId}`);

    // Send verification email using Resend
    try {
      await sendVerificationEmail({ email, token: emailVerifyToken });
    } catch (e) {
      console.error('❌ Failed to send verification email:', e);
      // account exists; user can click "resend" from login
    }

    // Do NOT issue JWT on signup (force verification first)
    const { password: _, ...userWithoutPassword } = newUser;

    return res.json({
      success: true,
      message: 'Account created. Please verify your email before logging in.',
      user: userWithoutPassword,
      requiresEmailVerification: true,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create account',
    });
  }
});

// GET /api/auth/verify-email?token=xxxxx
router.get('/verify-email', async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing token' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email_verified, email_verify_expires_at')
      .eq('email_verify_token', token)
      .single();

    if (error || !user) {
      return res.status(400).json({ success: false, message: 'Invalid verification link' });
    }

    const expired =
      !user.email_verify_expires_at || new Date(user.email_verify_expires_at) < new Date();

    if (expired) {
      return res.status(400).json({ success: false, message: 'Verification link expired' });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verify_token: null,
        email_verify_expires_at: null,
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return res.json({
      success: true,
      message: 'Email verified successfully. You can login now.',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email verification failed',
    });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('email', email)
      .single();

    // Avoid leaking whether user exists
    if (error || !user) {
      return res.json({ success: true, message: 'If the email exists, a verification link was sent.' });
    }

    if (user.email_verified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verify_token: emailVerifyToken,
        email_verify_expires_at: emailVerifyExpiresAt,
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontend}/verify-email?token=${encodeURIComponent(emailVerifyToken)}`;

    const from = `The Project Club <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`;
    if (!from) {
      return res.status(500).json({ success: false, message: 'FROM_EMAIL missing in backend env' });
    }

    const { data, error: sendError } = await resend.emails.send({
      from,
      to: [email],
      subject: 'Verify your email - The Project Club',
      html: buildVerifyEmailHtml(verifyUrl),
    });

    if (sendError) {
      return res.status(400).json({ success: false, message: sendError.message, resendError: sendError });
    }

    return res.json({ success: true, message: 'Verification email sent.', resendId: data?.id });
  } catch (err) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ success: false, message: 'Failed to resend verification email' });
  }
});


// POST /api/auth/login - Login user (blocked until email verified)
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

    // Block if not verified
    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in.',
      });
    }
    // inside POST /api/auth/login, after fetching user
      if (!user.password || typeof user.password !== 'string') {
        console.error('Invalid password hash in DB:', typeof user.password);
        return res.status(500).json({
          success: false,
          message: 'Account password is corrupted. Please reset password.',
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
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
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
      .select('id, name, email, phone, password, created_at, student_id, email_verified')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Verify token error:', error);
    return res.status(500).json({
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
      .select('id, name, email, phone, created_at, student_id, email_verified')
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

    return res.json({
      success: true,
      user: {
        ...userData,
        enrollments: formattedEnrollments,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone } = req.body;

    const { data: updated, error } = await supabase
      .from('users')
      .update({ name, phone })
      .eq('id', req.userId)
      .select('id, name, email, phone, created_at, student_id, email_verified')
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile',
      });
    }

    return res.json({
      success: true,
      user: updated,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// Export both router and middleware
module.exports = { router, verifyToken };
