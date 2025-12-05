import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  updatePassword,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { ref, set, get, update } from "firebase/database";
import { auth, database } from "@/lib/firebase";
import { User } from "@/types";

export const authService = {
  // Đăng ký với email và password
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<{ user: FirebaseUser; userData: User }> {
    try {
      // Tạo user trong Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Tạo user data trong Realtime Database
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || email,
        displayName: displayName,
        createdAt: Date.now(),
      };

      // Lưu user data vào database
      await set(ref(database, `users/${firebaseUser.uid}`), {
        ...userData,
        email: firebaseUser.email || email,
        displayName: displayName,
        createdAt: Date.now(),
      });

      return { user: firebaseUser, userData };
    } catch (error: unknown) {
      console.error("Error registering user:", error);
      throw error;
    }
  },

  // Đăng nhập với email và password
  async login(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error: unknown) {
      console.error("Error logging in:", error);
      throw error;
    }
  },

  // Đăng xuất
  async logout(): Promise<void> {
    try {
      // Xóa session từ localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("halora_user_session");
      }
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  },

  // Lấy user data từ database
  async getUserData(uid: string): Promise<User | null> {
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.val();
      return {
        uid: data.uid || uid,
        email: data.email || "",
        displayName: data.displayName || data.name || "",
        phoneNumber: data.phoneNumber || data.phone || "",
        photoURL: data.photoURL || data.avatar || "",
        address: data.address || "",
        provinceCode: data.provinceCode || "",
        districtCode: data.districtCode || "",
        wardCode: data.wardCode || "",
        createdAt: data.createdAt || Date.now(),
      };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  },

  // Đăng nhập với Google
  async loginWithGoogle(): Promise<FirebaseUser> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Kiểm tra xem user đã có trong database chưa
      const userRef = ref(database, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);

      // Nếu chưa có, tạo user data mới
      if (!snapshot.exists()) {
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          phoneNumber: firebaseUser.phoneNumber || "",
          photoURL: firebaseUser.photoURL || "",
          createdAt: Date.now(),
        };

        await set(ref(database, `users/${firebaseUser.uid}`), userData);
      }

      return firebaseUser;
    } catch (error: unknown) {
      console.error("Error logging in with Google:", error);
      throw error;
    }
  },

  // Đăng nhập với Facebook
  async loginWithFacebook(): Promise<FirebaseUser> {
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Kiểm tra xem user đã có trong database chưa
      const userRef = ref(database, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);

      // Nếu chưa có, tạo user data mới
      if (!snapshot.exists()) {
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          phoneNumber: firebaseUser.phoneNumber || "",
          photoURL: firebaseUser.photoURL || "",
          createdAt: Date.now(),
        };

        await set(ref(database, `users/${firebaseUser.uid}`), userData);
      }

      return firebaseUser;
    } catch (error: unknown) {
      console.error("Error logging in with Facebook:", error);
      throw error;
    }
  },

  // Cập nhật thông tin user
  async updateUserData(uid: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = ref(database, `users/${uid}`);
      const updates: Record<string, string | number | undefined> = {};

      if (data.displayName !== undefined) {
        updates.displayName = data.displayName;
      }
      if (data.phoneNumber !== undefined) {
        updates.phoneNumber = data.phoneNumber;
      }
      if (data.address !== undefined) {
        updates.address = data.address;
      }
      if (data.provinceCode !== undefined) {
        updates.provinceCode = data.provinceCode;
      }
      if (data.districtCode !== undefined) {
        updates.districtCode = data.districtCode;
      }
      if (data.wardCode !== undefined) {
        updates.wardCode = data.wardCode;
      }
      if (data.photoURL !== undefined) {
        updates.photoURL = data.photoURL;
      }

      await update(userRef, updates);

      // Cập nhật Firebase Auth profile nếu có displayName hoặc photoURL
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        const profileUpdates: { displayName?: string; photoURL?: string } = {};
        if (data.displayName !== undefined) {
          profileUpdates.displayName = data.displayName;
        }
        if (data.photoURL !== undefined) {
          profileUpdates.photoURL = data.photoURL;
        }
        if (Object.keys(profileUpdates).length > 0) {
          await updateProfile(currentUser, profileUpdates);
        }
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  },

  // Đổi mật khẩu
  async changePassword(newPassword: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Người dùng chưa đăng nhập");
      }

      await updatePassword(currentUser, newPassword);
    } catch (error: unknown) {
      console.error("Error changing password:", error);
      throw error;
    }
  },

  // Lắng nghe thay đổi trạng thái đăng nhập
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};
