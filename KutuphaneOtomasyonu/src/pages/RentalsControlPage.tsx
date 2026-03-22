import React, { useEffect, useState } from "react";
import { FaSearch as Search } from "react-icons/fa";


interface Rental {
  UserID: number;
  ReturnDate: string | null;
  LoanID: number;
  PunishmentID: number;
  BookTitle: string;
  UserName: string;
  LoanDate: string;
  IsApproved: boolean;
}

interface User {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  Address: string;
}

export default function RentalsControlPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");


  useEffect(() => {
    fetch("http://localhost:3001/loans/all")
      .then((res) => res.json())
      .then((data) => {
        console.log("Kiralama verisi:", data); // BURAYA BAK
        setRentals(data);
      })
      .catch((err) => console.error("Kiralama listesi alınamadı:", err));
  }, []);


  useEffect(() => {
      const results = users.filter(
        (user) =>
          user.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.Email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(results);
    }, [searchTerm, users]);
  
  

    const filteredRentals = rentals.filter((rental) =>
      (rental?.BookTitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rental?.UserName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleApprove = async (loanId: number) => {
  const storedAdmin = localStorage.getItem("admin");
  if (!storedAdmin) {
    alert("Sadece adminler onay verebilir.");
    return;
  }

  const admin = JSON.parse(storedAdmin);

  try {
    const response = await fetch(`http://localhost:3001/loans/approve/${loanId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ adminId: admin.id }), // BURAYI EKLEDİK ✅
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.message);

      // Opsiyonel: onaylandıktan sonra listeyi yenile
      setRentals((prev) =>
        prev.map((r) =>
          r.LoanID === loanId ? { ...r, IsApproved: true } : r
        )
      );
    } else {
      alert(data.message || "Onay başarısız.");
    }
  } catch (error) {
    console.error("Onaylama hatası:", error);
    alert("Sunucu hatası");
  }
};


  const handlePunish = async (userId: number, punishmentId: number) => {
  const storedAdmin = localStorage.getItem("admin");
  if (!storedAdmin) {
    alert("Sadece adminler ceza verebilir.");
    return;
  }

  const admin = JSON.parse(storedAdmin);

  const confirm = window.confirm("Seçilen ceza verilsin mi?");
  if (!confirm) return;

  try {
    const response = await fetch("http://localhost:3001/punishments/give", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        adminId: admin.id,
        punishmentId,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Ceza başarıyla verildi.");
    } else {
      alert(data.message || "Ceza verilirken hata oluştu.");
    }
  } catch (err) {
    console.error("Ceza verme hatası:", err);
    alert("Sunucu hatası oluştu.");
  }
};

  const [selectedPunishments, setSelectedPunishments] = useState<{ [loanId: number]: number }>({});



    
  

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ad, soyad veya email ara..."
                  className="w-full md:w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
      <table className="min-w-full bg-white border border-gray-300 rounded shadow-md">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">Kitap</th>
            <th className="p-4">Kullanıcı</th>
            <th className="p-4">Kiralama Tarihi</th>
            <th className="p-4">İade Tarihi</th>
            <th className="p-4">Durum</th>
            <th className="p-4">Ceza</th>

          </tr>
        </thead>
        <tbody >
          {filteredRentals.map((r, i) => (
            <tr key={i} className="border-t hover:bg-gray-50">
              <td className="p-4">{r.BookTitle}</td>
              <td className="p-4">{r.UserName}</td>
              <td className="p-4">{new Date(r.LoanDate).toLocaleDateString()}</td>
              <td className="p-4 ">
                {r.ReturnDate
                  ? new Date(r.ReturnDate).toLocaleDateString()
                  : "—"}
              </td>

              <td className="p-4">
        {r.IsApproved ? (
          <span className="text-green-600">Onaylandı</span>
          
        ) : (
          <button
            onClick={() => handleApprove(r.LoanID)}
            className="text-cyan-600 hover:underline"
          >
            Onayla
          </button>
        )}
        <br />
        <br />
        {r.ReturnDate ? (
  <span className="text-red-500">İade Edildi</span>
) : r.IsApproved ? (
  <span className="text-green-600">Aktif</span>
) : (
  <span className="text-yellow-500">Onay Bekliyor</span>
)}

      </td>
     <td>
  <div className="flex flex-col gap-2 items-center">
 <select
  className="border rounded px-2 py-1 text-sm w-40"
  value={selectedPunishments[r.LoanID] || ""}
  onChange={(e) =>
    setSelectedPunishments((prev) => ({
      ...prev,
      [r.LoanID]: parseInt(e.target.value),
    }))
  }
>
  <option value="" disabled>Ceza Türü Seç</option>
  <option value={1}>Geç İade (20 TL)</option>
  <option value={2}>Hasarlı Kitap (50 TL)</option>
</select>

<button
  className="bg-red-500 text-white rounded px-4 py-2 mt-2 hover:bg-red-600 w-28"
 onClick={() => handlePunish(r.UserID, selectedPunishments[r.LoanID])}

>
  CEZA VER
</button>

  </div>
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
