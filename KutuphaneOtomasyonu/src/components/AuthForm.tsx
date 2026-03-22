import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface RegisterFormProps {
  form: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    address: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SignInForm() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  

  const navigate = useNavigate(); // Initialize useNavigate

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
  
      const data = await response.json();
      console.log("Backend response:", data); // Giriş cevabı
  
      if (response.ok && data.user) {
        // Kullanıcıyı sakla
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("storage"));
        // Bildirim ver ve yönlendir
        alert("Giriş başarılı! Hoş geldin " + data.user.name);
        navigate("/");
      } else {
        alert("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      }
    } catch (error: any) {
      console.error("Giriş hatası:", error);
      alert(error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md ">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1" >Email Adresi</label>
          <input
          name="email"
            type="text"
            className="w-full border border-gray-300 p-2 rounded-lg"
            value={form.email}
            onChange={handleChange}
            required
            
          />
        </div>
        <div>
          <label className="block mb-1">Şifre</label>
          <input
          name="password"
            type="text"
            className="w-full border border-gray-300 p-2 rounded-lg"
             value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        
          <div className='flex flex-row justify-between items-center'>
            <label className="block mb-1">
              <input type="checkbox" className="mr-2" />
              Beni hatırla
            </label>
            <a href="#" className="text-cyan-700 text-sm">
              Şifremi unuttum
            </a>
          </div>
        
        <button
          type="submit"
          className="w-full bg-cyan-700 text-white p-2 rounded-lg hover:bg-cyan-800"
        >
          Giriş Yap
        </button>
        <div className="text-center mt-4">
          <a href="./admin" className=' text-cyan-500'>Admin girişine geç</a>
        </div>
        <div className='text-center '>
          <p  >
            Hesabınız yok mu?{' '}
            <a href="./" className='text-cyan-600'>Üye ol</a>
          </p>
        </div>
      </form>
    </div>
  );
}

export function RegisterForm({ form, onChange, onSubmit }: RegisterFormProps) {
  
  return(
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md ">
      <form onSubmit={onSubmit}  className="space-y-4">
       <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

  <div >
  <label className="block mb-1">Adınız</label>
          <input
          name="firstName"
            type="text"
            className="w-full border border-gray-300 p-2 rounded-lg"
            value={form.firstName} onChange={onChange}
          />
  </div>
  <div >
  <label className="block mb-1">Soyadınız</label>
          <input
          name='lastName'
            type="text"
            className="w-full border border-gray-300 p-2 rounded-lg"
            value={form.lastName} onChange={onChange}
          />
  </div>  
  </div> 

<div className='w-full'>
<label className="block mb-1">Email</label>
          <input
          name='email'
            type="text"
            className="w-full border border-gray-300 p-2 rounded-lg "
            value={form.email} onChange={onChange}
          />
</div>
<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

<div >
<label className="block mb-1">Şifre</label>
        <input
        name='password'
          type="text"
          className="w-full border border-gray-300 p-2 rounded-lg"
          value={form.password} onChange={onChange}
        />
</div>
<div >
<label className="block mb-1">Şifre Tekrar</label>
        <input
        name='confirmPassword'
          type="text"
          className="w-full border border-gray-300 p-2 rounded-lg"
          value={form.confirmPassword} onChange={onChange}
        />
</div>  
</div> 
<div>
<label className="block mb-1">Telefon</label>
          <input
          name='phone'
            type="tel"
            className="w-full border border-gray-300 p-2 rounded-lg"
            value={form.phone} onChange={onChange}
          />
</div>
<div>
<label className="block mb-1">Adres</label>
          <input
          name='address'
            type="text"
            className="w-full border border-gray-300 p-2 rounded-lg"
            value={form.address} onChange={onChange}
          />
</div>

<div>
  <h1 className='text-gray-700 ' >* ile işaretli alanların doldurulması zorunludur.</h1>
</div>
       
        
         
        <button
          type="submit"
          className="w-full bg-cyan-700 text-white p-2 rounded-lg hover:bg-cyan-800"
        >
          Üye Ol
        </button>
        <div className='text-center '>
          <p  >
            Zaten bir hesabınız var mı?{' '}
            <a href="./login" className='text-cyan-600'>Giriş yap</a>
          </p>
        </div>

      </form>
    </div>
  )
}

