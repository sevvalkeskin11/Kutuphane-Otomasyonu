import React, { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import BookList from "../components/BookList";


interface Book {
    BookID: number;
    BookTitle: string;
    AuthorFullName: string;
    CategoryName: string;
    PublicationDate: Date;
    ISBN: string;
    ImageUrl: string;
    StockStatus: number;
    CategoryDescription: string;
    RoomName: string;
    ShelfName: string;
}

  


interface BookFilters {
    bookTitle?: string;
    authorFullName?: string;
    categoryName?: string;
}

export function BooksPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [selectedGenre, setSelectedGenre] = useState<string>("");
    const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  
    // ✅ 2.1: Veri çekme
    useEffect(() => {
      fetch("http://localhost:3001/books")
        .then((res) => res.json())
        .then((data) => {
          setBooks(data);
          setFilteredBooks(data);
        })
        .catch((err) => console.error("Veri çekilemedi:", err));
    }, []);
  
    // ✅ 2.2: Genre filtreleme
    const genres = Array.from(new Set(books.map((book) => book.CategoryName)));
  
    useEffect(() => {
      let results = [...books];
      if (selectedGenre) {
        results = results.filter((book) => book.CategoryName === selectedGenre);
      }
     /* if (availableOnly) {
        results = results.filter((book) => book.CopiesAvailable > 0);
      }*/
      setFilteredBooks(results);
    }, [selectedGenre, availableOnly, books]);
  
    const handleRent = (bookId: number) => {
      alert(`${bookId} ID'li kitap kiralandı.`);
    };
  
    
    
    function handleSearch(filters: BookFilters): void {
      const results = books.filter((book) => {
        const matchTitle = filters.bookTitle ? book.BookTitle.toLowerCase().includes(filters.bookTitle.toLowerCase()) : true;
        const matchAuthor = filters.authorFullName ? book.AuthorFullName.toLowerCase().includes(filters.authorFullName.toLowerCase()) : true;
        const matchGenre = filters.categoryName ? book.CategoryName === filters.categoryName : true;
        return matchTitle && matchAuthor && matchGenre;
      });
    
      setFilteredBooks(results);
    }

    return(
        <div className="flex flex-col  bg-gray-100 ">
            <section>
            <div className="flex flex-col items-center justify-center bg-white w-full ">
              <br />
                <div className=" text-4xl font-bold font-serif text-library-700 mb-4">
                <h1>Kitap Kataloğu</h1>
                </div>
                <div className="font-serif text-lg text-gray-700 mb-4">
                    <p>Aradığınız kitabı bulmak için arama yapabilir veya filtreleri kullanabilirsiniz.</p>
                </div>

            <div className="w-full px-5 mx-auto  z-10 relative">
            <SearchBar onSearch={handleSearch} />     
            
                   </div> 
                   
</div>
            </section>

            <section>
                <div className="grid grid-cols-4 bg-gray-200 w-full gap-4 p-4">
                    <div className="col-span-1 bg-white pl-4 rounded-lg shadow-md h-80">
<br />
    <h1>Filtreler</h1>
<br />
<h3>Kitap Türü</h3>

<div className="space-y-2">
    <label className="inline-flex items-center">
        <input  type="radio"
                          className="text-library-600 focus:ring-library-500 h-4 w-4"
                          name="genre"
                          checked={selectedGenre === ""}
                          onChange={() => setSelectedGenre("")} />
        <span className="ml-2 text-gray-700">Tümü</span>
            </label>

            {genres.map(genre => (
                        <label key={genre} className="inline-flex items-center ">
                          <input
                            type="radio"
                            className="text-library-600 focus:ring-library-500 h-4 w-4"
                            name="genre"
                            checked={selectedGenre === genre}
                            onChange={() => setSelectedGenre(genre)}
                          />
                          <span className="ml-2 text-sm text-gray-700">{genre}</span>
                        </label>
                      ))}
</div>

<br />

                  <button
                    onClick={() => {
                      setSelectedGenre("");
                      setAvailableOnly(false);
                    }}
                    className="text-sm text-library-600 hover:text-library-800 font-medium"
                  >
                    Filtreleri Temizle
                  </button>
                    </div>

              

                    <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="flex justify-between items-center">
                    <h2 className="font-medium">
                      {filteredBooks.length} kitap bulundu
                    </h2>
                  </div>
                </div>
                 {books.length === 0 ? ( // Handle empty state
                            <p className="text-center text-gray-500">Henüz kitap bulunmamaktadır.</p>
                          ) : ( 
                    <BookList books={filteredBooks} limit={6} />
                          )}

              </div>

                </div>
            </section>
          
        </div>
    )
}