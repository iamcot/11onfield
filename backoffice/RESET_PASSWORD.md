# Reset Password Utility

Tiện ích để reset mật khẩu người dùng qua command line.

## Cách sử dụng

### Trên Production Server

```bash
cd /opt/11of/backend/current/scripts
./reset-password.sh <phone> <new_password>
```

**Ví dụ:**

```bash
# Reset password cho admin
cd /opt/11of/backend/current/scripts
./reset-password.sh admin newpassword123

# Reset password cho user với số điện thoại
./reset-password.sh 0123456789 mySecurePass456
```

### Trên Development Environment

```bash
cd /path/to/11of/backoffice/scripts
./reset-password.sh <phone> <new_password>
```

**Ví dụ:**

```bash
# Reset password cho admin
./reset-password.sh admin newpassword123

# Reset password cho user với số điện thoại
./reset-password.sh 0123456789 mySecurePass456
```

### Phương pháp 2: Chạy trực tiếp với Maven

```bash
cd /path/to/11of/backoffice

mvn exec:java \
  -Dexec.mainClass="com.elevenof.backoffice.util.SimplePasswordReset" \
  -Dexec.args="<phone> <new_password>" \
  -Dexec.cleanupDaemonThreads=false
```

## Yêu cầu

- Mật khẩu mới phải có ít nhất 6 ký tự
- Số điện thoại phải tồn tại trong hệ thống
- Database phải đang chạy và có thể kết nối được

## Lưu ý

- Script này sẽ kết nối đến database được cấu hình trong `application.properties`
- Mật khẩu sẽ được tự động mã hóa bằng BCrypt trước khi lưu vào database
- Sau khi reset thành công, người dùng có thể đăng nhập ngay với mật khẩu mới

## Xử lý lỗi

Nếu gặp lỗi "User not found":
- Kiểm tra lại số điện thoại/username đã nhập
- Xác nhận user tồn tại trong database

Nếu gặp lỗi kết nối database:
- Kiểm tra database đã chạy chưa
- Xác nhận thông tin kết nối trong `application.properties`

## Ví dụ đầy đủ

```bash
# 1. Di chuyển vào thư mục backoffice
cd /Users/I762313/projects/personal/11of/backoffice

# 2. Reset password cho admin
./reset-password.sh admin mynewpassword

# Output mong đợi:
# 🔄 Resetting password for user: admin
#
# ✅ Password reset successful!
# User: Admin User (admin)
# Role: ADMIN
# New password has been set.
#
# ✅ Password has been reset successfully!
# You can now login with the new password.
```
