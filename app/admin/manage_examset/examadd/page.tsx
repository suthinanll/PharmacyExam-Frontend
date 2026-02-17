"use client"
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar_admin from "@/components/Navbar_admin";
import Footer from "@/components/Footer";
import Swal from 'sweetalert2';
import { Loader2, Save, X, ChevronRight } from 'lucide-react';

function CreateExamPage() {
  const [examName, setExamName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(""); // เป็น string เพื่อรองรับ input
  const [numQuestions, setNumQuestions] = useState(""); // เป็น string เพื่อรองรับ input
  const [examFile, setExamFile] = useState<File | null>(null); // สำหรับไฟล์ที่เลือก

  const [categories, setCategories] = useState(["PLE-CCI D 2566", "OSCE", "Final"]);
  const [selected, setSelected] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (!newValue.trim()) return;
    setCategories([...categories, newValue]);
    setNewValue("");
  };

  const handleUpdate = () => {
    if (editIndex === null) return;
    const updated = [...categories];
    if (!newValue.trim()) return;
    updated[editIndex] = newValue;
    setCategories(updated);
    setEditIndex(null);
    setNewValue("");
  };

  const handleDelete = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
    if (selected === categories[index]) setSelected("");
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 💡 ในส่วนนี้จะเป็น Logic สำหรับส่งข้อมูลไปยัง API
    console.log({
      examName,
      description,
      duration: parseInt(duration), // แปลงเป็นตัวเลขก่อนส่ง
      numQuestions: parseInt(numQuestions), // แปลงเป็นตัวเลขก่อนส่ง
      examFile,
    });
    alert("จำลอง: ข้อมูลข้อสอบถูกบันทึกแล้ว!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setExamFile(e.target.files[0]);
    } else {
      setExamFile(null);
    }
  };


  return (
    <Navbar_admin>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="mb-8  pb-4">
          <Link
            href="/admin/manage_examset"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">กลับ</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
            สร้างข้อสอบใหม่
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            กรอกรายละเอียดและอัปโหลดไฟล์ข้อสอบ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ชื่อข้อสอบ */}
          <div>
            <label htmlFor="exam-name" className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อข้อสอบ
            </label>
            <input
              type="text"
              id="exam-name"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="เช่น PLE-CCI D 2566"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              required
            />
          </div>

          {/* คำอธิบาย */}
          <div>
            <label htmlFor="exam-description" className="block text-sm font-medium text-gray-700 mb-2">
              คำอธิบาย
            </label>
            <textarea
              id="exam-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="แนวข้อสอบในประเภทวิชาชีพ"
              rows={3}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm resize-y"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="exam-duration" className="block text-sm font-medium text-gray-700 mb-2">
                เวลาทำข้อสอบ
              </label>
              <div className="flex items-center mt-1">
                <input
                  type="number"
                  id="exam-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="เวลาทำ (นาที)"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="exam-questions" className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนข้อ
              </label>
              <div className="flex items-center mt-1">
                <input
                  type="number"
                  id="exam-questions"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  placeholder="จำนวนข้อ"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* ไฟล์ข้อสอบ */}
          <div>
            <label htmlFor="exam-file" className="block text-sm font-medium text-gray-700 mb-2">
              ไฟล์ข้อสอบ
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-green-500 transition-colors">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                <div className="text-center">
                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                  <span className="mt-2 block text-sm font-semibold text-gray-900">
                    {examFile ? examFile.name : "เลือกไฟล์"}
                  </span>
                  <p className="mt-1 text-xs text-gray-500">
                    ขนาดสูงสุด 10MB (ไฟล์ .xls, .xlsx, .csv, .pdf)
                  </p>
                </div>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".xls,.xlsx,.csv,.pdf" // กำหนดประเภทไฟล์ที่ยอมรับ
                />
              </label>
            </div>
          </div>

          {/* ไฟล์เฉลยข้อสอบ */}
          <div>
            <label htmlFor="exam-file" className="block text-sm font-medium text-gray-700 mb-2">
              ไฟล์เฉลยข้อสอบ
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-green-500 transition-colors">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                <div className="text-center">
                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                  <span className="mt-2 block text-sm font-semibold text-gray-900">
                    {examFile ? examFile.name : "เลือกไฟล์"}
                  </span>
                  <p className="mt-1 text-xs text-gray-500">
                    ขนาดสูงสุด 10MB (ไฟล์ .xls, .xlsx, .csv, .pdf)
                  </p>
                </div>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".xls,.xlsx,.csv,.pdf" // กำหนดประเภทไฟล์ที่ยอมรับ
                />
              </label>
            </div>
          </div>

          {/* หมวดหมู่ข้อสอบ */}
          <div className="space-y-4">
            <label htmlFor="exam-file" className="block text-sm font-medium text-gray-700 mb-2">
              หมวดหมู่ของข้อสอบ
            </label>

            <div className="relative">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="mt-1 block w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl shadow-sm focus:ring-1 bg-white sm:text-sm appearance-none"
              >
                <option value="">-- เลือกหมวดหมู่ของข้อสอบ --</option>
                {categories.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* ช่องเพิ่ม/แก้ไข หมวดหมู่ */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={editIndex !== null ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white sm:text-sm" />

              <button
                type="button"
                onClick={editIndex !== null ? handleUpdate : handleAdd}
                className="px-6 py-3 rounded-xl bg-green-600 text-white shadow-md hover:bg-green-700 text-sm font-medium"
              >
                {editIndex !== null ? "แก้ไข" : "เพิ่ม"}
              </button>
            </div>

            {/* รายการแสดงเพื่อแก้ไข / ลบ */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-2 max-h-64 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  ยังไม่มีหมวดหมู่
                </div>
              ) : (
                categories.map((c, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md"
                  >
                    <span className="text-sm font-medium text-gray-700">{c}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditIndex(i);
                          setNewValue(c);
                        }}
                        className="px-3 py-1.5 text-xs rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium shadow-sm"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(i)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium shadow-sm"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ปุ่มบันทึก */}
          <div className="pt-6">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Save className="w-5 h-5 mr-2" />
              บันทึกการตั้งค่า
            </button>
          </div>


          {/* หมวดหมู่ข้อสอบ */}

        </form>

      </div>
    </Navbar_admin>
  );
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

function CreateItemBank() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        bank_name: '',
        description: '',
        duration: 3600, // seconds (1 hour default)
        is_active: true,
        category_ids: [] as number[]
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const response = await fetch(`${API_URL}/categories`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const minutes = parseInt(e.target.value) || 0;
        setFormData(prev => ({
            ...prev,
            duration: minutes * 60 // แปลงเป็นวินาที
        }));
    };

    const handleCategoryToggle = (categoryId: number) => {
        setFormData(prev => ({
            ...prev,
            category_ids: prev.category_ids.includes(categoryId)
                ? prev.category_ids.filter(id => id !== categoryId)
                : [...prev.category_ids, categoryId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.bank_name.trim()) {
            Swal.fire({
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกชื่อชุดข้อสอบ',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        if (formData.duration <= 0) {
            Swal.fire({
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกระยะเวลาที่ถูกต้อง',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/items-bank`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();

                await Swal.fire({
                    title: 'สำเร็จ!',
                    text: 'สร้างชุดข้อสอบสำเร็จ',
                    icon: 'success',
                    confirmButtonColor: '#22c55e'
                });

                // Redirect to item bank list
                router.push('/admin/manage_examset');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ไม่สามารถสร้างชุดข้อสอบได้');
            }
        } catch (error: any) {
            console.error('Error creating item bank:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถสร้างชุดข้อสอบได้ กรุณาลองใหม่อีกครั้ง',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            bank_name: '',
            description: '',
            duration: 3600,
            is_active: true,
            category_ids: []
        });
    };

    return (
        <>
            <Navbar_admin>
                <div className="min-h-screen bg-gray-50 py-8">
                    <div className="container mx-auto px-4 max-w-4xl">


                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">สร้างชุดข้อสอบใหม่</h1>
                            <p className="text-gray-600">กรอกข้อมูลเพื่อสร้างชุดข้อสอบใหม่</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
                            {/* ชื่อชุดข้อสอบ */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    ชื่อชุดข้อสอบ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    value={formData.bank_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="เช่น MCQ ปี 2567 ชุดที่ 1"
                                    required
                                />
                            </div>

                            {/* คำอธิบาย */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    คำอธิบาย
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                                    placeholder="รายละเอียดของชุดข้อสอบ..."
                                />
                            </div>

                            {/* ระยะเวลา */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    ระยะเวลาในการทำข้อสอบ (นาที) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.duration / 60}
                                    onChange={handleDurationChange}
                                    min="1"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="60"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    ระยะเวลาปัจจุบัน: {Math.floor(formData.duration / 60)} นาที ({formData.duration} วินาที)
                                </p>
                            </div>

                            {/* ประเภทข้อสอบ */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    ประเภทข้อสอบ
                                </label>
                                {loadingCategories ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                        <span className="ml-2 text-gray-600">กำลังโหลดประเภทข้อสอบ...</span>
                                    </div>
                                ) : categories.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {categories.map((category) => (
                                            <label
                                                key={category.category_id}
                                                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${formData.category_ids.includes(category.category_id)
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.category_ids.includes(category.category_id)}
                                                    onChange={() => handleCategoryToggle(category.category_id)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <div className="ml-3">
                                                    <span className="font-medium text-gray-900">
                                                        {category.category_name}
                                                    </span>
                                                    {category.description && (
                                                        <p className="text-sm text-gray-500">{category.description}</p>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        ไม่มีประเภทข้อสอบ
                                    </div>
                                )}
                            </div>

                            {/* สถานะ */}
                            <div className="mb-8">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700">
                                        เปิดใช้งานชุดข้อสอบนี้
                                    </span>
                                </label>
                                <p className="text-sm text-gray-500 mt-1 ml-8">
                                    {formData.is_active
                                        ? 'ผู้ใช้สามารถเห็นและทำข้อสอบนี้ได้'
                                        : 'ชุดข้อสอบนี้จะถูกซ่อนจากผู้ใช้'}
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            กำลังสร้าง...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            สร้างชุดข้อสอบ
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={loading}
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <X className="w-5 h-5" />
                                    ล้างข้อมูล
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Navbar_admin>
        </>
    );
}

export default CreateItemBank;