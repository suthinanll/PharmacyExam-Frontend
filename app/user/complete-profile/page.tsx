"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "@/utils/sweetalert";
import { ChevronDown, KeyRound, Loader2, LogOut, Phone, School, UserCheck } from "lucide-react";
import { getMissingProfileFields, useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * บัญชีที่เข้าสู่ระบบด้วย Google จะไม่มีเบอร์โทร มหาวิทยาลัย และรหัสผ่าน
 * UserLayout จะพามาหน้านี้จนกว่าจะกรอกครบ — แสดงเฉพาะช่องที่ยังขาด
 */
export default function CompleteProfilePage() {
    const { user, getToken, refreshUser, logout } = useAuth();
    const router = useRouter();
    const missing = getMissingProfileFields(user);

    const [universities, setUniversities] = useState<{ university_id: number; name: string }[]>([]);
    const [tel, setTel] = useState("");
    const [universityId, setUniversityId] = useState<number | "">("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const needTel = missing.includes("tel");
    const needUniversity = missing.includes("university");
    const needPassword = missing.includes("password");

    useEffect(() => {
        fetch(`${API_URL}/universities`)
            .then((res) => (res.ok ? res.json() : []))
            .then(setUniversities)
            .catch((err) => console.error("Failed to fetch universities:", err));
    }, []);

    const validate = () => {
        const next: Record<string, string> = {};
        if (needTel && !/^0[0-9]{9}$/.test(tel)) {
            next.tel = "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก เช่น 0812345678";
        }
        if (needUniversity && !universityId) {
            next.university = "กรุณาเลือกมหาวิทยาลัย";
        }
        if (needPassword) {
            if (password.length < 8) next.password = "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร";
            else if (password !== confirmPassword) next.confirm_password = "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const readError = async (res: Response, fallback: string) => {
        const data = await res.json().catch(() => ({}));
        const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        return message || fallback;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSaving(true);
        try {
            const token = getToken();

            if (needTel || needUniversity) {
                const body: Record<string, unknown> = {};
                if (needTel) body.tel = tel;
                if (needUniversity) body.university_id = universityId;

                const res = await fetch(`${API_URL}/users/profile`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(body),
                });
                if (!res.ok) throw new Error(await readError(res, "บันทึกข้อมูลไม่สำเร็จ"));
            }

            if (needPassword) {
                const res = await fetch(`${API_URL}/users/profile/password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ password, confirm_password: confirmPassword }),
                });
                if (!res.ok) throw new Error(await readError(res, "ตั้งรหัสผ่านไม่สำเร็จ"));
            }

            await Swal.fire({
                icon: "success",
                title: "บันทึกข้อมูลเรียบร้อย",
                text: "พร้อมเริ่มใช้งานแล้ว",
                timer: 1500,
                showConfirmButton: false,
            });
            await refreshUser();
            router.replace("/user");
        } catch (err) {
            Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err instanceof Error ? err.message : "บันทึกข้อมูลไม่สำเร็จ" });
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = (field: string) =>
        `w-full rounded-xl border bg-white py-3 text-sm outline-none transition focus:ring-4 ${
            errors[field] ? "border-red-400 focus:ring-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-blue-50"
        }`;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-50 p-2">
                            <UserCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-medium text-gray-900">กรอกข้อมูลให้ครบก่อนเริ่มใช้งาน</h1>
                            <p className="text-xs text-gray-500">
                                {user?.first_name ? `สวัสดี ${user.first_name} ` : ""}บัญชี Google ยังไม่มีข้อมูลบางส่วน
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6" noValidate>
                    {needTel && (
                        <div className="space-y-1.5">
                            <label htmlFor="tel" className="text-xs font-medium text-gray-600">เบอร์โทรศัพท์</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="tel"
                                    type="tel"
                                    inputMode="numeric"
                                    autoComplete="tel"
                                    maxLength={10}
                                    placeholder="0812345678"
                                    value={tel}
                                    onChange={(e) => setTel(e.target.value.replace(/\D/g, ""))}
                                    className={`${inputClass("tel")} pl-10 pr-4`}
                                />
                            </div>
                            {errors.tel && <p className="text-xs text-red-600">{errors.tel}</p>}
                        </div>
                    )}

                    {needUniversity && (
                        <div className="space-y-1.5">
                            <label htmlFor="university" className="text-xs font-medium text-gray-600">มหาวิทยาลัย</label>
                            <div className="relative">
                                <School className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <select
                                    id="university"
                                    value={universityId}
                                    onChange={(e) => setUniversityId(e.target.value ? Number(e.target.value) : "")}
                                    className={`${inputClass("university")} cursor-pointer appearance-none pl-10 pr-10`}
                                >
                                    <option value="">-- เลือกมหาวิทยาลัย --</option>
                                    {universities.map((u) => (
                                        <option key={u.university_id} value={u.university_id}>{u.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>
                            {errors.university && <p className="text-xs text-red-600">{errors.university}</p>}
                        </div>
                    )}

                    {needPassword && (
                        <>
                            <div className="space-y-1.5">
                                <label htmlFor="password" className="text-xs font-medium text-gray-600">ตั้งรหัสผ่าน</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="อย่างน้อย 8 ตัวอักษร"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`${inputClass("password")} pl-10 pr-4`}
                                    />
                                </div>
                                {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="confirm_password" className="text-xs font-medium text-gray-600">ยืนยันรหัสผ่าน</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="confirm_password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`${inputClass("confirm_password")} pl-10 pr-4`}
                                    />
                                </div>
                                {errors.confirm_password && <p className="text-xs text-red-600">{errors.confirm_password}</p>}
                                <p className="text-xs text-gray-500">ใช้เข้าสู่ระบบด้วยอีเมลได้ นอกเหนือจากปุ่ม Google</p>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                    >
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        บันทึกและเริ่มใช้งาน
                    </button>

                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center justify-center gap-2 text-xs text-gray-500 transition hover:text-gray-700 cursor-pointer"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        ออกจากระบบ
                    </button>
                </form>
            </div>
        </div>
    );
}
