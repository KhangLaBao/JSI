
import { auth } from "./auth.js";

const ROLE_KEY = "firebase_lesson_demo_role";

function loginUrl() {
  return window.location.pathname.includes("/pages/") ? "./login.html" : "./pages/login.html";
}


// Bước 6: Kiểm tra user đã đăng nhập chưa, nếu chưa thì redirect về trang login.

export function requireAuth() {
  const user = auth.currentUser;
  if (!user) {
    return {
      allowed: false,
      reason: "not_authenticated",
      redirectTo: loginUrl(),
    };
  }
  return { allowed: true, user };
}
export function getDemoRole() {
  return sessionStorage.getItem(ROLE_KEY) || "user";
}

export function setDemoRole(role) {
  const next = role === "admin" ? "admin" : "user";
  sessionStorage.setItem(ROLE_KEY, next);
  return next;
}

export function toggleDemoRole() {
  return setDemoRole(getDemoRole() === "admin" ? "user" : "admin");
}
