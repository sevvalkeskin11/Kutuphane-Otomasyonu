// Login.tsx
import React from 'react';
import SignInForm from '../components/AuthForm';


export default function Login() {

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="w-full max-w-md p-8  rounded-2xl ">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-serif font-bold text-library-700 mb-2">
          Kullanıcı Girişi
        </h1>
        <p className="text-gray-700">
          Hesabınıza giriş yaparak kitap kiralamanın keyfini çıkarın
        </p>
      </header>
  <SignInForm  />
<br />
      <div className='text-center text-cyan-600'>
        <a href="./">Anasayfaya dön</a>
      </div>
    </div>
  </div>
  
  );
}
