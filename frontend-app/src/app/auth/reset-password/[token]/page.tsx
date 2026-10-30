"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { authService } from "@/services/auth.service";
import AuthCard, { FieldLabel, Notice, errorMessage } from "@/components/shell/AuthCard";
import { ArrowRight } from "@/components/home/ui";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password
    if (newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, newPassword);
      // the login page shows this once
      sessionStorage.setItem(
        "loginMessage",
        JSON.stringify({ type: "success", message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại." }),
      );
      router.push("/auth/login");
    } catch (err: unknown) {
      setError(errorMessage(err, "Có lỗi xảy ra. Vui lòng thử lại."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Khôi phục tài khoản"
      title="Mật khẩu mới"
      subtitle="Chọn mật khẩu ít nhất 8 ký tự mà bạn chưa dùng ở nơi khác."
      aside={{
        eyebrow: "Bước 3 / 3",
        title: (
          <>
            Sẵn sàng
            <br />
            <span className="of-neon">ra sân</span>
          </>
        ),
        text: "Đặt mật khẩu mới xong là bạn có thể đăng nhập và tiếp tục hồ sơ cầu thủ của mình.",
      }}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {error && <Notice tone="error">{error}</Notice>}

        <label className="block">
          <FieldLabel>Mật khẩu mới</FieldLabel>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="of-field mt-1"
            placeholder="Ít nhất 8 ký tự"
          />
        </label>

        <label className="block">
          <FieldLabel>Nhập lại mật khẩu</FieldLabel>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="of-field mt-1"
          />
        </label>

        <button type="submit" disabled={isLoading} className="of-btn mt-2 w-full">
          {isLoading ? "Đang lưu…" : "Đặt lại mật khẩu"} {!isLoading && <ArrowRight />}
        </button>

        <Link href="/auth/login" className="text-center text-[14px] font-semibold hover:!text-white" style={{ color: "var(--lime-2)" }}>
          ‹ Quay lại đăng nhập
        </Link>
      </form>
    </AuthCard>
  );
}
