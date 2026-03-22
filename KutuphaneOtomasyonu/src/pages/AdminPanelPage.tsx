import React, { useEffect, useState } from "react";

export default function AdminPanelPage() {

    const [stats, setStats] = useState<{ totalBooks: number; totalUsers: number ; LoanTransaction:number }>({
        totalBooks: 0,
        totalUsers: 0,
        LoanTransaction:0,
      });
    
      useEffect(() => {
        fetch("http://localhost:3001/stats")
          .then((res) => res.json())
          .then((data) => setStats(data))
          .catch((err) => console.error("İstatistik verisi alınamadı:", err));
      }, []);
    
    return(
      <div className="flex flex-col min-h-screen bg-gray-100">
        <h1 className="font-semibold font-serif text-3xl p-5">Admin Paneli</h1>
 <div className="flex flex-col  justify-center pt-32 ">

<div className="grid grid-cols-3 gap-4 p-5  border border-gray-200 mb-8">
<div className="grid-span-1 bg-white shadow-md rounded-lg p-6 mx-5 ">
<h1>Toplam Kitap</h1>
<br />
<p className="text-2xl">{stats.totalBooks}</p>
<br />
<a href="/bookcontrol" className="text-cyan-500 ">Tüm Kitaplar</a>

</div>
<div className="grid-span-2 bg-white shadow-md rounded-lg p-6 mx-5 ">
<h1>Toplam Kullanıcı</h1>
<br />

<p className="text-2xl">{stats.totalUsers}</p>
<br />
<a href="/userscontrol" className="text-cyan-500 ">Tüm Kullanıcılar</a>


</div>
<div className="grid-span-3 bg-white shadow-md rounded-lg p-6 mx-5 ">
<h1>Aktif Kiralamalar</h1>
<br />

<p className="text-2xl">{stats.LoanTransaction}</p>
<br />
<a href="/rentalscontrol" className="text-cyan-500">Kiralamaları Yönet</a>


</div>
</div>


        </div>
      </div>
       
    )
}