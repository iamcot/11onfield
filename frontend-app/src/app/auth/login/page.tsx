"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ phone, password });
      router.push("/profile");
    } catch (err: any) {
      setError(
        err.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex flex-col">
        {/* Top section - Logo */}
        <div className="relative py-4 bg-white">
          <div className="flex items-center justify-center">
            <div className="text-center px-8">
              <Image
                src="/images/green_11onfield.png"
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
                Đăng nhập tài khoản
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Hoặc{" "}
                <Link
                  href="/auth/register"
                  className="font-medium text-green-700 hover:text-green-600"
                >
                  tạo tài khoản mới
                </Link>
              </p>
              <p className="mt-2 text-center text-sm text-gray-600">
                <Link
                  href="/players"
                  className="font-medium text-green-700 hover:text-green-600"
                >
                  Xem danh sách cầu thủ
                </Link>
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
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
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Mật khẩu *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-700 focus:border-green-700 sm:text-sm"
                    placeholder="Nhập mật khẩu"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-green-700 hover:text-green-600"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white btn-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-2 min-h-screen">
        {/* Left column - Hero Image */}
        <div className="relative overflow-hidden">
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/images/ground.jpg)" }}
          ></div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center px-8 relative z-10">
              <Image
                src="/images/green_11onfield.png"
                alt="11of Logo"
                width={250}
                height={60}
                className="mx-auto"
                priority
              />
            </div>
          </div>
        </div>

        {/* Right column - Form */}
        <div className="relative flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-white">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Đăng nhập tài khoản
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Hoặc{" "}
                <Link
                  href="/auth/register"
                  className="font-medium text-green-700 hover:text-green-600"
                >
                  tạo tài khoản mới
                </Link>
              </p>
              <p className="mt-2 text-center text-sm text-gray-600">
                <Link
                  href="/players"
                  className="font-medium text-green-700 hover:text-green-600"
                >
                  Xem danh sách cầu thủ
                </Link>
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
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
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Mật khẩu *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-700 focus:border-green-700 sm:text-sm"
                    placeholder="Nhập mật khẩu"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-green-700 hover:text-green-600"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white btn-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
