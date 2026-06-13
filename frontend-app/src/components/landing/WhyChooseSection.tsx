"use client";

import SectionTitle from "./SectionTitle";

export default function WhyChooseSection() {
  const reasons = [
    {
      title: "Huấn luyện nâng chuẩn\nđá bóng chuyên nghiệp",
      description:
        "Bởi đội ngũ HLV giàu kinh nghiệm, chuyên môn cao và tận tâm phát triển bóng đá trẻ.",
      image: "/images/coach.png",
    },
    {
      title: "Phát triển toàn diện\nkỹ năng ngôi sao",
      description:
        "Rèn luyện toàn diện tài năng đá bóng và kỹ năng trở thành một ngôi sao.",
      image: "/images/development.png",
    },
    {
      title: "Xây dựng\nthương hiệu cá nhân",
      description:
        "Toả sáng và chạm tới giấc mơ sân cỏ, trở thành cầu thủ chuyên nghiệp.",
      image: "/images/opportunity.png",
    },
    {
      title: "Cơ hội ra sân trong Final Match ở SVĐ Quốc Gia",
      description: "Thay đổi cuộc đời bằng đam mê và nỗ lực không ngừng.",
      image: "/images/journey.png",
    },
  ];

  return (
    <section id="why-choose" className="py-8 md:py-10 lg:py-12">
      <div className="w-[90%] max-w-6xl mx-auto px-4">
        <SectionTitle title="Bạn nhận được gì khi tham gia?" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {reasons.map((reason, index) => (
            <div key={index} className="text-center relative">
              {/* Square Image Container */}
              <div className="w-full h-32 mb-6 overflow-hidden flex items-center justify-center">
                <img
                  src={reason.image}
                  alt={reason.title}
                  className="w-auto h-full object-contain"
                  onError={(e) => {
                    // Fallback to gray background if image doesn't exist
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              {/* Header */}
              <h3 className="text-green-700 font-bold text-xs md:text-lg uppercase mb-2 whitespace-pre-line">
                {reason.title}
              </h3>

              {/* Body */}
              {/* <p className="p-3 text-gray-700 text-sm">{reason.description}</p> */}

              {/* Gold divider line (not on last item) */}
              {index < reasons.length - 1 && (
                <div className="hidden lg:block absolute top-5 bottom-5 -right-4 w-0.5 bg-gold-600"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
