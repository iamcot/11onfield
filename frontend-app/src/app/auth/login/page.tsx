"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import ThemeShell from "@/components/shell/ThemeShell";
import { ArrowRight } from "@/components/home/ui";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const { track } = useAnalytics();
  const router = useRouter();

  // Check for success message from password change
  useEffect(() => {
    const message = sessionStorage.getItem("loginMessage");
    if (message) {
      try {
        const { type, message: text } = JSON.parse(message);
        if (type === "success") {
          setSuccessMessage(text);
        }
        sessionStorage.removeItem("loginMessage");
      } catch (e) {
        console.error("Failed to parse login message:", e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ phone, password });

      track("user_login", {
        method: "phone_password",
        role: user?.role || "unknown",
      });

      router.push("/profile");
    } catch (err: unknown) {
      const raw = (err as { message?: string })?.message;
      track("api_error", {
        endpoint: "/auth/login",
        status_code: 401,
        error_message: raw || "Login failed",
        user_action: "login_attempt",
      });
      // fetch() rejects with a TypeError when the API is unreachable or blocked by CORS
      setError(
        err instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(raw ?? "")
          ? "Không kết nối được máy chủ. Kiểm tra mạng và thử lại sau ít phút."
          : raw || "Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeShell footer={false}>
      <div className="mx-auto grid min-h-[calc(100svh-var(--header-h))] max-w-[1240px] items-center gap-10 px-4 py-10 lg:grid-cols-[1fr_460px] lg:gap-16 lg:px-6">
        <div className="hidden lg:block" data-reveal="">
          <div className="of-eyebrow of-eyebrow--left">Mùa 1 · 2026</div>
          <h1 className="of-display mt-3 text-[88px] leading-[0.9]">
            Trở lại
            <br />
            <span className="of-neon">sân cỏ</span>
          </h1>
          <p className="of-lede mt-5 max-w-md !text-[#CBD6CF]">
            Đăng nhập để cập nhật hồ sơ cầu thủ, xem lịch tuyển trạch khu vực và theo dõi kết quả của bạn.
          </p>
          <Link href="/competitions" className="of-navlink mt-8 inline-block" style={{ color: "var(--gold-2)" }}>
            Chương trình 11 người ra sân 2026 ›
          </Link>
        </div>

        <div className="of-glass of-cut of-cut--lg of-cut--b2 of-run of-step-in relative p-6 lg:p-9">
          <div className="of-brackets" />
          <div className="of-hud text-[11px] text-[color:var(--lime)]">Tài khoản</div>
          <h2 className="of-display mt-1 text-[40px] lg:text-[48px]">Đăng nhập</h2>
          <p className="mt-1 text-[14.5px] text-[#CBD6CF]">
            Chưa có tài khoản?{" "}
            <Link href="/auth/register" className="font-semibold hover:!text-white" style={{ color: "var(--lime-2)" }}>
              Đăng ký miễn phí
            </Link>
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            {successMessage && (
              <div className="border border-[rgba(166,227,90,0.45)] bg-[rgba(166,227,90,0.1)] px-4 py-3 text-[14px] text-[#E2F5CF]">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="border border-[rgba(255,138,128,0.5)] bg-[rgba(255,138,128,0.08)] px-4 py-3 text-[14px] text-[#FFD2CD]" role="alert">
                {error}
              </div>
            )}

            <label className="block">
              <span className="of-hud text-[10px] text-[color:var(--mute)]">Số điện thoại</span>
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

            <label className="block">
              <span className="flex items-center justify-between">
                <span className="of-hud text-[10px] text-[color:var(--mute)]">Mật khẩu</span>
                <Link href="/auth/forgot-password" className="text-[13px] font-semibold text-[color:var(--lime-2)] hover:text-white">
                  Quên mật khẩu?
                </Link>
              </span>
              <span className="relative mt-1 block">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="of-field !pr-16"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="of-hud absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[color:var(--lime-2)]"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </span>
            </label>

            <button type="submit" disabled={isLoading} className="of-btn mt-2 w-full">
              {isLoading ? "Đang đăng nhập…" : "Đăng nhập"} {!isLoading && <ArrowRight />}
            </button>
          </form>
        </div>
      </div>
    </ThemeShell>
  );
}
