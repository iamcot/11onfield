"use client";

import { useState } from "react";
import SectionTitle from "./SectionTitle";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Đăng ký tham gia có mất phí không?",
      answer:
        "Không, việc đăng ký tham gia chương trình hoàn toàn miễn phí. Chúng tôi cam kết tạo cơ hội công bằng cho tất cả các cầu thủ có đam mê và tài năng.",
    },
    {
      question: "Ai có thể tham gia chương trình?",
      answer:
        "Chương trình dành cho các cầu thủ nam từ 16-23 tuổi, có đam mê bóng đá và mong muốn phát triển sự nghiệp chuyên nghiệp. Không yêu cầu kinh nghiệm thi đấu chuyên nghiệp trước đó.",
    },
    {
      question: "Sau khi đăng ký, tôi sẽ được liên hệ như thế nào?",
      answer:
        "Sau khi hoàn tất đăng ký, bạn sẽ nhận được email xác nhận và thông tin chi tiết về lịch tuyển chọn. Ban tổ chức sẽ liên hệ qua email và số điện thoại đã đăng ký để thông báo về các bước tiếp theo.",
    },
    {
      question: "Vòng tuyển chọn diễn ra ở đâu?",
      answer:
        "Vòng tuyển chọn sẽ được tổ chức tại 3 thành phố lớn: Hà Nội, Đà Nẵng và TP. Hồ Chí Minh. Thông tin cụ thể về địa điểm và thời gian sẽ được cập nhật sau khi bạn đăng ký thành công.",
    },
    {
      question: "Top 30 và Top 11 sẽ nhận được gì?",
      answer:
        "Top 30 sẽ được tham gia chương trình huấn luyện tập trung chuyên nghiệp, cơ hội đi World Cup Tour và thi đấu cọ sát. Top 11 chính thức sẽ thi đấu tại SVĐ quốc gia Mỹ Đình, nhận giải thưởng giá trị bao gồm tiền mặt, hiện vật, hợp đồng sự nghiệp và cúp vàng danh giá.",
    },
    {
      question:
        "Thông tin cá nhân/chỉ số/video của tôi có được công khai không?",
      answer:
        "Thông tin cá nhân của bạn sẽ được bảo mật theo quy định. Chỉ những thông tin cơ bản như tên, vị trí và ảnh đại diện sẽ được hiển thị công khai trên nền tảng. Video và chỉ số kỹ thuật chỉ được chia sẻ với Ban huấn luyện và nhà tuyển dụng được ủy quyền.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-8 md:py-10 lg:py-12 bg-gray-50">
      <div className="w-[90%] max-w-4xl mx-auto px-4">
        <SectionTitle title="Câu hỏi thường gặp" />

        <div className="space-y-4 mt-8">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-semibold text-gray-800 text-base md:text-lg pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-green-700 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-4 text-gray-600 text-sm md:text-base">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
