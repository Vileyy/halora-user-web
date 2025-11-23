"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { authService } from "@/services/authService";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/userSlice";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
      }

      toast.success("Đăng nhập thành công!", {
        description: "Chào mừng bạn quay trở lại!",
      });

      // Delay một chút để toast có thời gian hiển thị
      setTimeout(() => {
        router.push("/");
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

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
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

