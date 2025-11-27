"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Trash2,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  setCartOpen,
  removeFromCart,
  syncCartToDatabase,
} from "@/store/cartSlice";
import { logout } from "@/store/userSlice";
import { getOptimizedCloudinaryUrl } from "@/utils/cloudinary";
import { productService } from "@/services/productService";
import { Product } from "@/types";
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
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { totalItems, items } = useAppSelector((state) => state.cart);
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const cartHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchSuggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (cartHoverTimeoutRef.current) {
        clearTimeout(cartHoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length >= 2) {
        const results = await productService.searchProducts(searchQuery, 5);
        setSearchSuggestions(results);
        setShowSearchSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSearchSuggestions(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchSuggestionsRef.current &&
        !searchSuggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSearchSuggestions(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSuggestionClick = (product: Product) => {
    setSearchQuery("");
    setShowSearchSuggestions(false);
    router.push(`/product/${product.id}`);
  };

  const handleCartClick = () => {
    router.push("/cart");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleRemoveFromCart = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(removeFromCart(itemId));

    // Sync to database
    if (isAuthenticated && user) {
      const updatedItems = items.filter((item) => item.id !== itemId);
      await dispatch(
        syncCartToDatabase({ userId: user.id, items: updatedItems })
      );
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  const handleProductsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/") {
      // Nếu đang ở trang chủ, scroll xuống phần sản phẩm mới
      const element = document.getElementById("new-products");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // Nếu không ở trang chủ, chuyển về trang chủ và scroll
      router.push("/#new-products");
      // Đợi một chút để trang load xong rồi scroll
      setTimeout(() => {
        const element = document.getElementById("new-products");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    }
  };

  const handleCategoriesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/") {
      // Nếu đang ở trang chủ, scroll xuống phần danh mục
      const element = document.getElementById("categories");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // Nếu không ở trang chủ, chuyển về trang chủ và scroll
      router.push("/#categories");
      // Đợi một chút để trang load xong rồi scroll
      setTimeout(() => {
        const element = document.getElementById("categories");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    }
  };

  const navItems = [
    { href: "/", label: "Trang chủ" },
    { href: "/products", label: "Sản phẩm", onClick: handleProductsClick },
    { href: "/categories", label: "Danh mục", onClick: handleCategoriesClick },
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
                ref={searchInputRef}
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchSuggestions.length > 0) {
                    setShowSearchSuggestions(true);
                  }
                }}
                className="w-full px-3 py-1.5 pl-9 pr-3 text-sm text-gray-900 border border-pink-200 rounded-md 
                         focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500
                         transition-all bg-gray-50 hover:bg-white focus:bg-white
                         placeholder:text-gray-400"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />

              {/* Search Suggestions Dropdown */}
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <div
                  ref={searchSuggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 
                           max-h-80 overflow-y-auto"
                >
                  {searchSuggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSuggestionClick(product)}
                      className="w-full px-3 py-2 hover:bg-pink-50 transition-colors flex items-center space-x-2 
                               text-left border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-100">
                        {product.image ? (
                          <Image
                            src={getOptimizedCloudinaryUrl(
                              product.image,
                              80,
                              80
                            )}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-gray-900 truncate">
                          {product.name}
                        </h4>
                        <p className="text-[10px] text-pink-600 font-semibold mt-0.5">
                          {product.minPrice
                            ? new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(product.minPrice)
                            : "N/A"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Navigation - Desktop (inline) */}
          <nav className="hidden lg:flex items-center space-x-0.5 mr-4">
            {navItems.map((item) => {
              if (item.onClick) {
                return (
                  <button
                    key={item.href}
                    onClick={item.onClick}
                    className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-pink-600 font-medium 
                             transition-colors duration-150"
                  >
                    {item.label}
                  </button>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-pink-600 font-medium 
                           transition-colors duration-150"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Mobile Search */}
            <button
              onClick={() => router.push("/search")}
              className="md:hidden p-2.5 text-gray-600 hover:text-pink-600 
                       hover:bg-pink-50 rounded-lg transition-all"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart with Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (cartHoverTimeoutRef.current) {
                  clearTimeout(cartHoverTimeoutRef.current);
                }
                setIsCartHovered(true);
              }}
              onMouseLeave={() => {
                cartHoverTimeoutRef.current = setTimeout(() => {
                  setIsCartHovered(false);
                }, 200); // Delay 200ms before closing
              }}
            >
              <button
                onClick={handleCartClick}
                className="relative p-2.5 text-gray-600 hover:text-pink-600 
                         hover:bg-pink-50 rounded-lg transition-all
                         active:scale-95"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-pink-600 
                                 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center
                                 shadow-md"
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </button>

              {/* Cart Dropdown */}
              {isCartHovered && items.length > 0 && (
                <>
                  {/* Invisible bridge to prevent dropdown from closing when moving mouse */}
                  <div className="absolute right-0 top-full w-80 md:w-96 h-2 pointer-events-none" />

                  <div
                    ref={cartDropdownRef}
                    className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col"
                  >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Sản Phẩm Mới Thêm
                      </h3>
                    </div>

                    {/* Items List */}
                    <div className="overflow-y-auto max-h-[400px]">
                      {items.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-start space-x-3 group"
                        >
                          {/* Product Image */}
                          <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                            {item.product?.image ? (
                              <Image
                                src={getOptimizedCloudinaryUrl(
                                  item.product.image,
                                  100,
                                  100
                                )}
                                alt={item.product.name || "Product"}
                                width={64}
                                height={64}
                                className="object-contain w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingCart className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                              {item.product?.name || "Sản phẩm"}
                              {item.variantSize && (
                                <span className="text-xs text-gray-500 ml-1">
                                  - {item.variantSize}
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-pink-600">
                                {item.product?.minPrice
                                  ? formatPrice(item.product.minPrice)
                                  : "N/A"}
                              </span>
                              <span className="text-xs text-gray-500">
                                x{item.quantity}
                              </span>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={(e) => handleRemoveFromCart(item.id, e)}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove from cart"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => {
                          setIsCartHovered(false);
                          router.push("/cart");
                        }}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                      >
                        Xem Giỏ Hàng
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Empty Cart Message */}
              {isCartHovered && items.length === 0 && (
                <div
                  ref={cartDropdownRef}
                  className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-6"
                >
                  <div className="text-center">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Giỏ hàng của bạn đang trống
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center p-2.5 text-gray-600 
                           hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all
                           active:scale-95"
                  aria-label="User Menu"
                >
                  <User className="w-5 h-5" />
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
              className="md:hidden p-2.5 text-gray-600 hover:text-pink-600 
                       hover:bg-pink-50 rounded-lg transition-all"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-2">
            <nav className="flex flex-col space-y-0.5">
              {navItems.map((item) => {
                if (item.onClick) {
                  return (
                    <button
                      key={item.href}
                      onClick={(e) => {
                        item.onClick!(e);
                        setIsMobileMenuOpen(false);
                      }}
                      className="px-3 py-1.5 text-sm text-gray-700 hover:text-pink-600 hover:bg-pink-50 
                               rounded transition-colors text-left"
                    >
                      {item.label}
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-1.5 text-sm text-gray-700 hover:text-pink-600 hover:bg-pink-50 
                             rounded transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
