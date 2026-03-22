import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  
  const [active, setActive] = useState("");
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [admin, setAdmin] = useState<{ id: number; name: string;email:string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const updateUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };

    updateUser();
  
   
    window.addEventListener("storage", updateUser);
  
    return () => window.removeEventListener("storage", updateUser);

  }, []);

  useEffect(() => {
    const updateAdmin = () => {
      try {
        const storedAdmin = localStorage.getItem("admin");
        if (storedAdmin && storedAdmin !== "undefined") {
          setAdmin(JSON.parse(storedAdmin));
        } else {
          setAdmin(null);
        }
      } catch (error) {
        console.error("Admin verisi çözümleme hatası:", error);
        setAdmin(null);
      }
    };
  
    updateAdmin();
  
    window.addEventListener("storage", updateAdmin);
    return () => window.removeEventListener("storage", updateAdmin);
  }, []);
  

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login"); 
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem("admin");
    setAdmin(null);
    navigate("/admin"); 
  };

  

  
  const [punishments, setPunishments] = useState<{ Amount: number; Description: string; AdminName: string }[]>([]);

  
  return (
    <nav className="bg-white text-cyan-700 px-3 py-3 flex justify-between items-center shadow-md">
      <a href="./" className="text-3xl font-bold">UniLib</a>
      <div className="space-x-4 text-black ">
        <Link to="/"
        onClick={()=> setActive("anasayfa")}
        className={` ${
          active === "anasayfa" ? "text-cyan-600 font-semibold " : ""
        }`}>Ana Sayfa</Link>
        <Link to="/books"
        onClick={()=> setActive("kitaplar")}
        className={` ${
          active === "kitaplar" ? "text-cyan-600 font-semibold " : ""
        }`}>Kitaplar</Link> 
        <Link to="/about"
        onClick={()=> setActive("hakkımızda")}
        className={` ${
          active === "hakkımızda" ? "text-cyan-600 font-semibold " : ""
        }`}>Hakkımızda</Link>

        {admin ? (
    <>
      <Link to="/adminpanel" 
       onClick={()=> setActive("admin")}
      className={` ${
          active === "admin" ? "text-cyan-600 font-semibold " : "text-yellow-600"
        }`}>Admin Panel</Link>
    </>
  ) : (null)
  }
      </div>

      <div className="space-x-5 flex items-center">
  {admin ? (
    <>
      <span className="text-sm font-medium text-gray-700">{admin.name}</span>
      <Link to="/adminprofil" className="hover:text-cyan-600">Profil</Link>
      <button onClick={handleLogoutAdmin} className="text-red-600 hover:underline">Çıkış Yap</button>
    </>
  ) : user ? (
    <>
      <span className="text-sm font-medium text-gray-700">{user.name}</span>
      <Link to="/profile" className="hover:text-cyan-600">Profil</Link>
      <button onClick={handleLogout} className="text-red-600 hover:underline">Çıkış Yap</button>

    </>
  ) : (
    <>
      <Link to="/login" className="hover:text-cyan-600">Giriş</Link>
      <Link to="/register" className="hover:text-cyan-600">Üye Ol</Link>
    </>
  )}
</div>
    </nav>
  );
};

export default Navbar; 

