import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface SessionData {
  user: User;
  lastActivity: number;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number | null;
}

const SESSION_KEY = "halora_user_session";
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 giờ

// Hàm lưu session vào localStorage
const saveSession = (user: User) => {
  if (typeof window !== "undefined") {
    const sessionData: SessionData = {
      user,
      lastActivity: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  }
};

// Hàm xóa session từ localStorage
const clearSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
};

// Hàm kiểm tra và khôi phục session
export const loadSession = (): UserState => {
  if (typeof window !== "undefined") {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (sessionStr) {
        const sessionData: SessionData = JSON.parse(sessionStr);
        const now = Date.now();
        const timeSinceLastActivity = now - sessionData.lastActivity;

        // Kiểm tra nếu session còn hiệu lực (trong vòng 24 giờ)
        if (timeSinceLastActivity < SESSION_TIMEOUT) {
          // Cập nhật lastActivity
          sessionData.lastActivity = now;
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

          return {
            user: sessionData.user,
            isAuthenticated: true,
            isLoading: false,
            lastActivity: sessionData.lastActivity,
          };
        } else {
          // Session đã hết hạn
          clearSession();
        }
      }
    } catch (error) {
      console.error("Error loading session:", error);
      clearSession();
    }
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    lastActivity: null,
  };
};

const initialState: UserState = loadSession();

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.lastActivity = action.payload ? Date.now() : null;

      // Lưu session vào localStorage
      if (action.payload) {
        saveSession(action.payload);
      } else {
        clearSession();
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.lastActivity = null;
      clearSession();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateActivity: (state) => {
      // Cập nhật lastActivity khi người dùng tương tác
      if (state.isAuthenticated && state.user) {
        const now = Date.now();
        state.lastActivity = now;

        // Cập nhật trong localStorage
        if (typeof window !== "undefined") {
          const sessionStr = localStorage.getItem(SESSION_KEY);
          if (sessionStr) {
            const sessionData: SessionData = JSON.parse(sessionStr);
            sessionData.lastActivity = now;
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
          }
        }
      }
    },
    checkSessionTimeout: (state) => {
      // Kiểm tra session timeout
      if (state.isAuthenticated && state.lastActivity) {
        const now = Date.now();
        const timeSinceLastActivity = now - state.lastActivity;

        if (timeSinceLastActivity >= SESSION_TIMEOUT) {
          // Session đã hết hạn - đăng xuất
          state.user = null;
          state.isAuthenticated = false;
          state.lastActivity = null;
          clearSession();
        }
      }
    },
  },
});

export const {
  setUser,
  logout,
  setLoading,
  updateActivity,
  checkSessionTimeout,
} = userSlice.actions;

export default userSlice.reducer;
