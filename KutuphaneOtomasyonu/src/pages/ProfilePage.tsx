import React, { Key, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  Address: string;
   
  
}

interface Punishment {
  UserId: number;
  PunishmentID: number;
  AdminId: number;
  LoanId:number;
  DateGiven: string;
}

export default function Profile(){

  const [activeTab, setActiveTab] = useState<"profile" | "kiralama" | "bildirimler">("profile");
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const [punishments, setPunishments] = useState<Punishment[]>([]);

  
  interface Book {
    IsApproved: any;
    LoanID: number; 
    BookID: number;
    BookTitle: string;
    AuthorFullName: string;
    LoanDate: string;
    ReturnDate: string | null;
    
  }

  
  
    const [rentedBooks, setRentedBooks] = useState<Book[]>([]);

useEffect(() => {
  const stored = localStorage.getItem("user");
  if (!stored) {
    console.error("Kullanıcı verisi bulunamadı. Giriş yapmanız gerekiyor.");
    return navigate("/login");
  }

  const user = JSON.parse(stored);

  fetch(`http://localhost:3001/loans/user/${user.id}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error("Kiralama API isteği başarısız oldu");
      }
      return res.json();
    })
    .then((data) => {
      console.log("📦 Gelen kiralama verisi:", data); 
      setRentedBooks(data);
    })
    .catch((err) => {
      console.error("Kiralama verisi alınamadı:", err);
      setRentedBooks([]); 
    });
}, [navigate]); // Add `rentedBooks` as a dependency

useEffect(() => {
  const stored = localStorage.getItem("user");
  if (!stored) {
    console.error("Kullanıcı verisi bulunamadı. Giriş yapmanız gerekiyor.");
    return navigate("/login");
  }

  let user;
  try {
    user = JSON.parse(stored);
  } catch (error) {
    console.error("Kullanıcı verisi çözümleme hatası:", error);
    return navigate("/login");
  }

  if (user && user.id) {
    fetch(`http://localhost:3001/profile/${user.id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Profil API isteği başarısız oldu");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Profil verisi alındı:", data); // Debug log
        setUserData(data);
      })
      .catch((err) => {
        console.error("Profil verisi alınamadı:", err);
        setUserData(null); // Ensure state is set even if the request fails
      });
  } else {
    console.error("Geçersiz kullanıcı verisi:", user);
    navigate("/login");
  }
}, [navigate]);



