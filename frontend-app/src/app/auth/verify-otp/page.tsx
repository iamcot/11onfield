"use client";

import { authService } from "@/services/auth.service";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
    } catch (err: any) {
      setError(err.message || "Mã OTP không đúng hoặc đã hết hạn");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex flex-col">
        {/* Top section - Logo */}
        <div className="relative py-4 bg-white">
          <div className="flex items-center justify-center">
            <Link href="/" className="text-center px-8">
              <Image
                src="/images/logo-color-full.png"
                alt="11of Logo"
                width={250}
                height={60}
                className="mx-auto cursor-pointer hover:opacity-80 transition"
                priority
              />
            </Link>
          </div>
        </div>

        {/* Bottom section - Form with white background */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white overflow-y-auto">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Xác minh OTP
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Nhập mã OTP đã được gửi đến {phone}
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="otpCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mã OTP (6 chữ số) *
                </label>
                <input
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-700 focus:border-green-700 sm:text-sm text-center text-2xl tracking-widest"
                  placeholder="000000"
                  autoComplete="off"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 btn-primary text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Đang xác minh..." : "Xác minh"}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-green-700 hover:text-green-800"
                >
                  Gửi lại mã OTP
                </Link>
              </div>
            </form>

            {/* ZNS OTP Example Image */}
            <div className="mt-8 border-t pt-6">
              <p className="text-sm text-gray-600 text-center mb-4">
                OTP của bạn sẽ được gửi thông qua tin nhắn ZALO có mẫu như sau
              </p>
              <div className="flex justify-center">
                <img
                  src="/images/zns_otp.jpg"
                  alt="Mẫu tin nhắn ZNS OTP"
                  className="max-w-xs w-full rounded-lg shadow-md border border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-[auto_1fr] min-h-screen">
        {/* Left column - Hero Image - Sticky */}
        <div className="sticky top-0 h-screen flex items-center justify-center">
          {/* Background image */}
          <img
            src="/images/banner_register.jpg"
            alt="Verify OTP Banner"
            className="h-full w-auto object-contain"
          />
        </div>

        {/* Right column - Form - Scrollable */}
        <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-white min-h-screen">
          <div className="max-w-md w-full space-y-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Link href="/">
                <Image
                  src="/images/logo-color-full.png"
                  alt="11of Logo"
                  width={250}
                  height={60}
                  className="cursor-pointer hover:opacity-80 transition"
                  priority
                />
              </Link>
            </div>

            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Xác minh OTP
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Nhập mã OTP đã được gửi đến {phone}
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="otpCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mã OTP (6 chữ số) *
                </label>
                <input
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-700 focus:border-green-700 sm:text-sm text-center text-2xl tracking-widest"
                  placeholder="000000"
                  autoComplete="off"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 btn-primary text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Đang xác minh..." : "Xác minh"}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-green-700 hover:text-green-800"
                >
                  Gửi lại mã OTP
                </Link>
              </div>
            </form>

            {/* ZNS OTP Example Image */}
            <div className="mt-8 border-t pt-6">
              <p className="text-sm text-gray-600 text-center mb-4">
                OTP của bạn sẽ được gửi thông qua tin nhắn ZALO có mẫu như sau
              </p>
              <div className="flex justify-center">
                <img
                  src="/images/zns_otp.jpg"
                  alt="Mẫu tin nhắn ZNS OTP"
                  className="max-w-xs w-full rounded-lg shadow-md border border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
