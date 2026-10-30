'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight } from '../home/ui';

const CONTACT_EMAIL = 'trinh@11onfield.com';
const INTERESTS = ['Tài trợ', 'Mua quyền khai thác IP', 'Đối tác truyền thông', 'Đối tác chuyên môn'];

export default function PartnerContact() {
  const [sent, setSent] = useState(false);

  // No partner-lead API exists yet, so the form opens a pre-filled email to the project lead.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const interests = f.getAll('interest').join(', ') || 'Chưa chọn';
    const body = [
      `Họ và tên: ${f.get('name')}`,
      `Doanh nghiệp: ${f.get('company')}`,
      `Email: ${f.get('email')}`,
      `Số điện thoại: ${f.get('phone')}`,
      `Hình thức quan tâm: ${interests}`,
      '',
      String(f.get('message') || ''),
    ].join('\n');
    const subject = `[11 On Field] Yêu cầu hồ sơ hợp tác – ${f.get('company')}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <section id="lien-he" className="relative z-[2] px-4 pb-20 pt-10 lg:px-6 lg:pb-28">
      <div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div data-reveal="left" className="lg:pt-6">
          <div className="of-eyebrow of-eyebrow--left">Hợp tác kiến tạo tương lai</div>
          <h2 className="of-display mt-4 text-[44px] text-white lg:text-[64px]" style={{ textShadow: '0 0 30px rgba(166,227,90,.35)' }}>
            Đừng chỉ xem lịch sử được viết nên.
            <br />
            <span className="of-neon">Hãy cùng chúng tôi cầm bút.</span>
          </h2>
          <div className="of-glass of-cut of-cut--sm mt-8 flex flex-col gap-2 p-5 text-[15px]">
            <div className="of-display text-[24px]">Đặng Thị Hoài Trinh</div>
            <a href="tel:+84908845258" className="text-[#D5DED8] hover:text-[color:var(--lime-2)]">
              +84 908 845 258
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#D5DED8] hover:text-[color:var(--lime-2)]">
              {CONTACT_EMAIL}
            </a>
            <a href="https://11onfield.com" className="text-[#D5DED8] hover:text-[color:var(--lime-2)]">
              11onfield.com
            </a>
          </div>
        </div>

        <form data-reveal="right" onSubmit={onSubmit} className="of-glass of-cut of-cut--lg of-run of-cut--b2 p-6 lg:p-8">
          <div className="of-hud text-[11px] text-[color:var(--lime)]">Investor &amp; sponsor kit</div>
          <h3 className="of-display mt-1 text-[34px] lg:text-[40px]">Nhận hồ sơ hợp tác</h3>
          <p className="mt-1 text-[14.5px] text-[#CBD6CF]">Format Bible tóm tắt, bảng quyền lợi tài trợ và lịch sản xuất gửi trong 24 giờ làm việc.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="of-hud text-[10px] text-[color:var(--mute)]">Họ và tên</span>
              <input name="name" required autoComplete="name" className="of-field mt-1" />
            </label>
            <label className="block">
              <span className="of-hud text-[10px] text-[color:var(--mute)]">Doanh nghiệp</span>
              <input name="company" required autoComplete="organization" className="of-field mt-1" />
            </label>
            <label className="block">
              <span className="of-hud text-[10px] text-[color:var(--mute)]">Email</span>
              <input name="email" type="email" required autoComplete="email" className="of-field mt-1" />
            </label>
            <label className="block">
              <span className="of-hud text-[10px] text-[color:var(--mute)]">Số điện thoại</span>
              <input name="phone" type="tel" autoComplete="tel" className="of-field mt-1" />
            </label>
          </div>

          <fieldset className="mt-4">
            <legend className="of-hud text-[10px] text-[color:var(--mute)]">Hình thức quan tâm</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map((x) => (
                <label key={x} className="of-option relative">
                  <input type="checkbox" name="interest" value={x} />
                  <span>{x}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 block">
            <span className="of-hud text-[10px] text-[color:var(--mute)]">Lời nhắn</span>
            <textarea name="message" rows={4} className="of-field mt-1" />
          </label>

          <button type="submit" className="of-btn mt-5 w-full sm:w-auto">
            Gửi &amp; nhận hồ sơ <ArrowRight />
          </button>
          <p className="mt-3 text-[12.5px] text-[#9FB0A6]">
            {sent
              ? `Ứng dụng email của bạn vừa được mở với nội dung đã điền. Nếu không thấy, vui lòng gửi trực tiếp tới ${CONTACT_EMAIL}.`
              : 'Thông tin chỉ dùng để liên hệ hợp tác, không chia sẻ cho bên thứ ba.'}
          </p>
        </form>
      </div>
    </section>
  );
}
