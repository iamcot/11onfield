import LandingFooter from "@/components/landing/LandingFooter";
import StickyNav from "@/components/landing/StickyNav";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-roboto-condensed)]">
      <StickyNav />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Privacy Policy */}
          <div className="mb-16">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
                Chính sách bảo mật thông tin 11 On Field
              </h1>
              <p className="text-gray-500 text-sm">
                Cập nhật lần cuối: 09/06/2026
              </p>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              Chào mừng bạn đến với trang thông tin chính thức của chương trình
              truyền hình thực tế bóng đá 11 On Field. Chúng tôi cam kết bảo vệ
              tuyệt đối quyền riêng tư và an toàn dữ liệu cá nhân của người dùng
              khi truy cập website, đăng ký tuyển trạch, hoặc tham gia tương
              tác. Bản Chính sách bảo mật này giải thích cách chúng tôi thu
              thập, xử lý và bảo vệ thông tin của bạn.
            </p>

            <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  1. Thu thập thông tin
                </h2>
                <p className="mb-3">
                  Chúng tôi tiến hành thu thập các loại dữ liệu sau đây nhằm tối
                  ưu hóa trải nghiệm người dùng và phục vụ công tác tổ chức
                  chương trình:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li>
                    <strong>
                      Thông tin đăng ký tuyển trạch/tham gia sự kiện:
                    </strong>{" "}
                    Họ và tên, Ngày tháng năm sinh, Số CCCD/Hộ chiếu, Số điện
                    thoại, Email, Địa chỉ thường trú.
                  </li>
                  <li>
                    <strong>Thông tin hồ sơ cầu thủ (Thí sinh):</strong> Chiều
                    cao, cân nặng, vị trí thi đấu, lịch sử chấn thương, câu lạc
                    bộ/đội bóng từng tham gia, video/hình ảnh kỹ năng bóng đá do
                    thí sinh tự tải lên.
                  </li>
                  <li>
                    <strong>Thông tin tương tác trực tuyến:</strong> Các nội
                    dung bình luận, bình chọn (cho cầu thủ được yêu thích), khảo
                    sát trực tuyến hoặc câu hỏi gửi về cho Nhà sản xuất.
                  </li>
                  <li>
                    <strong>Thông tin kỹ thuật tự động:</strong> Địa chỉ IP,
                    loại trình duyệt, hệ điều hành, thời gian truy cập và các
                    trang kiểm tra (URL) mà bạn đã xem trên website.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  2. Mục đích sử dụng thông tin
                </h2>
                <p className="mb-3">
                  Thông tin cá nhân của bạn được 11 On Field sử dụng vào các mục
                  đích hợp pháp sau:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li>
                    <strong>Sàng lọc tuyển trạch:</strong> Phục vụ quy trình
                    chấm điểm, phân chia nhóm tuổi, sắp xếp sơ đồ và quản lý
                    dòng người trong các ngày hội tuyển chọn trực tiếp.
                  </li>
                  <li>
                    <strong>Xác thực danh tính:</strong> Xác nhận thông tin thí
                    sinh đăng ký, đối chiếu thủ tục bảo hiểm chấn thương và cấp
                    phát số áo thi đấu chính xác.
                  </li>
                  <li>
                    <strong>Liên lạc và Thông báo:</strong> Gửi kết quả tuyển
                    chọn, thời gian/địa điểm các vòng thi đấu tiếp theo, hoặc
                    thông báo lịch phát sóng chương trình qua Email/SMS.
                  </li>
                  <li>
                    <strong>Tương tác khán giả:</strong> Vận hành hệ thống bình
                    chọn trực tuyến, quản lý cổng soát vé điện tử (E-ticket) cho
                    các trận đấu giao hữu và vòng chung kết.
                  </li>
                  <li>
                    <strong>Truyền thông hợp pháp:</strong> Sử dụng hình
                    ảnh/video kỹ năng (đã được thí sinh đồng ý cấp quyền) để
                    dựng tư liệu quảng bá hoặc phát sóng trong tập phim truyền
                    hình thực tế.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  3. Phạm vi chia sẻ thông tin
                </h2>
                <p className="mb-3">
                  Chúng tôi cam kết không bán, cho thuê, trao đổi thông tin cá
                  nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại
                  riêng. Thông tin chỉ được chia sẻ trong phạm vi giới hạn sau:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li>
                    <strong>Ekip sản xuất và Đối tác phát sóng:</strong> Chia sẻ
                    với các nhà đồng sản xuất, Biên tập viên, Đội ngũ Kỹ thuật,
                    Ban chuyên môn tuyển trạch và các đơn vị phát sóng chính
                    thức để phục vụ công tác sản xuất.
                  </li>
                  <li>
                    <strong>Đơn vị bảo hiểm & Y tế:</strong> Cung cấp thông tin
                    nhân thân bắt buộc cho các đối tác y tế hiện trường và công
                    ty bảo hiểm thể thao nhằm bảo vệ quyền lợi cầu thủ khi xảy
                    ra sự cố chấn thương trên sân.
                  </li>
                  <li>
                    <strong>Cơ quan nhà nước có thẩm quyền:</strong> Khi có yêu
                    cầu bằng văn bản từ cơ quan pháp luật nhằm phục vụ công tác
                    an ninh trật tự, cấp phép sự kiện tại sân vận động.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  4. Bảo mật thông tin
                </h2>
                <p className="mb-3">
                  11 On Field áp dụng các biện pháp bảo mật kỹ thuật và tổ chức
                  nghiêm ngặt nhất để bảo vệ dữ liệu của bạn:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li>
                    <strong>Mã hóa dữ liệu:</strong> Toàn bộ dữ liệu truyền tải
                    giữa thiết bị của bạn và hệ thống của chúng tôi được mã hóa
                    qua giao thức an toàn SSL (Secure Sockets Layer).
                  </li>
                  <li>
                    <strong>Kiểm soát truy cập:</strong> Chỉ những nhân sự được
                    phân quyền cụ thể trong ekip mới có quyền truy cập dữ liệu
                    thí sinh theo nguyên tắc bảo mật tối đa.
                  </li>
                  <li>
                    <strong>Lưu trữ an toàn:</strong> Hệ thống cơ sở dữ liệu
                    được lưu trữ trên các máy chủ đám mây an toàn, có tường lửa
                    giám sát 24/7 và hệ thống sao lưu tự động ngăn chặn hoàn
                    toàn nguy cơ mất mát thông tin.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  5. Quyền của người dùng
                </h2>
                <ul className="space-y-2 list-none pl-0">
                  <li>
                    <strong>Quyền truy cập và Chỉnh sửa:</strong> Bạn có quyền
                    đăng nhập vào tài khoản trên website để kiểm tra, cập nhật
                    hoặc đính chính các thông tin sai lệch về hồ sơ cầu thủ của
                    mình.
                  </li>
                  <li>
                    <strong>Quyền rút lại sự đồng ý / Xóa thông tin:</strong>{" "}
                    Bạn có thể yêu cầu Ban tổ chức hủy bỏ tư cách tham gia tuyển
                    chọn và xóa bỏ vĩnh viễn các thông tin dữ liệu nhạy cảm đã
                    cung cấp bằng cách liên hệ với chúng tôi qua kênh hỗ trợ
                    chính thức.
                  </li>
                </ul>
                <p className="mt-3 text-sm text-gray-500 italic">
                  Lưu ý: Việc xóa thông tin đăng ký trong giai đoạn chương trình
                  đang sản xuất có thể dẫn đến việc thí sinh bị tước quyền tham
                  gia các bước thi đấu tiếp theo do không đủ điều kiện đối chiếu
                  nhân thân.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  6. Cookies và công nghệ theo dõi
                </h2>
                <p className="mb-3">
                  Website của chúng tôi sử dụng &quot;Cookies&quot; (tệp văn bản
                  nhỏ đặt trên máy tính của bạn) để nhận diện trình duyệt, ghi
                  nhớ trạng thái đăng nhập tài khoản và phân tích lưu lượng truy
                  cập trực tuyến.
                </p>
                <p className="mb-3">
                  Thông qua cookies, chúng tôi có thể cải tiến giao diện web,
                  tối ưu tốc độ tải trang và hiển thị các nội dung liên quan sát
                  nhất đến nhu cầu xem bóng đá/giải trí của bạn.
                </p>
                <p>
                  Bạn hoàn toàn có thể lựa chọn tắt tính năng nhận cookies trong
                  phần cài đặt của trình duyệt, tuy nhiên điều này có thể làm
                  ảnh hưởng đến trải nghiệm mượt mà của một số tính năng tương
                  tác trực tiếp trên trang.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  7. Thay đổi chính sách
                </h2>
                <p className="mb-3">
                  Bản Chính sách bảo mật thông tin này có thể được cập nhật,
                  điều chỉnh bất cứ lúc nào để phù hợp với tiến độ vận hành thực
                  tế của chương trình hoặc các thay đổi về mặt luật pháp của Nhà
                  nước.
                </p>
                <p className="mb-3">
                  Mọi thay đổi lớn sẽ được chúng tôi đăng tải công khai ngay tại
                  trang này kèm theo mốc thời gian &quot;Cập nhật mới nhất&quot;
                  ở đầu trang để người dùng dễ dàng theo dõi.
                </p>
                <p>
                  Việc bạn tiếp tục truy cập website và sử dụng dịch vụ sau khi
                  các chỉnh sửa được công bố đồng nghĩa với việc bạn đồng ý chấp
                  thuận các nội dung thay đổi đó.
                </p>
              </section>
            </div>
          </div>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Liên hệ với chúng tôi
            </h3>
            <p className="text-gray-700 mb-2">
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ:
            </p>
            <ul className="text-gray-700 space-y-1">
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
