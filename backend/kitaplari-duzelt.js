const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

// 1. Supabase ve Google API Bağlantıları
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const GOOGLE_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

async function kütüphaneyiGüncelle() {
    console.log("🚀 Veri iyileştirme işlemi başlıyor...");

    // 2. Tablodaki tüm kitapları çek (Şemandaki isimlerle)
    const { data: kitaplar, error } = await supabase.from('kitaplar').select('id, kitap_adi, yazar, isbn, kapak_url');

    if (error) {
        console.error("❌ Veritabanından veriler çekilemedi:", error.message);
        return;
    }

    console.log(`🔎 Toplam ${kitaplar.length} kitap taranacak.`);

    for (let kitap of kitaplar) {
        try {
            // Kitap adı ve yazarla arama yaparsak daha doğru sonuç alırız
            const aramaTerimi = encodeURIComponent(`${kitap.kitap_adi} ${kitap.yazar || ''}`);
            const url = `https://www.googleapis.com/books/v1/volumes?q=${aramaTerimi}&langRestrict=tr&maxResults=1&key=${GOOGLE_API_KEY}`;
            
            const response = await axios.get(url);
            const bookInfo = response.data.items ? response.data.items[0].volumeInfo : null;

            if (bookInfo) {
                // Doğru ISBN_13 numarasını bul
                const isbn13 = bookInfo.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier;
                
                // Kapak resmini çek ve HTTPS'e zorla (güvenlik için)
                let kapak = bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail;
                if (kapak) kapak = kapak.replace('http:', 'https:');

                // 3. Veritabanını şemana uygun sütun isimleriyle güncelle
                const { error: updateError } = await supabase
                    .from('kitaplar')
                    .update({
                        isbn: isbn13 || kitap.isbn,      // Eğer API'den gelmezse eskisini koru
                        kapak_url: kapak || kitap.kapak_url // Eğer API'den gelmezse eskisini koru
                    })
                    .eq('id', kitap.id);

                if (updateError) {
                    console.error(`⚠️ Hata (${kitap.kitap_adi}):`, updateError.message);
                } else {
                    console.log(`✅ Güncellendi: ${kitap.kitap_adi} (ISBN: ${isbn13 || 'Değişmedi'})`);
                }
            } else {
                console.log(`❓ Google Books'ta bulunamadı: ${kitap.kitap_adi}`);
            }

            // API limitlerine takılmamak için kısa bir mola
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (err) {
            console.error(`🛑 Beklenmedik hata (${kitap.kitap_adi}):`, err.message);
        }
    }

    console.log("🏁 İşlem başarıyla tamamlandı! Tüm kitaplar güncellendi.");
}

kütüphaneyiGüncelle();