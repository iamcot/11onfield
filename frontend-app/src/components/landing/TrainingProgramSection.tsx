"use client";

import SectionTitle from "./SectionTitle";

export default function TrainingProgramSection() {
  const programs = [
    {
      title: "Kỹ thuật cá nhân",
      description:
        "Rèn luyện kỹ thuật cá nhân, kiểm soát bóng, xử lý bóng và kỹ năng thi đấu theo vị trí.",
      image: "/images/training1.png",
    },
    {
      title: "Chiến thuật đội hình",
      description:
        "Học chiến thuật đội hình, phối hợp tập thể, di chuyển không bóng và kỷ luật thi đấu.",
      image: "/images/training2.png",
    },
    {
      title: "Thể lực",
      description:
        "Cải thiện sức bền, tốc độ, sức mạnh và khả năng đáp ứng cường độ thi đấu.",
      image: "/images/training3.png",
    },
    {
      title: "Tư duy bóng đá",
      description:
        "Phát triển khả năng đọc tình huống, ra quyết định và hiểu yêu cầu chiến thuật của Ban huấn luyện.",
      image: "/images/training4.png",
    },
    {
      title: "Phân tích dữ liệu",
      description:
        "Kết hợp ghi hình, đeo thiết bị GPS, phân tích dữ liệu và cập nhật chỉ số cầu thủ theo thời gian thực.",
      image: "/images/training5.png",
    },
  ];

  return (
    <section id="training-program" className="py-8 md:py-10 lg:py-12">
      <div className="w-[90%] max-w-6xl mx-auto px-4">
        <SectionTitle title="Chương trình huấn luyện" />

        {/* Description */}
        <p className="text-center text-gray-700 text-sm md:text-base max-w-4xl mx-auto mb-8 md:mb-10">
          Các cầu thủ được chọn sẽ tham gia quá trình huấn luyện, kiểm tra và
          đánh giá theo từng giai đoạn, hướng đến việc phát triển kỹ thuật, thể
          lực, tư duy thi đấu và khả năng thích nghi trong môi trường bóng đá
          chuyên nghiệp.
        </p>

        {/* Mobile: Horizontal scroll */}
        <div className="lg:hidden overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-4">
            {programs.map((program, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[70vw] max-w-[280px] bg-green-700 rounded-xl overflow-visible shadow-lg relative"
              >
                {/* Top Image - Full width display */}
                <div className="h-56 bg-green-700 relative z-20 rounded-t-xl overflow-hidden">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to gray background if image doesn't exist
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                {/* Bottom Content - Behind image */}
                <div className="p-4 pt-12 flex flex-col items-center justify-center text-center min-h-[150px] bg-green-700 relative z-10 rounded-b-xl">
                  {/* Title */}
                  <h4
                    className="font-bold text-base mb-2"
                    style={{ color: "rgb(207, 159, 61)" }}
                  >
                    {program.title}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-white">{program.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden lg:grid grid-cols-5 gap-6">
          {programs.map((program, index) => (
            <div
              key={index}
              className="bg-green-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Top Image - Full height display */}
              <div className="h-48 bg-green-700 relative flex items-center justify-center">
                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to gray background if image doesn't exist
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              {/* Bottom Content - 2/3 height */}
              <div className="p-4 flex flex-col items-center justify-center text-center min-h-[150px]">
                {/* Title */}
                <h4
                  className="font-bold text-base mb-2"
                  style={{ color: "rgb(207, 159, 61)" }}
                >
                  {program.title}
                </h4>

                {/* Description */}
                <p className="text-sm text-white">{program.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
