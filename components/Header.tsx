"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Heart,
  X,
  LogOut,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setCartOpen } from "@/store/cartSlice";
import { logout } from "@/store/userSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { totalItems } = useAppSelector((state) => state.cart);
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleCartClick = () => {
    dispatch(setCartOpen(true));
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  const navItems = [
    { href: "/", label: "Trang chủ" },
    { href: "/products", label: "Sản phẩm" },
    { href: "/categories", label: "Danh mục" },
    { href: "/brands", label: "Thương hiệu" },
    { href: "/about", label: "Về chúng tôi" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? "bg-white shadow-sm border-b border-gray-100"
          : "bg-white border-b border-gray-100"
      }`}
    >
      <div className="container mx-auto px-3 md:px-4 relative">
        {/* Main Header - Compact */}
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-1.5 group flex-shrink-0"
          >
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
              Halora
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 font-medium hidden sm:block">
              Cosmetic
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-4"
          >
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 pl-9 pr-3 text-sm border border-pink-200 rounded-md 
                         focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500
                         transition-all bg-gray-50 hover:bg-white focus:bg-white
                         placeholder:text-gray-400"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            </div>
          </form>

          {/* Navigation - Desktop (inline) */}
          <nav className="hidden lg:flex items-center space-x-0.5 mr-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-pink-600 font-medium 
                         transition-colors duration-150"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-0.5">
            {/* Mobile Search */}
            <button
              onClick={() => router.push("/search")}
              className="md:hidden p-1.5 text-gray-600 hover:text-pink-600 
                       rounded transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="hidden md:flex items-center justify-center p-1.5 text-gray-600 
                       hover:text-pink-600 rounded transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4" />
            </Link>

            {/* Cart */}
            <button
              onClick={handleCartClick}
              className="relative p-1.5 text-gray-600 hover:text-pink-600 
                       rounded transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 bg-pink-600 
                               text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center p-1.5 text-gray-600 
                           hover:text-pink-600 rounded transition-colors"
                  aria-label="User Menu"
                >
                  <User className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 bg-white border border-gray-200 shadow-lg"
              >
                {isAuthenticated && user ? (
                  <>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        Tài khoản
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="cursor-pointer">
                        Đơn hàng
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3 mr-2" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push("/login")}
                      className="cursor-pointer"
                    >
                      Đăng nhập
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/register")}
                      className="cursor-pointer"
                    >
                      Đăng ký
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-gray-600 hover:text-pink-600 
                       rounded transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-2">
            <nav className="flex flex-col space-y-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:text-pink-600 hover:bg-pink-50 
                           rounded transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/wishlist"
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-pink-600 hover:bg-pink-50 
                         rounded transition-colors flex items-center space-x-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Yêu thích</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
