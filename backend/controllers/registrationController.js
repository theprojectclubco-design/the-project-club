const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../supabaseClient');

const { appendToExcel } = require('../utils/excelExport');
const {
  sendAdminNotification,
  sendStudentConfirmation,
  sendMaxCapacityAlert,
} = require('../utils/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Render Free blocks outbound SMTP ports (25/465/587), so Nodemailer will time out.
 * These wrappers ensure registration/payment still succeeds even if emails fail. [web:786]
 */
const safeNotify = async (label, fn) => {
  try {
    await fn();
    console.log(`✅ ${label}`);
    return true;
  } catch (err) {
    console.error(`⚠️ ${label} failed (ignored):`, err?.message || err);
    return false;
  }
};

const safeExcel = async (registration) =>
  safeNotify('Excel updated', () => appendToExcel(registration));

const safeAdminEmail = async (registration) =>
  safeNotify('Admin email sent', () => sendAdminNotification(registration));

const safeStudentEmail = async (registration, whatsappLink) =>
  safeNotify('Student email sent', () =>
    sendStudentConfirmation(registration, whatsappLink)
  );

const safeCapacityAlert = async (batch) =>
  safeNotify('Max capacity alert sent', () => sendMaxCapacityAlert(batch));

// Helper: Get or create user
const getOrCreateUser = async (name, email, phone) => {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, student_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return existingUser;
    }

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{ name, email, phone }])
      .select('id, student_id')
      .single();

    if (userError) throw userError;
    return newUser;
  } catch (error) {
    console.error('❌ Error in getOrCreateUser:', error);
    throw error;
  }
};

// ✅ Get WhatsApp group link
const getWhatsAppGroupLink = (gender, isDemo) => {
  console.log(`\n========================================`);
  console.log(`📱 WHATSAPP LINK SELECTION`);
  console.log(`========================================`);
  console.log(`Gender: ${gender}`);
  console.log(`isDemo: ${isDemo}`);
  console.log(`--------`);

  let selectedLink = null;
  let selectedGroup = null;

  const genderLower = (gender || '').toLowerCase();

  if (genderLower === 'male' && isDemo) {
    selectedLink = process.env.WHATSAPP_MALE_DEMO;
    selectedGroup = 'MALE DEMO';
  } else if (genderLower === 'male' && !isDemo) {
    selectedLink = process.env.WHATSAPP_MALE_PAID;
    selectedGroup = 'MALE PAID';
  } else if (genderLower === 'female' && isDemo) {
    selectedLink = process.env.WHATSAPP_FEMALE_DEMO;
    selectedGroup = 'FEMALE DEMO';
  } else if (genderLower === 'female' && !isDemo) {
    selectedLink = process.env.WHATSAPP_FEMALE_PAID;
    selectedGroup = 'FEMALE PAID';
  }

  console.log(`✅ Selected Group: ${selectedGroup}`);
  console.log(`✅ Selected Link: ${selectedLink || '❌ UNDEFINED'}`);
  console.log(`========================================\n`);

  return selectedLink;
};

// Check if user already registered for this batch
const checkDuplicateRegistration = async (email, phone, batchId, userId) => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('id, email, phone, batch_title, payment_status, student_id')
      .eq('batch_id', batchId)
      .or(`email.eq.${email},phone.eq.${phone},user_id.eq.${userId}`);

    if (error) {
      console.error('❌ Error checking duplicate:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0];
    }

    return null;
  } catch (error) {
    console.error('❌ Error in checkDuplicateRegistration:', error);
    return null;
  }
};

// ✅ NEW: Create Batch 2 automatically
const createBatch2 = async (originalBatch) => {
  try {
    console.log(`\n🔄 Creating Batch 2 for: ${originalBatch.title}`);

    const newStartDate = new Date(originalBatch.start_date);
    newStartDate.setMonth(newStartDate.getMonth() + 2);

    const batch2Data = {
      title: `${originalBatch.title} - Batch 2`,
      course_name: originalBatch.course_name,
      description: originalBatch.description,
      start_date: newStartDate.toISOString(),
      end_date: originalBatch.end_date
        ? new Date(
            new Date(originalBatch.end_date).setMonth(
              new Date(originalBatch.end_date).getMonth() + 2
            )
          ).toISOString()
        : null,
      duration: originalBatch.duration,
      fee: originalBatch.fee,
      max_seats: originalBatch.max_seats,
      registered_count: 0,
      technologies: originalBatch.technologies,
      projects: originalBatch.projects,
      instructor_name: originalBatch.instructor_name,
      instructor_bio: originalBatch.instructor_bio,
      instructor_image: originalBatch.instructor_image,
      schedule: originalBatch.schedule,
      syllabus: originalBatch.syllabus,
      media_resources: originalBatch.media_resources,
    };

    const { data: newBatch, error } = await supabase
      .from('batches')
      .insert([batch2Data])
      .select()
      .single();

    if (error) throw error;

    console.log(
      `✅ Batch 2 created successfully: ${newBatch.title} (ID: ${newBatch.id})`
    );
    return newBatch;
  } catch (error) {
    console.error('❌ Error creating Batch 2:', error);
    return null;
  }
};

