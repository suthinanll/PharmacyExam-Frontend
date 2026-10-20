# 📱 PWA Setup Complete Guide

เภสัชพร้อมสอบ - Progressive Web App
---

## ✅ ไฟล์ที่สร้างแล้ว:

### 1. **manifest.json** (`/public/manifest.json`)
- กำหนดชื่อแอป, สี, ไอคอน
- Shortcuts สำหรับ jump ไปหน้าต่างๆ
- รองรับทั้ง Android และ iOS

### 2. **Service Worker** (`/public/sw.js`)
- Cache หน้าสำคัญเพื่อใช้ offline
- Auto clean cache เก่า

### 3. **PWA Install Prompt** (`/components/PWAInstallPrompt.tsx`)
- Popup แนะนำการติดตั้ง (แสดงหลัง 3 วินาที)
- แยกคำแนะนำสำหรับ iOS และ Android
- มีปุ่ม "ไว้ทีหลัง" (เก็บ localStorage ไม่แสดงอีก)

### 4. **Layout Update** (`/app/layout.tsx`)
- เพิ่ม metadata สำหรับ PWA
- ลงทะเบียน Service Worker
- เพิ่ม PWAInstallPrompt component

---

## 🚀 ขั้นตอนถัดไป:

### 1️⃣ **สร้าง Icons** (สำคัญ!)

ใช้เครื่องมือออนไลน์:
- 🔗 https://www.pwabuilder.com/imageGenerator
- 🔗 https://realfavicongenerator.net/

**อัปโหลดโลโก้ของคุณ** แล้วดาวน์โหลด icons ขนาด:
```
icon-72x72.png
icon-96x96.png
icon-128x128.png
icon-144x144.png
icon-152x152.png
icon-192x192.png
icon-384x384.png
icon-512x512.png
```

**วางไฟล์ใน:** `public/icons/`

---

### 2️⃣ **ทดสอบ PWA**

#### **ใน Chrome:**
1. เปิด DevTools (F12)
2. ไปที่ **Application** tab
3. คลิก **Manifest** ดูว่า manifest.json โหลดสำเร็จหรือไม่
4. คลิก **Service Workers** ดูว่า sw.js ทำงานหรือไม่

#### **ทดสอบติดตั้ง:**
1. เปิดเว็บใน Chrome (Desktop)
2. รอ 3 วินาที → popup จะขึ้น
3. กด **"ติดตั้งตอนนี้"**
4. แอปจะติดตั้งเป็น PWA

#### **ทดสอบบนมือถือ:**

**Android:**
1. เปิดเว็บใน Chrome
2. รอ popup หรือกดเมนู (⋮) → "เพิ่มที่หน้าจอหลัก"
3. แอปจะปรากฏที่หน้าจอเหมือนแอปปกติ

**iOS:**
1. เปิดเว็บใน Safari
2. แตะปุ่มแชร์ (📤)
3. เลือก "เพิ่มที่หน้าจอหัก"
4. แตะ "เพิ่ม"

---

### 3️⃣ **ปรับแต่ง (Optional)**

#### **เปลี่ยนสี Theme:**
ไฟล์: `public/manifest.json`
```json
"theme_color": "#76B25A",  // ← เปลี่ยนเป็นสีที่ต้องการ
"background_color": "#ffffff"
```

#### **ปรับเวลาแสดง Popup:**
ไฟล์: `components/PWAInstallPrompt.tsx` บรรทัด 24
```typescript
setTimeout(() => {
  // ...
}, 3000);  // ← เปลี่ยนเป็น 5000 (5 วินาที) หรือ 1000 (1 วินาที)
```

#### **เพิ่มหน้าที่ต้องการ Cache:**
ไฟล์: `public/sw.js` บรรทัด 3-9
```javascript
const urlsToCache = [
  '/',
  '/user',
  '/user/examset',
  '/user/followup',
  '/user/calendar',
  '/user/cat-exam',  // ← เพิ่มหน้าใหม่
];
```

---

## 🎯 Features ที่ได้:

✅ **ติดตั้งได้บนทุกแพลตฟอร์ม** (Android, iOS, Desktop)
✅ **Popup แนะนำการติดตั้ง** (แสดงหลัง 3 วินาที)
✅ **คำแนะนำภาษาไทย** แยกตาม iOS/Android
✅ **Offline support** (cache หน้าสำคัญ)
✅ **Shortcuts** (คลิกขวาแอป → ไปหน้าต่างๆ ได้เลย)
✅ **Theme color** สีเขียว #76B25A
✅ **Auto clean cache เก่า**
✅ **ไม่แสดง popup ซ้ำ** (ถ้ากด "ไว้ทีหลัง")

---

## 🐛 Troubleshooting:

### **Popup ไม่ขึ้น?**
- ตรวจสอบว่า Service Worker ลงทะเบียนสำเร็จ (DevTools > Application > Service Workers)
- ลองเคลียร์ localStorage: `localStorage.removeItem('pwa-dismissed')`
- รีเฟรชหน้าใหม่

### **Icons ไม่แสดง?**
- ตรวจสอบว่าไฟล์อยู่ใน `public/icons/` จริง
- ชื่อไฟล์ต้องตรงกับใน `manifest.json`
- ลองเคลียร์ cache: DevTools > Application > Clear storage

### **ติดตั้งแล้วแต่เปิดไม่ได้?**
- ตรวจสอบ `start_url` ใน manifest.json
- ตรวจสอบว่า HTTPS เปิดใช้งาน (PWA ต้อง HTTPS)

---

## 📚 เอกสารเพิ่มเติม:

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Manifest Generator](https://www.pwabuilder.com/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## ✨ สรุป:

**ตอนนี้ทำเสร็จ 90% แล้ว!**

เหลือแค่:
1. สร้าง icons 8 ขนาด → วางใน `public/icons/`
2. ทดสอบติดตั้ง
3. Deploy!

**Happy Coding! 🚀**
