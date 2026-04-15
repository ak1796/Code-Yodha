const { sendCitizenConfirmation, sendOfficerNotification } = require('../src/services/emailService');
require('dotenv').config();

async function test() {
  console.log('Testing citizen email...');
  await sendCitizenConfirmation('patiltanay569@gmail.com', 'TEST-123', 'DRAINAGE');
  
  console.log('Testing officer email...');
  await sendOfficerNotification('patiltanay569@gmail.com', {
    title: 'Test Leakage',
    description: 'Pipe burst',
    category: 'DRAINAGE',
    user_email: 'citizen@gmail.com'
  });
}
test();
