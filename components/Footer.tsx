import Link from 'next/link';
import { Mail, Facebook } from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { global } from 'styled-jsx/css';


const Footer = () => {
    return (
        <footer className="w-full  text-white mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="py-6 sm:py-8 lg:py-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">

                        {/* Left Column: Contact Info */}
                        <div className="space-y-3">
                            <h3 className="text-xl sm:text-2xl font-medium mb-4">เภสัชพร้อมสอบ</h3>

                            <div className="space-y-2 text-sm sm:text-base">
                                <p className="font-medium text-white/90">ติดต่อเรา</p>

                                <p className="text-xs sm:text-sm leading-relaxed">
                                    วิทยาลัยการคอมพิวเตอร์<br />
                                    123 ถ.มิตรภาพ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40002
                                </p>

                                <p className="text-xs sm:text-sm">
                                    โทรศัพท์ 043-009700 ต่อ 44456, 44457
                                </p>

                                <p className="text-xs sm:text-sm">
                                    Hot Line: 089-7102651, 089-7102646
                                </p>

                                {/* Social Media Icons */}
                                <div className="flex space-x-3 pt-3">
                                    <a
                                        href="https://facebook.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110"
                                    >
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                    <a
                                        href="mailto:contact@pharmacy.ac.th"
                                        className="w-10 h-10 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110"
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
                                <ul className="space-y-2 text-xs sm:text-sm">
                                    <li>
                                        <Link
                                            href="/"
                                            className="hover:text-green-200 transition-colors duration-200"
                                        >
                                            คลังข้อสอบ
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/examset"
                                            className="text-white/90 hover:text-green-200 transition-colors duration-200"
                                        >
                                            โรคและระบบต่างๆ
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/examset"
                                            className="text-white/90 hover:text-green-200 transition-colors duration-200"
                                        >
                                            ข้อสอบย้อนหลัง
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/followup"
                                            className="hover:text-green-200 transition-colors duration-200"
                                        >
                                            ปฏิทินการสอบ
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/chatbot"
                                            className="hover:text-green-200 transition-colors duration-200"
                                        >
                                            แชตบอตผู้ช่วย
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/chatbot"
                                            className="hover:text-green-200 transition-colors duration-200"
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
                    <p className="text-xs sm:text-sm text-center text-green-50">
                        College of Computing Khon Kaen University
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;