
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import React from 'react';
import Navbar from './components/Navbar';
import Home from './pages/HomePage';
import Login from './pages/LoginPage';
import Register from './pages/SignUpPage';
import { Footer } from './components/Footer';

import { AboutPage } from './pages/AboutPage';
import { BooksPage } from './pages/BooksPage';
import ProfilePage from './pages/ProfilePage';
import AdminLoginPage from './pages/AdminLoginPage';
import { AdminProfilePage } from './pages/AdminProfilePage';
import AdminPanelPage from './pages/AdminPanelPage';
import UsersControlPage from './pages/UsersControlPage';
import BookControlPage from './pages/BookControlPage';
import RentalsControlPage from './pages/RentalsControlPage';





function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home books={[]} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/adminprofil" element={<AdminProfilePage />} />
        <Route path="/adminpanel" element={<AdminPanelPage />} />
        <Route path="/userscontrol" element={<UsersControlPage />} />
        <Route path="/bookcontrol" element={<BookControlPage />} />
        <Route path="/rentalscontrol" element={<RentalsControlPage />} />


      </Routes>
      <Footer/>
    </BrowserRouter>
    
  );
}

export default App;
