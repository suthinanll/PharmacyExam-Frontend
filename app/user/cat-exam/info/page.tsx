"use client";

import React from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { 
    Zap, 
    BrainCircuit, 
    BarChart, 
    CheckCircle2, 
    LineChart,
    Layers,
    Clock,
    Crosshair,
    ChevronLeft
} from "lucide-react";

export default function CATInfoBlogPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar_user />

            {/* Navigation back */}
            <div className="max-w-4xl mx-auto px-4 pt-8">
                <button 
                    onClick={() => router.push('/user/cat-exam')}
                    className="flex items-center gap-2 text-green-700 font-medium hover:text-green-800 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" /> ย้อนกลับ
                </button>
            </div>

            <article className="max-w-4xl mx-auto px-4 pt-6 pb-16">
                
                {/* Header Title */}
                <header className="text-center mb-16">
                   
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight leading-tight">
                        การทดสอบแบบปรับตัว <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                            (Computerized Adaptive Testing - CAT)
                        </span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        เทคโนโลยีการสอบรูปแบบใหม่ ที่ฉลาดพอจะรู้ว่าคุณเก่งแค่ไหน และช่วยลดเวลาในการทำข้อสอบลงได้ถึงครึ่งหนึ่ง!
                    </p>
                </header>

                {/* Section 1: Introduction */}
                <section className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/40 border border-slate-100 mb-10 overflow-hidden relative">
                    
                    <div className="relative z-10">
                        <h2 className="text-2xl font-medium text-slate-800 mb-6 flex items-center gap-3">
                            <BrainCircuit className="w-8 h-8 text-green-600 bg-green-50 p-1.5 rounded-xl" />
                            CAT คืออะไร?
                        </h2>
                        
                        <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed space-y-4">
                            <p>
                                ปกติแล้วเวลาเราสอบข้อสอบทั่วไป ทุกคนจะได้ทำข้อสอบ <strong>ชุดเดียวกัน จำนวนข้อเท่ากัน</strong> โดยไม่สนใจว่าข้อสอบนั้นจะง่ายหรือยากเกินไปสำหรับใครบางคน
                            </p>
                            <p>
                                แต่ <strong>CAT (Computerized Adaptive Testing)</strong> แตกต่างออกไป มันคือระบบการสอบที่ <strong className="text-green-700">ปรับเปลี่ยนข้อสอบแบบเรียลไทม์</strong> ให้เข้ากับ <em>"ความสามารถที่แท้จริง"</em> ของผู้เข้าสอบแต่ละคนโดยอัตโนมัติ
                            </p>
                            <p>
                                ถ้าคุณตอบถูก ระบบจะส่งข้อที่ยากขึ้นมาท้าทายคุณ แต่ถ้าคุณตอบผิด ระบบก็จะปรับระดับให้ง่ายลงมา การทำกระบวนการนี้ซ้ำๆ จะทำให้ระบบหาระดับความสามารถของคุณได้อย่างแม่นยำภายในไม่กี่ข้อ
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 2: How it works (Flow) */}
                <section className="mb-16">
                    <h2 className="text-2xl font-medium text-slate-800 mb-8 text-center">วงจรการดึงข้อสอบ (CAT Flow)</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center relative">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-medium text-xl">1</div>
                            <h3 className="font-medium text-slate-800 mb-2">ประเมินพลัง</h3>
                            <p className="text-sm text-slate-500">ระบบประเมินค่าความสามารถ (θ) ตามที่คุณกรอก</p>
                            
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center relative">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 font-medium text-xl">2</div>
                            <h3 className="font-medium text-slate-800 mb-2">เลือกข้อสอบ</h3>
                            <p className="text-sm text-slate-500">หาข้อสอบจากคลังที่ "ตรงระดับความสามารถของคุณ"</p>
                            
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center relative">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 font-medium text-xl">3</div>
                            <h3 className="font-medium text-slate-800 mb-2">รับคำตอบ</h3>
                            <p className="text-sm text-slate-500">ผู้สอบส่งคำตอบ ระบบตรวจสอบว่าถูกหรือผิด (อัปเดตค่าความสามารถของคุณ)</p>
                            
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 font-medium text-xl">4</div>
                            <h3 className="font-medium text-slate-800 mb-2">ตรวจสอบเงื่อนไข</h3>
                            <p className="text-sm text-slate-500">ถ้าแม่นยำพอแล้ว จะหยุดสอบ ถ้าไม่ กลับไปข้อ 2</p>
                        </div>
                    </div>
                </section>

                {/* Section 3: Feature Benefits */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                            <Clock className="w-7 h-7 text-green-600" />
                        </div>
                        <h3 className="text-xl font-medium text-slate-800 mb-3">รวดเร็วกว่า กะทัดรัดกว่า</h3>
                        <p className="text-slate-600 leading-relaxed">
                            คุณไม่จำเป็นต้องทำข้อสอบทั้งหมด 100 ข้อ การทดสอบ CAT สามารถวัดระดับของคุณได้แม่นยำเท่ากันโดยใช้ข้อสอบน้อยลงถึง 50%
                        </p>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                            <Crosshair className="w-7 h-7 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-medium text-slate-800 mb-3">แม่นยำทุกระดับชั้น</h3>
                        <p className="text-slate-600 leading-relaxed">
                            คนเก่งไม่ต้องเบื่อกับข้อสอบง่ายเกินไป คนที่เพิ่งเริ่มก็ไม่ต้องเครียดกับข้อสอบที่ยากเกินไป ข้อสอบจะท้าทายคุณในจุดที่เหมาะสมที่สุด
                        </p>
                    </div>
                </section>

                {/* Section 4: Comparison Table */}
                <section className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-100 mb-16 overflow-x-auto">
                    <h2 className="text-2xl font-medium text-slate-800 mb-8 text-center flex items-center justify-center gap-3">
                        <Layers className="w-8 h-8 text-indigo-600 bg-indigo-50 p-1.5 rounded-xl" />
                        เปรียบเทียบการสอบ
                    </h2>
                    
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr>
                                <th className="p-4 border-b-2 border-slate-200 text-slate-500 font-medium w-1/3">คุณสมบัติ</th>
                                <th className="p-4 border-b-2 border-slate-200 text-slate-800 font-medium w-1/3">การสอบปกติ (Linear Test)</th>
                                <th className="p-4 border-b-2 border-indigo-500 text-indigo-700 font-medium bg-indigo-50/50 rounded-t-xl w-1/3">การสอบแบบปรับตัว (CAT)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="p-4 font-medium text-slate-600 border-r border-slate-100">จำนวนข้อสอบ</td>
                                <td className="p-4 text-slate-600 border-r border-slate-100">คงที่ (ทุกคนทำข้อสอบชุดเดียวกัน จำนวนเท่ากัน)</td>
                                <td className="p-4 bg-indigo-50/30 text-indigo-800 font-medium">ยืดหยุ่น (จบได้เมื่อวัดผลแม่นยำแล้ว มักใช้จำนวนข้อลดลงได้ถึง 50%)</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-slate-600 border-r border-slate-100">ระดับความยาก</td>
                                <td className="p-4 text-slate-600 border-r border-slate-100">เหมือนเดิมตั้งแต่ต้นจนจบ (มีทั้งข้อง่ายสลับยาก)</td>
                                <td className="p-4 bg-indigo-50/30 text-indigo-800 font-medium">ปรับเปลี่ยนตามความสามารถของผู้สอบได้แบบข้อต่อข้อ</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-slate-600 border-r border-slate-100">ความกดดันทางจิตใจ</td>
                                <td className="p-4 text-slate-600 border-r border-slate-100">คนเก่งเบื่อข้อสอบง่าย / คนอ่อนท้อกับข้อสอบยาก</td>
                                <td className="p-4 bg-indigo-50/30 text-indigo-800 font-medium">ท้าทายกำลังพอดีตลอดเวลา (ลบจุดบอดเรื่องความท้อแท้)</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-slate-600 border-r border-slate-100">ความแม่นยำ (Precision)</td>
                                <td className="p-4 text-slate-600 border-r border-slate-100">ปานกลาง (อาจมีข้อคำถามที่ไม่จำเป็นต่อการวัดผลเยอะ)</td>
                                <td className="p-4 bg-indigo-50/30 text-indigo-800 font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">สูงมาก (ขับเคลื่อนประเมินผลผ่านสมการทางสถิติ - IRT)</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

               
            </article>

            <Footer />
        </div>
    );
}
