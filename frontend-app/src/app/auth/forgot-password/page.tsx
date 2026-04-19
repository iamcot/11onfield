'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      // TODO: Implement forgot password API call
      // await forgotPassword({ phone });
      setMessage('Liên kết đặt lại mật khẩu đã được gửi đến số điện thoại của bạn.');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left column - Hero Image */}
        <div className="relative bg-gradient-to-br from-blue-600 to-blue-900">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Placeholder for hero image - can be replaced with actual image */}
            <div className="text-white text-center px-8">
              <h1 className="text-4xl font-bold mb-4">11of</h1>
              <p className="text-xl opacity-90">Nền tảng quản lý bóng đá</p>
            </div>
          </div>
        </div>

        {/* Right column - Form */}
        <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Quên mật khẩu
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Nhập số điện thoại của bạn để nhận liên kết đặt lại mật khẩu
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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
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
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0123456789"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
                </button>
              </div>

              <div className="text-center">
                <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 text-sm">
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
