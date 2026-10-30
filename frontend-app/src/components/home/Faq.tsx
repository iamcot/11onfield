'use client';

import { useState } from 'react';
import { SectionHead, revealDelay } from './ui';

const FAQS = [
  {
    q: 'Đăng ký tham gia có mất phí không?',
    a: 'Không, việc đăng ký tham gia chương trình hoàn toàn miễn phí. Chúng tôi cam kết tạo cơ hội công bằng cho tất cả các cầu thủ có đam mê và tài năng.',
  },
  {
    q: 'Ai có thể tham gia chương trình?',
    a: 'Chương trình dành cho các cầu thủ nam từ 16-21 tuổi, có đam mê bóng đá và mong muốn phát triển sự nghiệp chuyên nghiệp. Không yêu cầu kinh nghiệm thi đấu chuyên nghiệp trước đó. Bạn có thể là học sinh, sinh viên, cầu thủ phong trào hoặc đang ở học viện.',
  },
  {
    q: 'Tôi đang ở nước ngoài có tham gia được không?',
    a: 'Được. Chương trình mở cho người Việt Nam trên toàn thế giới. Ban tổ chức sẽ liên hệ để hướng dẫn hình thức tuyển trạch phù hợp sau khi bạn đăng ký.',
  },
  {
    q: 'Sau khi đăng ký, tôi sẽ được liên hệ như thế nào?',
    a: 'Sau khi hoàn tất đăng ký, bạn sẽ nhận được email xác nhận và thông tin chi tiết về lịch tuyển chọn. Ban tổ chức sẽ liên hệ qua email và số điện thoại đã đăng ký để thông báo về các bước tiếp theo.',
  },
  {
    q: 'Vòng tuyển chọn diễn ra ở đâu?',
    a: 'Vòng tuyển chọn sẽ được tổ chức tại 3 thành phố lớn: Hà Nội, Đà Nẵng và TP. Hồ Chí Minh. Thông tin cụ thể về địa điểm và thời gian sẽ được cập nhật sau khi bạn đăng ký thành công.',
  },
  {
    q: 'Top 30 và Top 11 sẽ nhận được gì?',
    a: 'Top 30 sẽ được tham gia chương trình huấn luyện tập trung chuyên nghiệp, cơ hội đi World Cup Tour và thi đấu cọ sát. Top 11 chính thức sẽ thi đấu tại SVĐ Quốc Gia, nhận giải thưởng giá trị bao gồm tiền mặt, hiện vật, hợp đồng sự nghiệp và cúp vàng danh giá.',
  },
  {
    q: 'Thông tin cá nhân/chỉ số/video của tôi có được công khai không?',
    a: 'Thông tin cá nhân của bạn sẽ được bảo mật theo quy định. Chỉ những thông tin cơ bản như tên, vị trí và ảnh đại diện sẽ được hiển thị công khai trên nền tảng. Video và chỉ số kỹ thuật chỉ được chia sẻ với Ban huấn luyện và nhà tuyển dụng được ủy quyền.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="hoi-dap" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHead align="left" eyebrow="Hỏi đáp" title={<>Câu hỏi<br />thường gặp</>} />
          <p className="mt-4 text-[#CBD6CF]" data-reveal="">
            Chưa thấy câu trả lời? Gọi{' '}
            <a href="tel:+84902383511" className="font-semibold text-[color:var(--lime-2)] hover:text-white">
              090 2383 511
            </a>{' '}
            hoặc email{' '}
            <a href="mailto:11nguoirasan@11onfield.com" className="font-semibold text-[color:var(--lime-2)] hover:text-white">
              11nguoirasan@11onfield.com
            </a>
            .
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                data-reveal=""
                style={revealDelay(i % 4)}
                className={`of-glass of-cut of-cut--sm ${isOpen ? 'is-open of-run' : 'of-run-hover'}`}
              >
                <button
                  type="button"
                  className="flex min-h-[64px] w-full items-center justify-between gap-4 px-5 py-3 text-left text-[16px] font-bold lg:px-6 lg:text-[17px]"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  {f.q}
                  <span className="of-plus of-neon shrink-0 text-[26px] leading-none">+</span>
                </button>
                <div className="of-acc-body">
                  <div>
                    <p className="px-5 pb-5 text-[#CBD6CF] lg:px-6">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