useEffect(() => {
  const stored = localStorage.getItem("user");
  if (!stored) return;
  const user = JSON.parse(stored);

  fetch(`http://localhost:3001/punishments/${user.id}`)
    .then((res) => res.json())
    .then((data) => {
      console.log("📥 Ceza verisi:", data);
      // Eğer data.recordset varsa onu kullan
      const formatted = Array.isArray(data) ? data : data.recordset;
      setPunishments(formatted || []);
    })
    .catch((err) => console.error("Ceza verisi alınamadı:", err));
}, []);




 const handleReturn = async (loanId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/loans/return/${loanId}`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        alert("Kitap iade edildi.");
        // frontend'te iade durumu güncelle
        setRentedBooks((prev) =>
          prev.map((loan) =>
            loan.LoanID === loanId
              ? { ...loan, ReturnDate: new Date().toISOString() }
              : loan
          )
        );
      } else {
        alert(data.message || "İade işlemi başarısız.");
      }
    } catch (err) {
      console.error("İade hatası:", err);
      alert("Sunucu hatası");
    }
  };




  

    return(
        <div className="flex flex-col min-h-screen bg-gray-100">
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
    <button 
    className={`py-3 px-6 font-medium text-sm ${
                    activeTab === "kiralama"
                      ? "text-cyan-600 border-b-2 border-cyan-600 text-library-600"
                      : "text-gray-600 dark:text-gray-400 hover:text-library-600"
                  }`}
                  onClick={() => setActiveTab("kiralama")}
                >
                    Kiraladığım Kitaplar
    </button>
    <button 
    className={`py-3 px-6 font-medium text-sm ${
                    activeTab === "bildirimler"
                      ? "text-cyan-600 border-b-2 border-cyan-600 text-library-600"
                      : "text-gray-600 dark:text-gray-400 hover:text-library-600"
                  }`}
                  onClick={() => setActiveTab("bildirimler")}
                >
                  Bildirimler
    </button>

</div>

{activeTab ==="profile"&&(
    <div className="bg-white shadow-md rounded-lg p-6 mx-48">
        <div className="flex flex-row items-center mb-4 gap-3">
          <img className="size-32" src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" alt="" />
        <div className="flex flex-col ml-4">
        {userData && (
            <span className="text-lg font-bold  text-gray-700">{userData.FirstName } {userData.LastName } </span>  
        )}

        </div>
        </div>

        <div className="grid grid-cols-2 pl-5">
<div className="grid-span-1">
  <h1>Kişisel Bilgiler</h1>
  <br />
<label className="">Eposta Adresi</label>

<div className="bg-gray-50 p-2 rounded-md mb-4 w-96">
<span className="text-sm font-medium text-gray-700">{userData?.Email}</span>
  </div>

  <label className="">Telefon</label>

<div className="bg-gray-50 p-2 rounded-md mb-4 w-96">
<span className="text-sm font-medium text-gray-700">{userData?.PhoneNumber}</span>
  </div>

</div>
<div className="grid-span-2">
  <h1>Adres Bilgileri</h1>
  <br />
  <label className="">Adres</label>

<div className="bg-gray-50 p-2 rounded-md mb-4 w-96">
<span className="text-sm font-medium text-gray-700">{userData?.Address}</span>
  </div>
</div>


        </div>

    
    </div>
)}

{activeTab === "kiralama" && (
  <div className="bg-white shadow-md rounded-lg p-6 mx-48">
    <h2 className="text-xl font-semibold mb-4">Kiraladığınız Kitaplar</h2>
    {rentedBooks.length === 0 ? (
      <p>Henüz kiraladığınız bir kitap yok.</p>
    ) : (
      <ul className="space-y-3">
  {rentedBooks.map((book) => (
    <li key={book.LoanID || `${book.BookID}-${book.LoanDate}`}>
<div className="flex flex-row w-full justify-between items-center border-b pb-4">
<div className="flex flex-col">
        <span className="font-bold text-gray-800">{book.BookTitle}</span>
        <div className="flex flex-row gap-2 mt-1">
<span className="text-gray-500 text-sm">
          Kiralama Tarihi: {new Date(book.LoanDate).toLocaleDateString()}
        </span>
        <span className="text-gray-500 text-sm">
          İade Tarihi: {book.ReturnDate ? new Date(book.ReturnDate).toLocaleDateString() : "Henüz iade edilmedi"}
        </span>
        </div>
        <br />
        
        {book.IsApproved ? (
        <span className="text-green-600 text-sm">✔ Kitap başarıyla kiralandı</span>
      ) : (
        <span className="text-yellow-600 text-sm">⏳ Onay bekleniyor</span>
      )}
      </div>
      <div className="flex flex-end">
{book.ReturnDate ? (
  <span className="text-red-500 text-sm">İade Edildi</span>
) : book.IsApproved ? (
  <button
    onClick={() => handleReturn(book.LoanID)}
    className="text-red-600 hover:underline"
  >
    İade Et
  </button>
) : (
  <span className="text-gray-400 text-sm">İade edilemez</span>
)}
      

      </div>
</div>
     
    </li>
  ))}
</ul>
      
    )}
  </div>
)}

{activeTab === "bildirimler" && (
<div className="bg-white shadow-md rounded-lg p-6 mx-48">
<div className="mt-8">
<h2 className="text-xl font-semibold mb-4">Bildirimler</h2>
{punishments.length === 0 ? (
  <p>Henüz ceza bildirimleri yok.</p>
) : (
  <div className="space-y-4">
    {punishments.map((p, index) => (
      <div
        key={index}
        className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 shadow rounded"
      >
        <p className="font-semibold">Ceza Verildi</p>
        <p className="text-sm">
          {p.PunishmentID === 1 ? (
            <span className="text-red-500">Kiraladığınız kitap belirtilen iade etme gününü aştığı için 20 tl ceza verilmiştir</span>
          ) : p.PunishmentID === 2 ? (
            <span className="text-red-500">Kiraladığınız kitap hasarlı olduğu için 50 tl ceza verilmiştir</span>
          ) : (
            <span className="text-red-500">Bilinmeyen ceza türü</span>
          )}
        </p>
        <p className="text-sm">
  Ceza Tarihi: {p.DateGiven ? new Date(p.DateGiven).toLocaleDateString() : "Bilinmiyor"}
</p>
      </div>
    ))}
  </div>
)}
</div>
</div>


)}
<br />
        </div>
    )
}