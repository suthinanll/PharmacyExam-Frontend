import Link from 'next/link';
import { Mail, Facebook } from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { global } from 'styled-jsx/css';


const Footer = () => {
    return (
        <footer className="w-full bg-[rgba(118,178,90,1)] text-white mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="py-6 sm:py-8 lg:py-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">

                        {/* Left Column: Contact Info */}
                        <div className="space-y-3">
                            <h3 className="text-lg sm:text-xl font-medium mb-4">เภสัชพร้อมสอบ</h3>

                            <div className="space-y-2 text-lg">
                                <p className="font-medium text-white/90">ติดต่อเรา</p>

                                <p className="text-lg leading-relaxed">
                                    วิทยาลัยการคอมพิวเตอร์<br />
                                    123 ถ.มิตรภาพ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40002
                                </p>

                                <p className="text-lg">
                                    โทรศัพท์ 043-009700 ต่อ 44456, 44457
                                </p>

                                <p className="text-lg">
                                    Hot Line: 089-7102651, 089-7102646
                                </p>

                                {/* Social Media Icons */}
                                <div className="flex space-x-3 pt-3">
                                    <a
                                        href="https://www.facebook.com/computing.kku"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200"
                                    >
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                    <a
                                        href="mailto:computing.kku@kku.ac.th"
                                        className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200"
                                    >
                                        <Mail className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Links Grid */}
                        <div className="grid grid-cols-2 gap-6 sm:gap-8">
                            {/* Links Column 1 */}
                            <div className="space-y-3">
                                <ul className="space-y-2 text-lg">
                                    <li>
                                        <Link
                                            href="/user"
                                            className="hover:text-green-200 transition-colors duration-200 font-medium"
                                        >
                                            หน้าหลัก
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/user/examset"
                                            className="text-white/90 hover:text-green-200 transition-colors duration-200 font-medium"
                                        >
                                            คลังข้อสอบ
                                        </Link>
                                        <ul className="ml-4 mt-1.5 space-y-1.5">
                                            <li>
                                                <Link
                                                    href="/user/cat-exam"
                                                    className="text-lg text-white/80 hover:text-green-200 transition-colors duration-200 font-medium"
                                                >
                                                    • ข้อสอบแบบ CAT (Computerized Adaptive Testing)
                                                </Link>
                                            </li>
                                        </ul>
                                    </li>
                                    <li>
                                        <Link
                                            href="/user/calendar"
                                            className="hover:text-green-200 transition-colors duration-200 font-medium"
                                        >
                                            ปฏิทินการสอบ
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {/* Links Column 2 */}
                            <div className="space-y-3">
                                <ul className="space-y-2 text-lg">
                                    <li>
                                        <Link
                                            href="/user/chatbot"
                                            className="hover:text-green-200 transition-colors duration-200 font-medium"
                                        >
                                            แชตบอตผู้ช่วย
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/user/followup"
                                            className="hover:text-green-200 transition-colors duration-200 font-medium"
                                        >
                                            ติดตามความคืบหน้า
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/20 py-4">
                    <p className="text-lg text-center text-green-50">
                        College of Computing Khon Kaen University
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;