// Register.tsx
import React, { useState } from 'react';
import AuthForm, { RegisterForm } from '../components/AuthForm';


export default function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Şifreler eşleşmiyor!");
      return;
    }

    const response = await fetch("http://localhost:3001/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    alert(data.message);
  };




  return(
    <div>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="w-full  p-8  rounded-2xl ">
            <header className="mb-6 text-center">
              <h1 className="text-4xl font-serif font-bold text-library-700 mb-2">
              Üye Ol              </h1>
              <p className="text-gray-700">
              UniLib'e üye olarak binlerce kitabı keşfedin              </p>
            </header>
            <RegisterForm
  form={form}
  onChange={handleChange}
  onSubmit={handleSubmit}
/>
      <br />
            <div className='text-center text-cyan-600'>
              <a href="./">Anasayfaya dön</a>
            </div>
          </div>
        </div>
        
      
    </div>
  )
}
