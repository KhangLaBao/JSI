/*
  FILE MẪU ĐỂ HỌC VIÊN THẤY ĐƯỜNG NỐI FIREBASE AUTH

  Bước 1: Import Firebase SDK.
  Bước 2: Khởi tạo app bằng firebaseConfig.
  Bước 3: Khởi tạo auth.
  Bước 4: Thay toàn bộ logic mock trong js/auth.js bằng các API thật.

  Khi dạy trên lớp:
  - Cho học viên đọc file này để hiểu cấu trúc.
  - Sau đó mở js/auth.js để thay từng hàm một bằng Firebase SDK.
*/

// Ví dụ module CDN:
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

// Bước 1: Dán firebaseConfig thật ở file firebase-config.js.

const app = initializeApp(firebaseConfig);

// Bước 2: Khởi tạo và export auth.
const auth = getAuth(app);

// Bước 3: Export các hàm auth để dùng trong js/auth.js.
export {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
};