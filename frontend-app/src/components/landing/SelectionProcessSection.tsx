"use client";

import SectionTitle from "./SectionTitle";

export default function SelectionProcessSection() {
  const steps = [
    {
      number: 1,
      title: "Đăng ký",
      description: "Ứng viên đăng ký và nộp hồ sơ theo hướng dẫn",
      image: "/images/step1.png",
    },
    {
      number: 2,
      title: "Sơ tuyển",
      description: "Đánh giá hồ sơ và mời tham dự vòng tuyển trạch",
      image: "/images/step2.png",
    },
    {
      number: 3,
      title: "Kiểm tra năng lực",
      description:
        "Thi đấu và kiểm tra thể lực, kỹ thuật, tư duy, hiệu suất, kỹ năng",
      image: "/images/step3.png",
    },
    {
      number: 4,
      title: "Cơ hội",
      description:
        "Top 30 ứng viên được gọi vào đội để tập huấn và vượt qua các thử thách của chương trình",
      image: "/images/step4.png",
    },
    {
      number: 5,
      title: "Lựa chọn",
      description:
        "Đội hình chính thức 11 người ra sân trong trận đấu đỉnh cao",
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
                      className="w-8 h-8 text-gold-400"
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
                      className="w-6 h-6 text-gold-400"
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
      </div>
    </section>
  );
}
