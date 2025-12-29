const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const EXCEL_FILE_PATH = path.join(__dirname, '../registrations.xlsx');

const appendToExcel = async (registration) => {
  try {
    let workbook;
    let worksheet;

    // Read existing file if it exists
    if (fs.existsSync(EXCEL_FILE_PATH)) {
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(EXCEL_FILE_PATH);
      worksheet = workbook.worksheets[0];
    } else {
      // Create new workbook
      workbook = new ExcelJS.Workbook();
      worksheet = workbook.addWorksheet('Registrations');
      
      // Add headers
      worksheet.columns = [
        { header: 'Registration Date', key: 'date', width: 20 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Experience Level', key: 'experience', width: 15 },
        { header: 'Batch', key: 'batch', width: 20 },
        { header: 'Amount (₹)', key: 'amount', width: 12 },
        { header: 'Payment Status', key: 'status', width: 15 },
        { header: 'Razorpay Order ID', key: 'orderId', width: 20 },
        { header: 'Razorpay Payment ID', key: 'paymentId', width: 20 },
      ];
    }

    // Add new row
    worksheet.addRow({
      date: new Date(registration.created_at || new Date()).toLocaleString('en-IN'),
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      experience: registration.experience_level,
      batch: registration.batch_title,
      amount: registration.amount,
      status: registration.payment_status,
      orderId: registration.razorpay_order_id || 'N/A',
      paymentId: registration.razorpay_payment_id || 'N/A',
    });

    // Write to file
    await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
    console.log('✅ Registration added to Excel file');
    return true;

  } catch (error) {
    console.error('❌ Error writing to Excel:', error.message);
    return false;
  }
};

module.exports = { appendToExcel };
