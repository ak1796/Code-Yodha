const { supabase } = require('../lib/supabase');

exports.log = async function({ ticket_id, actor_id, action, old_value, new_value, ip_address }) {
  try {
     const payload = {
       ticket_id,
       actor_id,
       action: new_value ? `${action} | New Value: ${new_value}` : action,
       ip_address,
       created_at: new Date().toISOString()
     };
 
     console.log(`[FORENSIC_INGEST] Ingesting: ${action} for Node ${ticket_id}`);
     const { error } = await supabase.from('audit_log').insert(payload);
     
     if (error) {
       console.error("❌ AUDIT_LOG_ENTRY_FAILURE:", error.message);
     } else {
       console.log("✅ AUDIT_LOG_ENTRY_SUCCESS");
     }
  } catch (err) {
    console.error("Audit Log Exception:", err);
  }
};
