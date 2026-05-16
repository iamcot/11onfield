import LandingFooter from "@/components/landing/LandingFooter";
import StickyNav from "@/components/landing/StickyNav";

export default function MediaPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-roboto-condensed)]">
      <StickyNav />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
              Chính sách sử dụng hình ảnh/video
            </h1>
            <p className="text-gray-600">
              Cập nhật lần cuối: [Ngày tháng năm]
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                1. Thu thập hình ảnh và video
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về việc thu thập hình ảnh, video của cầu thủ...]
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                2. Mục đích sử dụng
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về mục đích sử dụng hình ảnh/video (đánh giá, quảng bá, truyền thông...)...]
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                3. Phạm vi công khai
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về phạm vi công khai của hình ảnh/video (website, mạng xã hội, truyền hình...)...]
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                4. Quyền sở hữu và bản quyền
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về quyền sở hữu hình ảnh/video và cách thức cấp phép...]
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                5. Quyền của người tham gia
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về quyền yêu cầu gỡ bỏ, chỉnh sửa hình ảnh/video...]
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                6. Bảo mật và lưu trữ
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về cách bảo mật và lưu trữ hình ảnh/video...]
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                7. Sử dụng bởi bên thứ ba
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về việc chia sẻ với đối tác, nhà tài trợ...]
              </p>
            </section>
          </div>

          {/* Contact */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Liên hệ với chúng tôi
            </h3>
            <p className="text-gray-700 mb-2">
              Nếu bạn có bất kỳ câu hỏi nào về chính sách sử dụng hình ảnh/video, vui lòng liên hệ:
            </p>
            <ul className="text-gray-700">
              <li>Email: <a href="mailto:11nguoirasan@11onfield.com" className="text-green-700 hover:underline">11nguoirasan@11onfield.com</a></li>
              <li>Hotline: <a href="tel:+84902383511" className="text-green-700 hover:underline">090 2383 511</a></li>
            </ul>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
