import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Books from './pages/Books'
import BookDetail from './pages/BookDetail'
import Dashboard from './pages/admin/Dashboard'
import ManageUsers from './pages/admin/ManageUsers'
import Transactions from './pages/admin/Transactions'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/giris" element={<Login />} />
        <Route path="/kayit" element={<Register />} />
        <Route path="/katalog" element={<Books />} />
        <Route path="/kitap/:id" element={<BookDetail />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="kullanicilar" element={<ManageUsers />} />
        <Route path="odunc" element={<Transactions />} />
      </Route>
    </Routes>
  )
}
