const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'mock_service_key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase };
