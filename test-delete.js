const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajajoighjtxdjgndbizb.supabase.co';
const supabaseKey = 'sb_publishable_pouOXLDyVC9V2H0Qkp1oeQ_QU3xSCxp';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Supabase'e bağlanılıyor...");
  
  // Login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123' // varsayılan bir şifre deneriz, veya direkt signup yaparız
  });
  
  let user = authData?.user;
  if (authError || !user) {
    console.log("Login başarısız, yeni kullanıcı oluşturuluyor...");
    const email = `test_${Date.now()}@test.com`;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: 'password123'
    });
    if (signUpError) {
      console.error("Signup error:", signUpError);
      return;
    }
    user = signUpData.user;
    console.log("Yeni kullanıcı ID:", user.id);
  } else {
    console.log("Kullanıcı ID:", user.id);
  }

  // Board oluştur
  console.log("Board oluşturuluyor...");
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .insert({ title: 'Test Board', user_id: user.id })
    .select()
    .single();
    
  if (boardError) {
    console.error("Board error:", boardError);
    return;
  }
  console.log("Board ID:", board.id);

  // Column oluştur
  const { data: col, error: colError } = await supabase
    .from('columns')
    .insert({ board_id: board.id, title: 'Test Col', position: 1 })
    .select()
    .single();

  if (colError) {
    console.error("Column error:", colError);
    return;
  }
  
  // Task oluştur
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({ column_id: col.id, title: 'Test Task', position: 1 })
    .select()
    .single();

  if (taskError) {
    console.error("Task error:", taskError);
    return;
  }

  // Board'u silmeyi dene (sadece board'u, cascade var mı bakalım)
  console.log("Board siliniyor (sadece board tablosundan)...");
  const { error: delError } = await supabase
    .from('boards')
    .delete()
    .eq('id', board.id);
    
  if (delError) {
    console.error("Silme Hatası Yakalandı! Hata:", delError);
  } else {
    console.log("Board başarıyla silindi (Cascade çalışıyor!).");
  }
}

test();
