"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authService } from "@/services/auth.service";
import AuthCard, { FieldLabel, Notice, errorMessage } from "@/components/shell/AuthCard";
import { ArrowRight } from "@/components/home/ui";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Validate phone
    if (!/^0\d{9}$/.test(phone)) {
      setError("Số điện thoại không hợp lệ (phải có 10 chữ số, bắt đầu bằng 0)");
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(phone);
      setMessage("Mã OTP đã được gửi đến số điện thoại của bạn");
      // Redirect to verify OTP page after 2 seconds
      setTimeout(() => {
        router.push(`/auth/verify-otp?phone=${phone}`);
      }, 2000);
    } catch (err: unknown) {
      setError(errorMessage(err, "Có lỗi xảy ra. Vui lòng thử lại."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Khôi phục tài khoản"
      title="Quên mật khẩu"
      subtitle="Nhập số điện thoại đã đăng ký để nhận mã OTP qua Zalo."
      aside={{
        eyebrow: "Bước 1 / 3",
        title: (
          <>
            Lấy lại
            <br />
            <span className="of-neon">mật khẩu</span>
          </>
        ),
        text: "Chỉ mất chưa đến một phút: nhận mã OTP, xác minh và đặt mật khẩu mới.",
      }}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {error && <Notice tone="error">{error}</Notice>}
        {message && <Notice tone="ok">{message}</Notice>}

        <label className="block">
          <FieldLabel>Số điện thoại</FieldLabel>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="of-field mt-1"
            placeholder="0901234567"
          />
        </label>

        <button type="submit" disabled={isLoading} className="of-btn mt-2 w-full">
          {isLoading ? "Đang gửi…" : "Gửi mã OTP"} {!isLoading && <ArrowRight />}
        </button>

        <Link href="/auth/login" className="text-center text-[14px] font-semibold hover:!text-white" style={{ color: "var(--lime-2)" }}>
          ‹ Quay lại đăng nhập
        </Link>
      </form>
    </AuthCard>
  );
}
