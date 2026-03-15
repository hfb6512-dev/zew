// Server Key Admin - Express Server
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { db, initFirebase } = require('./firebase-config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Biến cấu hình mặc định (sẽ load từ Firebase nếu có)
let appConfig = {
  appTitle: 'Server Key Admin',
  subtitle: 'Quản lý key và thiết bị',
  appVersion: '1.0.0',
  updateUrl: '',
  adminContactUrl: '',
  btnAdmin: 'Admin',
  btnKey: 'Key',
  btnLogin: 'Login',
  inputHint: 'Nhập key của bạn...',
  keyDuration: 24,
  apiBaseUrl: '',
  apiToken: '',
  maintenance: false,
  maintenanceMessage: 'Hệ thống đang bảo trì. Vui lòng thử lại sau!'
};

// API: Lấy cấu hình
app.get('/api/config', (req, res) => {
  res.json(appConfig);
});

// API: Lưu cấu hình
app.put('/api/config', async (req, res) => {
  try {
    const newConfig = req.body;
    appConfig = { ...appConfig, ...newConfig };
    
    // Lưu vào Firebase nếu đã kết nối
    if (db) {
      await db.ref('config').set(appConfig);
    }
    
    res.json({ success: true, config: appConfig });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Lấy danh sách keys
app.get('/api/keys', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.ref('keys').once('value');
      const keys = snapshot.val() || {};
      const keysArray = Object.entries(keys).map(([id, data]) => ({
        id,
        ...data
      }));
      return res.json(keysArray);
    }
    
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Tạo key mới
app.post('/api/keys/generate', async (req, res) => {
  const { type, name, duration, deviceLimit } = req.body;
  
  let keyId;
  let keyValue;
  let keyData;
  
  switch (type) {
    case 'normal':
      keyValue = 'SP-' + generateRandomKey();
      keyId = uuidv4();
      keyData = {
        key: keyValue,
        type: 'normal',
        duration: duration || appConfig.keyDuration,
        createdAt: Date.now(),
        expiresAt: Date.now() + (duration || appConfig.keyDuration) * 60 * 60 * 1000,
        used: false,
        deviceId: null,
        usedAt: null
      };
      break;
      
    case 'custom':
      keyValue = name || 'CUSTOM-' + generateRandomKey();
      keyId = uuidv4();
      keyData = {
        key: keyValue,
        type: 'custom',
        duration: duration || appConfig.keyDuration,
        createdAt: Date.now(),
        expiresAt: Date.now() + (duration || appConfig.keyDuration) * 60 * 60 * 1000,
        used: false,
        deviceId: null,
        usedAt: null,
        reusable: true
      };
      break;
      
    case 'global':
      keyValue = name || 'GLOBAL-' + generateRandomKey();
      keyId = uuidv4();
      keyData = {
        key: keyValue,
        type: 'global',
        duration: duration || appConfig.keyDuration,
        createdAt: Date.now(),
        expiresAt: Date.now() + (duration || appConfig.keyDuration) * 60 * 60 * 1000,
        deviceLimit: deviceLimit || 1,
        devices: []
      };
      break;
      
    default:
      return res.status(400).json({ error: 'Invalid key type' });
  }
  
  try {
    if (db) {
      await db.ref('keys').child(keyId).set(keyData);
    }
    
    res.json({ success: true, id: keyId, ...keyData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Cập nhật key
app.put('/api/keys/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    if (db) {
      await db.ref('keys').child(id).update(updates);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Xóa key
app.delete('/api/keys/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    if (db) {
      await db.ref('keys').child(id).remove();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Xóa nhiều keys
app.delete('/api/keys', async (req, res) => {
  const { ids } = req.body;
  
  try {
    if (db && ids && Array.isArray(ids)) {
      const updates = {};
      ids.forEach(id => {
        updates[id] = null;
      });
      await db.ref('keys').update(updates);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Lấy danh sách thiết bị
app.get('/api/devices', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.ref('devices').once('value');
      const devices = snapshot.val() || {};
      const devicesArray = Object.entries(devices).map(([id, data]) => ({
        id,
        ...data
      }));
      return res.json(devicesArray);
    }
    
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Validate key
app.post('/api/validate', async (req, res) => {
  const { key, deviceId } = req.body;
  
  try {
    // Kiểm tra chế độ bảo trì
    if (appConfig.maintenance) {
      return res.json({
        valid: false,
        message: appConfig.maintenanceMessage || 'Hệ thống đang bảo trì'
      });
    }
    
    if (!db) {
      return res.json({
        valid: false,
        message: 'Database chưa được kết nối'
      });
    }
    
    const snapshot = await db.ref('keys').orderByChild('key').equalTo(key).once('value');
    const keys = snapshot.val();
    
    if (!keys) {
      return res.json({
        valid: false,
        message: 'Key không tồn tại'
      });
    }
    
    const keyEntry = Object.entries(keys)[0];
    const keyId = keyEntry[0];
    const keyData = keyEntry[1];
    
    // Kiểm tra thời hạn
    if (keyData.expiresAt && Date.now() > keyData.expiresAt) {
      return res.json({
        valid: false,
        message: 'Key đã hết hạn'
      });
    }
    
    // Xử lý theo từng loại key
    switch (keyData.type) {
      case 'normal':
        if (keyData.used) {
          return res.json({
            valid: false,
            message: 'Key đã được sử dụng'
          });
        }
        
        // Đánh dấu key đã sử dụng và lưu deviceId
        await db.ref('keys').child(keyId).update({
          used: true,
          deviceId: deviceId,
          usedAt: Date.now()
        });
        
        return res.json({
          valid: true,
          message: 'Key hợp lệ',
          type: 'normal',
          expiresAt: keyData.expiresAt
        });
        
      case 'custom':
        if (keyData.deviceId && keyData.deviceId !== deviceId) {
          return res.json({
            valid: false,
            message: 'Key đang được sử dụng bởi thiết bị khác'
          });
        }
        
        // Cập nhật deviceId mới
        await db.ref('keys').child(keyId).update({
          deviceId: deviceId,
          usedAt: Date.now()
        });
        
        return res.json({
          valid: true,
          message: 'Key hợp lệ',
          type: 'custom',
          expiresAt: keyData.expiresAt
        });
        
      case 'global':
        const devices = keyData.devices || [];
        if (!devices.includes(deviceId)) {
          if (keyData.deviceLimit && devices.length >= keyData.deviceLimit) {
            return res.json({
              valid: false,
              message: `Đã đạt giới hạn thiết bị (${keyData.deviceLimit})`
            });
          }
          
          devices.push(deviceId);
          await db.ref('keys').child(keyId).update({
            devices: devices,
            usedAt: Date.now()
          });
        }
        
        return res.json({
          valid: true,
          message: 'Key hợp lệ',
          type: 'global',
          expiresAt: keyData.expiresAt,
          deviceLimit: keyData.deviceLimit,
          currentDevices: devices.length
        });
        
      default:
        return res.json({
          valid: false,
          message: 'Loại key không hợp lệ'
        });
    }
  } catch (error) {
    res.status(500).json({ valid: false, error: error.message });
  }
});

// API: Gia hạn key
app.post('/api/keys/extend/:id', async (req, res) => {
  const { id } = req.params;
  const { hours } = req.body;

  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database chưa kết nối' });
    }

    const snapshot = await db.ref('keys').child(id).once('value');
    const keyData = snapshot.val();

    if (!keyData) {
      return res.status(404).json({ success: false, message: 'Key không tồn tại' });
    }

    const newDuration = hours || appConfig.keyDuration;
    const newExpiry = Date.now() + newDuration * 60 * 60 * 1000;

    await db.ref('keys').child(id).update({
      expiresAt: newExpiry,
      duration: newDuration
    });

    res.json({ success: true, expiresAt: newExpiry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Xóa thiết bị khỏi key
app.post('/api/devices/remove/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  
  try {
    if (db) {
      // Tìm và cập nhật key chứa thiết bị này
      const keysSnapshot = await db.ref('keys').once('value');
      const keys = keysSnapshot.val();
      
      for (const [keyId, keyData] of Object.entries(keys || {})) {
        if (keyData.type === 'global' && keyData.devices) {
          const newDevices = keyData.devices.filter(d => d !== deviceId);
          if (newDevices.length !== keyData.devices.length) {
            await db.ref('keys').child(keyId).update({ devices: newDevices });
          }
        } else if (keyData.deviceId === deviceId) {
          await db.ref('keys').child(keyId).update({
            deviceId: null,
            used: false,
            usedAt: null
          });
        }
        
        // Xóa thiết bị
        await db.ref('devices').child(deviceId).remove();
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Xóa tất cả dữ liệu
app.delete('/api/reset', async (req, res) => {
  try {
    if (db) {
      await db.ref('keys').remove();
      await db.ref('devices').remove();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Hàm tạo key ngẫu nhiên
function generateRandomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Load config từ Firebase khi khởi động
async function loadConfig() {
  if (db) {
    try {
      const snapshot = await db.ref('config').once('value');
      const savedConfig = snapshot.val();
      if (savedConfig) {
        appConfig = { ...appConfig, ...savedConfig };
        console.log('✅ Đã load cấu hình từ Firebase');
      }
    } catch (error) {
      console.log('⚠️  Không thể load cấu hình từ Firebase:', error.message);
    }
  }
}

// Khởi động server
async function startServer() {
  await loadConfig();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server Key Admin đang chạy tại http://localhost:${PORT}`);
    console.log(`📋 API: http://localhost:${PORT}/api`);
  });
}

startServer();