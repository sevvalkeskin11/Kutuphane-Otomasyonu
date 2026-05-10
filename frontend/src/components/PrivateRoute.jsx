import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Sadece giriş yapmış kullanıcıların görmesi gereken rotaları sarmalar.
 * Çocuk olarak <Outlet /> kullanılarak bir Route element'i olarak çalışır:
 *   <Route element={<PrivateRoute />}>
 *     <Route path="/profil" element={<Profile />} />
 *   </Route>
 *
 * Giriş yoksa /giris'e yönlendirir ve kullanıcı oradan giriş yapınca
 * geldiği sayfaya geri dönebilsin diye orijinal konumu state'te taşır.
 */
export default function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/giris" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
