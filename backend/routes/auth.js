const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase'); 

const JWT_SECRET = "kutuphane_cok_gizli_anahtar_123";

// 1. KAYIT OL  API'si
router.post('/register', async (req, res) => {
    const { full_name, email, password, phone_number, address } = req.body;
    try {
        const { data: existingUser } = await supabase.from('users').select('*').eq('email', email).single();
        if (existingUser) return res.status(400).json({ hata: "Bu e-posta adresi zaten kullanılıyor!" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data: newUser, error } = await supabase.from('users').insert([
            { full_name, email, password: hashedPassword, phone_number, address }
        ]).select();

        if (error) throw error;
        res.status(201).json({ mesaj: "Kayıt başarıyla oluşturuldu!", kullanici: newUser[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ hata: "Sunucu hatası." });
    }
});

// 2. GİRİŞ YAP  API'si
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
        if (!user || error) return res.status(401).json({ hata: "E-posta veya şifre hatalı!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ hata: "E-posta veya şifre hatalı!" });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        delete user.password; 

        res.json({ mesaj: "Giriş başarılı!", token: token, kullanici: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ hata: "Sunucu hatası." });
    }
});

module.exports = router;