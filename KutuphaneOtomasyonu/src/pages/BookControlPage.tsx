import React, { useEffect, useState } from "react";
import { FaSearch as Search } from "react-icons/fa";

interface Book {
  BookID: number;
  BookTitle: string;
  AuthorFullName: string;
  CategoryName: string;
  PublicationYear: number;
  ISBN: string;
  ImageUrl: string;
  AvailabilityStatus: string;
  StockStatus: string;
  RoomName: string;
  ShelfName: string;
}

interface DropdownData {
  authors: { AuthorID: number; FirstName: string; LastName: string }[];
  categories: { CategoryID: number; CategoryName: string }[];
  locations: { LocationID: number; RoomName: string; ShelfName: string }[];
}

export default function BookControlPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [dropdowns, setDropdowns] = useState<DropdownData>({
    authors: [],
    categories: [],
    locations: [],
  });

  const [form, setForm] = useState({
    ISBN: "",
    BookTitle: "",
    StockStatus: "",
    PublicationDate: "",
    AvailabilityStatus: "Durum Seç",
    ImageUrl: "",
    AuthorID: 0,
    CategoryID: 0,
    LocationID: 0,
  });

  useEffect(() => {
    fetch("http://localhost:3001/books")
      .then((res) => res.json())
      .then((data) => {
        setBooks(data);
        setFilteredBooks(data);
      })
      .catch((err) => console.error("Veri çekilemedi:", err));
  }, []);

  useEffect(() => {
    const results = books.filter((book) =>
  (book.BookTitle?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
  (book.AuthorFullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
  (book.CategoryName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
);

    setFilteredBooks(results);
  }, [searchTerm, books]);

  useEffect(() => {
    fetch("http://localhost:3001/dropdowns")
      .then((res) => res.json())
      .then((data) => setDropdowns(data))
      .catch((err) => console.error("Dropdown verisi alınamadı:", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setForm((prev) => ({
  ...prev,
  [name]: name === "LocationID" || name === "AuthorID" || name === "CategoryID"
    ? parseInt(value)
    : value
}));
};

  const handleSubmit = async () => {
    const response = await fetch("http://localhost:3001/books/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Kitap eklendi.");
      setShowModal(false);
      window.location.reload(); // ya da kitapları yeniden fetch edebilirsiniz
    } else {
      alert(data.message || "Ekleme başarısız.");
    }
  };

  return (
    <div className="overflow-x-auto p-6">
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Kitap adı, yazar veya tür ara..."
            className="w-full md:w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <button
          className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600"
          onClick={() => setShowModal(true)}
        >
          Yeni Kitap Ekle
        </button>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl relative">
            <h2 className="text-xl font-bold mb-4">Yeni Kitap Ekle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="BookTitle"
                value={form.BookTitle}
                onChange={handleChange}
                placeholder="Kitap Adı"
                className="p-2 border rounded"
              />
              <input
                type="text"
                name="ISBN"
                value={form.ISBN}
                onChange={handleChange}
                placeholder="ISBN"
                className="p-2 border rounded"
              />
              <input
                type="text"
                name="StockStatus"
                value={form.StockStatus}
                onChange={handleChange}
                placeholder="Stok Durumu"
                className="p-2 border rounded"
              />
              <input
                type="date"
                name="PublicationDate"
                value={form.PublicationDate}
                onChange={handleChange}
                className="p-2 border rounded"
              />
              <input
                type="text"
                name="ImageUrl"
                value={form.ImageUrl}
                onChange={handleChange}
                placeholder="Kapak Görseli URL"
                className="p-2 border rounded"
              />
              <select name="AvailabilityStatus" value={form.AvailabilityStatus} onChange={handleChange} className="p-2 border rounded"  >
                
                <option value="Durum Seç">Durum Seç</option>
                <option value="Var">Var</option>
                <option value="Yok">Yok</option>
              </select>

              <select name="AuthorID" value={form.AuthorID} onChange={handleChange} className="p-2 border rounded">
                <option value="">Yazar Seç</option>
                {dropdowns.authors.map((a) => (
                  <option key={a.AuthorID} value={a.AuthorID}>
                    {a.FirstName} {a.LastName}
                  </option>
                ))}
              </select>

              <select name="CategoryID" value={form.CategoryID} onChange={handleChange} className="p-2 border rounded">
                <option value="">Kategori Seç</option>
                {dropdowns.categories.map((c) => (
                  <option key={c.CategoryID} value={c.CategoryID}>
                    {c.CategoryName}
                  </option>
                ))}
              </select>

              <select name="LocationID" value={form.LocationID} onChange={handleChange} className="p-2 border rounded">
                <option value="">Konum Seç</option>
                {dropdowns.locations.map((l) => (
                  <option key={l.LocationID} value={l.LocationID}>
                    {l.RoomName} / {l.ShelfName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowModal(false)}>İptal</button>
              <button className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700" onClick={handleSubmit}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Tablo */}
      <table className="min-w-full border border-gray-300 bg-white shadow-md rounded">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-4">Kitap Adı</th>
            <th className="p-4">Yazar</th>
            <th className="p-4">Tür</th>
            <th className="p-4">Salon</th>
            <th className="p-4">Raf</th>
            <th className="p-4">Stok</th>
            <th className="p-4">Durum</th>
          </tr>
        </thead>
        <tbody>
          {filteredBooks.map((book) => (
            <tr key={book.BookID} className="border-t hover:bg-gray-50">
              <td className="p-4">{book.BookTitle}</td>
              <td className="p-4">{book.AuthorFullName}</td>
              <td className="p-4">{book.CategoryName}</td>
              <td className="p-4">{book.RoomName}</td>
              <td className="p-4">{book.ShelfName}</td>
              <td className="p-4">{book.StockStatus}</td>
              <td className="p-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  book.AvailabilityStatus === "Var" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {book.AvailabilityStatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
