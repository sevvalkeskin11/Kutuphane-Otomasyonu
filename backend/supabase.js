// .env dosyasındaki şifreleri okumamızı sağlar
require('dotenv').config(); 

// Supabase aracını çağırıyoruz
const { createClient } = require('@supabase/supabase-js');

// Şifrelerimizi değişkenlere alıyoruz
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Veritabanı bağlantımızı kuruyoruz
const supabase = createClient(supabaseUrl, supabaseKey);

// Bu bağlantıyı diğer dosyalarda kullanabilmek için dışa aktarıyoruz
module.exports = supabase;