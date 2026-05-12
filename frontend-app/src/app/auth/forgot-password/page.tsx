"use client";

import { authService } from "@/services/auth.service";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      setError(
        "Số điện thoại không hợp lệ (phải có 10 chữ số, bắt đầu bằng 0)",
      );
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
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
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
            <div className="text-center px-8">
              <Image
                src="/images/banner_register.jpg"
                alt="11of Logo"
                width={250}
                height={60}
                className="mx-auto"
                priority
              />
            </div>
          </div>
        </div>

        {/* Bottom section - Form with white background */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Quên mật khẩu
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Nhập số điện thoại để nhận mã OTP
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {message && (
                <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm text-green-800">{message}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Số điện thoại *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-700 focus:border-green-700 sm:text-sm"
                    placeholder="0123456789"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 btn-primary text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="font-medium text-green-700 hover:text-green-800 text-sm"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
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
            alt="Forgot Password Banner"
            className="h-full w-auto object-contain"
          />
        </div>

        {/* Right column - Form - Scrollable */}
        <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-white min-h-screen">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Quên mật khẩu
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Nhập số điện thoại để nhận mã OTP
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {message && (
                <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm text-green-800">{message}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Số điện thoại *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-700 focus:border-green-700 sm:text-sm"
                    placeholder="0123456789"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 btn-primary text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="font-medium text-green-700 hover:text-green-800 text-sm"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
