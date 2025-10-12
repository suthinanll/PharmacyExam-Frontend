"use client"
import { useState } from 'react';
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: 'สุธินันท์',
    lastName: 'ลำลอง',
    email: 'suthinan.l@kkumail.com',
    phone: '094-198-5046',
    age: '21',
    address: 'มหาวิทยาลัยขอนแก่น',
    university: 'มหาวิทยาลัยขอนแก่น',
    faculty: 'คณะเภสัชศาสตร์',
    studentId: '653380001-1',
    year: '4',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    console.log('Saving profile:', profileData);
    // เรียก API บันทึกข้อมูล
  };

  const handleCancel = () => {
    setIsEditing(false);
    // รีเซ็ตข้อมูลกลับไปเป็นค่าเดิม
  };

  return (
    <>
      <Navbar_user />
      
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Breadcrumb */}
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <span className="hover:text-blue-600 cursor-pointer">หน้าหลัก</span>
              <span className="mx-2">›</span>
              <span className="text-gray-800 font-medium">โปรไฟล์ของฉัน</span>
            </div>
          </div>

          {/* Header Card */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600 shadow-lg">
                  {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-gray-800">
                  {profileData.firstName} {profileData.lastName}
                </h1>
                <p className="text-gray-600 mt-1">{profileData.email}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    นักศึกษาปี {profileData.year}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {profileData.faculty}
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    แก้ไขข้อมูล
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">ข้อมูลส่วนตัว</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อจริง
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    isEditing 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  } outline-none`}
                />
              </div>

              {/* นามสกุล */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  นามสกุล
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    isEditing 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  } outline-none`}
                />
              </div>

              {/* อีเมล */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    isEditing 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  } outline-none`}
                />
              </div>

              {/* เบอร์โทรศัพท์ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    isEditing 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  } outline-none`}
                />
              </div>

              {/* อายุ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อายุ
                </label>
                <input
                  type="number"
                  name="age"
                  value={profileData.age}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    isEditing 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  } outline-none`}
                />
              </div>

              {/* ที่อยู่ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ที่อยู่
                </label>
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    isEditing 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  } outline-none`}
                />
              </div>
            </div>
          </div>

          {/* Education Info */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">ข้อมูลการศึกษา</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* มหาวิทยาลัย */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  มหาวิทยาลัย
                </label>
                <input
                  type="text"
                  name="university"
                  value={profileData.university}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    isEditing 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  } outline-none`}
                />
              </div>

              {/* คณะ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คณะ
                </label>
                <input
                  type="text"
                  name="faculty"
                  value={profileData.faculty}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    isEditing 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  } outline-none`}
                />
              </div>

              {/* รหัสนักศึกษา */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสนักศึกษา
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={profileData.studentId}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    isEditing 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  } outline-none`}
                />
              </div>

              {/* ชั้นปี */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชั้นปี
                </label>
                <select
                  name="year"
                  value={profileData.year}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                    isEditing 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  } outline-none`}
                >
                  <option value="1">ปี 1</option>
                  <option value="2">ปี 2</option>
                  <option value="3">ปี 3</option>
                  <option value="4">ปี 4</option>
                  <option value="5">ปี 5</option>
                  <option value="6">ปี 6</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              เปลี่ยนรหัสผ่าน
            </h2>
            <div className="max-w-md">
              <button className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
};

export default Profile;