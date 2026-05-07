const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ajajoighjtxdjgndbizb.supabase.co';
const supabaseKey = 'sb_publishable_pouOXLDyVC9V2H0Qkp1oeQ_QU3xSCxp';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmptyIn() {
  const { data, error } = await supabase.from('tasks').select('id').in('column_id', []);
  console.log('Result of IN []:', error ? error.message : data);
}

testEmptyIn();
