const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppNotification = async (phoneNumber, studentName, batchTitle, whatsappGroupLink) => {
  try {
    // Format phone number
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedPhone = '+91' + phoneNumber;
    }

    // Use provided link or fallback to env
    const groupLink = whatsappGroupLink || process.env.WHATSAPP_GROUP_LINK;

    console.log('📱 Sending to:', formattedPhone);
    console.log('📱 Group Link:', groupLink);

    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedPhone}`,
      body: `Hi ${studentName}! 🎉\n\nWelcome to ${batchTitle}!\n\nJoin our WhatsApp group for updates and announcements:\n${groupLink}\n\nLooking forward to learning with you!\n\n- THE PROJECT CLUB Team`,
    });

    console.log('✅ WhatsApp notification sent:', message.sid);
    return true;
  } catch (error) {
    console.error('❌ WhatsApp error:', error.message);
    return false;
  }
};

module.exports = { sendWhatsAppNotification };
