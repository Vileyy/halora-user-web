"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { authService } from "@/services/authService";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/userSlice";
import { loadCartFromDatabase } from "@/store/cartSlice";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingFacebook, setIsLoadingFacebook] = useState(false);
  const [error, setError] = useState("");

  // Lấy redirect URL từ query params
  const redirectUrl = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const firebaseUser = await authService.login(email, password);
      const userData = await authService.getUserData(firebaseUser.uid);

      if (userData) {
        dispatch(
          setUser({
            id: userData.uid,
            email: userData.email,
            name: userData.displayName || userData.email,
            avatar: userData.photoURL,
          })
        );
        // Load cart from database
        dispatch(loadCartFromDatabase(userData.uid));
      }

      toast.success("Đăng nhập thành công!", {
        description: "Chào mừng bạn quay trở lại!",
      });

      // Delay một chút để toast có thời gian hiển thị
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Đăng nhập thất bại. Vui lòng thử lại!";

      if (error.code === "auth/user-not-found") {
        errorMessage = "Email không tồn tại!";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Mật khẩu không đúng!";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email không hợp lệ!";
      }

      setError(errorMessage);
      toast.error("Đăng nhập thất bại", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoadingGoogle(true);

    try {
      const firebaseUser = await authService.loginWithGoogle();
      const userData = await authService.getUserData(firebaseUser.uid);

      if (userData) {
        dispatch(
          setUser({
            id: userData.uid,
            email: userData.email,
            name: userData.displayName || userData.email,
            avatar: userData.photoURL,
          })
        );
        // Load cart from database
        dispatch(loadCartFromDatabase(userData.uid));
      }

      toast.success("Đăng nhập thành công!", {
        description: "Chào mừng bạn quay trở lại!",
      });

      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } catch (error: any) {
      console.error("Google login error:", error);
      let errorMessage = "Đăng nhập bằng Google thất bại. Vui lòng thử lại!";

      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Bạn đã đóng cửa sổ đăng nhập.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Cửa sổ đăng nhập bị chặn. Vui lòng cho phép popup.";
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        errorMessage = "Tài khoản này đã được đăng ký với phương thức khác.";
      }

      setError(errorMessage);
      toast.error("Đăng nhập thất bại", {
        description: errorMessage,
      });
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError("");
    setIsLoadingFacebook(true);

    try {
      const firebaseUser = await authService.loginWithFacebook();
      const userData = await authService.getUserData(firebaseUser.uid);

      if (userData) {
        dispatch(
          setUser({
            id: userData.uid,
            email: userData.email,
            name: userData.displayName || userData.email,
            avatar: userData.photoURL,
          })
        );
        // Load cart from database
        dispatch(loadCartFromDatabase(userData.uid));
      }

      toast.success("Đăng nhập thành công!", {
        description: "Chào mừng bạn quay trở lại!",
      });

      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } catch (error: any) {
      console.error("Facebook login error:", error);
      let errorMessage = "Đăng nhập bằng Facebook thất bại. Vui lòng thử lại!";

      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Bạn đã đóng cửa sổ đăng nhập.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Cửa sổ đăng nhập bị chặn. Vui lòng cho phép popup.";
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        errorMessage = "Tài khoản này đã được đăng ký với phương thức khác.";
      } else if (error.code === "auth/facebook-account-disabled") {
        errorMessage = "Tài khoản Facebook đã bị vô hiệu hóa.";
      }

      setError(errorMessage);
      toast.error("Đăng nhập thất bại", {
        description: errorMessage,
      });
    } finally {
      setIsLoadingFacebook(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-md">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-pink-600 mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </Link>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Đăng nhập
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Chào mừng bạn quay trở lại!
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500
                           transition-all text-gray-900"
                  placeholder="Nhập email của bạn"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500
                           transition-all text-gray-900"
                  placeholder="Nhập mật khẩu của bạn"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold 
                       py-3 rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all 
                       duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Hoặc đăng nhập bằng
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoadingGoogle || isLoadingFacebook}
              className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-300 
                       text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 
                       transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoadingGoogle ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>
                {isLoadingGoogle ? "Đang đăng nhập..." : "Đăng nhập với Google"}
              </span>
            </button>

            {/* Facebook Login */}
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={isLoadingGoogle || isLoadingFacebook}
              className="w-full flex items-center justify-center space-x-3 bg-[#1877F2] border-2 border-[#1877F2] 
                       text-white font-medium py-3 rounded-lg hover:bg-[#166FE5] hover:border-[#166FE5] 
                       transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoadingFacebook ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              <span>
                {isLoadingFacebook
                  ? "Đang đăng nhập..."
                  : "Đăng nhập với Facebook"}
              </span>
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                href={
                  redirectUrl !== "/"
                    ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
                    : "/register"
                }
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
