import Navbar_admin from "@/components/Navbar_admin";

function Page() {
  return (
    <Navbar_admin>
      <h1 className="text-3xl font-bold text-green-700">ยินดีต้อนรับ</h1>
      <p className="mt-4 text-gray-600">นี่คือเนื้อหาที่จะแสดงด้านขวาของ Sidebar</p>
    </Navbar_admin>
  );
}

export default Page;