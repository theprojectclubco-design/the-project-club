const nodemailer = require('nodemailer');

/**
 * Render Free friendly Gmail SMTP setup.
 * Keeps ALL your existing functions and templates exactly the same,
 * only updates the transporter to be more reliable on Render.
 *
 * ENV:
 * - ADMIN_EMAIL
 * - ADMIN_EMAIL_PASSWORD  (Gmail App Password)
 * - ADMIN_RECIPIENT
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASSWORD,
  },

  // Resilience settings (helps avoid connection/socket timeouts on free hosts)
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  rateDelta: 1000,
  rateLimit: 5,
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,

  tls: {
    minVersion: 'TLSv1.2',
  },
});

// Optional: verify once at startup (won't crash server)
transporter.verify().then(
  () => console.log('✅ Email service ready'),
  (err) => console.error('❌ Email service not ready:', err?.message || err)
);


// Send email to admin
const sendAdminNotification = async (registration) => {
  const emailBody = `
New Student Registered!


Name: ${registration.name}
Email: ${registration.email}
Phone: ${registration.phone}
Experience Level: ${registration.experience_level}
Batch: ${registration.batch_title}
Amount Paid: ₹${registration.amount}
Gender: ${registration.gender}
Student ID: ${registration.student_id || 'N/A (Demo Batch)'}
Payment Status: ${registration.payment_status}
Registered At: ${new Date(registration.created_at).toLocaleString('en-IN')}
Referral Source: ${registration.referral_source || 'N/A'}
Notes: ${registration.notes || 'N/A'}
`;


  try {
    await transporter.sendMail({
      from: `"Course Registration" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_RECIPIENT,
      subject: `🎓 New Registration: ${registration.name} | ${registration.batch_title}`,
      text: emailBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">🎓 New Student Registration</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Student Details</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">Name:</td>
                <td style="padding: 12px 0; color: #333;">${registration.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 12px 0; color: #333;">${registration.email}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">Phone:</td>
                <td style="padding: 12px 0; color: #333;">${registration.phone}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">Gender:</td>
                <td style="padding: 12px 0; color: #333;">${registration.gender}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">Student ID:</td>
                <td style="padding: 12px 0; color: #333; font-weight: bold;">${registration.student_id || 'N/A (Demo Batch)'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">Batch:</td>
                <td style="padding: 12px 0; color: #333;">${registration.batch_title}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">Amount Paid:</td>
                <td style="padding: 12px 0; color: #4CAF50; font-weight: bold;">₹${registration.amount}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">Payment Status:</td>
                <td style="padding: 12px 0; color: #333;">${registration.payment_status}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">Experience Level:</td>
                <td style="padding: 12px 0; color: #333;">${registration.experience_level}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">Referral Source:</td>
                <td style="padding: 12px 0; color: #333;">${registration.referral_source || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">Notes:</td>
                <td style="padding: 12px 0; color: #333;">${registration.notes || 'N/A'}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #f0f0f0; border-radius: 5px; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                Registered at ${new Date(registration.created_at).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      `,
    });


    console.log('✅ Admin notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
  }
};


// Send confirmation email to student
const sendStudentConfirmation = async (registration, whatsappLink) => {
  // ✅ Only show WhatsApp section if link exists
  const whatsappSection = whatsappLink
    ? `
      <div style="background-color: #25D366; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <h3 style="color: white; margin: 0 0 10px 0;">📱 Join Our WhatsApp Community</h3>
        <p style="color: white; margin: 0 0 15px 0; font-size: 14px;">
          Stay updated with course announcements and connect with fellow students!
        </p>
        <a href="${whatsappLink}" 
           style="display: inline-block; background-color: white; color: #25D366; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Join WhatsApp Group
        </a>
      </div>
    `
    : '';


  const emailBody = `
Hi ${registration.name},


Thank you for enrolling in ${registration.batch_title}! Your payment has been confirmed.


Course: ${registration.batch_title}
Amount Paid: ₹${registration.amount}
Student ID: ${registration.student_id}
Email: ${registration.email}
Phone: ${registration.phone}


If you have any questions, feel free to reach out to us at ${process.env.ADMIN_EMAIL}


Best regards,
The Project Club Team
`;


  try {
    await transporter.sendMail({
      from: `"The Project Club" <${process.env.ADMIN_EMAIL}>`,
      to: registration.email,
      subject: `🎉 Welcome to ${registration.batch_title}!`,
      text: emailBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #2196F3; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Welcome Aboard!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              You're now enrolled in ${registration.batch_title}
            </p>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hi <strong>${registration.name}</strong>,
            </p>
            
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              Thank you for enrolling in <strong>${registration.batch_title}</strong>! 
              Your payment has been confirmed.
            </p>
            
            <div style="background-color: #E3F2FD; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #1976D2; margin: 0 0 15px 0;">📋 Enrollment Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Student ID:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${registration.student_id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Course:</td>
                  <td style="padding: 8px 0; color: #333;">${registration.batch_title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Amount Paid:</td>
                  <td style="padding: 8px 0; color: #4CAF50; font-weight: bold;">₹${registration.amount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${registration.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Phone:</td>
                  <td style="padding: 8px 0; color: #333;">${registration.phone}</td>
                </tr>
              </table>
            </div>
            
            ${whatsappSection}
            
            <div style="margin-top: 25px; padding: 15px; background-color: #FFF3E0; border-left: 4px solid #FF9800; border-radius: 4px;">
              <p style="margin: 0; color: #E65100; font-size: 14px;">
                <strong>💡 Important:</strong> Keep your Student ID safe. You'll need it for all course-related communications.
              </p>
            </div>
            
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 25px;">
              If you have any questions, feel free to reach out to us at 
              <a href="mailto:${process.env.ADMIN_EMAIL}" style="color: #2196F3; text-decoration: none;">
                ${process.env.ADMIN_EMAIL}
              </a>
            </p>
            
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 20px;">
              Best regards,<br>
              <strong>The Project Club Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p style="margin: 0;">© 2025 The Project Club. All rights reserved.</p>
          </div>
        </div>
      `,
    });


    console.log('✅ Student confirmation email sent successfully');
  } catch (error) {
    console.error('❌ Error sending student confirmation:', error);
  }
};


// ✅ NEW: Send max capacity alert to admin
const sendMaxCapacityAlert = async (batch) => {
  try {
    await transporter.sendMail({
      from: `"Course Registration System" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_RECIPIENT,
      subject: `⚠️ BATCH FULL: ${batch.title} - Max Capacity Reached`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">⚠️ Maximum Capacity Reached</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="background-color: #ffe6e6; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b6b; margin-bottom: 20px;">
              <h2 style="color: #c92a2a; margin: 0 0 10px 0;">Batch Status: FULL</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Batch Name:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${batch.title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Current Count:</td>
                  <td style="padding: 8px 0; color: #ff6b6b; font-weight: bold; font-size: 18px;">
                    ${batch.registered_count} / ${batch.max_seats}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Status:</td>
                  <td style="padding: 8px 0; color: #c92a2a; font-weight: bold;">MAXIMUM CAPACITY REACHED</td>
                </tr>
              </table>
            </div>
            
            <h3 style="color: #333; margin-top: 25px;">📋 Recommended Actions:</h3>
            <ul style="color: #555; font-size: 15px; line-height: 1.8;">
              <li>Create a new batch (Batch 2) for this course</li>
              <li>Consider increasing max_seats if possible</li>
              <li>Review and contact students on waitlist</li>
              <li>Update course listing to show "FULL" status</li>
            </ul>
            
            <div style="margin-top: 25px; padding: 15px; background-color: #e3f2fd; border-radius: 5px;">
              <p style="margin: 0; color: #1976d2; font-size: 14px;">
                <strong>ℹ️ Note:</strong> New registrations for this batch will be rejected automatically 
                until capacity is increased or a new batch is created.
              </p>
            </div>
            
            <div style="margin-top: 25px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Automated alert from Registration System<br>
                ${new Date().toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      `,
    });


    console.log(`✅ Max capacity alert sent for ${batch.title}`);
  } catch (error) {
    console.error('❌ Error sending max capacity alert:', error);
  }
};


module.exports = {
  sendAdminNotification,
  sendStudentConfirmation,
  sendMaxCapacityAlert, // ✅ NEW export
};
