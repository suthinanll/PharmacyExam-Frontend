/**
 * ตัว SweetAlert2 จริง ถูกโหลดแบบ dynamic import จาก utils/sweetalert.ts เท่านั้น ห้าม import ตรง
 *
 * ใช้บิลด์ dist/sweetalert2.js ที่ไม่ inject CSS เอง (CSS ที่ inject ตอน runtime ไม่มี nonce
 * จึงถูก Content-Security-Policy บล็อก) แล้ว import ไฟล์ CSS แยกให้ Next.js โหลดมาพร้อมกัน
 */
import Swal from "sweetalert2/dist/sweetalert2.js";
import "sweetalert2/dist/sweetalert2.min.css";

export default Swal;
