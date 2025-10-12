import Image from "next/image";

export default function NewsCard({
  title,
  desc,
  img,
  badge,
  link,
}: {
  title: string;
  desc: string;
  img: string;
  badge?: string;
  link: string;
}) {
  return (
    <div className="bg-white rounded-xl sm:rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-full">
      {/* Badge + Image */}
      <div className="relative">
        {badge && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            {badge}
          </div>
        )}
        <a href={link}>
          <Image
            src={img}
            alt={title}
            width={500}
            height={300}
            className="w-full h-55 object-cover "
          />
        </a>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 md:p-6 flex flex-col flex-1">
        <a href={link}>
          <h5 className="text-xl sm:text-xl md:text-xl font-bold text-gray-900 mb-3">
            {title}
          </h5>
        </a>

        <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4 flex-1">
          {desc}
        </p>

        {/* Buttons (fixed bottom) */}
        <div className="flex flex-row items-center gap-2 sm:gap-3 mt-auto">
          <a
            href={link}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-2.5 
       rounded-xl text-xs sm:text-sm font-medium 
       hover:from-blue-700 hover:to-blue-800 transition-all 
       shadow-lg hover:shadow-xl text-center"
          >
            อ่านข่าวเพิ่มเติม
          </a>

          {/* ปุ่มบันทึกข่าวสาร (icon เท่านั้น) */}
          <a
            href="#"
            className="w-10 h-10 flex items-center justify-center 
               bg-white text-blue-600 rounded-xl 
               border-2 border-blue-600 
               hover:bg-blue-50 transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </a>
        </div>


      </div>
    </div>
  );
}
