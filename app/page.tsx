"use client";
import React, { useState, useCallback } from "react";
import { XCircle, CheckCircle, Loader2 } from 'lucide-react';

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

// เปลี่ยนชื่อคอมโพเนนต์จาก Notification เป็น ToastNotification เพื่อหลีกเลี่ยงชื่อซ้ำกับ Web API
const ToastNotification = ({ message, type, onClose }) => {
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



export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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


  const handleLogin = async (e) => {
    e.preventDefault();
    showMessage(null, null); // Clear old messages

    if (!email || !password) {
      showMessage("กรุณากรอกอีเมลและรหัสผ่าน", 'error');
      return;
    }

    setIsLoading(true);

    const payload = {
      email: email,
      password: password,
    };
    
    // ตั้งค่า URL API
    const apiUrl = '/api/auth/login'; 

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
        showMessage(`เข้าสู่ระบบสำเร็จ!`, 'success');
        
        // --- NEW ROLE-BASED REDIRECTION LOGIC ---
        // แก้ไข: เปลี่ยนจาก data.status เป็น data.role_id ตามที่ผู้ใช้ระบุ
        const userRoleId = data.role_id; 
        
        let redirectPath = '/'; // Default path (can be changed to /login if needed)

        if (userRoleId === 1) {
            redirectPath = '/user'; 
        } else if (userRoleId === 2) {
            redirectPath = '/admin'; 
        } else {
            // *** ปรับปรุงการจัดการเมื่อ role_id เป็น undefined/null/ค่าอื่นที่ไม่ใช่ 1 หรือ 2 ***
            if (userRoleId === undefined || userRoleId === null) {
                // หาก role_id หายไป ให้ log ข้อมูลทั้งหมดที่ได้จาก server
                console.error('Login successful but missing "role_id" field in API response data:', data);
                showMessage('เข้าสู่ระบบสำเร็จ แต่ข้อมูลสิทธิ์ผู้ใช้ไม่สมบูรณ์ (กรุณาตรวจสอบการตอบกลับของ Server)', 'error');
            } else {
                // สำหรับค่า role_id ที่ไม่เท่ากับ 1 หรือ 2
                console.error('Login successful but invalid user role_id received:', userRoleId, 'Redirecting to login/staying put.');
                showMessage(`เข้าสู่ระบบสำเร็จ แต่ไม่พบสิทธิ์การใช้งานที่ถูกต้อง (Role ID: ${userRoleId})`, 'error');
            }
            // ถ้า role_id ไม่ถูกต้อง/หายไป จะหยุดการทำงานและแสดง error message
            setIsLoading(false); 
            return;
        }

        // Redirect after successful login and status check
        setTimeout(() => {
            window.location.href = redirectPath; 
        }, 500); // Give a brief moment for the success notification to appear

      } else {
        const msg = data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
        showMessage(msg, 'error');
      }

    } catch (error) {
      console.error('Login API Error:', error);
      showMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง', 'error');
    } finally {
      // Only reset loading state if redirection didn't happen
      if (window.location.pathname === '/' || window.location.pathname === '/login') {
          setIsLoading(false);
      }
    }
  };


  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-login.png')" }}
    >
      <div className="bg-white backdrop-blur-md shadow-xl rounded-2xl p-8 w-[90%] max-w-md">
        <h1 className="text-3xl font-semibold text-center mb-6 text-green-600">
          เภสัชพร้อมสอบ
        </h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 mb-2">อีเมล</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="yourname@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">รหัสผ่าน</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : null}
            เข้าสู่ระบบ
          </button>
        </form>

        {/* เส้นแบ่ง */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">หรือเข้าสู่ระบบด้วย</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* <div className="flex justify-center space-x-6 text-3xl">
          <button
            onClick={() => handleSocialLogin("Google")}
            className="hover:scale-110 transition-transform"
            disabled={isLoading}
          >
            <GoogleIcon />
          </button>
          <button
            onClick={() => handleSocialLogin("Facebook")}
            className="text-blue-600 hover:scale-110 transition-transform"
            disabled={isLoading}
          >
            <FacebookIcon />
          </button>
        </div> */}

        <div className="text-center mt-6 text-sm text-gray-600">
          ยังไม่มีบัญชี?{" "}
          <a href="/register" className="text-green-600 hover:underline">
            สมัครสมาชิก
          </a>
        </div>
      </div>
    </div>
  );
}