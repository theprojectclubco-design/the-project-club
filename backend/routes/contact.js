const express = require('express');
const router = express.Router();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_RECIPIENT = process.env.ADMIN_RECIPIENT;

const ensureEnv = () => {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
  if (!ADMIN_RECIPIENT) throw new Error('ADMIN_RECIPIENT missing');
};

// POST /api/contact - Handle contact form submission
router.post('/', async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    // Validation
    if (!fullName || !email || !phone || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    ensureEnv();

    // 1) Send to Admin
    await resend.emails.send({
      from: `Contact Form <${FROM_EMAIL}>`,
      to: ADMIN_RECIPIENT,
      subject: `📩 New Contact Message: ${fullName}`,
      text: `Name: ${fullName}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
      html: `
        <h2>New Contact Message</h2>
        <p><b>Name:</b> ${fullName}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Message:</b></p>
        <pre style="white-space:pre-wrap;">${message}</pre>
      `,
    });

    // 2) Confirmation to User
    await resend.emails.send({
      from: `The Project Club <${FROM_EMAIL}>`,
      to: email,
      subject: `✅ We received your message`,
      text: `Hi ${fullName},\n\nWe’ve received your message and will get back to you within 24 hours.\n\nYour message:\n${message}\n\nBest regards,\nThe Project Club Team`,
      html: `
        <p>Hi <b>${fullName}</b>,</p>
        <p>We’ve received your message and will get back to you within 24 hours.</p>
        <p><b>Your message:</b></p>
        <pre style="white-space:pre-wrap;">${message}</pre>
        <p>Best regards,<br/><b>The Project Club Team</b></p>
      `,
    });

    return res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
});

module.exports = router;
