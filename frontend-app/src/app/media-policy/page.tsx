import LandingFooter from "@/components/landing/LandingFooter";
import StickyNav from "@/components/landing/StickyNav";

export default function MediaPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-be-vietnam-pro)]">
      <StickyNav />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Media Policy */}
          <div className="mb-16">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
                Chính sách sử dụng hình ảnh/video 11 On Field
              </h1>
              <p className="text-gray-500 text-sm">
                Cập nhật lần cuối: 09/06/2026
              </p>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              Bằng việc đăng ký tham gia tuyển trạch, có mặt tại khu vực ghi
              hình hoặc tương tác với chương trình 11 On Field, cầu thủ (sau đây
              gọi là &quot;Người tham gia&quot;) đã đọc, hiểu và tự nguyện đồng
              ý với các điều khoản thuộc Chính sách sử dụng hình ảnh và video
              dưới đây của Đơn vị khai thác bản quyền và Sản xuất chương trình
              (sau đây gọi là &quot;Nhà sản xuất&quot;).
            </p>

            <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  1. Thu thập hình ảnh và video
                </h2>
                <p className="mb-3">
                  Nhà sản xuất chương trình 11 On Field và các đơn vị phối hợp
                  thực hiện được ủy quyền ghi lại hình ảnh, giọng nói, video và
                  các tư liệu kỹ thuật số khác của Người tham gia thông qua:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li>
                    <strong>Quá trình đăng ký trực tuyến:</strong> Các video
                    clip thể hiện kỹ năng bóng đá, hình ảnh chân dung do Người
                    tham gia chủ động tải lên hệ thống website.
                  </li>
                  <li>
                    <strong>Hoạt động tại hiện trường:</strong> Toàn bộ quá
                    trình tập luyện, thi đấu đối kháng, phỏng vấn hậu trường, và
                    các hoạt động bên lề tại sân vận động hoặc trường quay - do
                    đội ngũ quay phim của 11 On Field thực hiện.
                  </li>
                  <li>
                    <strong>Hệ thống ghi hình tự động:</strong> Hình ảnh thu
                    được từ camera toàn cảnh, hệ thống flycam trên không và tư
                    liệu phân tích kỹ thuật từ hệ thống công nghệ của chương
                    trình tại sân đấu.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  2. Mục đích sử dụng
                </h2>
                <ul className="space-y-2 list-none pl-0">
                  <li>
                    <strong>Đánh giá chuyên môn:</strong> Cung cấp tư liệu gốc
                    cho Ban chuyên môn tuyển trạch (Hội đồng Huấn luyện viên,
                    Chuyên viên phân tích chỉ số) tiến hành chấm điểm, sàng lọc
                    qua các bước tuyển chọn.
                  </li>
                  <li>
                    <strong>Sản xuất nội dung:</strong> Biên tập, cắt ghép hậu
                    kỳ để xây dựng thành các tập phim chính thức của chương
                    trình truyền hình thực tế phát sóng tới khán giả.
                  </li>
                  <li>
                    <strong>Quảng bá và Truyền thông:</strong> Thiết kế thành
                    các nội dung tiếp thị, ảnh teaser, trailer, video ngắn
                    (Reels, TikTok), poster thương mại nhằm gia tăng độ nhận
                    diện cho chương trình.
                  </li>
                  <li>
                    <strong>Tư liệu lưu trữ:</strong> Lưu giữ hồ sơ cầu thủ làm
                    cơ sở dữ liệu chuyển nhượng, giới thiệu tài năng cho các câu
                    lạc bộ bóng đá chuyên nghiệp trong chương trình hoặc sau khi
                    chương trình kết thúc.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  3. Phạm vi công khai
                </h2>
                <p className="mb-3">
                  Nhà sản xuất chương trình 11 On Field có quyền phát sóng, phân
                  phối và công bố các hình ảnh, video đã qua biên tập của Người
                  tham gia trên phạm vi toàn cầu thông qua tất cả các phương
                  tiện truyền thông hiện tại hoặc được phát triển trong tương
                  lai, bao gồm:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li>
                    <strong>Nền tảng Truyền hình & OTT:</strong> Phát sóng trên
                    kênh của các đối tác chiến lược (như VTV, FPT Play, Viettel
                    Media, TV360, Netflix) và ứng dụng di động chính thức.
                  </li>
                  <li>
                    <strong>Nền tảng Số (Mạng xã hội):</strong> Đăng tải trên
                    Fanpage Facebook, kênh YouTube, TikTok, và Website chính
                    thức của 11 On Field.
                  </li>
                  <li>
                    <strong>Hạ tầng trực tiếp ngoài trời:</strong> Trình chiếu
                    tại hệ thống màn hình LED bao quanh sân vận động, màn hình
                    LED delay tại các khán đài trong ngày diễn ra trận chung
                    kết.
                  </li>
                  <li>
                    <strong>Ấn phẩm truyền thông vật lý:</strong> In ấn trên
                    pano quảng cáo, backdrop thảm đỏ, tài liệu báo chí, vé xem
                    trận đấu, và các sản phẩm thương mại (merchandise) đi kèm
                    giải đấu.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  4. Quyền sở hữu và bản quyền
                </h2>
                <ul className="space-y-2 list-none pl-0">
                  <li>
                    <strong>Sở hữu trí tuệ độc quyền:</strong> Tất cả các thước
                    phim, hình ảnh, file âm thanh do ê-kíp của 11 On Field ghi
                    hình hoặc do Người tham gia cung cấp khi đã được biên tập
                    vào cấu trúc chương trình đều thuộc quyền sở hữu trí tuệ của
                    Đơn vị bản quyền 11 On Field là Công ty Cổ phần Đầu tư và
                    Giáo dục anyLEARN. Dữ liệu có thể được lưu trữ lâu dài hoặc
                    không xác định thời hạn nhằm phục vụ mục đích lưu trữ lịch
                    sử chương trình, thống kê, nghiên cứu, truyền thông, quản lý
                    hồ sơ vận động viên, bảo vệ quyền và lợi ích hợp pháp của
                    chương trình và các mục đích hợp pháp khác theo quy định
                    pháp luật.
                  </li>
                  <li>
                    <strong>Cấp phép sử dụng:</strong> Người tham gia đồng ý cấp
                    cho Nhà sản xuất quyền sử dụng hình ảnh/video cá nhân không
                    hủy ngang, miễn tiền tác quyền thương mại, và có giá trị
                    trên phạm vi toàn cầu. Nhà sản xuất có toàn quyền biên tập,
                    hiệu chỉnh hình ảnh, lồng nhạc nền, chèn hiệu ứng kỹ xảo sao
                    cho phù hợp với định hướng nghệ thuật và thể thao của chương
                    trình mà không cần phải duyệt lại qua Người tham gia.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  5. Quyền của người tham gia
                </h2>
                <ul className="space-y-2 list-none pl-0">
                  <li>
                    <strong>Yêu cầu đính chính dữ liệu:</strong> Người tham gia
                    có quyền yêu cầu Nhà sản xuất sửa đổi thông tin hiển thị kèm
                    theo hình ảnh (như viết sai tên, sai số áo, sai vị trí thi
                    đấu).
                  </li>
                  <li>
                    <strong>Yêu cầu gỡ bỏ giới hạn:</strong> Trong trường hợp
                    hình ảnh/video gốc chưa phát sóng vi phạm nghiêm trọng đến
                    thuần phong mỹ tục, bôi nhọ danh dự cá nhân ngoài ý muốn của
                    Đạo diễn hình, Người tham gia có quyền gửi đơn khiếu nại văn
                    bản yêu cầu Nhà sản xuất xem xét điều chỉnh hoặc gỡ bỏ.
                  </li>
                </ul>
                <p className="mt-3 text-sm text-gray-500 italic">
                  Lưu ý đặc thù: Do đặc thù ngành sản xuất truyền hình thực tế
                  mang tính chất liên kết chuỗi câu chuyện (drama), Nhà sản xuất
                  sẽ không giải quyết các yêu cầu gỡ bỏ hình ảnh/video từ phía
                  các thí sinh đã bị loại hoặc tự ý bỏ cuộc nếu hình ảnh đó nằm
                  trong tập phim đã được đóng gói hậu kỳ hoặc đã lên sóng chính
                  thức.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  6. Bảo mật và lưu trữ
                </h2>
                <ul className="space-y-2 list-none pl-0">
                  <li>
                    <strong>Lưu trữ an toàn:</strong> Các file hình ảnh, video
                    thô (Footages) chưa qua xử lý sẽ được bàn giao trực tiếp cho
                    Tổ Quản lý dữ liệu (Data Wrangler) lưu trữ trên các ổ cứng
                    chuyên dụng và hệ thống máy chủ đám mây có bảo mật mật mã.
                  </li>
                  <li>
                    <strong>Ngăn chặn rò rỉ:</strong> Nhà sản xuất cam kết quản
                    lý chặt chẽ, không để lộ các video hậu trường nhạy cảm, các
                    cảnh quay hỏng (ngã chấn thương nghiêm trọng, biểu cảm tiêu
                    cực chưa biên tập) ra ngoài mạng xã hội khi chưa có sự phê
                    duyệt của Tổng đạo diễn nhằm bảo vệ hình ảnh cho cầu thủ.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  7. Sử dụng bởi bên thứ ba
                </h2>
                <ul className="space-y-2 list-none pl-0">
                  <li>
                    <strong>Chia sẻ với Đối tác & Nhà tài trợ:</strong> Nhà sản
                    xuất có quyền chia sẻ hình ảnh/video chứa logo thương hiệu,
                    hoặc các clip trải nghiệm sản phẩm tại Booth tài trợ cho các
                    Nhà tài trợ chiến lược của chương trình để họ thực hiện các
                    chiến dịch truyền thông đồng hành.
                  </li>
                  <li>
                    <strong>Cam kết thương mại:</strong> Bên thứ ba khi sử dụng
                    hình ảnh/video do Nhà sản xuất cung cấp bắt buộc phải tuân
                    thủ đúng mục đích quảng bá cho chương trình 11 On Field,
                    không được tự ý khai thác hình ảnh riêng lẻ của cầu thủ cho
                    mục đích kinh doanh nhãn hàng độc lập khi chưa có sự thỏa
                    thuận ký kết ba bên (Nhà sản xuất – Thí sinh – Nhà tài trợ).
                  </li>
                </ul>
              </section>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Liên hệ với chúng tôi
            </h3>
            <p className="text-gray-700 mb-2">
              Nếu bạn có bất kỳ câu hỏi nào về chính sách sử dụng hình
              ảnh/video, vui lòng liên hệ:
            </p>
            <ul className="text-gray-700">
              <li>
                Email:{" "}
                <a
                  href="mailto:11nguoirasan@11onfield.com"
                  className="text-green-700 hover:underline"
                >
                  11nguoirasan@11onfield.com
                </a>
              </li>
              <li>
                Hotline:{" "}
                <a
                  href="tel:+84902383511"
                  className="text-green-700 hover:underline"
                >
                  090 2383 511
                </a>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
