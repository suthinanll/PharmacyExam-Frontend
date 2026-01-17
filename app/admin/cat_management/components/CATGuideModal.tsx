'use client';

import React from 'react';
import { X, Info, AlertCircle } from 'lucide-react';

interface CATGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CATGuideModal({ isOpen, onClose }: CATGuideModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden">
                <div className="bg-green-600 px-6 py-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Info className="w-6 h-6" />
                        <h3 className="text-xl font-semibold">คู่มือการจัดการข้อสอบ CAT</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-green-500 p-1.5 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto max-h-[80vh] space-y-6">
                    <section className="bg-gray-50 rounded-xl p-5">
                        <h4 className="text-gray-900 text-lg font-medium mb-3">
                            CAT (Computerized Adaptive Testing) คืออะไร?
                        </h4>
                        <p className="text-gray-700 text-base leading-relaxed">
                            คือระบบการสอบที่ปรับตัวตามความสามารถของผู้สอบ โดยระบบจะเลือกข้อสอบที่เหมาะสมมาให้ทำแบบเรียลไทม์
                            หากตอบถูกระบบจะให้ข้อที่ยากขึ้น หากตอบผิดจะให้ข้อที่ง่ายลง เพื่อประเมินความสามารถที่แท้จริงอย่างรวดเร็วและแม่นยำ
                        </p>
                    </section>

                    <section>
                        <h4 className="text-gray-900 text-lg font-medium mb-4">
                            IRT Parameters (พารามิเตอร์ที่ต้องกำหนด)
                        </h4>

                        <div className="space-y-4">
                            {/* Parameter a */}
                            <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-700 font-medium text-lg">a</span>
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="text-gray-900 text-base font-medium mb-1">
                                            Discrimination (อำนาจจำแนก)
                                        </h5>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            บอกว่าข้อสอบข้อนี้สามารถแยกคนเก่งออกจากคนไม่เก่งได้ดีแค่ไหน
                                        </p>
                                    </div>
                                </div>
                                <div className="pl-13 space-y-2 text-sm text-gray-700">
                                    <p>• ค่าสูง (&gt; 1.5): จำแนกได้ดีมาก เหมาะสำหรับข้อสอบมาตรฐาน</p>
                                    <p>• ค่าต่ำ (&lt; 0.5): จำแนกได้น้อย</p>
                                    <p className="text-blue-700 font-medium">• ค่าแนะนำ: 1.0 - 2.0</p>
                                </div>
                            </div>

                            {/* Parameter b */}
                            <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <span className="text-purple-700 font-medium text-lg">b</span>
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="text-gray-900 text-base font-medium mb-1">
                                            Difficulty (ความยาก)
                                        </h5>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            ตำแหน่งของข้อสอบบนแกนความสามารถ ยิ่งค่าสูงยิ่งยากมาก
                                        </p>
                                    </div>
                                </div>
                                <div className="pl-13 space-y-2 text-sm text-gray-700">
                                    <p>• b = 0: ยากปานกลาง</p>
                                    <p>• b &gt; 1.5: ข้อสอบยากมาก</p>
                                    <p>• b &lt; -1.5: ข้อสอบง่ายมาก</p>
                                    <p className="text-purple-700 font-medium">• ช่วงปกติ: -4.0 ถึง 4.0</p>
                                </div>
                            </div>

                            {/* Parameter c */}
                            <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                                        <span className="text-pink-700 font-medium text-lg">c</span>
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="text-gray-900 text-base font-medium mb-1">
                                            Guessing (การเดา)
                                        </h5>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            โอกาสที่คนไม่มีความรู้เลยจะเดาข้อนี้ถูก
                                        </p>
                                    </div>
                                </div>
                                <div className="pl-13 space-y-2 text-sm text-gray-700">
                                    <p className="text-pink-700 font-medium">• ค่าแนะนำ: 0.20 - 0.25 (สำหรับ 4-5 ตัวเลือก)</p>
                                    <p>• ค่าสูงเกินไป (&gt; 0.3): แสดงว่าตัวลวงไม่ดี ตัดช้อยส์ได้ง่ายเกินไป</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h5 className="text-amber-900 text-base font-medium mb-2">
                                    ข้อควรระวัง
                                </h5>
                                <p className="text-amber-800 text-sm leading-relaxed">
                                    การตั้งค่า Parameter ที่ไม่สอดคล้องกับคุณภาพจริงของข้อสอบจะส่งผลให้ระบบ CAT ประเมินความสามารถของผู้สอบผิดพลาด
                                    ควรตั้งค่าตามความยากและคุณภาพที่แท้จริงของข้อสอบ
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium text-base transition-colors"
                    >
                        เข้าใจแล้ว
                    </button>
                </div>
            </div>
        </div>
    );
}
