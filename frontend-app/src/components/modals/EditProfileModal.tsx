"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEditProfile } from "@/contexts/EditProfileContext";
import { useState, useEffect } from "react";
import { userService } from "@/services/user.service";
import { compressImage, formatFileSize, isValidImageFile, isValidImageSize } from "@/lib/image-utils";

export default function EditProfileModal() {
  const { isOpen, closeEditProfile } = useEditProfile();
  const { user, refreshUser } = useAuth();

  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setEditFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        dob: user.dob || "",
        gender: user.gender || "",
        provinceId: user.address?.province?.id || "",
        address: user.address?.address || "",
        ward: user.address?.ward || "",
        // Player fields
        height: user.height || "",
        weight: user.weight || "",
        preferredFoot: user.preferredFoot || "",
        level: user.level || "",
        bio: user.bio || "",
        positions: user.positions || [],
      });

      // Load provinces
      userService.getProvinces()
        .then(setProvinces)
        .catch((err) => {
          console.error("Error loading provinces:", err);
          // Continue without provinces
        });
    }
  }, [isOpen, user]);

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handlePositionChange = (position: string) => {
    setEditFormData((prev: any) => {
      const positions = prev.positions || [];
      if (positions.includes(position)) {
        return { ...prev, positions: positions.filter((p: string) => p !== position) };
      } else {
        return { ...prev, positions: [...positions, position] };
      }
    });
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isValidImageFile(file)) {
      alert("Vui lòng chọn file ảnh hợp lệ (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size
    if (!isValidImageSize(file, 20)) {
      alert(`Kích thước file quá lớn (${formatFileSize(file.size)}). Tối đa 20MB.`);
      return;
    }

    setSelectedAvatarFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl(previewUrl);
  };

  const handleAvatarClick = () => {
    document.getElementById("avatar-file-input")?.click();
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);

    try {
      // Upload avatar if selected
      if (selectedAvatarFile) {
        setIsUploadingAvatar(true);
        setUploadProgress("Đang nén ảnh...");

        const compressedFile = await compressImage(selectedAvatarFile);
        setUploadProgress("Đang tải lên...");

        await userService.updateAvatar(compressedFile);
        setUploadProgress("Tải lên thành công!");

        // Clean up
        if (avatarPreviewUrl) {
          URL.revokeObjectURL(avatarPreviewUrl);
        }
        setSelectedAvatarFile(null);
        setAvatarPreviewUrl(null);
        setIsUploadingAvatar(false);
        setUploadProgress("");
      }

      // Filter out empty values to avoid sending empty strings for enums
      const cleanedData: any = {};
      Object.keys(editFormData).forEach((key) => {
        const value = editFormData[key];
        // Only include non-empty values
        if (value !== "" && value !== null && value !== undefined) {
          // For arrays, only include if not empty
          if (Array.isArray(value)) {
            if (value.length > 0) {
              cleanedData[key] = value;
            }
          } else {
            cleanedData[key] = value;
          }
        }
      });

      // Update profile data
      await userService.updateProfile(cleanedData);

      // Refresh user data
      await refreshUser();

      alert("Cập nhật hồ sơ thành công!");
      closeEditProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      alert(error.message || "Có lỗi xảy ra khi cập nhật hồ sơ");
    } finally {
      setIsSaving(false);
      setIsUploadingAvatar(false);
    }
  };

  if (!isOpen) return null;

  const isPlayer = user?.role === "PLAYER";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa hồ sơ</h3>
          <button
            onClick={closeEditProfile}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Avatar Upload Section */}
          <div className="border-b pb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Ảnh đại diện</h4>

            <div className="flex items-center gap-6">
              {/* Avatar Preview */}
              <div className="relative">
                {avatarPreviewUrl || user?.avatar ? (
                  <img
                    src={avatarPreviewUrl || user?.avatar}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-green-200 flex items-center justify-center text-2xl font-bold text-green-600">
                    {user?.fullName?.charAt(0) || "U"}
                  </div>
                )}

                {/* Clickable overlay */}
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-30 transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                  title="Chọn ảnh"
                >
                  <span className="opacity-0 hover:opacity-100 text-white text-sm font-medium">
                    Đổi ảnh
                  </span>
                </button>
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                {selectedAvatarFile ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{selectedAvatarFile.name}</span>
                      <span className="text-gray-500 ml-2">
                        ({formatFileSize(selectedAvatarFile.size)})
                      </span>
                    </p>

                    {uploadProgress && (
                      <p className="text-sm text-green-600 font-medium">{uploadProgress}</p>
                    )}

                    <button
                      onClick={handleAvatarClick}
                      disabled={isUploadingAvatar}
                      className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
                    >
                      Chọn ảnh khác
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleAvatarClick}
                      disabled={isUploadingAvatar}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      Chọn ảnh mới
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      JPEG, PNG, GIF, WebP. Tối đa 20MB.
                    </p>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                id="avatar-file-input"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* User Info Section */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={editFormData.fullName || ""}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email || ""}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={editFormData.dob || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    name="gender"
                    value={editFormData.gender || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tỉnh/Thành phố
                </label>
                <select
                  name="provinceId"
                  value={editFormData.provinceId || ""}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Player Info Section - Only show if user is a player */}
          {isPlayer && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin cầu thủ
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chiều cao (cm)
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={editFormData.height || ""}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cân nặng (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={editFormData.weight || ""}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chân thuận
                    </label>
                    <select
                      name="preferredFoot"
                      value={editFormData.preferredFoot || ""}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Chọn chân thuận</option>
                      <option value="left">Trái</option>
                      <option value="right">Phải</option>
                      <option value="both">Cả hai</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trình độ
                    </label>
                    <select
                      name="level"
                      value={editFormData.level || ""}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Chọn trình độ</option>
                      <option value="BEGINNER">Mới bắt đầu</option>
                      <option value="INTERMEDIATE">Trung bình</option>
                      <option value="ADVANCED">Nâng cao</option>
                      <option value="PROFESSIONAL">Chuyên nghiệp</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vị trí thi đấu
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["forward", "midfielder", "defender", "centerback", "goalkeeper"].map((pos) => (
                      <label key={pos} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.positions?.includes(pos) || false}
                          onChange={() => handlePositionChange(pos)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">
                          {pos === "forward" && "Tiền đạo"}
                          {pos === "midfielder" && "Tiền vệ"}
                          {pos === "defender" && "Hậu vệ"}
                          {pos === "centerback" && "Trung vệ"}
                          {pos === "goalkeeper" && "Thủ môn"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới thiệu
                  </label>
                  <textarea
                    name="bio"
                    value={editFormData.bio || ""}
                    onChange={handleEditFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Viết vài dòng về bản thân..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={closeEditProfile}
            disabled={isSaving}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving || isUploadingAvatar}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
