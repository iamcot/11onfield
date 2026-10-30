import type { LegalDoc } from '../types';

const doc: LegalDoc = {
  title: 'Chính sách bảo mật thông tin 11 On Field',
  intro: ['Chào mừng bạn đến với trang thông tin chính thức của chương trình truyền hình thực tế bóng đá 11 On Field. Chúng tôi cam kết bảo vệ tuyệt đối quyền riêng tư và an toàn dữ liệu cá nhân của người dùng khi truy cập website, đăng ký tuyển trạch, hoặc tham gia tương tác. Bản Chính sách bảo mật này giải thích cách chúng tôi thu thập, xử lý và bảo vệ thông tin của bạn.'],
  sections: [
    {
      title: '1. Thu thập thông tin',
      lead: ['Chúng tôi tiến hành thu thập các loại dữ liệu sau đây nhằm tối ưu hóa trải nghiệm người dùng và phục vụ công tác tổ chức chương trình:'],
      items: [
        ['Thông tin đăng ký tuyển trạch/tham gia sự kiện:', 'Họ và tên, Ngày tháng năm sinh, Số CCCD/Hộ chiếu, Số điện thoại, Email, Địa chỉ thường trú.'],
        ['Thông tin hồ sơ cầu thủ (Thí sinh):', 'Chiều cao, cân nặng, vị trí thi đấu, lịch sử chấn thương, câu lạc bộ/đội bóng từng tham gia, video/hình ảnh kỹ năng bóng đá do thí sinh tự tải lên.'],
        ['Thông tin tương tác trực tuyến:', 'Các nội dung bình luận, bình chọn (cho cầu thủ được yêu thích), khảo sát trực tuyến hoặc câu hỏi gửi về cho Nhà sản xuất.'],
        ['Thông tin kỹ thuật tự động:', 'Địa chỉ IP, loại trình duyệt, hệ điều hành, thời gian truy cập và các trang kiểm tra (URL) mà bạn đã xem trên website.'],
      ],
    },
    {
      title: '2. Mục đích sử dụng thông tin',
      lead: ['Thông tin cá nhân của bạn được 11 On Field sử dụng vào các mục đích hợp pháp sau:'],
      items: [
        ['Sàng lọc tuyển trạch:', 'Phục vụ quy trình chấm điểm, phân chia nhóm tuổi, sắp xếp sơ đồ và quản lý dòng người trong các ngày hội tuyển chọn trực tiếp.'],
        ['Xác thực danh tính:', 'Xác nhận thông tin thí sinh đăng ký, đối chiếu thủ tục bảo hiểm chấn thương và cấp phát số áo thi đấu chính xác.'],
        ['Liên lạc và Thông báo:', 'Gửi kết quả tuyển chọn, thời gian/địa điểm các vòng thi đấu tiếp theo, hoặc thông báo lịch phát sóng chương trình qua Email/SMS.'],
        ['Tương tác khán giả:', 'Vận hành hệ thống bình chọn trực tuyến, quản lý cổng soát vé điện tử (E-ticket) cho các trận đấu giao hữu và vòng chung kết.'],
        ['Truyền thông hợp pháp:', 'Sử dụng hình ảnh/video kỹ năng (đã được thí sinh đồng ý cấp quyền) để dựng tư liệu quảng bá hoặc phát sóng trong tập phim truyền hình thực tế.'],
      ],
    },
    {
      title: '3. Phạm vi chia sẻ thông tin',
      lead: ['Chúng tôi cam kết không bán, cho thuê, trao đổi thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại riêng. Thông tin chỉ được chia sẻ trong phạm vi giới hạn sau:'],
      items: [
        ['Ekip sản xuất và Đối tác phát sóng:', 'Chia sẻ với các nhà đồng sản xuất, Biên tập viên, Đội ngũ Kỹ thuật, Ban chuyên môn tuyển trạch và các đơn vị phát sóng chính thức để phục vụ công tác sản xuất.'],
        ['Đơn vị bảo hiểm & Y tế:', 'Cung cấp thông tin nhân thân bắt buộc cho các đối tác y tế hiện trường và công ty bảo hiểm thể thao nhằm bảo vệ quyền lợi cầu thủ khi xảy ra sự cố chấn thương trên sân.'],
        ['Cơ quan nhà nước có thẩm quyền:', 'Khi có yêu cầu bằng văn bản từ cơ quan pháp luật nhằm phục vụ công tác an ninh trật tự, cấp phép sự kiện tại sân vận động.'],
      ],
    },
    {
      title: '4. Bảo mật thông tin',
      lead: ['11 On Field áp dụng các biện pháp bảo mật kỹ thuật và tổ chức nghiêm ngặt nhất để bảo vệ dữ liệu của bạn:'],
      items: [
        ['Mã hóa dữ liệu:', 'Toàn bộ dữ liệu truyền tải giữa thiết bị của bạn và hệ thống của chúng tôi được mã hóa qua giao thức an toàn SSL (Secure Sockets Layer).'],
        ['Kiểm soát truy cập:', 'Chỉ những nhân sự được phân quyền cụ thể trong ekip mới có quyền truy cập dữ liệu thí sinh theo nguyên tắc bảo mật tối đa.'],
        ['Lưu trữ an toàn:', 'Hệ thống cơ sở dữ liệu được lưu trữ trên các máy chủ đám mây an toàn, có tường lửa giám sát 24/7 và hệ thống sao lưu tự động ngăn chặn hoàn toàn nguy cơ mất mát thông tin.'],
      ],
    },
    {
      title: '5. Quyền của người dùng',
      items: [
        ['Quyền truy cập và Chỉnh sửa:', 'Bạn có quyền đăng nhập vào tài khoản trên website để kiểm tra, cập nhật hoặc đính chính các thông tin sai lệch về hồ sơ cầu thủ của mình.'],
        ['Quyền rút lại sự đồng ý / Xóa thông tin:', 'Bạn có thể yêu cầu Ban tổ chức hủy bỏ tư cách tham gia tuyển chọn và xóa bỏ vĩnh viễn các thông tin dữ liệu nhạy cảm đã cung cấp bằng cách liên hệ với chúng tôi qua kênh hỗ trợ chính thức.'],
      ],
      notes: ['Lưu ý: Việc xóa thông tin đăng ký trong giai đoạn chương trình đang sản xuất có thể dẫn đến việc thí sinh bị tước quyền tham gia các bước thi đấu tiếp theo do không đủ điều kiện đối chiếu nhân thân.'],
    },
    {
      title: '6. Cookies và công nghệ theo dõi',
      lead: ['Website của chúng tôi sử dụng "Cookies" (tệp văn bản nhỏ đặt trên máy tính của bạn) để nhận diện trình duyệt, ghi nhớ trạng thái đăng nhập tài khoản và phân tích lưu lượng truy cập trực tuyến.', 'Thông qua cookies, chúng tôi có thể cải tiến giao diện web, tối ưu tốc độ tải trang và hiển thị các nội dung liên quan sát nhất đến nhu cầu xem bóng đá/giải trí của bạn.', 'Bạn hoàn toàn có thể lựa chọn tắt tính năng nhận cookies trong phần cài đặt của trình duyệt, tuy nhiên điều này có thể làm ảnh hưởng đến trải nghiệm mượt mà của một số tính năng tương tác trực tiếp trên trang.'],
    },
    {
      title: '7. Thay đổi chính sách',
      lead: ['Bản Chính sách bảo mật thông tin này có thể được cập nhật, điều chỉnh bất cứ lúc nào để phù hợp với tiến độ vận hành thực tế của chương trình hoặc các thay đổi về mặt luật pháp của Nhà nước.', 'Mọi thay đổi lớn sẽ được chúng tôi đăng tải công khai ngay tại trang này kèm theo mốc thời gian "Cập nhật mới nhất" ở đầu trang để người dùng dễ dàng theo dõi.', 'Việc bạn tiếp tục truy cập website và sử dụng dịch vụ sau khi các chỉnh sửa được công bố đồng nghĩa với việc bạn đồng ý chấp thuận các nội dung thay đổi đó.'],
    },
  ],
  contact: 'Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ:',
};

export default doc;
