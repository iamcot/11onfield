# Reset Password Utility

Tiện ích để reset mật khẩu người dùng qua command line.

## Cách sử dụng

### Trên Production Server

```bash
# Pull code về thư mục riêng trên server
cd ~
git clone <repo-url> 11of-source
# hoặc git pull nếu đã có

# Chạy script từ thư mục source code
cd 11of-source/backoffice
./scripts/reset-password.sh <phone> <new_password>
```

**Ví dụ:**

```bash
# Reset password cho admin
cd ~/11of-source/backoffice
./scripts/reset-password.sh admin newpassword123

# Reset password cho user với số điện thoại
./scripts/reset-password.sh 0123456789 mySecurePass456
```

**Lưu ý:** Script sẽ tự động load database credentials từ `/opt/11of/backend/.env`

### Trên Development Environment

```bash
cd /path/to/11of/backoffice
./scripts/reset-password.sh <phone> <new_password>
```

**Ví dụ:**

```bash
# Reset password cho admin
./scripts/reset-password.sh admin newpassword123

# Reset password cho user với số điện thoại
./scripts/reset-password.sh 0123456789 mySecurePass456
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

- Script tự động load database credentials từ environment variables:
  - **Production**: Đọc từ `/opt/11of/backend/.env`
  - **Development**: Đọc từ `.env` trong thư mục backoffice (nếu có)
  - **Fallback**: Sử dụng giá trị mặc định trong `application.yml`
- Mật khẩu sẽ được tự động mã hóa bằng BCrypt trước khi lưu vào database
- Sau khi reset thành công, người dùng có thể đăng nhập ngay với mật khẩu mới

## Environment Configuration

### Production Server

Khi chạy trên production server từ thư mục source code:
1. Script tự động load environment variables từ `/opt/11of/backend/.env`
2. Spring Boot resolve database credentials từ các environment variables này
3. Không cần thay đổi `application.yml`

**Output khi chạy:**
```bash
cd ~/11of-source/backoffice
./scripts/reset-password.sh admin mynewpassword

# Output:
# 🔐 Loading environment from /opt/11of/backend/.env
#
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

### Development Environment

Khi chạy trên môi trường local:
1. Tạo file `.env` trong thư mục `backoffice/` (file này được gitignore)
2. Thêm database credentials:
   ```
   DB_USERNAME=root
   DB_PASSWORD=yourpassword
   ```
3. Chạy script như bình thường

Hoặc có thể sử dụng giá trị mặc định trong `application.yml` nếu database local dùng root với password rỗng.

## Xử lý lỗi

Nếu gặp lỗi "User not found":
- Kiểm tra lại số điện thoại/username đã nhập
- Xác nhận user tồn tại trong database

Nếu gặp lỗi kết nối database:
- Kiểm tra database đã chạy chưa
- Xác nhận thông tin kết nối trong `application.yml`
- Kiểm tra file `.env` có đúng database credentials không (trên production: `/opt/11of/backend/.env`)

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