// 1) Create order
exports.createOrder = async (req, res) => {
  try {
    const {
      name,
      fullName,
      email,
      phone,
      experienceLevel,
      batchId,
      referralSource,
      notes,
      gender,
    } = req.body;

    const studentName = name || fullName;

    if (
      !studentName ||
      !email ||
      !phone ||
      !experienceLevel ||
      !batchId ||
      !gender
    ) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided including gender',
      });
    }

    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return res
        .status(404)
        .json({ success: false, message: 'Batch not found' });
    }

    // ✅ FIX: Check if batch is full
    if (batch.registered_count >= batch.max_seats) {
      // This can fail on Render Free due to SMTP restrictions; ignore safely.
      await safeCapacityAlert(batch);

      const batch2 = await createBatch2(batch);

      if (batch2) {
        return res.status(400).json({
          success: false,
          message: `Batch "${batch.title}" is full (${batch.registered_count}/${batch.max_seats}). However, we've created "${batch2.title}" starting ${new Date(
            batch2.start_date
          ).toLocaleDateString('en-IN')}. Would you like to enroll in that?`,
          batchFull: true,
          newBatchId: batch2.id,
          newBatchTitle: batch2.title,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Batch is full. Please select another batch.',
      });
    }

    // Get or create user
    const user = await getOrCreateUser(studentName, email, phone);

    // Check for duplicate registration
    const existingReg = await checkDuplicateRegistration(
      email,
      phone,
      batchId,
      user.id
    );

    if (existingReg) {
      let identifier = 'account';
      if (existingReg.email === email) identifier = 'email';
      else if (existingReg.phone === phone) identifier = 'phone number';

      return res.status(400).json({
        success: false,
        message: `You have already registered for "${existingReg.batch_title}" with this ${identifier}. ${
          existingReg.payment_status === 'PAID'
            ? 'Your enrollment is confirmed!'
            : 'Please complete your pending payment or contact support.'
        }`,
        duplicate: true,
        existingRegistration: {
          batchTitle: existingReg.batch_title,
          paymentStatus: existingReg.payment_status,
          studentId: existingReg.student_id,
        },
      });
    }

    const isDemo = Number(batch.fee) <= 1;

    const order = await razorpay.orders.create({
      amount: Number(batch.fee) * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { name: studentName, email, phone, batchId },
    });

    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .insert([
        {
          user_id: user.id,
          name: studentName,
          email,
          phone,
          experience_level: experienceLevel,
          batch_id: batchId,
          batch_title: batch.title,
          amount: Number(batch.fee),
          payment_status: 'PENDING',
          razorpay_order_id: order.id,
          referral_source: referralSource || null,
          notes: notes || null,
          gender,
          student_id: user.student_id,
        },
      ])
      .select()
      .single();

    if (regError) {
      console.error('❌ Registration creation error:', regError);
      return res
        .status(500)
        .json({ success: false, message: regError.message });
    }

    console.log(
      `✅ New registration created for ${studentName} | Batch: ${batch.title} | Student ID: ${user.student_id}`
    );

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      registrationId: registration.id,
      studentId: user.student_id,
      isDemo,
    });
  } catch (error) {
    console.error('❌ createOrder error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
    });
  }
};

// 2) Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification fields',
      });
    }

    const body = orderId + '|' + paymentId;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    const { data: reg, error: regFetchErr } = await supabase
      .from('registrations')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .single();

    if (regFetchErr || !reg) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    const isDemo = Number(reg.amount) <= 1;
    const whatsappLink = getWhatsAppGroupLink(reg.gender, isDemo);

    // ✅ FIX: Check if already paid to prevent double counting
    if (reg.payment_status === 'PAID') {
      console.log(`⚠️ Payment already processed. Skipping increment.`);
      return res.json({
        success: true,
        message: 'Payment already verified',
        data: { ...reg, whatsapp_link: whatsappLink },
      });
    }

    // Update payment status
    const { data: updated, error: updErr } = await supabase
      .from('registrations')
      .update({
        payment_status: 'PAID',
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        paid_at: new Date().toISOString(),
      })
      .eq('id', reg.id)
      .select()
      .single();

    if (updErr) {
      return res.status(500).json({
        success: false,
        message: updErr.message,
      });
    }

    // ✅ FIX: Increment registered_count ONLY once per unique user
    const { data: batch, error: batchErr } = await supabase
      .from('batches')
      .select('id, registered_count, max_seats, title')
      .eq('id', updated.batch_id)
      .single();

    if (!batchErr && batch) {
      const newCount = (batch.registered_count || 0) + 1;

      await supabase
        .from('batches')
        .update({ registered_count: newCount })
        .eq('id', updated.batch_id);

      console.log(
        `✅ Updated registered_count for ${batch.title}: ${newCount}/${batch.max_seats}`
      );

      // Check if max capacity reached
      if (newCount >= batch.max_seats) {
        console.log(`⚠️ Batch ${batch.title} has reached maximum capacity!`);
        await safeCapacityAlert(batch);
      }
    }

    /**
     * IMPORTANT:
     * Notifications (Excel + emails) must never break verifyPayment.
     * On Render Free, SMTP is blocked so emails will fail; these are best-effort. [web:786]
     */
    await safeExcel(updated);
    await safeAdminEmail(updated);
    await safeStudentEmail(updated, whatsappLink);

    console.log(`✅ Payment verified | WhatsApp: ${whatsappLink || 'N/A'}`);

    return res.json({
      success: true,
      message: 'Payment verified and registration completed',
      data: {
        ...updated,
        whatsapp_link: whatsappLink,
      },
    });
  } catch (error) {
    console.error('❌ verifyPayment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message,
    });
  }
};

// Admin: list all registrations
exports.getAllRegistrations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
