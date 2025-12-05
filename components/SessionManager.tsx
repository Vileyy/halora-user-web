"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateActivity, checkSessionTimeout, logout } from "@/store/userSlice";
import { authService } from "@/services/authService";
import { toast } from "sonner";

export default function SessionManager() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.user);

  // Xử lý khi session hết hạn
  const handleSessionExpired = useCallback(async () => {
    try {
      await authService.logout();
      dispatch(logout());

      toast.error("Phiên đăng nhập đã hết hạn", {
        description: "Vui lòng đăng nhập lại để tiếp tục",
      });

      router.push("/login");
    } catch (error) {
      console.error("Error handling session expiry:", error);
    }
  }, [dispatch, router]);

  // Kiểm tra session timeout định kỳ
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      dispatch(checkSessionTimeout());

      // Kiểm tra lại state sau khi check timeout
      const state = document.querySelector("[data-session-expired]");
      if (state) {
        handleSessionExpired();
      }
    }, 60 * 1000); // Kiểm tra mỗi phút

    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch, handleSessionExpired]);

  // Cập nhật activity khi người dùng tương tác
  const handleUserActivity = useCallback(() => {
    if (isAuthenticated) {
      dispatch(updateActivity());
    }
  }, [isAuthenticated, dispatch]);

  // Lắng nghe các sự kiện tương tác của người dùng
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttle để tránh gọi quá nhiều
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledHandler = () => {
      if (!throttleTimer) {
        handleUserActivity();
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
        }, 30000); // Cập nhật tối đa 30s một lần
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledHandler);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [isAuthenticated, handleUserActivity]);

  // Xử lý khi tab/window được focus lại
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // Kiểm tra session khi tab được focus lại
        dispatch(checkSessionTimeout());
        dispatch(updateActivity());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [isAuthenticated, dispatch]);

  return null; // Component này không render gì cả
}
