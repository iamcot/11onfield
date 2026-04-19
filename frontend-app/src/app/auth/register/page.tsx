"use client";

import { Toggle } from "@/components/ui/Toggle";
import { registerConfig } from "@/config/register.config";
import { useAuth } from "@/contexts/AuthContext";
import { Province, provinceService } from "@/services/province.service";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    // Section 1 - Always visible
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",

    // Section 2 - Conditionally visible based on role
    role: registerConfig.playerToggleDefaultState ? "PLAYER" : "USER",
    provinceId: "",
    positions: [] as string[],
    height: "",
    weight: "",
    preferredFoot: "",
    email: "",
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await provinceService.getAllProvinces();
        setProvinces(data);
      } catch (err) {
        console.error("Error loading provinces:", err);
      }
    };
    loadProvinces();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: "",
      });
    }
  };

  const addPosition = (position: string) => {
    if (!formData.positions.includes(position)) {
      setFormData({
        ...formData,
        positions: [...formData.positions, position],
      });
    }
  };

  const removePosition = (position: string) => {
    setFormData({
      ...formData,
      positions: formData.positions.filter((p) => p !== position),
    });
  };

  const validatePhone = (phone: string): boolean => {
    // Vietnamese phone: 10 digits starting with 0
    return /^0\d{9}$/.test(phone);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Vui lòng nhập họ và tên";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Vui lòng nhập số điện thoại";
    } else if (!validatePhone(formData.phone)) {
      errors.phone = "Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)";
    }

    if (formData.password.length < 8) {
      errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu không khớp";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!acceptedTerms) {
      setError("Vui lòng đồng ý với điều khoản và điều kiện");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const registrationData = {
        fullName: formData.fullName,
        phone: formData.phone,
        password: formData.password,
        role: formData.role as "USER" | "PLAYER" | "COACH" | "SCOUTER",
        provinceId: parseInt(formData.provinceId),
        email:
          formData.role === "PLAYER" ? formData.email || undefined : undefined,
        ...(formData.role === "PLAYER" && {
          playerProfile: {
            positions: formData.positions,
            height: formData.height,
            weight: formData.weight,
            preferredFoot: formData.preferredFoot,
          },
        }),
      };

      await register(registrationData);
      router.push("/profile");
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
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
                Tạo tài khoản
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Hoặc{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  đăng nhập tài khoản có sẵn
                </Link>
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Section 1 - Always visible */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Họ và tên *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Nhập họ và tên"
                  />
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

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
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0123456789"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.phone}
                    </p>
                  )}
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
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Nhập mật khẩu"
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nhập lại mật khẩu *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Nhập lại mật khẩu"
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Province Selection */}
              <div>
                <label
                  htmlFor="provinceId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tỉnh/Thành phố *
                </label>
                <select
                  id="provinceId"
                  name="provinceId"
                  required
                  value={formData.provinceId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">-- Chọn tỉnh/thành phố --</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.provinceId && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.provinceId}
                  </p>
                )}
              </div>

              {/* Toggle */}
              <div className="pt-4">
                <Toggle
                  enabled={formData.role === "PLAYER"}
                  onChange={(enabled) =>
                    setFormData({
                      ...formData,
                      role: enabled ? "PLAYER" : "USER",
                    })
                  }
                  label="Bạn là tuyển thủ"
                  description="Bật để điền thông tin tuyển thủ của bạn"
                />
              </div>

              {/* Section 2 - Conditionally visible */}
              {formData.role === "PLAYER" && (
                <div className="space-y-4 pt-6 mt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Thông tin tuyển thủ
                  </h3>

                  <div>
                    <label
                      htmlFor="positions"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Vị trí thi đấu
                    </label>

                    {/* Dropdown with selected positions inside */}
                    <div className="mt-1 relative">
                      <div className="min-h-[42px] w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus-within:ring-blue-500 focus-within:border-blue-500">
                        {/* Selected positions as tags inside the box */}
                        {formData.positions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {formData.positions.map((positionValue) => {
                              const option =
                                registerConfig.positionOptions.find(
                                  (opt) => opt.value === positionValue,
                                );
                              return (
                                <span
                                  key={positionValue}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {option?.label}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removePosition(positionValue)
                                    }
                                    className="ml-1 inline-flex items-center justify-center w-3 h-3 text-blue-600 hover:text-blue-800 focus:outline-none"
                                  >
                                    <span className="sr-only">
                                      Remove {option?.label}
                                    </span>
                                    <svg
                                      className="w-2.5 h-2.5"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Dropdown select */}
                        <select
                          id="positions"
                          name="positions"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              addPosition(e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="w-full border-none focus:ring-0 focus:outline-none p-0 text-sm"
                        >
                          <option value="">Chọn vị trí thi đấu</option>
                          {registerConfig.positionOptions.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              disabled={formData.positions.includes(
                                option.value,
                              )}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="height"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Chiều cao (cm)
                      </label>
                      <input
                        id="height"
                        name="height"
                        type="number"
                        value={formData.height}
                        onChange={handleChange}
                        className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="170"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="weight"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Cân nặng (kg)
                      </label>
                      <input
                        id="weight"
                        name="weight"
                        type="number"
                        value={formData.weight}
                        onChange={handleChange}
                        className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="65"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="preferredFoot"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Chân thuận
                    </label>
                    <select
                      id="preferredFoot"
                      name="preferredFoot"
                      value={formData.preferredFoot}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Chọn chân thuận</option>
                      {registerConfig.preferredFootOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="pt-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Tôi đồng ý với{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-blue-600 hover:text-blue-500 underline"
                    >
                      điều khoản và điều kiện
                    </Link>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || !acceptedTerms}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
