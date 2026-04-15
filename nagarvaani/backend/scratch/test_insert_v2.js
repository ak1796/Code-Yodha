const { supabase } = require('../src/lib/supabase');
async function test() {
  const { data, error } = await supabase
    .from('complaints')
    .insert({
      title: 'Test',
      description: 'Test description',
      category: 'DRAINAGE',
      email: 'patiltanay569@gmail.com',
      status: 'Submitted'
    })
    .select();
  if (error) {
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
  } else {
    console.log('Success:', data);
  }
}
test();
