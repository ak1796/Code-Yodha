const nodemailer = require('nodemailer');
require('dotenv').config();

// STEP 2: Nodemailer Setup
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * STEP 3: Send Confirmation Email to Citizen
 */
const sendCitizenConfirmation = async (userEmail, complaintId, category) => {
  const mailOptions = {
    from: `"Smart Grievance Platform" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Complaint Registered Successfully",
    text: `
Your complaint has been registered successfully.

Complaint Details:
- ID: ${complaintId}
- Category: ${category}
- Status: Submitted

Message: Your complaint has been registered and assigned to the concerned department.

Thank you for your patience.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Confirmation email sent to citizen: ${userEmail}`);
  } catch (error) {
    console.error(`❌ Error sending email to citizen: ${error.message}`);
  }
};

/**
 * STEP 4: Send Notification Email to Officer
 */
const sendOfficerNotification = async (officerEmail, complaintData) => {
  const mailOptions = {
    from: `"Smart Grievance Platform" <${process.env.EMAIL_USER}>`,
    to: officerEmail,
    subject: "New Complaint Assigned",
    text: `
A new complaint has been assigned to your department.

Complaint details:
- Title: ${complaintData.title}
- Description: ${complaintData.description}
- Category: ${complaintData.category}
- Citizen email: ${complaintData.user_email}

Action message: Please take necessary action.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification email sent to officer: ${officerEmail}`);
  } catch (error) {
    console.error(`❌ Error sending email to officer: ${error.message}`);
  }
};

module.exports = {
  sendCitizenConfirmation,
  sendOfficerNotification,
};
