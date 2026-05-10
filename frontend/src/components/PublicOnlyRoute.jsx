import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * /giris ve /kayit gibi sadece giriş yapmamış kullanıcıların görmesi gereken
 * rotaları sarmalar. Zaten oturum açıksa kullanıcıyı anasayfaya yönlendirir.
 */
export default function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
