import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import RouteErrorBoundary from "./components/RouteErrorBoundary";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Books = lazy(() => import("./pages/Books"));
const BookDetail = lazy(() => import("./pages/BookDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const Transactions = lazy(() => import("./pages/admin/Transactions"));

function RouteFallback() {
  return (
    <div
      className="flex min-h-[42vh] items-center justify-center text-sm text-ink/50"
      aria-busy="true"
      role="status"
    >
      Yükleniyor…
    </div>
  );
}

export default function App() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/katalog" element={<Books />} />
            <Route path="/kitap/:id" element={<BookDetail />} />

            {/* Sadece misafirlere açık (giriş yapan anasayfaya gider) */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/giris" element={<Login />} />
              <Route path="/kayit" element={<Register />} />
            </Route>

            {/* Sadece giriş yapmış kullanıcılar */}
            <Route element={<PrivateRoute />}>
              <Route path="/profil" element={<Profile />} />
            </Route>
          </Route>

          {/* Sadece admin rolü */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="kullanicilar" element={<ManageUsers />} />
              <Route path="odunc" element={<Transactions />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
