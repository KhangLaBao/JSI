

import { auth } from "./auth.js";
import {
  initializeApp,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Thêm thông báo mới
export async function addAnnouncement(title, content, important = false) {
  try {
    const docRef = await addDoc(collection(db, "announcements"), {
      title: title,
      content: content,
      author: auth.currentUser?.email || "anonymous",
      date: serverTimestamp(),
      important: important,
      visible: true,
      type: "announcement",
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Lấy danh sách thông báo
export async function getAnnouncements(limitCount = 50) {
  try {
    const q = query(
      collection(db, "announcements"),
      orderBy("date", "desc")
    );
    const snap = await getDocs(q);
    const announcements = [];
    snap.forEach((doc) => {
      announcements.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return { success: true, data: announcements };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Xóa thông báo
export async function deleteAnnouncement(id) {
  try {
    await deleteDoc(doc(db, "announcements", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

