import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";



interface Book {
    BookID: number;
    BookTitle: string;
    AuthorFullName: string;
    CategoryName: string;
    PublicationDate: Date;
    ISBN: string;
    StockStatus: number;
    ImageUrl: string; 
    CategoryDescription: string;
    RoomName: string;
    ShelfName: string;
    }
  
  interface BookListProps {
    books: Book[];
    limit?: number;
  }

  
  
  export default function BookList({ books ,limit}: BookListProps) {
    const [selectedBookId, setSelectedBookId] = React.useState<number | null>(null);
    const [active, setActive] = React.useState<number | null>(null);    
    const [user, setUser] = useState<{ id: number; name: string } | null>(null);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    // Eğer limit varsa, sayfalama yapma, sadece ilk N kitabı göster
    const booksPerPage = limit ? limit : 7;
    const totalPages = Math.ceil(books.length / booksPerPage);
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);

    const [isOpen, setIsOpen] = useState(false);
   

  


    const handleRent = async (bookId: number) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
    
      if (!user?.id) {
        navigate("/login");
        return;
      }
    
      const response = await fetch("http://localhost:3001/api/loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, bookId }),
      });
    
      const data = await response.json();
      if (response.ok) {
        alert(`${data.message}`);
      } else {
        alert("Kiralama başarısız");
      }
    };

    
    
      useEffect(() => {
        const updateUser = () => {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            setUser(null);
          }
        };
      
        // Sayfa ilk yüklendiğinde çalışır
        updateUser();
      
        // Giriş/çıkış sonrası da çalışır
        window.addEventListener("storage", updateUser);
      
        return () => window.removeEventListener("storage", updateUser);
    
      }, []);
    
      const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
      };
    
 

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 ">
        {currentBooks.map((book) => (
<div key={book.BookID} className="flex flex-col border p-4 rounded shadow-md h-[600px]">
<div className="font-serif p-2">
            <img src={book.ImageUrl} alt={book.BookTitle} className="w-full  object-cover rounded bg-white h-[420px] hover:scale-105" />
    <div className="flex flex-row justify-between items-center ">
    <h2 className="text-xl font-bold  ">{book.BookTitle}</h2>
<div className=" border text-cyan-700 bg-cyan-100  rounded-full w-20 h-5 text-center  ">
 <p className="text-xs">{book.CategoryName}</p>
</div>

</div>
          
            <p className="text-gray-700 "> {book.AuthorFullName}</p>
           
            <p className="text-sm text-gray-500">
             Yayın Yılı: {new Date(book.PublicationDate).getFullYear()} | Stok: {book.StockStatus}
            </p>
</div>
           <div className="flex flex-row justify-between items-center p-2 ">
            <div>
<button onClick={() => setActive(book.BookID)}>
  <p className="text-gray-400 hover:text-gray-500">Detaylar</p>
</button>
<div>
{active=== book.BookID && (
         <div className="fixed inset-0 bg-gray-200  flex flex-row items-center gap-52 p-5">
       
          
          {/* Kitap Görseli */}
          <div className="flex-shrink-0">
            <img
              src={book.ImageUrl}
              alt={book.BookTitle}
              className="w-[300px] h-[460px] object-cover rounded"
            />
          </div>

          {/* Kitap Bilgileri */}
          <div className="flex-grow">
            <h2 className="text-2xl font-bold mb-2">{book.BookTitle}</h2>
            <p className="text-gray-700 mb-2"><strong>Yazar:</strong> {book.AuthorFullName}</p>
            <p className="text-gray-600 mb-2"><strong>Tür:</strong> {book.CategoryName}, {book.CategoryDescription}</p>
            <p className="text-gray-700 mb-2"><strong>Oda Numarası:</strong> {book.RoomName}</p>   
            <p className="text-gray-700 mb-2"><strong>Raf Numarası:</strong> {book.ShelfName}</p>  
            <p className="text-sm text-gray-500">
               Yayın Yılı: {new Date(book.PublicationDate).getFullYear()} | Stok: {book.StockStatus}
            </p>

            <button
              onClick={() => setActive(null)}
              className="mt-6 bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-800 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
</div>

            </div>

            <div>
{user ? (<div className="flex justify-end">
            <button className="bg-cyan-700 text-white font-semibold py-1 px-4 rounded hover:bg-cyan-400 transition-colors " 
             onClick={() => { 
               setSelectedBookId(book.BookID); 
               handleRent(book.BookID); 
             }}>
            Kirala
          </button>

            </div>): <div className="flex justify-end">
    <button
      className="bg-cyan-600 text-white font-semibold py-1 px-4 rounded hover:bg-cyan-800 transition-colors"
      onClick={() => navigate("/login")}
    >
      Giriş Yap ve Kirala
    </button>
  </div>
  
  }
            </div>
            
           
           </div>
           
           

          
</div>
           
          
        ))}
      
        {/* Sayfalama Kontrolleri */}
        {totalPages > 1 && (
          <div className="col-span-1 sm:col-span-2 md:col-span-3 flex justify-center mt-8 gap-4">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Geri
            </button>
            <span className="text-gray-600 font-medium flex items-center">
              Sayfa {currentPage} / {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              İleri
            </button>
          </div>
        )}
        <br />
      </div>
      
      
    );
  }
