"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEditProfile } from "@/contexts/EditProfileContext";
import { provinceService } from "@/services/province.service";
import { userService } from "@/services/user.service";
import { compressImage, formatFileSize, isValidImageFile, isValidImageSize } from "@/lib/image-utils";
import DynamicFieldList from "@/components/forms/DynamicFieldList";
import DynamicAchievementList from "@/components/forms/DynamicAchievementList";
import DynamicHighlightList from "@/components/forms/DynamicHighlightList";
import { useEffect, useState, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

  // New state for collections
  const [individualAchievements, setIndividualAchievements] = useState<Array<{title: string; date: string}>>([]);
  const [teamAchievements, setTeamAchievements] = useState<Array<{title: string; date: string}>>([]);
  const [highlights, setHighlights] = useState<Array<{url: string; date: string}>>([]);
  const [socials, setSocials] = useState<string[]>([]);

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
          // New extended fields
          personalId: fullProfile.personalId || "",
          residentialAddress: fullProfile.residentialAddress || "",
          school: fullProfile.school || "",
          academy: fullProfile.academy || "",
          club: fullProfile.club || "",
        }),
      };

      // Populate collection states
      if (fullProfile.role === "PLAYER") {
        setIndividualAchievements(
          fullProfile.individualAchievements?.map((a: any) => ({
            title: a.title || "",
            date: a.date || ""
          })) || []
        );
        setTeamAchievements(
          fullProfile.teamAchievements?.map((a: any) => ({
            title: a.title || "",
            date: a.date || ""
          })) || []
        );
        setHighlights(
          fullProfile.highlights?.map((h: any) => ({
            url: h.url || "",
            date: h.date || ""
          })) || []
        );
        setSocials(
          fullProfile.socials?.map((s: any) => s.url) || []
        );
      }

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

      // Validate achievements and highlights have both title/url AND date
      if (currentUser?.role === "PLAYER") {
        // Check individual achievements
        for (const achievement of individualAchievements) {
          if (achievement.title && achievement.title.trim() && !achievement.date) {
            alert("Vui lòng chọn ngày cho tất cả các thành tích cá nhân");
            setIsSaving(false);
            return;
          }
        }

        // Check team achievements
        for (const achievement of teamAchievements) {
          if (achievement.title && achievement.title.trim() && !achievement.date) {
            alert("Vui lòng chọn ngày cho tất cả các thành tích tập thể");
            setIsSaving(false);
            return;
          }
        }

        // Check highlights
        for (const highlight of highlights) {
          if (highlight.url && highlight.url.trim() && !highlight.date) {
            alert("Vui lòng chọn ngày cho tất cả các video highlights");
            setIsSaving(false);
            return;
          }
        }
      }

      // Upload avatar first if selected
      if (selectedAvatarFile) {
        setUploadProgress("Đang nén ảnh...");
        const compressedFile = await compressImage(selectedAvatarFile, 800, 800, 0.8);
        setUploadProgress("Đang upload ảnh...");
        await userService.uploadAvatar(compressedFile, false); // Background removal disabled
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

      // Add collections data for players (check if user is a player)
      if (currentUser?.role === "PLAYER") {
        cleanedData.individualAchievements = individualAchievements
          .filter(a => a.title && a.title.trim() && a.date)
          .map(a => ({
            title: a.title,
            date: a.date
          }));

        cleanedData.teamAchievements = teamAchievements
          .filter(a => a.title && a.title.trim() && a.date)
          .map(a => ({
            title: a.title,
            date: a.date
          }));

        cleanedData.highlights = highlights
          .filter(h => h.url && h.url.trim() && h.date)
          .map(h => ({
            url: h.url,
            date: h.date
          }));

        cleanedData.socials = socials.filter(s => s.trim());
      }

      console.log("Sending profile update:", cleanedData);
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
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

              {/* Background Removal Checkbox - TEMPORARILY DISABLED */}
              {/* {selectedAvatarFile && (
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    id="removeBackground"
                    checked={removeBackground}
                    onChange={(e) => setRemoveBackground(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="removeBackground" className="text-sm text-gray-700 cursor-pointer">
                    Tự động xóa background
                  </label>
                </div>
              )} */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh
                  </label>
                  <DatePicker
                    selected={editFormData.dob ? new Date(editFormData.dob) : null}
                    onChange={(date: Date | null) => {
                      setEditFormData({
                        ...editFormData,
                        dob: date ? date.toISOString().split('T')[0] : ""
                      });
                    }}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholderText="Chọn ngày sinh"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    maxDate={new Date()}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
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

          {/* Player Info Section - Show if user is a PLAYER */}
          {currentUser?.role === 'PLAYER' && (
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
                      placeholder="65"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vị trí thi đấu
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'striker', label: 'Tiền đạo' },
                      { value: 'midfielder', label: 'Tiền vệ' },
                      { value: 'defender', label: 'Hậu vệ' },
                      { value: 'goalkeeper', label: 'Thủ môn' }
                    ].map(position => (
                      <label key={position.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.positions?.includes(position.value) || false}
                          onChange={(e) => {
                            const positions = editFormData.positions || [];
                            if (e.target.checked) {
                              setEditFormData({
                                ...editFormData,
                                positions: [...positions, position.value]
                              });
                            } else {
                              setEditFormData({
                                ...editFormData,
                                positions: positions.filter((p: string) => p !== position.value)
                              });
                            }
                          }}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{position.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chân thuận
                  </label>
                  <div className="flex gap-6">
                    {[
                      { value: 'left', label: 'Trái' },
                      { value: 'right', label: 'Phải' },
                      { value: 'both', label: 'Cả hai' }
                    ].map(foot => (
                      <label key={foot.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="preferredFoot"
                          value={foot.value}
                          checked={editFormData.preferredFoot === foot.value}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            preferredFoot: e.target.value
                          })}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{foot.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
                  <select
                    name="level"
                    value={editFormData.level || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
                    placeholder="Giới thiệu về bản thân..."
                  />
                </div>

                {/* New extended player fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số CCCD
                  </label>
                  <input
                    type="text"
                    name="personalId"
                    value={editFormData.personalId || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
                    placeholder="Nhập số CCCD"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ thường trú
                  </label>
                  <input
                    type="text"
                    name="residentialAddress"
                    value={editFormData.residentialAddress || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
                    placeholder="Nhập địa chỉ chi tiết"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trường đang học
                  </label>
                  <input
                    type="text"
                    name="school"
                    value={editFormData.school || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
                    placeholder="Ví dụ: THPT Lê Quý Đôn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Học viện đang tập
                  </label>
                  <input
                    type="text"
                    name="academy"
                    value={editFormData.academy || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
                    placeholder="Ví dụ: PVF, HAGL JMG"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đội bóng đang thi đấu
                  </label>
                  <input
                    type="text"
                    name="club"
                    value={editFormData.club || ""}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 placeholder:opacity-50"
                    placeholder="Ví dụ: CLB Bóng đá Thanh Hóa U18"
                  />
                </div>

                {/* Dynamic collections */}
                <DynamicAchievementList
                  label="Thành tích cá nhân"
                  titlePlaceholder="Ví dụ: Vua phá lưới U18 TP HCM năm 2025"
                  values={individualAchievements}
                  onChange={setIndividualAchievements}
                />

                <DynamicAchievementList
                  label="Thành tích tập thể"
                  titlePlaceholder="Ví dụ: HCV với đội trẻ TP HCM"
                  values={teamAchievements}
                  onChange={setTeamAchievements}
                />

                <DynamicHighlightList
                  label="Video highlights"
                  urlPlaceholder="Dán URL video (YouTube, Facebook...)"
                  values={highlights}
                  onChange={setHighlights}
                />

                <DynamicFieldList
                  label="Mạng xã hội"
                  placeholder="Dán URL profile (Facebook, Instagram...)"
                  values={socials}
                  onChange={setSocials}
                />
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
