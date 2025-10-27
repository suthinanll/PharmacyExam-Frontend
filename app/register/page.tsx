/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import React, { useState, useCallback, useEffect } from "react";
import { XCircle, CheckCircle } from 'lucide-react';


// ฟังก์ชัน Exponential Backoff สำหรับการเรียก API ซ้ำ
const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429) { // Too Many Requests
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                console.warn(`Rate limit hit. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            console.warn(`Fetch failed. Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

const Notification = ({ message, type, onClose }) => {
    if (!message) return null;
    
    const baseClasses = "fixed top-4 right-4 p-4 rounded-lg shadow-2xl transition-transform transform duration-300 z-50 flex items-center";
    const colorClasses = type === 'error' 
        ? "bg-red-500 text-white" 
        : "bg-green-500 text-white";
    const Icon = type === 'error' ? XCircle : CheckCircle;

    return (
        <div className={`${baseClasses} ${colorClasses} animate-slide-in-right`}>
            <Icon className="w-6 h-6 mr-3" />
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 font-bold opacity-70 hover:opacity-100">
                &times;
            </button>
            <style jsx>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};


export default function RegisterPage() {
    // State สำหรับข้อมูลฟอร์ม
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [tel, setTel] = useState("");
    const [bod, setBod] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [university, setUniversity] = useState(''); // เก็บ University ID
    
    // State สำหรับการดึงข้อมูลและ UI
    const [universities, setUniversities] = useState([]); 
    const [isUniversityLoading, setIsUniversityLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState(null);

    const showMessage = useCallback((msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage(null);
            setMessageType(null);
        }, 5000);
    }, []);

    // Effect สำหรับการดึงข้อมูลมหาวิทยาลัย (API Call Only)
    useEffect(() => {
        const fetchUniversities = async () => {
            setIsUniversityLoading(true);
            try {
                const response = await fetchWithRetry('/api/universities', { method: 'GET' });                
                if (!response.ok) {
                    throw new Error('Failed to fetch university data: Network error or server response not OK');
                }
                const data = await response.json();
                
                if (Array.isArray(data) && data.every(item => item.id && item.name)) {
                    setUniversities(data);
                } else {
                    throw new Error('Invalid data structure received from university API. Expected array of {id, name}.');
                }
            } catch (error) {
                console.error('University Fetch Error:', error);
                showMessage('ไม่สามารถโหลดรายชื่อมหาวิทยาลัยได้ กรุณาตรวจสอบ Backend /api/universities', 'error');
            } finally {
                setIsUniversityLoading(false);
            }
        };

        fetchUniversities();
    }, [showMessage]);


    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage(null); // Clear old messages
        
        if (password !== confirmPassword) {
            showMessage("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง", 'error');
            return;
        }

        if (university === '') {
            showMessage("กรุณาเลือกมหาวิทยาลัย", 'error');
            return;
        }
        
        if (!bod) {
            showMessage("กรุณาระบุวันเกิด", 'error');
            return;
        }
                if (universities.length === 0) {
            showMessage("ไม่สามารถลงทะเบียนได้: ข้อมูลมหาวิทยาลัยยังไม่ถูกโหลด", 'error');
            return;
        }

        setIsLoading(true);

        const payload = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            tel: tel || null, 
            bod: bod || null, 
            password: password,
            university_id: university,
            role_id: 1, 
        };        

        const apiUrl = '/api/auth/register'; 
        try {
            const response = await fetchWithRetry(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(`สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ ${data.user?.first_name || firstName}`, 'success');
                window.location.href = '/'; // Redirect
            } else {
                const msg = data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน';
                showMessage(msg, 'error');
            }

        } catch (error) {
            console.error('Registration API Error:', error);
            showMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง', 'error');
        } finally {
            setIsLoading(false);
        }
    };



  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center font-inter"
      // ใช้ Placeholder Image เป็นพื้นหลัง
      style={{ backgroundImage: "url('/bg-login.png')" }}
    >
      <Notification 
        message={message} 
        type={messageType} 
        onClose={() => setMessage(null)} 
      />

      <div className="bg-white backdrop-blur-md shadow-xl rounded-2xl p-9 w-[90%] max-w-md m-10">
        <h1 className="text-3xl font-semibold text-center mb-6 text-green-600">
          สมัครสมาชิก
        </h1>

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* ชื่อและนามสกุล (First Name & Last Name - Side by Side) */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* ชื่อจริง (first_name) */}
            <div>
              <label className="block text-gray-700 mb-2">ชื่อจริง</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                placeholder="กรอกชื่อจริง"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            {/* นามสกุล (last_name) */}
            <div>
              <label className="block text-gray-700 mb-2">นามสกุล</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                placeholder="กรอกนามสกุล"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          
          {/* อีเมล */}
          <div>
            <label className="block text-gray-700 mb-2">อีเมล</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="yourname@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          {/* เบอร์โทรศัพท์ (tel) */}
          <div>
            <label className="block text-gray-700 mb-2">เบอร์โทรศัพท์ (ไม่บังคับ)</label>
            <input
              type="tel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="08xxxxxxxx"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
            />
          </div>

          {/* วันเกิด (BOD) - NEW FIELD */}
          <div>
            <label className="block text-gray-700 mb-2">วันเกิด</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              value={bod}
              onChange={(e) => setBod(e.target.value)}
              required
            />
          </div>
            
          {/* Dropdown เลือกมหาวิทยาลัย (university_id) */}
          <div>
            <label className="block text-gray-700 mb-2">มหาวิทยาลัย</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none appearance-none bg-white"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
            >
              <option value="" disabled>-- เลือกมหาวิทยาลัยของคุณ --</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.name}
                </option>
              ))}
            </select>
          </div>

          {/* รหัสผ่าน */}
          <div>
            <label className="block text-gray-700 mb-2">รหัสผ่าน</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* ยืนยันรหัสผ่าน */}
          <div>
            <label className="block text-gray-700 mb-2">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={`w-full text-white font-semibold py-2 rounded-lg transition-all duration-200 shadow-md ${
              isLoading 
                ? 'bg-green-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังลงทะเบียน...
              </span>
            ) : (
              'สมัครสมาชิก'
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          มีบัญชีอยู่แล้ว?{" "}
          <a href="/" className="text-green-600 hover:underline">
            เข้าสู่ระบบที่นี่
          </a>
        </div>
      </div>
    </div>
  );
}