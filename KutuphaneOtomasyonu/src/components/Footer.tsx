import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => {
    return (
<footer className="bg-white text-black py-4">
    <div className="container px-4 py-8 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
                
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-serif text-2xl font-bold text-library-700">UniLib</span>
              <span className="text-xs bg-library-100 text-library-800 px-2 py-1 rounded-full">Universe</span>
            </Link>

            <h1>UniLib kitapseverlerin buluşma noktası. Binlerce kitap arasından seçim yapın ve okumanın keyfini çıkarın.</h1>

            </div>
            <div>
                <h2 className="text-lg font-semibold mb-4">Hızlı Bağlantılar</h2>
                <ul className="space-y-2">
                    <li><Link to="/" className="text-gray-600 hover:text-library-700">Anasayfa</Link></li>
                    <li><Link to="/books" className="text-gray-600 hover:text-library-700">Kitaplar</Link></li>
                    <li><Link to="/about" className="text-gray-600 hover:text-library-700">Hakkında</Link></li>
                    <li><Link to="/contact" className="text-gray-600 hover:text-library-700">İletişim</Link></li>
                </ul>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-4">İletişim</h2>
                <ul className="space-y-2">
              <li className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Adres:</span> Kütüphane Caddesi No:42, İstanbul
              </li>
              <li className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Telefon:</span> (0212) 456 78 90
              </li>
              <li className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">E-posta:</span> iletisim@unilib.com
              </li>
              <li className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Çalışma Saatleri:</span> 09:00 - 18:00, Hafta içi
              </li>
            </ul>
            </div>
        </div>

        <div className="h-0.5 bg-gray-300 w-full my-8"></div>

<div className="flex flex-row items-center justify-between ">
<div>
         <h1>© 2025 UniLib Universe. Tüm Hakları Saklıdır.</h1>   
        </div>
       
        <div className="flex gap-4"> 
        <Link to="/contact" className="text-gray-600 hover:text-library-700">Kullanım Şartları</Link>
        <Link to="/contact" className="text-gray-600 hover:text-library-700">Gizlilik Politikası</Link>
        </div>
</div>
        


    </div>
</footer>

    );
       
};