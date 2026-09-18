/**
 * SweetAlert2 เวอร์ชันที่ไม่แทรก <style> เข้า DOM เอง
 *
 * บิลด์ปกติของ sweetalert2 จะ inject CSS ตอน runtime ซึ่งไม่มี nonce ติดไปด้วย
 * ทำให้ถูก Content-Security-Policy บล็อก เราจึงใช้บิลด์ dist/sweetalert2.js
 * ที่ไม่ inject อะไร แล้ว import ไฟล์ CSS แยกให้ Next.js รวมเข้า bundle แทน
 *
 * ทุกที่ในโปรเจกต์ให้ import จากไฟล์นี้: import Swal from "@/utils/sweetalert";
 * (ส่วนชุดสีมาตรฐานของปุ่มยังอยู่ที่ utils/swal.ts เหมือนเดิม)
 */
import Swal from "sweetalert2/dist/sweetalert2.js";
import "sweetalert2/dist/sweetalert2.min.css";

export default Swal;
