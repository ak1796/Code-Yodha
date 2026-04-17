const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { geminiExtractFromEmail } = require('../lib/gemini');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// --- SECTION 1: IMAP & SMTP CONFIG ---
const imapConfig = {
  user: process.env.GMAIL_USER,
  password: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  authTimeout: 3000
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS
  }
});

// --- SECTION 3: FIND OFFICER FUNCTION ---
async function findOfficerForComplaint(department, city) {
  const { data: officer, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, department, ward_name, officer_lat, officer_lng, active_ticket_count, max_ticket_capacity')
    .eq('role', 'officer')
    .eq('department', department)
    .eq('city', city)
    .eq('is_available', true)
    .order('active_ticket_count', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("ÔØî Finder Failure:", error.message);
    return null;
  }
  return officer;
}

// --- SECTION 4: SEND CONFIRMATION EMAIL TO CITIZEN ---
async function sendConfirmationToCitizen(citizenEmail, complaintId, category, department, description) {
  const mailOptions = {
    from: `"NagarVaani" <${process.env.GMAIL_USER}>`,
    to: citizenEmail,
    subject: `Complaint Registered Successfully ÔÇö NagarVaani #${complaintId.substring(0, 8).toUpperCase()}`,
    html: `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1)">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #f97316; margin: 0;">NagarVaani</h1>
      <p style="color: #666; margin: 5px 0;">Civic Intelligence Platform</p>
    </div>
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
      <h2 style="color: #15803d; margin: 0 0 5px 0;">Ô£ô Complaint Registered Successfully</h2>
      <p style="color: #166534; margin: 0;">Your complaint has been received and is being processed.</p>
    </div>
    <h3 style="color: #333; border-bottom: 2px solid #f97316; padding-bottom: 8px;">Complaint Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #666; width: 40%;">Complaint ID:</td><td style="padding: 8px 0; color: #333; font-weight: bold;">#${complaintId.substring(0, 8).toUpperCase()}</td></tr>
      <tr style="background: #f9f9f9;"><td style="padding: 8px; color: #666;">Category:</td><td style="padding: 8px; color: #333; font-weight: bold;">${category}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Department:</td><td style="padding: 8px 0; color: #333;">${department}</td></tr>
      <tr style="background: #f9f9f9;"><td style="padding: 8px; color: #666;">Status:</td><td style="padding: 8px;"><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Submitted</span></td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Your Complaint:</td><td style="padding: 8px 0; color: #333;">${description}</td></tr>
    </table>
    <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin-top: 20px;">
      <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>Message:</strong> Your complaint has been registered and assigned to the concerned department. You will receive updates as your complaint progresses.</p>
    </div>
    <p style="color: #666; font-size: 13px; margin-top: 20px;">Track your complaint at: <a href="http://localhost:5173/track/${complaintId}" style="color: #f97316;">nagarvaani.gov.in/track/${complaintId.substring(0, 8)}</a></p>
    <div style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 15px; text-align: center;">
      <p style="color: #999; font-size: 12px; margin: 0;">NagarVaani ÔÇö Civic Intelligence Platform</p>
      <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">Do not reply to this email. For queries contact nagarvaani@gmail.com</p>
    </div>
  </div>
</body>
</html>`
  };
  return transporter.sendMail(mailOptions);
}

// --- SECTION 5: SEND NOTIFICATION TO OFFICER ---
async function sendNotificationToOfficer(officerEmail, officerName, complaintId, category, description, location, citizenEmail, severity) {
  const slaHours = { DRAINAGE: 48, WATER: 48, ROADS: 168, GARBAGE: 72, ELECTRICITY: 24, HEALTH: 24, PARKS: 240, BUILDINGS: 96, PEST: 72, ENCROACHMENT: 96, OTHER: 96 };
  const deadline = new Date(Date.now() + (slaHours[category] || 96) * 3600000).toLocaleString();
  
  const severityColors = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
  
  const mailOptions = {
    from: `"NagarVaani System" <${process.env.GMAIL_USER}>`,
    to: officerEmail,
    subject: `­ƒöö New Complaint Assigned ÔÇö ${category}, ${location} ÔÇö #${complaintId.substring(0, 8).toUpperCase()}`,
    html: `<!DOCTYPE html>
<html>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid #334155;">
    <h2 style="color: #f97316; margin-top: 0; font-size: 24px;">New Complaint Assigned to You</h2>
    <div style="background: #334155; height: 1px; margin: 25px 0;"></div>
    
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 10px 0; color: #94a3b8; width: 40%;">Signal ID:</td><td style="padding: 10px 0; font-weight: 800; color: #f97316;">#${complaintId.substring(0, 8).toUpperCase()}</td></tr>
      <tr><td style="padding: 10px 0; color: #94a3b8;">Category:</td><td><span style="background: #f97316; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${category}</span></td></tr>
      <tr><td style="padding: 10px 0; color: #94a3b8;">Severity:</td><td><span style="background: ${severityColors[severity] || '#64748b'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${severity}</span></td></tr>
      <tr><td style="padding: 10px 0; color: #94a3b8;">Location:</td><td style="padding: 10px 0; font-weight: bold;">${location}</td></tr>
      <tr><td style="padding: 10px 0; color: #94a3b8;">Citizen Contact:</td><td style="padding: 10px 0;">${citizenEmail}</td></tr>
      <tr><td style="padding: 10px 0; color: #94a3b8;">SLA Deadline:</td><td style="padding: 10px 0; color: #ef4444; font-weight: bold;">${deadline}</td></tr>
    </table>

    <div style="background: #0f172a; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f97316;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: bold; margin-bottom: 10px;">Description</p>
      <p style="margin: 0; line-height: 1.6;">${description}</p>
    </div>

    <p style="font-size: 12px; color: #64748b;">Source: <strong style="color: #38bdf8;">Ô£ë EMAIL SUBMISSION</strong></p>

    <a href="http://localhost:5173/officer/dashboard" style="display: block; background: #f97316; color: white; text-align: center; padding: 18px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 30px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">LOGIN TO DISPATCH CENTER</a>
    
    <p style="text-align: center; color: #64748b; font-size: 11px; margin-top: 30px;">This is an automated tactical assignment. Action is required before SLA breach.</p>
  </div>
</body>
</html>`
  };
  return transporter.sendMail(mailOptions);
}

// --- SECTION 6: MAIN EMAIL PROCESSING FUNCTION ---
exports.processIncomingEmails = async () => {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        imap.search(['UNSEEN'], (err, results) => {
          if (err || !results || !results.length) {
            console.log("­ƒô¡ No unread signals found in inbox.");
            imap.end();
            return resolve();
          }

          const f = imap.fetch(results, { bodies: '', markSeen: true });
          let processedCount = 0;

          f.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, mail) => {
                if (err) return console.error("ÔØî Mail Parse Failure:", err);

                const senderEmail = mail.from?.value?.[0]?.address || "Unknown";
                const emailSubject = mail.subject || "(No Subject)";
                const emailBody = mail.text || mail.html || "";
                const receivedAt = mail.date || new Date();

                // Skip system/bounce emails
                if (senderEmail === process.env.GMAIL_USER || senderEmail.includes('mailer-daemon') || senderEmail.includes('noreply')) {
                  console.log(`ÔÅ¡´©Å Skipping non-citizen signal from ${senderEmail}`);
                  return;
                }

                console.log(`­ƒôí Ingesting Signal from ${senderEmail}: "${emailSubject.substring(0, 30)}..."`);

                try {
                  // STEP 3: Gemini Extraction
                  const extracted = await geminiExtractFromEmail(emailSubject, emailBody);
                  console.log(`­ƒñû AI Extraction Result: [Dept: ${extracted?.department}] [Severity: ${extracted?.severity}]`);
                  if (!extracted || !extracted.is_complaint) {
                    console.log(`🤖 Signal rejected by AI: Not a valid complaint or spam.`);
                    return;
                  }

                  // STEP 4: Save to Complaints
                  const { data: complaint, error: cErr } = await supabase
                    .from('complaints')
                    .insert({
                      description: extracted.description,
                      raw_text: emailBody,
                      category: extracted.category,
                      department: extracted.department,
                      source: 'EMAIL',
                      status: 'open',
                      city: extracted.city || 'Mumbai',
                      ward_name: extracted.ward,
                      severity: extracted.severity,
                      citizen_email: senderEmail,
                      created_at: receivedAt.toISOString()
                    })
                    .select()
                    .single();

                  if (cErr) throw cErr;

                  // STEP 5: Create Master Ticket
                  const slaHours = { DRAINAGE: 48, WATER: 48, ROADS: 168, GARBAGE: 72, ELECTRICITY: 24, HEALTH: 24, PARKS: 240, BUILDINGS: 96, PEST: 72, ENCROACHMENT: 96, OTHER: 96 };
                  const slaDeadline = new Date(receivedAt.getTime() + (slaHours[extracted.department] || 96) * 3600000);

                  const { data: ticket, error: tErr } = await supabase
                    .from('master_tickets')
                    .insert({
                      title: extracted.summary || emailSubject,
                      description: extracted.description,
                      category: extracted.category,
                      department: extracted.department,
                      status: 'filed',
                      source: 'EMAIL',
                      city: extracted.city || 'Mumbai',
                      severity: extracted.severity,
                      sla_deadline: slaDeadline.toISOString(),
                      citizen_email: senderEmail,
                      priority_score: extracted.severity === 'HIGH' ? 4 : extracted.severity === 'MEDIUM' ? 3 : 2
                    })
                    .select()
                    .single();

                  if (tErr) throw tErr;

                  // Update original complaint with master_ticket_id
                  await supabase.from('complaints').update({ master_ticket_id: ticket.id }).eq('id', complaint.id);

                  // STEP 6: Find Officer
                  const officer = await findOfficerForComplaint(extracted.department, extracted.city || 'Mumbai');

                  if (officer) {
                    await supabase.from('master_tickets').update({ assigned_officer_id: officer.id, status: 'assigned' }).eq('id', ticket.id);
                    await supabase.rpc('increment_ticket_count', { officer_id: officer.id });
                    
                    await supabase.from('officer_assignments').insert({
                      ticket_id: ticket.id,
                      officer_id: officer.id,
                      assignment_reason: 'Email complaint ÔÇö auto assigned by department',
                      was_auto_assigned: true
                    });

                    const auditService = require('./auditService');
                    await auditService.log({
                      ticket_id: ticket.id,
                      action: 'auto_assigned_from_email',
                      new_value: `Officer: ${officer.full_name} | Target: ${officer.email}`
                    });

                    // STEP 8: Notify Officer
                    await sendNotificationToOfficer(officer.email, officer.full_name, ticket.id, extracted.category, extracted.description, extracted.location, senderEmail, extracted.severity);
                  }

                  // STEP 7: Confirm to Citizen
                  await sendConfirmationToCitizen(senderEmail, ticket.id, extracted.category, extracted.department, extracted.description);

                  console.log(`Ô£à Processed Signal ${ticket.id.substring(0,8)} | Assigned: ${officer ? officer.full_name : 'N/A'}`);

                } catch (err) {
                  console.error("ÔØî Signal Processing Error:", err.message);
                }
              });
            });
          });

          f.once('error', (err) => reject(err));
          f.once('end', () => {
             imap.end();
             resolve();
          });
        });
      });
    });

    imap.once('error', (err) => reject(err));
    imap.once('end', () => console.log('­ƒöî IMAP Connection Terminated.'));
    imap.connect();
  });
};
