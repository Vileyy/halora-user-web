"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { authService } from "@/services/authService";
import {
  addressService,
  Province,
  District,
  Ward,
} from "@/services/addressService";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser, logout } from "@/store/userSlice";
import { auth } from "@/lib/firebase";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  X,
  Lock,
  LogOut,
  Package,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const [userData, setUserData] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    address: "",
    photoURL: "",
    provinceCode: "",
    districtCode: "",
    wardCode: "",
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Check if user logged in with email/password (can change password and email)
  const isEmailPasswordUser = auth.currentUser?.providerData.some(
    (provider) => provider.providerId === "password"
  );

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const provincesData = await addressService.getProvinces();
        setProvinces(provincesData);
      } catch (error) {
        console.error("Error loading provinces:", error);
      }
    };
    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (userData.provinceCode) {
      const loadDistricts = async () => {
        setIsLoadingAddress(true);
        try {
          const districtsData = await addressService.getDistricts(
            userData.provinceCode
          );
          setDistricts(districtsData);
          setWards([]);
          // Reset district and ward when province changes
          if (isEditing) {
            setUserData((prev) => ({
              ...prev,
              districtCode: "",
              wardCode: "",
            }));
          }
        } catch (error) {
          console.error("Error loading districts:", error);
        } finally {
          setIsLoadingAddress(false);
        }
      };
      loadDistricts();
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [userData.provinceCode, isEditing]);

  // Load wards when district changes
  useEffect(() => {
    if (userData.districtCode) {
      const loadWards = async () => {
        setIsLoadingAddress(true);
        try {
          const wardsData = await addressService.getWards(
            userData.districtCode
          );
          setWards(wardsData);
          // Reset ward when district changes
          if (isEditing) {
            setUserData((prev) => ({
              ...prev,
              wardCode: "",
            }));
          }
        } catch (error) {
          console.error("Error loading wards:", error);
        } finally {
          setIsLoadingAddress(false);
        }
      };
      loadWards();
    } else {
      setWards([]);
    }
  }, [userData.districtCode, isEditing]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login?redirect=/profile");
      return;
    }

    // Load user data
    const loadUserData = async () => {
      try {
        const data = await authService.getUserData(user.id);
        if (data) {
          setUserData({
            displayName: data.displayName || "",
            email: data.email || "",
            phoneNumber: data.phoneNumber || "",
            address: data.address || "",
            photoURL: data.photoURL || "",
            provinceCode: data.provinceCode || "",
            districtCode: data.districtCode || "",
            wardCode: data.wardCode || "",
          });

          // If province code exists, load districts and wards
          if (data.provinceCode) {
            try {
              const districtsData = await addressService.getDistricts(
                data.provinceCode
              );
              setDistricts(districtsData);

              if (data.districtCode) {
                const wardsData = await addressService.getWards(
                  data.districtCode
                );
                setWards(wardsData);
              }
            } catch (error) {
              console.error("Error loading address data:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, [user, isAuthenticated, router]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data
    if (user) {
      authService.getUserData(user.id).then((data) => {
        if (data) {
          setUserData({
            displayName: data.displayName || "",
            email: data.email || "",
            phoneNumber: data.phoneNumber || "",
            address: data.address || "",
            photoURL: data.photoURL || "",
            provinceCode: data.provinceCode || "",
            districtCode: data.districtCode || "",
            wardCode: data.wardCode || "",
          });
        }
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate phone number
    const phoneNumber = userData.phoneNumber.trim();
    if (phoneNumber && phoneNumber.length !== 10) {
      setPhoneError("Số điện thoại phải có đúng 10 số");
      toast.error("Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 số!");
      return;
    }

    // Check if phone contains only numbers
    if (phoneNumber && !/^\d+$/.test(phoneNumber)) {
      setPhoneError("Số điện thoại chỉ được chứa số");
      toast.error("Số điện thoại chỉ được chứa số!");
      return;
    }

    setPhoneError("");
    setIsLoading(true);
    try {
      await authService.updateUserData(user.id, {
        displayName: userData.displayName,
        phoneNumber: phoneNumber,
        address: userData.address,
        provinceCode: userData.provinceCode,
        districtCode: userData.districtCode,
        wardCode: userData.wardCode,
        photoURL: userData.photoURL,
      });

      // Update Redux store
      dispatch(
        setUser({
          ...user,
          name: userData.displayName || user.email,
          avatar: userData.photoURL,
        })
      );

      toast.success("Cập nhật thông tin thành công!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating user data:", error);
      toast.error("Cập nhật thông tin thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(passwordData.newPassword);

      toast.success("Đổi mật khẩu thành công!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error("Error changing password:", error);
      let errorMessage = "Đổi mật khẩu thất bại. Vui lòng thử lại!";

      if (error.code === "auth/requires-recent-login") {
        errorMessage = "Vui lòng đăng nhập lại để đổi mật khẩu!";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn!";
      }

      toast.error("Đổi mật khẩu thất bại", {
        description: errorMessage,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      toast.success("Đăng xuất thành công!");
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Đăng xuất thất bại. Vui lòng thử lại!");
    }
  };

  // Get selected address names for display
  const selectedProvince = provinces.find(
    (p) => p.code === userData.provinceCode
  );
  const selectedDistrict = districts.find(
    (d) => d.code === userData.districtCode
  );
  const selectedWard = wards.find((w) => w.code === userData.wardCode);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-pink-600 mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {userData.photoURL ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <Image
                      src={userData.photoURL}
                      alt={userData.displayName || "User"}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-1">
                  {userData.displayName || user.email}
                </h1>
                <p className="text-pink-100 text-sm">{userData.email}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Profile Information */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Thông tin cá nhân
                </h2>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-pink-600 
                             hover:bg-pink-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Chỉnh sửa</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 
                               hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Hủy</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white 
                               bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isLoading ? "Đang lưu..." : "Lưu"}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <User className="w-4 h-4 inline mr-2" />
                    Họ và tên
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.displayName}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          displayName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500
                               transition-all text-gray-900"
                      placeholder="Nhập họ và tên"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                      {userData.displayName || "Chưa cập nhật"}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                    {userData.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {!isEmailPasswordUser
                      ? "Email từ tài khoản Google/Facebook không thể thay đổi"
                      : "Email không thể thay đổi"}
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Số điện thoại
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="tel"
                        value={userData.phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow numbers
                          const numbersOnly = value.replace(/\D/g, "");
                          // Limit to 10 digits
                          const limitedValue = numbersOnly.slice(0, 10);
                          setUserData({
                            ...userData,
                            phoneNumber: limitedValue,
                          });
                          // Clear error when user types
                          if (phoneError) {
                            setPhoneError("");
                          }
                        }}
                        className={`w-full px-4 py-2.5 border rounded-lg 
                                 focus:outline-none focus:ring-2 transition-all text-gray-900
                                 ${
                                   phoneError
                                     ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                                     : "border-gray-300 focus:ring-pink-500 focus:border-pink-500"
                                 }`}
                        placeholder="Nhập số điện thoại (10 số)"
                        maxLength={10}
                      />
                      {phoneError && (
                        <p className="text-red-500 text-xs mt-1">
                          {phoneError}
                        </p>
                      )}
                      {!phoneError && userData.phoneNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          {userData.phoneNumber.length}/10 số
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                      {userData.phoneNumber || "Chưa cập nhật"}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Địa chỉ
                  </label>
                  {isEditing ? (
                    <div className="space-y-4">
                      {/* Street Address */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Số nhà, tên đường
                        </label>
                        <input
                          type="text"
                          value={userData.address}
                          onChange={(e) =>
                            setUserData({
                              ...userData,
                              address: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                                   focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500
                                   transition-all text-gray-900"
                          placeholder="Số nhà, tên đường"
                        />
                      </div>

                      {/* Province, District, Ward */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Tỉnh/Thành phố
                          </label>
                          <div className="relative">
                            <select
                              value={userData.provinceCode}
                              onChange={(e) =>
                                setUserData({
                                  ...userData,
                                  provinceCode: e.target.value,
                                  districtCode: "",
                                  wardCode: "",
                                })
                              }
                              disabled={isLoadingAddress}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                                       focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500
                                       transition-all text-gray-900 appearance-none bg-white pr-10
                                       disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {isLoadingAddress
                                  ? "Đang tải..."
                                  : "Chọn Tỉnh/Thành phố"}
                              </option>
                              {provinces.map((province) => (
                                <option
                                  key={province.code}
                                  value={province.code}
                                >
                                  {province.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Quận/Huyện
                          </label>
                          <div className="relative">
                            <select
                              value={userData.districtCode}
                              onChange={(e) =>
                                setUserData({
                                  ...userData,
                                  districtCode: e.target.value,
                                  wardCode: "",
                                })
                              }
                              disabled={
                                !userData.provinceCode || districts.length === 0
                              }
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                                       focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500
                                       transition-all text-gray-900 appearance-none bg-white pr-10
                                       disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {!userData.provinceCode
                                  ? "Chọn Tỉnh/Thành phố trước"
                                  : districts.length === 0
                                  ? "Đang tải..."
                                  : "Chọn Quận/Huyện"}
                              </option>
                              {districts.map((district) => (
                                <option
                                  key={district.code}
                                  value={district.code}
                                >
                                  {district.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Phường/Xã
                          </label>
                          <div className="relative">
                            <select
                              value={userData.wardCode}
                              onChange={(e) =>
                                setUserData({
                                  ...userData,
                                  wardCode: e.target.value,
                                })
                              }
                              disabled={
                                !userData.districtCode || wards.length === 0
                              }
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                                       focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500
                                       transition-all text-gray-900 appearance-none bg-white pr-10
                                       disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {!userData.districtCode
                                  ? "Chọn Quận/Huyện trước"
                                  : wards.length === 0
                                  ? "Đang tải..."
                                  : "Chọn Phường/Xã"}
                              </option>
                              {wards.map((ward) => (
                                <option key={ward.code} value={ward.code}>
                                  {ward.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 min-h-[60px]">
                      {userData.address ? (
                        <div>
                          <p>{userData.address}</p>
                          {(selectedProvince ||
                            selectedDistrict ||
                            selectedWard) && (
                            <p className="text-sm text-gray-600 mt-1">
                              {[
                                selectedWard?.name,
                                selectedDistrict?.name,
                                selectedProvince?.name,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                      ) : (
                        "Chưa cập nhật"
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            {isEmailPasswordUser && (
              <div className="mb-6 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Đổi mật khẩu
                  </h2>
                  {!showPasswordForm ? (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-pink-600 
                               hover:bg-pink-50 rounded-lg transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Đổi mật khẩu</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 
                               hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Hủy</span>
                    </button>
                  )}
                </div>

                {showPasswordForm && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500
                                 transition-all text-gray-900"
                        placeholder="Nhập mật khẩu mới"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Xác nhận mật khẩu
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500
                                 transition-all text-gray-900"
                        placeholder="Nhập lại mật khẩu mới"
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5 px-4 
                               rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isChangingPassword
                        ? "Đang xử lý..."
                        : "Xác nhận đổi mật khẩu"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/orders"
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 
                           text-gray-700 font-medium rounded-lg transition-colors"
                >
                  <Package className="w-5 h-5" />
                  <span>Xem đơn hàng</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-50 hover:bg-red-100 
                           text-red-600 font-medium rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
