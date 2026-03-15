// Firebase Admin SDK
const { initializeApp, cert } = require('firebase-admin');
const { getDatabase } = require('firebase-admin/database');

// Lưu ý: Bạn cần tải file serviceAccountKey.json từ Firebase Console
// Vào Project Settings > Service Accounts > Generate new private key
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (e) {
  console.log('⚠️  Chưa có file serviceAccountKey.json');
  console.log('Vui lòng tải file này từ Firebase Console > Project Settings > Service Accounts');
  serviceAccount = null;
}

let db = null;

function initFirebase() {
  if (!serviceAccount) {
    console.log('❌ Firebase chưa được cấu hình!');
    return null;
  }
  
  try {
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: serviceAccount.project_id 
        ? `https://${serviceAccount.project_id}.firebaseio.com`
        : 'https://YOUR_PROJECT_ID.firebaseio.com'
    });
    
    db = getDatabase();
    console.log('✅ Kết nối Firebase thành công!');
    return db;
  } catch (error) {
    console.error('❌ Lỗi kết nối Firebase:', error.message);
    return null;
  }
}

// Khởi tạo ngay khi load module
if (serviceAccount) {
  initFirebase();
}

module.exports = { db, initFirebase };