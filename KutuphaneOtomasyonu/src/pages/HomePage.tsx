// src/pages/Home.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import BookList from '../components/BookList';


interface Book {
  BookID: number;
  BookTitle: string;
  AuthorFullName: string;
  CategoryName: string;
  PublicationDate: number;
  ISBN: string;
  StockStatus: number;
  ImageUrl: string;
  RoomName: string;
  ShelfName: string;
  CategoryDescription: string;
}

 interface BookListProps {
    books: Book[];
    limit?: number;
  }


export default function Home({limit}: BookListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const genres = Array.from(new Set(books.map((book) => book.CategoryName)));
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const shownBooks = limit ? books.slice(0, limit) : books;
  const [active, setActive] = React.useState<number | null>(null);
   

  
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
  fetch("http://localhost:3001/books")
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text(); // JSON değilse plain text okur
        throw new Error(`Sunucu hatası: ${text}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log("Fetched books:", data);
      setBooks(data);
      setFilteredBooks(data);
    })
    .catch((err) => console.error("Veri çekilemedi:", err.message));
}, []);


  
  type BookFilters = {
    bookTitle?: string;
    authorFullName?: string;
    categoryName?: string;
  };

  function handleSearch(filters: BookFilters): void {
    console.log('Filters applied:', filters);
  
    const results = books.filter((book) => {
      const matchTitle = filters.bookTitle ? book.BookTitle.toLowerCase().includes(filters.bookTitle.toLowerCase()) : true;
      const matchAuthor = filters.authorFullName ? book.AuthorFullName.toLowerCase().includes(filters.authorFullName.toLowerCase()) : true;
      const matchGenre = filters.categoryName ? book.CategoryName === filters.categoryName : true;
      return matchTitle && matchAuthor && matchGenre;
    });
  
    setFilteredBooks(results);
  }

  return (
   <div className="flex flex-col min-h-screen">
    <main className="flex-grow">
    <section>
        <div className='bg-gradient-to-br from-cyan-500 to-cyan-700 mx-auto px-10 py-40 md:py-10 flex flex-col items-center justify-center text-center '>
          <br />
          
            {user==null ?(
  <h1 className='text-4xl font-bold font-serif text-white mb-4'>UniLib  Kütüphane Otomasyon Sistemine Hoşgeldiniz</h1>
            ):(
              <div>
 <h1 className='text-4xl  font-serif text-white mb-4'>Hoşgeldin {user?.name}</h1>
  <h1 className='text-xl font-serif text-white mb-4'>Dilerseniz kitap arayın, kategorilere göz atın veya en popüler kitapları inceleyin.</h1>
              </div>
             
              
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link 
                to="/books" 
                className="px-6 py-3 bg-white text-library-700 rounded-lg font-medium font-serif hover:bg-gray-100 transition-colors shadow-md"
              >
                Kitapları Keşfet
              </Link>
              {user===null ? (
 <Link 
                to="/register" 
                className="px-6 py-3 bg-cyan-900 text-white rounded-lg font-medium font-serif hover:bg-cyan-950 transition-colors shadow-md"
              >
                Üye Ol
              </Link>
              ):null
              }   
        </div>
        </div>
    </section>

  <section className="py-8 bg-gray-50 overflow-hidden">
  <div className="w-full bg-white py-6">
    <div className="flex animate-scroll whitespace-nowrap gap-4 w-[200%]">
      {[...shownBooks, ...shownBooks].map((book, index) => (
        <div
          key={index}
          className="flex flex-col items-center border p-4 rounded shadow-md w-[220px] h-[400px] mx-2 flex-shrink-0 bg-white"
        >
          <img
            src={book.ImageUrl}
            alt={book.BookTitle}
            className="w-[200px] h-[320px] object-cover rounded hover:scale-105 transition-transform"
            onClick={() => setActive(book.BookID)}
          />
          <h2 className="mt-2 text-sm font-semibold text-center">{book.BookTitle}</h2>
        </div>
      ))}
    </div>
  </div>
</section>

 <div>
  {active !== null && (() => {
    const book = books.find(b => b.BookID === active);
    return book ? (
      <div className="fixed inset-0 bg-gray-200  flex flex-row items-center gap-52 p-5">
       
          
          {/* Kitap Görseli */}
          <div className="flex-shrink-0">
            <img
              src={book.ImageUrl}
              alt={book.BookTitle}
              className="w-[300px] h-[450px] object-cover rounded"
            />
          </div>

          {/* Kitap Bilgileri */}
          <div className="flex-grow">
            <h2 className="text-2xl font-bold mb-2">{book.BookTitle}</h2>
            <p className="text-gray-700 mb-2"><strong>Yazar:</strong> {book.AuthorFullName}</p>
            <p className="text-gray-600 mb-2"><strong>Tür:</strong> {book.CategoryName}, {book.CategoryDescription}</p>
             <p className="text-gray-700 mb-2"><strong>Oda Numarası:</strong> {book.RoomName}</p>   
            <p className="text-gray-700 mb-2"><strong>Raf Numarası:</strong> {book.ShelfName}</p>  
            <p className="text-sm text-gray-500">Yayın Yılı: {new Date(book.PublicationDate).getFullYear()} | Stok: {book.StockStatus}</p>

            <button
              onClick={() => setActive(null)}
              className="mt-6 bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-800 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      
    ) : null;
  })()}
</div>


<section className='py-20 px-4 bg-gray-50  flex flex-col items-center'>
  <div>
    <h1 className='text-3xl font-serif text-black'>Neden UniLib?</h1>
    <br />
  </div>

  <div className='flex flex-col md:flex-row gap-20 mt-4  '>
    <div className='py-10 px-2 border  rounded-2xl shadow-lg bg-white max-w-md mx-auto text-center'>
      <link rel="stylesheet" href="" />
<h1 className=' text-2xl font-semibold font-serif mb-4'>Geniş Koleksiyon
</h1>
<h1 className='font-serif'>
Binlerce kitap arasından seçim yaparak, her zevke ve ilgi alanına uygun eserlere ulaşabilirsiniz.
</h1>
    </div>
    <div className='py-10 px-2 border  rounded-2xl shadow-lg bg-white max-w-md mx-auto text-center'>
<h1 className='text-2xl font-semibold font-serif mb-4'>Kolay Kullanım
</h1>
<h1 className='font-serif'>
Dilediğiniz yerden kitaplarınızı yönetin, kiralayın ve iade edin. Tamamen çevrimiçi sistem!
</h1>
    </div>
    <div className='py-10 px-2 border rounded-2xl shadow-lg bg-white max-w-md mx-auto text-center'>
<h1 className='text-2xl font-semibold font-serif mb-4'>Kolay Takip
</h1>
<h1 className='font-serif'>
Kiraladığınız kitapları ve cezaları kolayca görüntüleyin.
</h1>
    </div>
   
  </div>
</section>

<section >

<div className='bg-gradient-to-br from-cyan-500 to-cyan-700  text-white py-20 px-4 flex flex-col items-center justify-center gap-8'>
  {user==null ? (
    <div className='flex flex-col items-center justify-center gap-8'>
<h1 className='text-3xl font-serif'>Hemen Başlayın</h1>
<h1 className='text-lg font-serif text-center '>Unilib Universe'de kitapların büyülü dünyasına adım atın. Üye olun ve hemen <br /> okumanın keyfini çıkarın.</h1>
<Link to="/register">
<button  className='bg-white text-cyan-800 px-6 py-3 rounded-lg font-semibold font-serif hover:bg-gray-100 transition-colors'>
  Ücretsiz Üye Ol
</button>
</Link>

    </div>
  ):null}

  </div>
  
</section>



    </main>
   
   </div>
  );
}
  function setFilteredBooks(results: any[]) {
    throw new Error('Function not implemented.');
  }

