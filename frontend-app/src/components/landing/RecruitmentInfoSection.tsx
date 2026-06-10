export default function RecruitmentInfoSection() {
  return (
    <section id="recruitment-info" className="relative -mt-8">
      <div className="w-[90%] max-w-6xl mx-auto bg-green-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-3 gap-0">
          {/* Column 1: Đối tượng */}
          <div className="flex flex-col md:flex-row items-center justify-center p-3 md:p-6 text-white relative">
            {/* Icon */}
            <img
              src="/images/icon11.png"
              alt="Đối tượng"
              className="w-8 h-8 md:w-16 md:h-16 object-contain flex-shrink-0 mb-2 md:mb-0"
            />

            {/* Text */}
            <div className="md:ml-4 text-center md:text-left">
              <p className="text-[12px] md:text-sm uppercase font-semibold">
                Đối tượng
              </p>
              <p className="text-xs md:text-lg font-bold">Nam, 16-21 tuổi</p>
              <p className="text-[8px] md:text-xs">(2005 - 2010)</p>
            </div>

            {/* Divider */}
            <div className="absolute right-0 top-4 bottom-4 w-px bg-green-600"></div>
          </div>

          {/* Column 2: Thời gian */}
          <div className="flex flex-col md:flex-row items-center justify-center p-3 md:p-6 text-white relative">
            {/* Icon */}
            <img
              src="/images/icon12.png"
              alt="Thời gian"
              className="w-8 h-8 md:w-16 md:h-16 object-contain flex-shrink-0 mb-2 md:mb-0"
            />

            {/* Text */}
            <div className="md:ml-4 text-center md:text-left">
              <p className="text-[12px] md:text-sm uppercase font-semibold">
                Thời gian
              </p>
              <p className="text-xs md:text-lg font-bold">Nhận hồ sơ</p>
              <p className="text-[8px] md:text-xs">11/06/2026</p>
            </div>

            {/* Divider */}
            <div className="absolute right-0 top-4 bottom-4 w-px bg-green-600"></div>
          </div>

          {/* Column 3: Tuyển sinh */}
          <div className="flex flex-col md:flex-row items-center justify-center p-3 md:p-6 text-white">
            {/* Icon */}
            <img
              src="/images/icon13.png"
              alt="Tuyển sinh"
              className="w-8 h-8 md:w-16 md:h-16 object-contain flex-shrink-0 mb-2 md:mb-0"
            />

            {/* Text */}
            <div className="md:ml-4 text-center md:text-left">
              <p className="text-[12px] md:text-sm uppercase font-semibold">
                Tuyển trạch
              </p>
              <p className="text-xs md:text-lg font-bold">Toàn quốc</p>
              <p className="text-[8px] md:text-xs">Đăng ký miễn phí</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
