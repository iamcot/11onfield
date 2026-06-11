import LandingFooter from "@/components/landing/LandingFooter";
import StickyNav from "@/components/landing/StickyNav";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-be-vietnam-pro)]">
      <StickyNav />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
              Điều khoản &amp; Quy chế tham gia
            </h1>
            <p className="text-gray-500 text-sm">
              Cập nhật lần cuối: 07/06/2026
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                1. Giới thiệu
              </h2>
              <ul className="space-y-2 list-none pl-0">
                <li>
                  <strong>Mục đích:</strong> Quy chế này quy định các điều kiện,
                  quyền lợi và nghĩa vụ của cầu thủ khi tham gia chương trình 11
                  Người Ra Sân - 11 On Field.
                </li>
                <li>
                  <strong>Mục tiêu:</strong> Tạo sân chơi chuyên nghiệp, an toàn
                  và lành mạnh cho các tài năng trẻ từ 16 đến 21 tuổi.
                </li>
                <li>
                  <strong>Hiệu lực:</strong> Điều khoản áp dụng bắt đầu từ thời
                  điểm cầu thủ ký tên vào đơn đăng ký cho đến khi chương trình
                  kết thúc.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                2. Điều kiện tham gia
              </h2>
              <ul className="space-y-2 list-none pl-0">
                <li>
                  <strong>Độ tuổi:</strong> Cầu thủ phải có ngày sinh trong
                  khoảng từ 01/01/2005 đến 31/12/2010 (Đủ từ 16 đến dưới 22
                  tuổi).
                </li>
                <li>
                  <strong>Đại diện pháp lý:</strong> Cầu thủ dưới 18 tuổi bắt
                  buộc phải có văn bản đồng ý và chữ ký xác nhận của cha mẹ hoặc
                  người giám hộ hợp pháp.
                </li>
                <li>
                  <strong>Giấy tờ định danh:</strong> Phải cung cấp bản sao Căn
                  cước công dân (CCCD) hoặc Hộ chiếu còn hạn để ban tổ chức
                  (BTC) đối chiếu và lưu hồ sơ.
                </li>
                <li>
                  <strong>Sức khỏe:</strong> Có giấy khám sức khỏe đủ điều kiện
                  tham gia hoạt động bóng đá đối kháng cường độ cao do cơ quan y
                  tế cấp xã/phường trở lên cấp trong vòng 03 tháng gần nhất.
                </li>
                <li>
                  <strong>Tình trạng tư pháp:</strong> Không trong thời gian bị
                  cấm thi đấu của Liên đoàn bóng đá hoặc đang chịu các hình thức
                  kỷ luật, án hình sự khác.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                3. Quyền và nghĩa vụ của người tham gia
              </h2>
              <ul className="space-y-2 list-none pl-0">
                <li>
                  <strong>Quyền lợi chuyên môn:</strong> Được ra sân thi đấu,
                  tập luyện dưới sự hướng dẫn của đội ngũ huấn luyện viên (HLV)
                  và sử dụng cơ sở vật chất của chương trình.
                </li>
                <li>
                  <strong>Quyền lợi bảo hiểm:</strong> Được tham gia chương
                  trình bảo hiểm tai nạn thể thao theo phạm vi, điều kiện và hạn
                  mức do BTC công bố tại từng thời điểm.
                </li>
                <li>
                  <strong>Nghĩa vụ tuân thủ:</strong> Có trách nhiệm tuân thủ
                  điều lệ giải, tuân thủ hướng dẫn chuyên môn của Ban huấn luyện
                  và các quyết định trọng tài trên sân.
                </li>
                <li>
                  <strong>Đạo đức tác phong:</strong> Giữ gìn hình ảnh, không
                  tham gia cá độ, không sử dụng chất kích thích (doping) và nói
                  không với bạo lực sân cỏ.
                </li>
                <li>
                  <strong>Nghĩa vụ truyền thông:</strong> Tham gia các hoạt động
                  chụp ảnh, phỏng vấn, truyền thông quảng bá cho chương trình
                  khi có yêu cầu từ BTC.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                4. Quy định về Thi đấu, Huấn luyện &amp; Ghi hình
              </h2>
              <ul className="space-y-2 list-none pl-0">
                <li>
                  <strong>Luật thi đấu chính thức:</strong> Chương trình áp dụng
                  nghiêm ngặt Luật thi đấu bóng đá 11 người hiện hành do Liên
                  đoàn Bóng đá Việt Nam (VFF) và Liên đoàn Bóng đá Thế giới
                  (FIFA) ban hành.
                </li>
                <li>
                  <strong>Tính linh hoạt của định dạng:</strong> Do đặc thù của
                  chương trình truyền hình thực tế, Ban tổ chức (BTC) toàn quyền
                  điều chỉnh thời lượng trận đấu, tiến độ ghi hình và cấu trúc
                  các thử thách chuyên môn để tối ưu hóa chất lượng sản xuất tại
                  từng giai đoạn.
                </li>
                <li>
                  <strong>Cam kết lịch trình ghi hình:</strong> Cầu thủ có nghĩa
                  vụ phối hợp và cam kết tuân thủ thời gian ghi hình linh hoạt
                  theo toàn bộ lịch trình tác nghiệp do Đơn vị sản xuất phân
                  công.
                </li>
                <li>
                  <strong>Tiêu chuẩn trang thiết bị:</strong> Khi ra sân, cầu
                  thủ bắt buộc phải sử dụng đồng phục do BTC cung cấp, mang giày
                  đinh chuyên dụng (phù hợp với mặt sân cỏ tự nhiên/nhân tạo) và
                  bắt buộc đeo bọc ống quyển (bảo vệ ống đồng) để đảm bảo an
                  toàn thi đấu.
                </li>
                <li>
                  <strong>Quy định kỷ luật hiện diện:</strong> Cầu thủ phải có
                  mặt tại địa điểm tập luyện, thi đấu hoặc phim trường ít nhất
                  45 phút trước giờ bấm máy. Mọi hành vi đi trễ hoặc vắng mặt
                  không có lý do chính đáng quá 02 lần sẽ bị áp dụng các hình
                  thức kỷ luật của chương trình.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                5. Sức khỏe &amp; miễn trừ trách nhiệm
              </h2>
              <ul className="space-y-2 list-none pl-0">
                <li>
                  <strong>Cam kết thể trạng:</strong> Cầu thủ có trách nhiệm
                  trung thực khai báo tiền sử bệnh lý, chấn thương hoặc các vấn
                  đề sức khỏe có thể ảnh hưởng đến quá trình tham gia chương
                  trình.
                </li>
                <li>
                  <strong>Xử lý chấn thương:</strong> Đơn vị sản xuất chịu trách
                  nhiệm sơ cứu, chi trả chi phí y tế ban đầu (trong hạn mức bảo
                  hiểm giải đấu cung cấp) nếu xảy ra chấn thương trong các buổi
                  ghi hình chính thức.
                </li>
                <li>
                  <strong>Miễn trừ trách nhiệm:</strong> Cầu thủ tự nguyện chịu
                  mọi rủi ro chấn thương thông thường của bộ môn bóng đá 11
                  người. Đơn vị sản xuất được miễn trừ trách nhiệm pháp lý đối
                  với các tổn thất dài hạn, tai nạn do cầu thủ tự ý tập luyện
                  ngoài giờ hoặc không tuân thủ chỉ dẫn an toàn.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                6. Quyền hình ảnh &amp; phát sóng
              </h2>
              <ul className="space-y-2 list-none pl-0">
                <li>
                  <strong>Chuyển giao quyền sở hữu:</strong> Người tham gia đồng
                  ý cho Đơn vị sản xuất toàn quyền ghi hình, khai thác, sử dụng,
                  biên tập, phát sóng và thương mại hóa hình ảnh, giọng nói và
                  dữ liệu phát sinh trong quá trình tham gia chương trình trên
                  mọi nền tảng truyền thông hiện tại và tương lai mà không phát
                  sinh thêm nghĩa vụ thanh toán.
                </li>
                <li>
                  <strong>Phạm vi khai thác:</strong> Đơn vị sản xuất có toàn
                  quyền sử dụng các tư liệu này trên mọi nền tảng phát sóng
                  (Truyền hình, YouTube, Facebook, TikTok...) và cho các mục
                  đích thương mại, quảng cáo.
                </li>
                <li>
                  <strong>Thời hạn áp dụng:</strong> Quyền sở hữu và khai thác
                  hình ảnh của đơn vị sản xuất đối với các tư liệu trong chương
                  trình có giá trị vĩnh viễn, không bị giới hạn bởi thời gian
                  hay không gian địa lý.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                7. Bảo mật thông tin chương trình
              </h2>
              <ul className="space-y-2 list-none pl-0">
                <li>
                  <strong>Thông tin bảo mật:</strong> Bao gồm kết quả trận đấu,
                  cầu thủ bị loại, nội dung kịch bản thử thách, hậu trường và
                  các dữ liệu tài chính của chương trình chưa được phát sóng
                  chính thức.
                </li>
                <li>
                  <strong>Nghĩa vụ cầu thủ:</strong> Cầu thủ tuyệt đối không
                  được tiết lộ, chia sẻ bất kỳ thông tin bảo mật nào cho bên thứ
                  ba, kể cả người thân, hoặc đăng tải lên mạng xã hội cá nhân.
                </li>
                <li>
                  <strong>Chế tài vi phạm:</strong> Mọi hành vi làm rò rỉ (leak)
                  thông tin sẽ bị tước quyền tham gia chương trình ngay lập tức,
                  hủy bỏ toàn bộ giải thưởng và phải bồi thường thiệt hại tài
                  chính theo mức quy định.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                8. Quy tắc ứng xử &amp; truyền thông
              </h2>
              <ul className="space-y-2 list-none pl-0">
                <li>
                  <strong>Phát ngôn truyền thông:</strong> Cầu thủ không được tự
                  ý nhận trả lời phỏng vấn báo chí hoặc thực hiện các buổi
                  livestream chia sẻ về chương trình khi chưa có sự phê duyệt
                  bằng văn bản từ bộ phận truyền thông của Ban tổ chức (BTC).
                </li>
                <li>
                  <strong>Chuẩn mực hành vi:</strong> Cấm tuyệt đối các hành vi
                  bạo lực sân cỏ, gian lận, dàn xếp tỷ số hoặc có các phát ngôn
                  phân biệt chủng tộc, tôn giáo làm ảnh hưởng đến uy tín chương
                  trình.
                </li>
                <li>
                  <strong>Quản lý mạng xã hội:</strong> Trong suốt thời gian
                  phát sóng, cầu thủ phải đảm bảo các bài đăng cá nhân không vi
                  phạm thuần phong mỹ tục, không tương tác tiêu cực hoặc kích
                  động tranh cãi (anti-fans) làm ảnh hưởng xấu đến thương hiệu
                  chương trình.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                9. Dữ liệu cá nhân &amp; hệ thống tuyển trạch
              </h2>
              <ul className="space-y-2 list-none pl-0">
                <li>
                  <strong>Thu thập dữ liệu:</strong> Cầu thủ đồng ý cho BTC lưu
                  trữ và phân tích các chỉ số chuyên môn sinh trắc học như:
                  chiều cao, cân nặng, tốc độ, bản đồ nhiệt, tỷ lệ chuyền bóng
                  thu thập được trong các trận đấu.
                </li>
                <li>
                  <strong>Mục đích chia sẻ:</strong> Các dữ liệu chuyên môn này
                  sẽ được số hóa và đồng bộ vào hệ thống dữ liệu tuyển trạch của
                  chương trình nhằm gửi tới các Câu lạc bộ chuyên nghiệp, Học
                  viện bóng đá và cơ hội chuyển nhượng cho cầu thủ tham gia
                  chương trình.
                </li>
                <li>
                  <strong>Bảo vệ quyền riêng tư:</strong> Các thông tin nhạy cả m
                  khác (số CCCD, địa chỉ, số điện thoại) được cam kết bảo mật
                  theo quy định của pháp luật về Bảo vệ dữ liệu cá nhân.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                10. Giải thưởng và quyền lợi
              </h2>
              <ul className="space-y-2 list-none pl-0">
                <li>
                  <strong>Giải thưởng hàng tuần (Weekly Awards):</strong> Cầu
                  thủ xuất sắc nhất tuần sẽ được vinh danh danh hiệu "Player of
                  the Week" dựa theo đánh giá của Hội đồng chuyên môn. Người
                  chiến thắng sẽ nhận phần thưởng theo công bố chính thức của
                  BTC.
                </li>
                <li>
                  <strong>
                    Cầu thủ xuất sắc nhất chương trình (Best Player)
                  </strong>{" "}
                  sẽ nhận giải thưởng gồm Cúp vàng danh giá, danh hiệu cá nhân
                  chính thức, phần thưởng hiện kim và quà tặng giá trị.
                </li>
                <li>
                  <strong>Cơ hội phát triển:</strong> Các cầu thủ xuất sắc có cơ
                  hội được giới thiệu đến các câu lạc bộ chuyên nghiệp, các học
                  viện bóng đá hoặc nhận học bổng huấn luyện chuyên sâu.
                </li>
                <li>
                  <strong>Chứng nhận:</strong> Tất cả cầu thủ hoàn thành chương
                  trình đều được cấp Giấy chứng nhận tham gia chính thức từ BTC.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                11. Điều khoản chung
              </h2>
              <ul className="space-y-2 list-none pl-0">
                <li>
                  <strong>Bất khả kháng:</strong> BTC không chịu trách nhiệm bồi
                  thường nếu lịch trình bị hoãn, hủy do thiên tai, dịch bệnh,
                  hoặc quyết định của cơ quan nhà nước có thẩm quyền.
                </li>
                <li>
                  <strong>Xử lý vi phạm:</strong> Mọi hành vi vi phạm điều khoản
                  này sẽ bị xử lý từ nhắc nhở, kỷ luật, loại khỏi chương trình
                  và chuyển cơ quan chức năng nếu vi phạm pháp luật.
                </li>
                <li>
                  <strong>Sửa đổi quy chế:</strong> BTC bảo lưu quyền sửa đổi,
                  bổ sung điều khoản này vào bất kỳ lúc nào trong trường hợp cần
                  thiết để đảm bảo an toàn, chuyên môn, sản xuất và sẽ thông báo
                  trước cho cầu thủ ít nhất 24 giờ trước khi áp dụng.
                </li>
              </ul>
            </section>
          </div>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Liên hệ với chúng tôi
            </h3>
            <p className="text-gray-700 mb-2">
              Nếu bạn có bất kỳ câu hỏi nào về điều khoản tham gia, vui lòng
              liên hệ:
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
