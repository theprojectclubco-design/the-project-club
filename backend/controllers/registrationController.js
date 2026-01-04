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
 * These wrappers ensure registration/payment still succeeds even if emails fail.
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
    const { data: existingUser, error: existingErr } = await supabase
      .from('users')
      .select('id, student_id')
      .eq('email', email)
      .single();

    if (!existingErr && existingUser) return existingUser;

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
      .select('id, email, phone, batch_title, payment_status, student_id, user_id, batch_id')
      .eq('batch_id', batchId)
      .or(`email.eq.${email},phone.eq.${phone},user_id.eq.${userId}`);

    if (error) {
      console.error('❌ Error checking duplicate:', error);
      return null;
    }

    if (data && data.length > 0) return data[0];
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

// 1) Create order (NO registration creation here)
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

    if (!studentName || !email || !phone || !experienceLevel || !batchId || !gender) {
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

    // ✅ Check if batch is full (still ok to do here)
    if ((batch.registered_count || 0) >= batch.max_seats) {
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

    // Create Razorpay order (registration will be created ONLY after payment)
    const isDemo = Number(batch.fee) <= 1;

    const order = await razorpay.orders.create({
      amount: Number(batch.fee) * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { name: studentName, email, phone, batchId },
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      isDemo,
      // send back meta so frontend can reuse it in verify-payment
      meta: {
        name: studentName,
        email,
        phone,
        experienceLevel,
        batchId,
        referralSource: referralSource || null,
        notes: notes || null,
        gender,
      },
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

// 2) Verify payment (CREATE registration here, only when PAID)
exports.verifyPayment = async (req, res) => {
  console.log("verifyPayment body:", Object.keys(req.body));

  try {
    const { orderId, paymentId, signature, meta } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification fields',
      });
    }

    // meta is required now because we create registration only after payment
    if (!meta || !meta.name || !meta.email || !meta.phone || !meta.experienceLevel || !meta.batchId || !meta.gender) {
      return res.status(400).json({
        success: false,
        message:
          'Missing meta fields. Send meta: { name, email, phone, experienceLevel, batchId, gender, referralSource?, notes? }',
      });
    }

    // Verify Razorpay signature
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

    // Idempotency: if a PAID registration already exists for this payment/order, return it
    const { data: paidByPayment } = await supabase
      .from('registrations')
      .select('*')
      .eq('razorpay_payment_id', paymentId)
      .maybeSingle?.();

    if (paidByPayment) {
      const isDemoExisting = Number(paidByPayment.amount) <= 1;
      const whatsappExisting = getWhatsAppGroupLink(paidByPayment.gender, isDemoExisting);

      return res.json({
        success: true,
        message: 'Payment already verified',
        data: { ...paidByPayment, whatsapp_link: whatsappExisting },
      });
    }

    // Load batch and check capacity (final gate happens here too)
    const { data: batch, error: batchErr } = await supabase
      .from('batches')
      .select('*')
      .eq('id', meta.batchId)
      .single();

    if (batchErr || !batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    if ((batch.registered_count || 0) >= batch.max_seats) {
      await safeCapacityAlert(batch);

      const batch2 = await createBatch2(batch);
      if (batch2) {
        return res.status(409).json({
          success: false,
          message: `Payment verified, but batch "${batch.title}" is full. We created "${batch2.title}". Please contact support to move your enrollment.`,
          batchFull: true,
          newBatchId: batch2.id,
          newBatchTitle: batch2.title,
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Payment verified, but batch is full. Please contact support.',
      });
    }

    // Get or create user
    const user = await getOrCreateUser(meta.name, meta.email, meta.phone);

    // Duplicate protection (user/email/phone + same batch)
    const existingReg = await checkDuplicateRegistration(
      meta.email,
      meta.phone,
      meta.batchId,
      user.id
    );

    if (existingReg && existingReg.payment_status === 'PAID') {
      const whatsappLinkDup = getWhatsAppGroupLink(meta.gender, Number(batch.fee) <= 1);
      return res.json({
        success: true,
        message: 'Already registered (paid)',
        data: { ...existingReg, whatsapp_link: whatsappLinkDup },
      });
    }

    const isDemo = Number(batch.fee) <= 1;

    // ✅ Create registration ONLY after payment verified
    const { data: createdReg, error: regError } = await supabase
      .from('registrations')
      .insert([
        {
          user_id: user.id,
          name: meta.name,
          email: meta.email,
          phone: meta.phone,
          experience_level: meta.experienceLevel,
          batch_id: meta.batchId,
          batch_title: batch.title,
          amount: Number(batch.fee),
          payment_status: 'PAID',
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          paid_at: new Date().toISOString(),
          referral_source: meta.referralSource || null,
          notes: meta.notes || null,
          gender: meta.gender,
          student_id: user.student_id,
        },
      ])
      .select()
      .single();
      console.log('Created registration:', createdReg);


    if (regError) {
      console.error('❌ Registration insert error:', regError);
      return res.status(500).json({
        success: false,
        message: regError.message,
      });
    }

    // Increment registered_count once
    const newCount = (batch.registered_count || 0) + 1;
    await supabase
      .from('batches')
      .update({ registered_count: newCount })
      .eq('id', meta.batchId);

    console.log(`✅ Updated registered_count for ${batch.title}: ${newCount}/${batch.max_seats}`);

    if (newCount >= batch.max_seats) {
      console.log(`⚠️ Batch ${batch.title} has reached maximum capacity!`);
      await safeCapacityAlert(batch);
    }

    const whatsappLink = getWhatsAppGroupLink(createdReg.gender, isDemo);

    // Best-effort notifications (must not break verifyPayment)
    await safeExcel(createdReg);
    await safeAdminEmail(createdReg);
    await safeStudentEmail(createdReg, whatsappLink);

    console.log(`✅ Payment verified | WhatsApp: ${whatsappLink || 'N/A'}`);

    return res.json({
      success: true,
      message: 'Payment verified and registration created',
      data: {
        ...createdReg,
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
