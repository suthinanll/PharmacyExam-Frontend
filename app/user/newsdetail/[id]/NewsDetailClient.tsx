'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar_user';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { sanitizeHtml } from "@/utils/sanitize";

export interface NewsDetail {
    article_id: number;
    title: string;
    content: string;
    cover_image_url: string;
    created_at: string;
    status: string;
    source_url?: string;
}

const FALLBACK_COVER = "/img/news1.jpg";

function coverUrl(news: NewsDetail) {
    if (!news.cover_image_url) return FALLBACK_COVER;
    return news.cover_image_url.startsWith('http')
        ? news.cover_image_url
        : `${process.env.NEXT_PUBLIC_API_URL}${news.cover_image_url}`;
}

/**
 * initialNews = ข่าวที่เซิร์ฟเวอร์ดึงมาให้แล้ว (page.tsx) ถ้าเป็น null จะดึงฝั่งไคลเอนต์เหมือนเดิม
 */
const NewsDetailClient = ({ initialNews }: { initialNews: NewsDetail | null }) => {
    const { id } = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const [news, setNews] = useState<NewsDetail | null>(initialNews);
    const [loading, setLoading] = useState(initialNews === null);
    const [coverSrc, setCoverSrc] = useState(initialNews ? coverUrl(initialNews) : FALLBACK_COVER);

    // sanitizeHtml ทำงานได้เฉพาะในเบราว์เซอร์ (บนเซิร์ฟเวอร์คืนค่าว่าง)
    // จึงใส่เนื้อข่าวหลัง mount ไม่งั้น HTML จากเซิร์ฟเวอร์กับไคลเอนต์ไม่ตรงกัน
    const [contentHtml, setContentHtml] = useState("");
    useEffect(() => {
        setContentHtml(news ? sanitizeHtml(news.content) : "");
    }, [news]);

    const fetchNewsDetail = useCallback(async () => {
        try {
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (res.ok) {
                const data = await res.json();
                setNews(data);
                setCoverSrc(coverUrl(data));
            } else {
                router.push('/');
            }
        } catch (error) {
            console.error("Fetch Detail Error:", error);
        } finally {
            setLoading(false);
        }
    }, [id, router, getToken]);

    useEffect(() => {
        if (id && initialNews === null) fetchNewsDetail();
    }, [id, fetchNewsDetail, initialNews]);

    if (loading) {
        return (
            <>
                <Navbar />
                {/* min-h-screen เพื่อดัน Footer ให้อยู่ใต้เส้นพับตั้งแต่แรก
                    ถ้าใช้ความสูงสั้นกว่านี้ Footer จะอยู่ในจอแล้วถูกดันลงตอนเนื้อข่าวมาถึง
                    กลายเป็น layout shift ก้อนใหญ่ (Lighthouse วัดได้ CLS 0.155) */}
                <div className="bg-gray-50 min-h-screen flex items-start justify-center pt-24">
                    <LoadingSpinner text="กำลังโหลดรายละเอียดข่าว..." size="lg" />
                </div>
                <Footer />
            </>
        );
    }

    if (!news) return null;

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">

                    <div className="flex items-center text-sm text-gray-500 mb-5">
                        <Link href="/user" className="hover:text-green-600 cursor-pointer transition">หน้าหลัก</Link>
                        <span className="mx-2">›</span>
                        <span className="text-gray-400">ข่าวสาร</span>
                        <span className="mx-2">›</span>
                        <span className="text-gray-600 font-medium truncate">{news.title}</span>
                    </div>

                    <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
                        {/* Cover Image */}
                        <div className="relative w-full h-64 md:h-[400px]">
                            {/* รูปปกคือองค์ประกอบ LCP ของหน้า priority ใส่ preload ไว้ใน head
                                ส่วนการให้ Next ย่อรูปตามความกว้างจอ (WebP) ทำให้ไฟล์เล็กลงมาก
                                โฮสต์ที่ไม่อยู่ใน remotePatterns จะโหลดไม่ขึ้น จึงสลับไปรูปสำรอง */}
                            <Image
                                src={coverSrc}
                                alt={news.title}
                                fill
                                priority
                                sizes="(max-width: 896px) 100vw, 896px"
                                onError={() => setCoverSrc(FALLBACK_COVER)}
                                className="object-cover"
                            />
                            <div className="absolute top-4 left-4">
                                <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full ">
                                    ข่าวประชาสัมพันธ์
                                </span>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-6 md:p-10">
                            <div className="flex items-center text-sm text-gray-400 mb-4">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(news.created_at).toLocaleDateString('th-TH', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </div>

                            <h1 className="text-2xl md:text-4xl font-medium text-gray-900 mb-6 leading-tight">
                                {news.title}
                            </h1>

                            <hr className="mb-8 border-gray-100" />

                            <div
                                className="prose prose-blue max-w-none text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_s]:line-through [&_a]:text-blue-600 [&_a]:underline [&_img]:rounded-lg [&_img]:my-4"
                                dangerouslySetInnerHTML={{ __html: contentHtml }}
                            />
                            
                            {news.source_url && (
                                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-blue-900 mb-1">ลิงก์แหล่งข่าว / อ้างอิง</p>
                                        <a 
                                            href={news.source_url.startsWith('http') ? news.source_url : `https://${news.source_url}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                                        >
                                            {news.source_url}
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="mt-12 pt-8 border-t border-gray-100">
                                {/* ใช้ลิงก์ตรงแทน router.back() เพราะถ้าเปิดข่าวจากแท็บใหม่/ลิงก์ที่แชร์มา
                                    จะไม่มีประวัติให้ย้อน และถ้าเพิ่งล็อกอินมาจะย้อนไปหน้า /login */}
                                <Link
                                    href="/user"
                                    className="inline-flex items-center text-blue-600 font-medium hover:underline"
                                >
                                    <svg className="w-5 h-5 mr-2" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    กลับหน้าหลัก
                                </Link>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default NewsDetailClient;