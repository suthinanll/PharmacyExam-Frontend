/** บิลด์ dist ของ sweetalert2 ไม่มีไฟล์ types มาให้ จึงชี้กลับไปใช้ types ของแพ็กเกจหลัก */
declare module "sweetalert2/dist/sweetalert2.js" {
  import Swal from "sweetalert2";
  export default Swal;
}
