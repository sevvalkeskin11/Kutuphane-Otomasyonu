import React, { useEffect, useState } from "react";
import { FaSearch as Search } from "react-icons/fa";

interface User {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  Address: string;
}

export default function UsersControlPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetch("http://localhost:3001/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setFilteredUsers(data);
      })
      .catch((err) => console.error("Kullanıcılar alınamadı:", err));
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Şifreler eşleşmiyor!");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      alert(data.message);

      if (response.ok) {
        setShowForm(false);
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          address: "",
        });

        // Listeyi güncelle
        const res = await fetch("http://localhost:3001/users");
        const updated = await res.json();
        setUsers(updated);
        setFilteredUsers(updated);
      }
    } catch (err) {
      console.error("Kayıt hatası:", err);
    }
  };
  const handleDeleteUser = async (userId: number) => {
  const confirm = window.confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?");
  if (!confirm) return;

  try {
    const response = await fetch(`http://localhost:3001/users/${userId}`, {
      method: "DELETE",
    });

    const data = await response.json();
    alert(data.message);

    if (response.ok) {
      // Silinen kullanıcıyı listeden çıkar
      const updatedUsers = users.filter((user) => user.UserID !== userId);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
    }
  } catch (error) {
    console.error("Silme hatası:", error);
    alert("Silme sırasında bir hata oluştu.");
  }
};


  return (
    <div className="overflow-x-auto p-6">
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
        <div>
          <button
            className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600"
            onClick={() => setShowForm(!showForm)}
          >
            Yeni Kullanıcı Ekle
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl relative">
             <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="firstName"
              placeholder="Ad"
              value={form.firstName}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Soyad"
              value={form.lastName}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Telefon"
              value={form.phone}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              name="address"
              placeholder="Adres"
              value={form.address}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Şifre"
              value={form.password}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Şifre Tekrar"
              value={form.confirmPassword}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />

            <div className="flex justify-end gap-4 mt-4">
            <button 
            type="button"
            className="mt-2 md:col-span-2 bg-gray-300 text-white px-4 py-2 rounded hover:bg-gray-400" 
            onClick={() => setShowForm(false)}>İptal</button>
            <button
              type="submit"
              className="mt-2 md:col-span-2 bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600"
            >
              Kaydet
            </button>
            </div>
           
          </form>
          </div>
        </div>
      )}

      <table className="min-w-full border border-gray-300 bg-white shadow-md rounded">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-4">Ad Soyad</th>
            <th className="p-4">Email</th>
            <th className="p-4">Telefon</th>
            <th className="p-4">Adres</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.UserID} className="border-t hover:bg-gray-50">
              <td className="p-4">
                {user.FirstName} {user.LastName}
              </td>
              <td className="p-4">{user.Email}</td>
              <td className="p-4">{user.PhoneNumber}</td>
              <td className="p-4">{user.Address}</td>
               <td className="p-4">
    <button
      onClick={() => handleDeleteUser(user.UserID)}
      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
    >
      Sil
    </button>
  </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}