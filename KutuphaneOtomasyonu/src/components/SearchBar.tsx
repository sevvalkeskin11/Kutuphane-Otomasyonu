import { useState } from "react";
import React from "react";


interface BookFilters {
  bookTitle?: string;
  authorFullName?: string;
  categoryName?: string;
}

interface SearchBarProps {
  onSearch: (filters: BookFilters) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState<"bookTitle" | "authorFullName" | "categoryName">("bookTitle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    
   const filters: BookFilters = {};
    if (searchTerm) {
      if (searchBy) {
        const formatted =
          searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();
        filters[searchBy] = formatted;
      }
    }
    onSearch(filters);
  };

  return (
    <div className="bg-white  shadow-sm rounded-lg p-4 border border-gray-100 ">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Kitap adı, yazar ya da tür ara..."
            className="w-full border border-gray-300 rounded-lg py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-library-500  dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="flex">
            <label className="inline-flex items-center mr-4">
              <input
                type="radio"
                className="text-library-600 focus:ring-library-500 h-4 w-4"
                name="searchBy"
                checked={searchBy === "bookTitle"}
                onChange={() => setSearchBy("bookTitle")}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Kitap Adı</span>
            </label>
            <label className="inline-flex items-center mr-4">
              <input
                type="radio"
                className="text-library-600 focus:ring-library-500 h-4 w-4"
                name="searchBy"
                checked={searchBy === "authorFullName"}
                onChange={() => setSearchBy("authorFullName")}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Yazar</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="text-library-600 focus:ring-library-500 h-4 w-4"
                name="searchBy"
                checked={searchBy === "categoryName"}
                onChange={() => setSearchBy("categoryName")}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Tür</span>
            </label>
          </div>
          
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-library-700 text-white font-medium py-2 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-library-500 focus:ring-offset-2"
          >
            Ara
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
