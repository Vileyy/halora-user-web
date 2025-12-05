/**
 * Utility functions for session management
 */

export const SESSION_KEY = "halora_user_session";
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 giờ

/**
 * Lấy thời gian còn lại của session (ms)
 */
export const getSessionTimeRemaining = (): number | null => {
  if (typeof window === "undefined") return null;

  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr);
    const now = Date.now();
    const timeElapsed = now - session.lastActivity;
    const timeRemaining = SESSION_TIMEOUT - timeElapsed;

    return timeRemaining > 0 ? timeRemaining : 0;
  } catch {
    return null;
  }
};

/**
 * Format thời gian còn lại thành string 
 */
export const formatTimeRemaining = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  }
  return `${minutes} phút`;
};

/**
 * Kiểm tra xem session có hết hạn không
 */
export const isSessionExpired = (): boolean => {
  const timeRemaining = getSessionTimeRemaining();
  return timeRemaining === null || timeRemaining <= 0;
};

/**
 * Lấy thông tin session hiện tại
 */
export const getSessionInfo = () => {
  if (typeof window === "undefined") return null;

  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr);
    const timeRemaining = getSessionTimeRemaining();

    return {
      user: session.user,
      lastActivity: session.lastActivity,
      timeRemaining,
      isExpired: timeRemaining === null || timeRemaining <= 0,
    };
  } catch {
    return null;
  }
};
