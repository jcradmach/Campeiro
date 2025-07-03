
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, child, get, push, update, remove, onValue } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCBZ30AohxxvBbBQNedVVD1r2rsJ6n8zM4",
  authDomain: "livrariadogauderio.firebaseapp.com",
  databaseURL: "https://livrariadogauderio-default-rtdb.firebaseio.com",
  projectId: "livrariadogauderio",
  storageBucket: "livrariadogauderio.firebasestorage.app",
  messagingSenderId: "186633507480",
  appId: "1:186633507480:web:4b98a2aa7bc8324d3036ed",
  measurementId: "G-Q4BC6ZJ6M7"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Exporte tudo o que será usado em outros arquivos
export { 
  auth, 
  database, 
  storage,  // Adicione esta linha
  ref, 
  set, 
  child, 
  get, 
  push, 
  update, 
  remove,
  storageRef,  // Adicione esta linha
  uploadBytes,  // Adicione esta linha
  getDownloadURL,  // Adicione esta linha
  onValue
};

