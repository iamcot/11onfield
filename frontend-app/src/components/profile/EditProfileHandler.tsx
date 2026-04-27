"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEditProfile } from "@/contexts/EditProfileContext";
import { provinceService } from "@/services/province.service";
import { userService } from "@/services/user.service";
import { compressImage, formatFileSize, isValidImageFile, isValidImageSize } from "@/lib/image-utils";
import { useEffect, useState, useCallback } from "react";

export default function EditProfileHandler() {
  const { user: currentUser } = useAuth();
  const { setOpenCallback, closeEditProfile } = useEditProfile();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleOpenEditModal = useCallback(async () => {
    console.log("EditProfileHandler: handleOpenEditModal called, currentUser:", currentUser?.userid);

    if (!currentUser?.userid) {
      console.error("No user data available");
      alert("Vui lòng đăng nhập để chỉnh sửa hồ sơ");
      return;
    }

    try {
      // Fetch full user profile to get all fields
      const fullProfile = await userService.getUserByUserid(currentUser.userid);

      // Load provinces
      try {
        const provinceData = await provinceService.getAllProvinces();
        setProvinces(provinceData);
      } catch (error) {
        console.error("Error loading provinces:", error);
        setProvinces([]);
      }

      // Initialize form data with full profile data
      const formData = {
        fullName: fullProfile.fullName || "",
        email: fullProfile.email || "",
        dob: fullProfile.dob || "",
        gender: fullProfile.gender || "",
        provinceId: fullProfile.address?.province?.id ? String(fullProfile.address.province.id) : "",
        // Player-specific fields
        ...(fullProfile.role === "PLAYER" && {
          height: fullProfile.height ? String(fullProfile.height) : "",
          weight: fullProfile.weight ? String(fullProfile.weight) : "",
          preferredFoot: fullProfile.preferredFoot || "",
          positions: fullProfile.positions || [],
          level: fullProfile.level || "",
          bio: fullProfile.bio || "",
        }),
      };

      console.log("Full Profile:", fullProfile);
      console.log("Form Data:", formData);

      setEditFormData(formData);
      setShowEditModal(true);
    } catch (error) {
      console.error("Error loading profile:", error);
      alert("Không thể tải thông tin hồ sơ");
    }
  }, [currentUser]);

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    closeEditProfile();
    // Clear avatar selection
    if (selectedAvatarFile) {
      setSelectedAvatarFile(null);
    }
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }
    setEditFormData({});
  };

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      // Upload avatar first if selected
      if (selectedAvatarFile) {
        setUploadProgress("Đang nén ảnh...");
        const compressedFile = await compressImage(selectedAvatarFile, 800, 800, 0.8);
        setUploadProgress("Đang upload ảnh...");
        await userService.uploadAvatar(compressedFile);
        setUploadProgress("");
      }

      // Then update profile data
      const cleanedData: any = {};
      Object.keys(editFormData).forEach((key) => {
        const value = editFormData[key];
        if (value !== "" && value !== null && value !== undefined) {
          cleanedData[key] = value;
        }
      });

      await userService.updateProfile(cleanedData);

      // Clear avatar selection
      setSelectedAvatarFile(null);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      setAvatarPreviewUrl(null);

      alert("Cập nhật thông tin thành công!");
      handleCloseEditModal();

      // Reload page to refresh user data
      window.location.reload();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      alert(err.message || "Cập nhật thất bại");
    } finally {
      setIsSaving(false);
      setUploadProgress("");
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      alert("Chỉ chấp nhận file ảnh: JPEG, PNG, GIF, WebP");
      return;
    }

    if (!isValidImageSize(file)) {
      alert(`Kích thước file không được vượt quá ${formatFileSize(20 * 1024 * 1024)}`);
      return;
    }

    setSelectedAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarPreviewUrl(previewUrl);
  };

  const handleAvatarClick = () => {
    document.getElementById("global-avatar-file-input")?.click();
  };

  // Register callback - always register with stable function reference
  useEffect(() => {
    console.log("EditProfileHandler: Registering callback, currentUser:", currentUser?.userid);
    setOpenCallback(handleOpenEditModal);
    return () => {
      console.log("EditProfileHandler: Cleanup - unregistering callback");
      setOpenCallback(null);
    };
  }, [handleOpenEditModal, setOpenCallback]);

  if (!showEditModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa hồ sơ</h3>
          <button
            onClick={handleCloseEditModal}
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
              <div className="relative">
                {avatarPreviewUrl || currentUser?.avatar ? (
                  <img
                    src={avatarPreviewUrl || currentUser?.avatar}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-green-200 flex items-center justify-center text-2xl font-bold text-green-600">
                    {currentUser?.fullName?.charAt(0) || "U"}
                  </div>
                )}
                <button
                  onClick={handleAvatarClick}
                  className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-30 transition flex items-center justify-center cursor-pointer"
                  title="Chọn ảnh"
                >
                  <span className="opacity-0 hover:opacity-100 text-white text-sm font-medium">
                    Đổi ảnh
                  </span>
                </button>
              </div>

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
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      Chọn ảnh khác
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleAvatarClick}
                      className="px-4 py-2 btn-primary text-white rounded-md transition text-sm"
                    >
                      Chọn ảnh mới
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      JPEG, PNG, GIF, WebP. Tối đa 20MB.
                    </p>
                  </div>
                )}
              </div>

              <input
                id="global-avatar-file-input"
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

          {/* Player Info Section */}
          {(editFormData.height || editFormData.weight || editFormData.preferredFoot || editFormData.level || editFormData.bio) && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cầu thủ</h4>
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
                      placeholder="170"
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
                      placeholder="65"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vị trí thi đấu
                  </label>
                  <div className="mt-1 relative">
                    <div className="min-h-[42px] w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus-within:ring-green-500 focus-within:border-green-500">
                      {/* Selected positions as tags inside the box */}
                      {(editFormData.positions || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(editFormData.positions || []).map((positionValue: string) => {
                            const positionOptions = [
                              { value: 'striker', label: 'Tiền đạo' },
                              { value: 'midfielder', label: 'Tiền vệ' },
                              { value: 'centerback', label: 'Trung vệ' },
                              { value: 'defender', label: 'Hậu vệ' },
                              { value: 'goalkeeper', label: 'Thủ môn' },
                            ];
                            const option = positionOptions.find(opt => opt.value === positionValue);
                            return (
                              <span
                                key={positionValue}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                              >
                                {option?.label}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPositions = (editFormData.positions || []).filter((p: string) => p !== positionValue);
                                    setEditFormData({
                                      ...editFormData,
                                      positions: newPositions,
                                    });
                                  }}
                                  className="ml-1 inline-flex items-center justify-center w-3 h-3 text-green-600 hover:text-green-800 focus:outline-none"
                                >
                                  <span className="sr-only">Remove {option?.label}</span>
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
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            const currentPositions = editFormData.positions || [];
                            if (!currentPositions.includes(e.target.value)) {
                              setEditFormData({
                                ...editFormData,
                                positions: [...currentPositions, e.target.value],
                              });
                            }
                          }
                        }}
                        className="w-full border-none focus:ring-0 focus:outline-none p-0 text-sm"
                      >
                        <option value="">Chọn vị trí thi đấu</option>
                        {[
                          { value: 'striker', label: 'Tiền đạo' },
                          { value: 'midfielder', label: 'Tiền vệ' },
                          { value: 'centerback', label: 'Trung vệ' },
                          { value: 'defender', label: 'Hậu vệ' },
                          { value: 'goalkeeper', label: 'Thủ môn' },
                        ].map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={(editFormData.positions || []).includes(option.value)}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
                  <select
                    name="level"
                    value={editFormData.level || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Chọn cấp độ</option>
                    <option value="CAU_THU_MOI">Cầu thủ mới</option>
                    <option value="NGHIEP_DU">Nghiệp dư</option>
                    <option value="TUYEN_TRE">Tuyển trẻ</option>
                    <option value="CHUYEN_NGHIEP">Chuyên nghiệp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới thiệu</label>
                  <textarea
                    name="bio"
                    value={editFormData.bio || ""}
                    onChange={handleEditFormChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Giới thiệu về bản thân..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={handleCloseEditModal}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="px-4 py-2 btn-primary text-white rounded-md transition disabled:opacity-50"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
