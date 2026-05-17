"use client";

import SectionTitle from "./SectionTitle";

export default function SelectionProcessSection() {
  const steps = [
    {
      number: 1,
      title: "Đăng ký",
      description:
        "Cầu thủ hoàn thiện hồ sơ cá nhân để đăng ký tham gia chương trình",
      image: "/images/step1.png",
    },
    {
      number: 2,
      title: "Tuyển trạch toàn quốc",
      description:
        "Tham gia các buổi tuyển trạch tại Hà Nội, Đà Nẵng, TPHCM để thể hiện tài năng và giành vé vào Top 30 cầu thủ lên tuyển.",
      image: "/images/step2.png",
    },
    {
      number: 3,
      title: "Huấn luyện tập trung",
      description:
        "Top 30 cầu thủ được tập luyện trong môi trường bóng đá chuyên nghiệp, vượt qua các thử thách của chương trình để giành lấy tấm vé đi World Cup Tour",
      image: "/images/step3.png",
    },
    {
      number: 4,
      title: "Huấn luyện quốc tế",
      description:
        "Đội hình chính được tặng vé đi World Cup Tour, huấn luyện nâng cao, thi đấu cọ sát trong nước và quốc tế.",
      image: "/images/step4.png",
    },
    {
      number: 5,
      title: "Cơ hội sự nghiệp",
      description:
        "11 cầu thủ chính thức ra sân trong Final Match tại SVĐ quốc gia Mỹ Đình. Cầu thủ đạt đỉnh cao phong độ và có thành tích tốt nhất sẽ được trao giải thưởng của chương trình gồm hiện kim, hiện vật, hợp đồng sự nghiệp và cúp vàng danh giá.",
      image: "/images/step5.png",
    },
  ];

  return (
    <section
      id="selection-process"
      className="py-8 md:py-10 lg:py-12 bg-gray-50"
    >
      <div className="w-[90%] max-w-6xl mx-auto px-4">
        <SectionTitle title="Quy trình tuyển chọn" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-4">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center relative">
              {/* Image with yellow border */}
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4 bg-white">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to gray background if image doesn't exist
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              {/* Title */}
              <h4 className="text-green-700 font-bold text-base uppercase mb-2 text-center">
                {step.number}. {step.title}
              </h4>

              {/* Description */}
              <p className="text-gray-700 text-sm text-center">
                {step.description}
              </p>

              {/* Chevron arrow (not on last step, only on desktop) */}
              {index < steps.length - 1 && (
                <>
                  {/* Right arrow for desktop */}
                  <div className="hidden lg:block absolute -right-2 top-16">
                    <svg
                      className="w-8 h-8 text-gold-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

                  {/* Down arrow for mobile */}
                  <div className="lg:hidden flex justify-center mt-4">
                    <svg
                      className="w-6 h-6 text-gold-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Timeline Section */}
        <div className="mt-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-green-700 mb-12">
            Lộ trình chương trình 2026
          </h3>

          <div className="relative">
            {/* Timeline line - hidden on mobile */}
            <div className="hidden md:block absolute left-0 right-0 top-14 h-1 bg-gradient-to-r from-green-700 via-yellow-500 to-green-700"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
              {[
                {
                  month: "6",
                  title: "Tuyển trạch toàn quốc",
                  color: "from-green-600 to-green-700",
                },
                {
                  month: "7",
                  title: "Huấn luyện tập trung và đi World Cup Tour",
                  color: "from-green-700 to-yellow-600",
                },
                {
                  month: "8-9",
                  title: "Huấn luyện và thi đấu cọ sát",
                  color: "from-yellow-600 to-yellow-500",
                },
                {
                  month: "10",
                  title: "Final Match - SVĐ quốc gia Mỹ Đình",
                  color: "from-yellow-500 to-green-600",
                },
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center relative">
                  {/* Circle marker with month inside */}
                  <div
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg z-10 mb-6`}
                  >
                    <div className="w-[72px] h-[72px] md:w-20 md:h-20 rounded-full bg-white flex flex-col items-center justify-center gap-0.5">
                      <span
                        className="text-[10px] md:text-xs font-semibold leading-none"
                        style={{ color: "rgb(207, 159, 61)" }}
                      >
                        Tháng
                      </span>
                      <span
                        className="text-xl md:text-2xl font-bold leading-none"
                        style={{ color: "rgb(207, 159, 61)" }}
                      >
                        {item.month}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-center text-gray-700 font-medium text-sm md:text-base px-2">
                    {item.title}
                  </p>

                  {/* Connecting line for mobile */}
                  {index < 3 && (
                    <div className="md:hidden w-1 h-8 bg-gradient-to-b from-green-700 to-yellow-500 mx-auto mt-4"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
