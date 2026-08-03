import { useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";
import { useAuth } from "../../context/AuthContext";
import { getUserRole } from "../../utils/userRole";
import { performLogout } from "../../utils/logout";

export default function SignIn() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (isAuthenticated && token) {
      const role = getUserRole() || sessionStorage.getItem("userRole");
      if (role === "Superadmin") {
        navigate("/superadmin/dashboard-stats", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } else if (isAuthenticated && !token) {
      performLogout();
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <PageMeta
        title="Welcome to HikeHub"
        description="Sign in to your account"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
