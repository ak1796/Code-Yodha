const { supabase } = require('../src/lib/supabase');
async function test() {
  const { data, error } = await supabase
    .from('complaints')
    .insert({
      title: 'Test',
      description: 'Test description',
      category: 'DRAINAGE',
      user_email: 'patiltanay569@gmail.com',
      status: 'Submitted'
    })
    .select();
  if (error) {
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Details:', error.details);
  } else {
    console.log('Success:', data);
  }
}
test();
