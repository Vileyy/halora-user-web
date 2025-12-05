# Hệ thống Quản lý Session Đăng nhập

## Tổng quan

Hệ thống này quản lý trạng thái đăng nhập của người dùng với các tính năng:

- ✅ Lưu trạng thái đăng nhập vào localStorage
- ✅ Tự động đăng xuất sau 24 giờ không hoạt động
- ✅ Cập nhật thời gian hoạt động khi người dùng tương tác
- ✅ Khôi phục session khi người dùng quay lại website
- ✅ Kiểm tra session timeout định kỳ

## Cách hoạt động

### 1. Khi đăng nhập

Khi người dùng đăng nhập thành công (qua email/password, Google, hoặc Facebook):

1. Thông tin user được lưu vào Redux store
2. Session được tự động lưu vào localStorage với:
   - Thông tin user (id, email, name, avatar)
   - Thời gian hoạt động cuối cùng (lastActivity)

```typescript
{
  user: {
    id: "user_id",
    email: "user@example.com",
    name: "User Name",
    avatar: "avatar_url"
  },
  lastActivity: 1234567890
}
```

### 2. Session Timeout - 24 giờ

Session sẽ tự động hết hạn sau **24 giờ không hoạt động**. Thời gian được tính từ lần tương tác cuối cùng của người dùng.

### 3. Cập nhật Activity

Hệ thống tự động cập nhật `lastActivity` khi người dùng:

- Di chuyển chuột
- Nhấn phím
- Click chuột
- Scroll trang
- Touch trên mobile

**Lưu ý:** Để tránh gọi quá nhiều, cập nhật được throttle tối đa 30 giây một lần.

### 4. Kiểm tra Session

Session được kiểm tra tự động trong các trường hợp:

1. **Định kỳ mỗi phút** - Kiểm tra xem session có hết hạn không
2. **Khi tab được focus** - Kiểm tra khi người dùng quay lại tab
3. **Khi load trang** - Khôi phục session nếu còn hiệu lực

### 5. Khi Session hết hạn

Khi session hết hạn (quá 24 giờ không hoạt động):

1. User được đăng xuất tự động
2. Session bị xóa khỏi localStorage
3. Hiển thị thông báo "Phiên đăng nhập đã hết hạn"
4. Redirect về trang login

## Các Components chính

### 1. SessionManager (`components/SessionManager.tsx`)

Component này chạy ngầm và xử lý:

- Lắng nghe các sự kiện tương tác của user
- Cập nhật lastActivity
- Kiểm tra session timeout định kỳ
- Xử lý đăng xuất khi session hết hạn

### 2. userSlice (`store/userSlice.ts`)

Redux slice quản lý state của user với các actions:

- `setUser` - Lưu thông tin user và session
- `logout` - Đăng xuất và xóa session
- `updateActivity` - Cập nhật thời gian hoạt động
- `checkSessionTimeout` - Kiểm tra session có hết hạn không
- `loadSession` - Khôi phục session từ localStorage

### 3. authService (`services/authService.ts`)

Service xử lý authentication với Firebase, đã được cập nhật để:

- Xóa session khi logout
- Tương tác với localStorage

## Sử dụng

### Kiểm tra trạng thái đăng nhập

```typescript
import { useAppSelector } from "@/store/hooks";

function MyComponent() {
  const { user, isAuthenticated, lastActivity } = useAppSelector(
    (state) => state.user
  );

  if (isAuthenticated) {
    console.log("User đã đăng nhập:", user);
  }
}
```

### Đăng xuất thủ công

```typescript
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/userSlice";
import { authService } from "@/services/authService";

function LogoutButton() {
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await authService.logout();
    dispatch(logout());
  };

  return <button onClick={handleLogout}>Đăng xuất</button>;
}
```

### Lấy thông tin session

```typescript
import { getSessionInfo, formatTimeRemaining } from "@/utils/session";

function SessionInfo() {
  const sessionInfo = getSessionInfo();

  if (sessionInfo && !sessionInfo.isExpired) {
    const timeString = formatTimeRemaining(sessionInfo.timeRemaining);
    console.log(`Session còn: ${timeString}`);
  }
}
```

## Cấu hình

Có thể thay đổi timeout trong `store/userSlice.ts`:

```typescript
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // Thay đổi theo nhu cầu
```

## Testing

Để test tính năng timeout nhanh hơn, có thể giảm `SESSION_TIMEOUT` xuống:

```typescript
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 phút cho testing
```

## Lưu ý bảo mật

- Session được lưu trong localStorage (client-side)
- Không lưu thông tin nhạy cảm như password, token trong session
- Session chỉ chứa thông tin cơ bản của user
- Firebase Auth vẫn quản lý token authentication riêng
