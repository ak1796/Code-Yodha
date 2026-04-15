const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { sendCitizenConfirmation, sendOfficerNotification } = require('../services/emailService');

/**
 * STEP 1: Complaint Submission API
 * POST /api/grievance/complaints
 */
router.post('/complaints', async (req, res) => {
  const { title, description, category, user_email } = req.body;

  // Basic validation
  if (!title || !description || !category || !user_email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Insert complaint into Supabase
    // Note: We use the table names and schema requested by the user
    const { data: complaint, error: insertError } = await supabase
      .from('complaints')
      .insert({
        title,
        description,
        category,
        status: 'Submitted'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Supabase Insert Error:', insertError.message);
      return res.status(500).json({ error: 'Failed to record complaint' });
    }

    // 2. Find officer based on department
    const { data: officer, error: officerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('role', 'officer')
      .eq('department', category)
      .eq('is_available', true)
      .limit(1)
      .maybeSingle();

    // 3. Send Email to Citizen
    await sendCitizenConfirmation(user_email, complaint.id, category);

    // 4. Send Email to Officer if found (STEP 5 handling)
    if (officer && officer.email) {
      await sendOfficerNotification(officer.email, {
        title,
        description,
        category,
        user_email
      });
    } else {
      // STEP 5: Error Handling - log error if no officer found
      console.error(`⚠️ No available officer found for department: ${category}`);
    }

    // Return success response
    return res.status(201).json({
      message: 'Complaint filed successfully',
      complaint_id: complaint.id,
      assigned: !!officer
    });

  } catch (error) {
    // STEP 5: Ensure API doesn't crash
    console.error('❌ Fatal Error in Complaint Submission:', error.message);
    return res.status(500).json({ error: 'An internal server error occurred' });
  }
});

module.exports = router;
