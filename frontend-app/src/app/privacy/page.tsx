import LandingFooter from "@/components/landing/LandingFooter";
import StickyNav from "@/components/landing/StickyNav";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-roboto-condensed)]">
      <StickyNav />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
              Chính sách bảo mật thông tin
            </h1>
            <p className="text-gray-600">
              Cập nhật lần cuối: [Ngày tháng năm]
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                1. Thu thập thông tin
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về loại thông tin thu thập từ người dùng...]
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                2. Mục đích sử dụng thông tin
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về mục đích sử dụng thông tin cá nhân...]
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                3. Phạm vi chia sẻ thông tin
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về phạm vi chia sẻ thông tin với bên thứ ba...]
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                4. Bảo mật thông tin
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về các biện pháp bảo mật thông tin...]
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                5. Quyền của người dùng
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về quyền truy cập, chỉnh sửa, xóa thông tin cá nhân...]
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                6. Cookies và công nghệ theo dõi
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về việc sử dụng cookies...]
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                7. Thay đổi chính sách
              </h2>
              <p className="text-gray-700 leading-relaxed">
                [Nội dung về cách thông báo khi có thay đổi chính sách...]
              </p>
            </section>
          </div>

          {/* Contact */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Liên hệ với chúng tôi
            </h3>
            <p className="text-gray-700 mb-2">
              Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật, vui lòng liên hệ:
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
