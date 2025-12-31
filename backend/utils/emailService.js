const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_RECIPIENT = process.env.ADMIN_RECIPIENT;

const ensureEnv = () => {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
  if (!ADMIN_RECIPIENT) throw new Error('ADMIN_RECIPIENT missing');
};

const sendAdminNotification = async (registration) => {
  ensureEnv();

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
`.trim();

  await resend.emails.send({
    from: `Course Registration <${FROM_EMAIL}>`,
    to: ADMIN_RECIPIENT,
    subject: `🎓 New Registration: ${registration.name} | ${registration.batch_title}`,
    text: emailBody,
    html: `
      <h2>New Student Registered!</h2>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr><td><b>Name</b></td><td>${registration.name}</td></tr>
        <tr><td><b>Email</b></td><td>${registration.email}</td></tr>
        <tr><td><b>Phone</b></td><td>${registration.phone}</td></tr>
        <tr><td><b>Gender</b></td><td>${registration.gender}</td></tr>
        <tr><td><b>Student ID</b></td><td>${registration.student_id || 'N/A (Demo Batch)'}</td></tr>
        <tr><td><b>Batch</b></td><td>${registration.batch_title}</td></tr>
        <tr><td><b>Amount Paid</b></td><td>₹${registration.amount}</td></tr>
        <tr><td><b>Payment Status</b></td><td>${registration.payment_status}</td></tr>
        <tr><td><b>Experience Level</b></td><td>${registration.experience_level}</td></tr>
        <tr><td><b>Referral Source</b></td><td>${registration.referral_source || 'N/A'}</td></tr>
        <tr><td><b>Notes</b></td><td>${registration.notes || 'N/A'}</td></tr>
      </table>
      <p>Registered at ${new Date(registration.created_at).toLocaleString('en-IN')}</p>
    `,
  });
};

const sendStudentConfirmation = async (registration, whatsappLink) => {
  ensureEnv();

  const emailBody = `
Hi ${registration.name},

Thank you for enrolling in ${registration.batch_title}!
Your payment has been confirmed.

Student ID: ${registration.student_id || 'N/A'}
Course: ${registration.batch_title}
Amount Paid: ₹${registration.amount}
Email: ${registration.email}
Phone: ${registration.phone}

${whatsappLink ? `Join WhatsApp Group: ${whatsappLink}` : ''}

If you have any questions, reply to this email.

Best regards,
The Project Club Team
`.trim();

  await resend.emails.send({
    from: `The Project Club <${FROM_EMAIL}>`,
    to: registration.email,
    subject: `✅ Enrollment Confirmed: ${registration.batch_title}`,
    text: emailBody,
    html: `
      <p>Hi <b>${registration.name}</b>,</p>
      <p>Thank you for enrolling in <b>${registration.batch_title}</b>! Your payment has been confirmed.</p>

      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
        <tr><td><b>Student ID</b></td><td>${registration.student_id || 'N/A'}</td></tr>
        <tr><td><b>Course</b></td><td>${registration.batch_title}</td></tr>
        <tr><td><b>Amount Paid</b></td><td>₹${registration.amount}</td></tr>
        <tr><td><b>Email</b></td><td>${registration.email}</td></tr>
        <tr><td><b>Phone</b></td><td>${registration.phone}</td></tr>
      </table>

      ${
        whatsappLink
          ? `<p><a href="${whatsappLink}" target="_blank" rel="noreferrer">Join WhatsApp Group</a></p>`
          : ''
      }

      <p>If you have any questions, feel free to reach out.</p>
      <p>Best regards,<br/><b>The Project Club Team</b></p>
    `,
  });
};

const sendMaxCapacityAlert = async (batch) => {
  ensureEnv();

  await resend.emails.send({
    from: `The Project Club <${FROM_EMAIL}>`,
    to: ADMIN_RECIPIENT,
    subject: `⚠️ MAX CAPACITY REACHED: ${batch.title}`,
    text: `Batch "${batch.title}" reached maximum capacity: ${batch.registered_count} / ${batch.max_seats}`,
    html: `
      <h2>Maximum capacity reached</h2>
      <p><b>Batch:</b> ${batch.title}</p>
      <p><b>Current Count:</b> ${batch.registered_count} / ${batch.max_seats}</p>
      <p><b>Status:</b> MAXIMUM CAPACITY REACHED</p>
    `,
  });
};

module.exports = {
  sendAdminNotification,
  sendStudentConfirmation,
  sendMaxCapacityAlert,
};
