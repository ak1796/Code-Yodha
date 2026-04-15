const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendAssignmentEmail = async (officerEmail, ticketData) => {
  const mailOptions = {
    from: `"NagarVaani Command Center" <${process.env.SMTP_USER}>`,
    to: officerEmail,
    subject: `🚨 New Signal Assigned: ${ticketData.category} | ${ticketData.ward} | Priority ${ticketData.priority_score}`,
    text: `
Dear Specialist,

A new municipal signal has been dispatched to your node.

SIGNAL DETAILS:
------------------------------------------
ID:             ${ticketData.id.substring(0, 8).toUpperCase()}
Department:      ${ticketData.category}
Jurisdiction:    ${ticketData.ward}
Telemetry:       Priority ${ticketData.priority_score} / 5
Citizens Impact: ${ticketData.affected_count || 1}
SLA Deadline:    ${new Date(ticketData.sla_deadline).toLocaleString()}
------------------------------------------

Description:
${ticketData.description}

MISSION CONTROL:
https://nagarvaani.gov.in/officer/dispatch/${ticketData.id}

This is an automated tactical assignment.
`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📡 Signal payload transmitted to ${officerEmail}`);
  } catch (error) {
    console.error("❌ Transmission Failure:", error.message);
  }
};

exports.sendCitizenUpdateEmail = async (citizenEmail, status, ticketData) => {
  const mailOptions = {
    from: `"NagarVaani Service" <${process.env.SMTP_USER}>`,
    to: citizenEmail,
    subject: `Update on Signal #${ticketData.id.substring(0, 8).toUpperCase()} - ${status}`,
    text: `
Your civic signal has been updated.

NEW STATUS: ${status.toUpperCase()}
Updated At: ${new Date().toLocaleString()}

You can track the resolution progress here:
https://nagarvaani.gov.in/track/${ticketData.id}

Thank you for contributing to your city's hygiene.
`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (e) {}
};

exports.sendTelegramUpdate = async (chatId, status, ticketData) => {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const TelegramBot = require('node-telegram-bot-api');
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

  const message = `🔔 Update on your complaint #${ticketData.id.substring(0, 8).toUpperCase()}\n\n` +
    `Status: ${status.toUpperCase()}\n` +
    `Node Actor: ${status === 'resolved' ? 'Mission RESOLVED' : 'In Progress'}\n\n` +
    `Track Live: http://ugirp.vercel.app/track/${ticketData.id}\n\n` +
    (status === 'resolved' ? 'Thank you for making Mumbai better. Please rate your experience 1-5.' : '');

  try {
    await bot.sendMessage(chatId, message);
    console.log(`📡 Signal status pulse transmitted to Telegram: ${chatId}`);
  } catch (e) {
    console.error("❌ Telegram Transmission failure:", e.message);
  }
};
