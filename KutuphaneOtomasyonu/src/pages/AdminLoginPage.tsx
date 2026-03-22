import React from "react";
import SignInAdminForm from "../components/AdminForm";



export default function AdminLoginPage() {

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="w-full max-w-md p-8  rounded-2xl ">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-serif font-bold text-library-700 mb-2">
        Admin Girişi
                </h1>
        <p className="text-gray-700 font-serif">
        Kütüphane yönetim sistemi için giriş yapın
        </p>
      </header>
     
  <SignInAdminForm />
<br />
      <div className='text-center font-serif text-cyan-600'>
        <a href="./">Anasayfaya dön</a>
      </div>
    </div>
  </div>
  
  );
}
