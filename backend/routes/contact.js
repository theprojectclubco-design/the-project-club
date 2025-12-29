const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Create transporter using env variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASSWORD,
  },
});

// POST /api/contact - Handle contact form submission
router.post('/', async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    // Validation
    if (!fullName || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #32b8c6;">New Contact Form Submission</h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
          <p><strong>Message:</strong></p>
          <p style="background-color: white; padding: 15px; border-left: 4px solid #32b8c6; border-radius: 5px;">
            ${message.replace(/\n/g, '<br>')}
          </p>
        </div>
        <p style="font-size: 0.9rem; color: #666; margin-top: 20px;">
          This message was sent from The Project Club contact form.
        </p>
      </div>
    `;

    // Send email to admin
    await transporter.sendMail({
      from: `"THE PROJECT CLUB" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_RECIPIENT,
      subject: `Contact Form: Message from ${fullName}`,
      html: emailContent,
      replyTo: email, // Allow admin to reply directly
    });

    // Send confirmation email to user
    const confirmationEmail = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #32b8c6;">Thank You for Contacting Us!</h2>
        <p>Hi <strong>${fullName}</strong>,</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Your message:</strong></p>
          <p style="background-color: white; padding: 15px; border-left: 4px solid #32b8c6; border-radius: 5px;">
            ${message.replace(/\n/g, '<br>')}
          </p>
        </div>
        <p>If you have any urgent queries, feel free to reach us directly via WhatsApp.</p>
        <p>Best regards,<br><strong>THE PROJECT CLUB Team</strong></p>
      </div>
    `;

    await transporter.sendMail({
      from: `"THE PROJECT CLUB" <${process.env.ADMIN_EMAIL}>`,
      to: email,
      subject: 'We Received Your Message - The Project Club',
      html: confirmationEmail,
    });

    res.json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.',
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again or contact us via WhatsApp.',
    });
  }
});

module.exports = router;
