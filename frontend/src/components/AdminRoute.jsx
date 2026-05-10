import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Sadece admin kullanıcıların görmesi gereken rotaları sarmalar.
 * - Hiç giriş yapılmamışsa /giris'e gönderir (oradan tekrar geri dönebilsin
 *   diye konum state'te taşınır).
 * - Giriş yapılmış ama rol admin değilse anasayfaya yönlendirir.
 */
export default function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/giris" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
