import React, { useEffect, useState } from "react";

interface AdminProfile {
  AdminID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  Address: string;
}
import SignInAdminForm from "../components/AdminForm";
import { useNavigate } from "react-router-dom";

export function AdminProfilePage() {
    const [activeTab, setActiveTab] = useState<"profile" | "kiralama">("profile");
      const [userData, setUserData] = useState<AdminProfile | null>(null);
      const navigate = useNavigate();

      const [adminData, setAdminData] = useState<AdminProfile | null>(null);

      useEffect(() => {
        const storedAdmin = localStorage.getItem("admin");
        if (!storedAdmin) return;
    
        const admin = JSON.parse(storedAdmin);
        fetch(`http://localhost:3001/admin/${admin.id}`)
          .then((res) => res.json())
          .then((data) => setAdminData(data))
          .catch((err) => console.error("Admin verisi alınamadı:", err));
      }, []);
    




    return(
        
        <div className="flex flex-col min-h-screen bg-gray-100 ">
<h1 className="font-serif text-3xl text-black pl-52 pt-20">Hesabım</h1>
<div className="flex border-b border-gray-200 mb-8 px-48 ">
    <button 
    className={`py-3 px-6 font-medium text-sm ${
                    activeTab === "profile"
                      ? "text-cyan-600 border-b-2 border-cyan-600 text-library-600"
                      : "text-gray-600 dark:text-gray-400 hover:text-library-600"
                  }`}
                  onClick={() => setActiveTab("profile")}
                >
                  Profil Bilgilerim
    </button>
   

</div>

{activeTab ==="profile"&&(
    <div className="bg-white shadow-md rounded-lg p-6 mx-48">
        <div className="flex flex-row items-center mb-4 gap-3">
          <img className="size-32" src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" alt="" />
        <div className="flex flex-col ml-4">
        {adminData && (
            <span className="text-lg font-bold  text-gray-700">{adminData.FirstName } {adminData.LastName } </span>  
        )}
      
        </div>
        </div>
 <h1 className="pl-6">Kişisel Bilgiler</h1>
        <div className="flex flex-row pl-5 gap-16">   
<div >
  <br />
<label className="">Eposta Adresi</label>

<div className="bg-gray-50 p-2 rounded-md mb-4 w-96">
<span className="text-sm font-medium text-gray-700">{adminData?.Email}</span>
  </div>
</div>

<div >
  <br />
   <label className="">Telefon</label>

<div className="bg-gray-50 p-2 rounded-md mb-4 w-96">
<span className="text-sm font-medium text-gray-700">{adminData?.PhoneNumber}</span>
  </div>
</div>


        </div>

    
    </div>
)}


        </div>
    );
}