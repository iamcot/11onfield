"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { authService } from "@/services/auth.service";
import AuthCard, { FieldLabel, Notice, errorMessage } from "@/components/shell/AuthCard";
import { ArrowRight } from "@/components/home/ui";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");

  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!phone) {
      router.push("/auth/forgot-password");
    }
  }, [phone, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate OTP
    if (!/^\d{6}$/.test(otpCode)) {
      setError("Mã OTP phải gồm 6 chữ số");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.verifyOtp(phone!, otpCode);
      // Redirect to reset password page with token
      router.push(`/auth/reset-password/${result.token}`);
    } catch (err: unknown) {
      setError(errorMessage(err, "Mã OTP không đúng hoặc đã hết hạn"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Khôi phục tài khoản"
      title="Xác minh OTP"
      subtitle={
        <>
          Nhập mã 6 số đã gửi đến <strong className="text-white">{phone}</strong>
        </>
      }
      aside={{
        eyebrow: "Bước 2 / 3",
        title: (
          <>
            Kiểm tra
            <br />
            <span className="of-neon">Zalo</span>
          </>
        ),
        text: "Mã OTP có hiệu lực trong thời gian ngắn. Nếu chưa nhận được, bạn có thể yêu cầu gửi lại.",
      }}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {error && <Notice tone="error">{error}</Notice>}

        <label className="block">
          <FieldLabel>Mã OTP (6 chữ số)</FieldLabel>
          <input
            id="otpCode"
            name="otpCode"
            type="text"
            inputMode="numeric"
            required
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            className="of-field of-num mt-1 text-center !text-[28px] tracking-[0.5em]"
            placeholder="000000"
            autoComplete="one-time-code"
          />
        </label>

        <button type="submit" disabled={isLoading} className="of-btn mt-2 w-full">
          {isLoading ? "Đang xác minh…" : "Xác minh"} {!isLoading && <ArrowRight />}
        </button>

        <Link href="/auth/forgot-password" className="text-center text-[14px] font-semibold hover:!text-white" style={{ color: "var(--lime-2)" }}>
          Gửi lại mã OTP
        </Link>
      </form>
    </AuthCard>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#071711]" />}>
      <VerifyOtpContent />
    </Suspense>
  );
}
