"use client";

import MobileNav from "@/components/layout/MobileNav";
import RightNavigator from "@/components/layout/RightNavigator";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import TopUserCard from "@/components/layout/TopUserCard";
import EventCard from "@/components/profile/EventCard";
import HexagonChart from "@/components/HexagonChart";
import { appConfig } from "@/config/app.config";
import { useAuth } from "@/contexts/AuthContext";
import { useEditProfile } from "@/contexts/EditProfileContext";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  compressImage,
  formatFileSize,
  isValidImageFile,
  isValidImageSize,
} from "@/lib/image-utils";
import { getMockUserByPhone } from "@/mocks/user.mock";
import { eventService } from "@/services/event.service";
import { followService } from "@/services/follow.service";
import { provinceService } from "@/services/province.service";
import { userService } from "@/services/user.service";
import { EventListItem } from "@/types/event";
import { UserListItem } from "@/types/user";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function UserProfilePage() {
  const {
    user: currentUser,
    isAuthenticated,
    isLoading: authLoading,
    logout,
  } = useAuth();
  const { isCollapsed } = useSidebar();
  const { closeEditProfile, setOpenCallback } = useEditProfile();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userid = params.userid as string;
  const fromPlayers = searchParams.get("from") === "players";
  const fromFollowers = searchParams.get("from") === "followers";
  const fromFollowing = searchParams.get("from") === "following";
  const showBackButton = fromPlayers || fromFollowers || fromFollowing;

  const [profileUser, setProfileUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "matches" | "events">(
    "profile",
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followingPlayers, setFollowingPlayers] = useState<UserListItem[]>([]);
  const [followersList, setFollowersList] = useState<UserListItem[]>([]);

  // Sidebar view state
  const [sidebarView, setSidebarView] = useState<
    "default" | "followers" | "following"
  >("default");

  // Events state
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsPage, setEventsPage] = useState(0);
  const [eventsTotalPages, setEventsTotalPages] = useState(0);
  const [joiningEventId, setJoiningEventId] = useState<number | null>(null);

  // Recent activities (events) state
  const [recentEvents, setRecentEvents] = useState<EventListItem[]>([]);
  const [recentEventsLoading, setRecentEventsLoading] = useState(false);
  const [showRightNav, setShowRightNav] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const handleFollowToggle = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (followLoading) return;

    // Show confirmation for unfollow
    if (isFollowing) {
      const confirmed = window.confirm(
        `Bạn có chắc muốn bỏ theo dõi ${profileUser?.fullName || "người dùng này"}?`,
      );
      if (!confirmed) return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(userid);
        setIsFollowing(false);
        // Update local follower count
        if (profileUser) {
          setProfileUser({
            ...profileUser,
            followersCount: Math.max(0, (profileUser.followersCount || 1) - 1),
          });
        }
      } else {
        await followService.followUser(userid);
        setIsFollowing(true);
        // Update local follower count
        if (profileUser) {
          setProfileUser({
            ...profileUser,
            followersCount: (profileUser.followersCount || 0) + 1,
          });
        }
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShowFollowers = async () => {
    if (sidebarView === "followers") {
      setSidebarView("default");
      setShowRightNav(false);
      return;
    }

    try {
      const followers = await followService.getFollowers(userid);
      setFollowersList(followers);
      setSidebarView("followers");

      // Open right nav on mobile
      setShowRightNav(true);
    } catch (error) {
      console.error("Failed to fetch followers:", error);
    }
  };

  const handleShowFollowing = async () => {
    if (sidebarView === "following") {
      setSidebarView("default");
      setShowRightNav(false);
      return;
    }

    try {
      const following = await followService.getFollowingPlayers(userid);
      setFollowingPlayers(following);
      setSidebarView("following");

      // Open right nav on mobile
      setShowRightNav(true);
    } catch (error) {
      console.error("Failed to fetch following:", error);
    }
  };

  const handleCloseSidebar = () => {
    setSidebarView("default");
    setShowRightNav(false);
  };

  const handleOpenEditModal = async () => {
    // Use currentUser if profileUser is not available (e.g., when opening from other pages)
    const userToEdit = profileUser || currentUser;

    if (!userToEdit) {
      console.error("No user data available");
      return;
    }

    // Load provinces
    try {
      const provinceData = await provinceService.getAllProvinces();
      setProvinces(provinceData);
    } catch (error) {
      console.error("Error loading provinces:", error);
      setProvinces([]);
    }

    // Initialize form data with current profile data
    const formData = {
      fullName: userToEdit.fullName || "",
      email: userToEdit.email || "",
      dob: userToEdit.dob || "",
      gender: userToEdit.gender || "",
      provinceId: userToEdit.provinceId ? String(userToEdit.provinceId) : "",
      // Player-specific fields
      ...(userToEdit.isPlayer && {
        height: userToEdit.height ? String(userToEdit.height) : "",
        weight: userToEdit.weight ? String(userToEdit.weight) : "",
        preferredFoot: userToEdit.preferredFoot || "",
        positions: userToEdit.positions || [],
        level: userToEdit.level || "",
        bio: userToEdit.bio || "",
      }),
    };

    // Set form data and open modal
    await new Promise(resolve => {
      setEditFormData(formData);
      resolve(undefined);
    });

    setShowEditModal(true);
  };

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
  };

  const handleEditFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
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

        // Compress image before upload
        const compressedFile = await compressImage(
          selectedAvatarFile,
          800,
          800,
          0.8,
        );
        console.log(
          `Original: ${formatFileSize(selectedAvatarFile.size)}, Compressed: ${formatFileSize(compressedFile.size)}`,
        );

        setUploadProgress("Đang upload ảnh...");

        // Upload to backend
        await userService.uploadAvatar(compressedFile);
        setUploadProgress("");
      }

      // Then update profile data
      // Filter out empty values to prevent sending empty strings
      const cleanedData: any = {};
      Object.keys(editFormData).forEach((key) => {
        const value = editFormData[key];
        // Only include non-empty values
        if (value !== "" && value !== null && value !== undefined) {
          cleanedData[key] = value;
        }
      });

      await userService.updateProfile(cleanedData);

      // Refresh profile data
      const apiUser = await userService.getUserByUserid(userid);
      const transformedUser = {
        username: apiUser.phone,
        userid: apiUser.userid,
        fullName: apiUser.fullName,
        email: apiUser.email,
        avatar: apiUser.avatar,
        dob: apiUser.dob,
        gender: apiUser.gender,
        province: apiUser.address?.province?.name,
        provinceId: apiUser.address?.province?.id,
        address: apiUser.address?.address,
        ward: apiUser.address?.ward,
        createdAt: apiUser.createdAt,
        isPlayer: apiUser.role === "PLAYER",
        positions: apiUser.positions || [],
        height: apiUser.height,
        weight: apiUser.weight,
        preferredFoot: apiUser.preferredFoot,
        level: apiUser.level,
        bio: apiUser.bio,
        attributes: apiUser.attributes || [],
      };
      setProfileUser(transformedUser);

      // Clear avatar selection
      setSelectedAvatarFile(null);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      setAvatarPreviewUrl(null);

      // Show success notification
      alert("Cập nhật thông tin thành công!");

      handleCloseEditModal();
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

    // Validate file type
    if (!isValidImageFile(file)) {
      alert("Chỉ chấp nhận file ảnh: JPEG, PNG, GIF, WebP");
      return;
    }

    // Validate file size
    if (!isValidImageSize(file, 20)) {
      alert(
        `Kích thước file quá lớn (${formatFileSize(file.size)}). Tối đa 20MB.`,
      );
      return;
    }

    setSelectedAvatarFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl(previewUrl);
  };

  const handleAvatarClick = () => {
    // Trigger hidden file input
    document.getElementById("avatar-file-input")?.click();
  };

  const handleCancelAvatarSelection = () => {
    setSelectedAvatarFile(null);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarPreviewUrl(null);
  };

  // Register callback for edit profile from context
  useEffect(() => {
    const isOwn = currentUser?.userid === profileUser?.userid;
    if (profileUser && isOwn) {
      setOpenCallback(handleOpenEditModal);
    }
    return () => setOpenCallback(null);
  }, [profileUser, currentUser]);

  useEffect(() => {
    if (!authLoading && userid) {
      // Fetch user by userid
      if (appConfig.isMockEnabled) {
        console.log("[Mock Mode] Fetching user profile by userid:", userid);
        const user = getMockUserByPhone(userid);
        if (user) {
          setProfileUser(user);
        } else {
          setError("Không tìm thấy người dùng");
        }
        setIsLoading(false);
      } else {
        // Call real API to fetch user by userid
        const fetchUserProfile = async () => {
          try {
            const apiUser = await userService.getUserByUserid(userid);

            // Transform API response to match component's expected format
            const transformedUser = {
              username: apiUser.phone,
              userid: apiUser.userid,
              fullName: apiUser.fullName,
              email: apiUser.email,
              avatar: apiUser.avatar,
              dob: apiUser.dob,
              gender: apiUser.gender,
              province: apiUser.address?.province?.name,
              provinceId: apiUser.address?.province?.id,
              address: apiUser.address?.address,
              ward: apiUser.address?.ward,
              createdAt: apiUser.createdAt,
              isPlayer: apiUser.role === "PLAYER",
              positions: apiUser.positions || [],
              height: apiUser.height,
              weight: apiUser.weight,
              preferredFoot: apiUser.preferredFoot,
              level: apiUser.level,
              bio: apiUser.bio,
              attributes: apiUser.attributes || [],
              followersCount: apiUser.followersCount || 0,
              followingCount: apiUser.followingCount || 0,
            };

            setProfileUser(transformedUser);
            setIsLoading(false);
          } catch (err: any) {
            console.error("Error fetching user profile:", err);
            setError(err.message || "Không tìm thấy người dùng");
            setIsLoading(false);
          }
        };

        fetchUserProfile();
      }
    }
  }, [authLoading, isAuthenticated, userid, router]);

  // Determine if viewing own profile
  const isOwnProfile = currentUser?.userid === profileUser?.userid;

  // Fetch follow status when viewing other's profile
  useEffect(() => {
    if (!isOwnProfile && isAuthenticated && userid) {
      followService
        .isFollowing(userid)
        .then(setIsFollowing)
        .catch(console.error);
    }
  }, [userid, isOwnProfile, isAuthenticated]);

  // Fetch following list for non-player profiles
  useEffect(() => {
    if (profileUser && profileUser.isPlayer === false) {
      followService
        .getFollowingPlayers(userid)
        .then((players) => setFollowingPlayers(players.slice(0, 10)))
        .catch(console.error);
    }
  }, [profileUser, userid]);

  // Fetch joined events when events tab is active
  useEffect(() => {
    if (activeTab === "events" && userid) {
      const fetchEvents = async () => {
        console.log("[Profile] Fetching events for userid:", userid);
        setEventsLoading(true);
        try {
          const response = await eventService.getUserJoinedEvents(
            userid,
            eventsPage,
            10,
          );
          console.log("[Profile] Events response:", response);
          setEvents(response.data);
          setEventsTotalPages(response.totalPages);
        } catch (err) {
          console.error("Error fetching joined events:", err);
        } finally {
          setEventsLoading(false);
        }
      };

      fetchEvents();
    }
  }, [activeTab, userid, eventsPage]);

  // Fetch recent events for "Hoạt động gần đây" section (Profile tab)
  useEffect(() => {
    if (activeTab === "profile" && userid) {
      const fetchRecentEvents = async () => {
        setRecentEventsLoading(true);
        try {
          const response = await eventService.getUserJoinedEvents(
            userid,
            0,
            3, // Get only 3 most recent events
          );
          setRecentEvents(response.data);
        } catch (err) {
          console.error("Error fetching recent events:", err);
        } finally {
          setRecentEventsLoading(false);
        }
      };

      fetchRecentEvents();
    }
  }, [activeTab, userid]);

  // Handle join event from visitor view
  const handleJoinEvent = async (eventId: number) => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    setJoiningEventId(eventId);
    try {
      await eventService.joinEvent(eventId);
      // Optionally refresh events list or show success message
      alert("Đã tham gia sự kiện thành công!");
    } catch (err: any) {
      console.error("Error joining event:", err);
      alert(err.message || "Không thể tham gia sự kiện");
    } finally {
      setJoiningEventId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/profile" className="text-green-600 hover:text-green-500">
            Quay lại trang cá nhân của bạn
          </Link>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return null;
  }

  // Mock data - will be replaced with real API calls
  const mockStats = {
    matches: 0,
    wins: 0,
    losses: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    redCards: 0,
    yellowCards: 0,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left Sidebar - Navigation - Hidden on mobile */}
      <Sidebar onLogout={handleLogout} />

      <TopBar onMenuToggle={() => setShowRightNav(!showRightNav)} />
      <RightNavigator
        isOpen={showRightNav}
        onClose={() => {
          setShowRightNav(false);
          setSidebarView("default");
        }}
        scrollOnOpen={sidebarView === "followers" || sidebarView === "following"}
      >
        {(sidebarView === "followers" || sidebarView === "following") && (
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-300 p-4">
              <h2 className="text-white text-lg font-semibold">
                {sidebarView === "followers" ? "Người theo dõi" : "Đang theo dõi"}
              </h2>
            </div>

            {/* List */}
            <div className="p-4">
              {(sidebarView === "followers" ? followersList : followingPlayers).length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {sidebarView === "followers" ? "Chưa có người theo dõi" : "Chưa theo dõi ai"}
                </p>
              ) : (
                <div className="space-y-3">
                  {(sidebarView === "followers" ? followersList : followingPlayers).map((user) => (
                    <Link
                      key={user.userid}
                      href={`/profile/${user.userid}?from=${sidebarView}`}
                      onClick={() => {
                        setShowRightNav(false);
                        setSidebarView("default");
                      }}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                          <span className="text-green-600 font-bold">
                            {user.fullName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {user.fullName}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {user.role.toLowerCase()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </RightNavigator>

      {/* Top User Card - Desktop Only */}
      <TopUserCard />

      {/* Center Content */}
      <main className="flex-1 overflow-auto pb-0 pt-16 md:pb-0 md:pt-16 relative">
        {/* Background image at bottom */}
        <div className={`fixed bottom-0 left-0 right-0 h-48 pointer-events-none z-0 transition-all duration-300 ${isCollapsed ? 'md:left-16' : 'md:left-64'}`}>
          <div
            className="absolute inset-0 bg-cover bg-bottom"
            style={{ backgroundImage: `url(/images/ground.jpg)` }}
          >
            {/* Gradient overlay fade to white at top */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/50 to-white"></div>
          </div>
        </div>

        <div className="relative z-10">
          {/* Banner */}
          {/* <div className="h-48 relative z-0">
            <Image
              src="/images/banner_1.jpg"
              alt="Profile Banner"
              fill
              className="object-cover object-bottom"
              priority
            />
          </div> */}

          {/* Avatar Section */}
          <div className="max-w-6xl mx-auto px-4 pt-2 relative z-10">
            {/* Back Button - Show when coming from players/followers/following */}
            {showBackButton && (
              <button
                onClick={() => router.back()}
                className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>Quay lại</span>
              </button>
            )}

            <div className="bg-white rounded-lg shadow p-3 mb-6">
              <div className="flex items-start gap-4 md:gap-6">
                {/* Avatar */}
                {profileUser.avatar ? (
                  <img
                    src={profileUser.avatar}
                    alt="Avatar"
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-green-200 flex items-center justify-center text-3xl md:text-4xl font-bold text-green-600 flex-shrink-0">
                    {profileUser.fullName?.charAt(0) ||
                      profileUser.username.charAt(0)}
                  </div>
                )}

                {/* Name and Positions */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className={!isOwnProfile ? "" : "truncate"}>
                      {profileUser.fullName || profileUser.username}
                    </span>
                    {profileUser.gender && (
                      <span className="text-lg md:text-xl flex-shrink-0">
                        {profileUser.gender === "MALE" && "♂️"}
                        {profileUser.gender === "FEMALE" && "♀️"}
                        {profileUser.gender === "OTHER" && "⚧️"}
                      </span>
                    )}
                  </h2>
                  {profileUser.isPlayer && profileUser.positions && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {profileUser.positions.map((position: string) => (
                        <span
                          key={position}
                          className="px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {position === "striker" && "Tiền đạo"}
                          {position === "midfielder" && "Tiền vệ"}
                          {position === "centerback" && "Trung vệ"}
                          {position === "defender" && "Hậu vệ"}
                          {position === "goalkeeper" && "Thủ môn"}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Follow Stats */}
                  {profileUser.followersCount !== undefined &&
                    profileUser.followingCount !== undefined &&
                    isOwnProfile && (
                      <div className="mt-2 text-sm text-gray-600">
                        <button
                          onClick={handleShowFollowing}
                          className="hover:text-green-600 transition"
                        >
                          <span className="font-medium">
                            {profileUser.followingCount}
                          </span>{" "}
                          đang theo dõi
                        </button>
                        {" · "}
                        <button
                          onClick={handleShowFollowers}
                          className="hover:text-green-600 transition"
                        >
                          <span className="font-medium">
                            {profileUser.followersCount}
                          </span>{" "}
                          người theo dõi
                        </button>
                      </div>
                    )}
                  {/* Non-clickable stats for other profiles */}
                  {profileUser.followersCount !== undefined &&
                    profileUser.followingCount !== undefined &&
                    !isOwnProfile && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">
                          {profileUser.followingCount}
                        </span>{" "}
                        đang theo dõi
                        {" · "}
                        <span className="font-medium">
                          {profileUser.followersCount}
                        </span>{" "}
                        người theo dõi
                      </div>
                    )}
                </div>

                {/* Action Buttons - Only show for other profiles on desktop */}
                {!isOwnProfile && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`hidden md:flex px-4 py-2 rounded-lg transition items-center gap-2 text-base flex-shrink-0 ${
                      isFollowing
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-green-600 text-white hover:bg-green-700"
                    } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {followLoading
                      ? "..."
                      : isFollowing
                        ? "Đang theo dõi"
                        : "Theo dõi"}
                  </button>
                )}
              </div>

              {/* Action Button on mobile - separate row */}
              {!isOwnProfile && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`md:hidden w-full mt-3 px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium ${
                    isFollowing
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-green-600 text-white hover:bg-green-700"
                  } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {followLoading
                    ? "..."
                    : isFollowing
                      ? "Đang theo dõi"
                      : "Theo dõi"}
                </button>
              )}
            </div>

            {/* Tab Bar */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-3 md:px-6 py-2 md:py-3 font-medium text-sm md:text-base ${
                    activeTab === "profile"
                      ? "text-green-600 border-b-2 border-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Trang cá nhân
                </button>
                <button
                  onClick={() => setActiveTab("matches")}
                  disabled
                  className={`px-3 md:px-6 py-2 md:py-3 font-medium text-sm md:text-base cursor-not-allowed opacity-50 ${
                    activeTab === "matches"
                      ? "text-green-600 border-b-2 border-green-600"
                      : "text-gray-500"
                  }`}
                >
                  Trận đấu <span className="ml-1 text-xs md:text-sm">(0)</span>
                </button>
                {/* Temporarily hidden */}
                {/* <button
                  onClick={() => setActiveTab("events")}
                  className={`px-3 md:px-6 py-2 md:py-3 font-medium text-sm md:text-base ${
                    activeTab === "events"
                      ? "text-green-600 border-b-2 border-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Sự kiện
                </button> */}
              </div>

              {/* Tab Content */}
              <div className="p-4 md:p-6">
                {activeTab === "profile" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Left: User Info */}
                    <div className="lg:col-span-1">
                      <h3 className="text-lg font-semibold mb-4">
                        Thông tin cá nhân
                      </h3>
                      <div className="space-y-3">
                        <InfoRow
                          label="Họ và tên"
                          value={profileUser.fullName || "N/A"}
                        />
                        {isOwnProfile && (
                          <InfoRow
                            label="Số điện thoại"
                            value={profileUser.username}
                          />
                        )}
                        {profileUser.email && (
                          <InfoRow label="Email" value={profileUser.email} />
                        )}
                        {profileUser.dob && (
                          <InfoRow
                            label="Ngày sinh"
                            value={new Date(profileUser.dob).toLocaleDateString(
                              "vi-VN",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          />
                        )}
                        {profileUser.province && (
                          <InfoRow
                            label="Địa chỉ"
                            value={profileUser.province}
                          />
                        )}
                        {profileUser.createdAt && (
                          <InfoRow
                            label="Thành viên từ"
                            value={new Date(
                              profileUser.createdAt,
                            ).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          />
                        )}
                        {profileUser.isPlayer && profileUser.bio && (
                          <div className="">
                            <p className="text-sm text-gray-600 mb-2">
                              Tiểu sử
                            </p>
                            <p className="text-sm font-medium text-gray-900 leading-relaxed whitespace-pre-wrap">
                              {profileUser.bio}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Recent Events */}
                    <div className="lg:col-span-2">
                      <h3 className="text-lg font-semibold mb-4">
                        Hoạt động gần đây
                      </h3>
                      {recentEventsLoading ? (
                        <div className="text-center py-8 text-gray-500">
                          Đang tải...
                        </div>
                      ) : recentEvents.length > 0 ? (
                        <div className="space-y-4">
                          {recentEvents.map((event) => (
                            <div
                              key={event.id}
                              className="bg-white rounded-lg shadow overflow-hidden"
                            >
                              {/* Header */}
                              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                <p className="text-sm text-gray-700">
                                  <span className="font-semibold">
                                    {profileUser.fullName ||
                                      profileUser.username}
                                  </span>{" "}
                                  đã tham gia sự kiện
                                </p>
                              </div>

                              {/* Event Card */}
                              <Link
                                href={`/events/${event.id}`}
                                className="block hover:bg-gray-50 transition"
                              >
                                {event.picture && (
                                  <div className="relative w-full h-48">
                                    <Image
                                      src={event.picture}
                                      alt={event.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div className="p-4">
                                  <h4 className="font-semibold text-gray-900 text-lg mb-2">
                                    {event.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {event.shortContent || "Tham gia sự kiện"}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <span>
                                      {new Date(
                                        event.startDate,
                                      ).toLocaleDateString("vi-VN")}
                                    </span>
                                    {event.location && (
                                      <>
                                        <span>•</span>
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                        </svg>
                                        <span className="truncate">
                                          {event.location}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Chưa tham gia sự kiện nào
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "matches" && (
                  <div className="text-center py-8 text-gray-500">
                    Danh sách trận đấu sẽ được hiển thị ở đây
                  </div>
                )}

                {activeTab === "events" && (
                  <div className="space-y-4">
                    {eventsLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        Đang tải...
                      </div>
                    ) : events.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Chưa tham gia sự kiện nào
                      </div>
                    ) : (
                      <>
                        {events.map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            userName={profileUser.fullName}
                            showJoinButton={!isOwnProfile}
                            onJoinClick={() => handleJoinEvent(event.id)}
                            isJoining={joiningEventId === event.id}
                          />
                        ))}

                        {/* Pagination */}
                        {eventsTotalPages > 1 && (
                          <div className="flex justify-center gap-2 mt-6">
                            <button
                              onClick={() =>
                                setEventsPage((prev) => Math.max(0, prev - 1))
                              }
                              disabled={eventsPage === 0}
                              className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Trước
                            </button>
                            <span className="px-4 py-2 text-gray-700">
                              Trang {eventsPage + 1} / {eventsTotalPages}
                            </span>
                            <button
                              onClick={() =>
                                setEventsPage((prev) =>
                                  Math.min(eventsTotalPages - 1, prev + 1),
                                )
                              }
                              disabled={eventsPage >= eventsTotalPages - 1}
                              className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              Sau
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Player Stats - Full width on mobile, sidebar on desktop */}
      {profileUser.isPlayer && (
        <aside className="md:w-80 mx-4 md:mx-0 mb-32 md:mb-0 md:pt-16 bg-white shadow-lg overflow-auto order-3 md:order-none relative z-10">
          <div className="p-4 md:p-6 space-y-4 md:space-y-6 md:pb-24">
            {/* Header with close button when showing followers/following */}
            {sidebarView !== "default" && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {sidebarView === "followers"
                    ? "Người theo dõi"
                    : "Đang theo dõi"}
                </h3>
                <button
                  onClick={handleCloseSidebar}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            )}

            {/* Default view - Player Stats */}
            {sidebarView === "default" && (
              <>
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Thông tin cầu thủ
                  </h3>
                  <div className="space-y-2">
                    <StatRow
                      label="Chiều cao"
                      value={
                        profileUser.height ? `${profileUser.height} cm` : "N/A"
                      }
                    />
                    <StatRow
                      label="Cân nặng"
                      value={
                        profileUser.weight ? `${profileUser.weight} kg` : "N/A"
                      }
                    />
                    <StatRow
                      label="Chân thuận"
                      value={
                        profileUser.preferredFoot === "left"
                          ? "Trái"
                          : profileUser.preferredFoot === "right"
                            ? "Phải"
                            : profileUser.preferredFoot === "both"
                              ? "Cả hai"
                              : "N/A"
                      }
                    />
                  </div>
                </div>

                {/* Skills - Hexagon Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Kỹ năng</h3>
                  <div className="flex justify-center">
                    {profileUser?.attributes && profileUser.attributes.length > 0 ? (
                      <HexagonChart
                        attributes={profileUser.attributes}
                        size={300}
                        showLabels={true}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>Chưa có dữ liệu chỉ số</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Thông số</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard title="Trận đấu" value={mockStats.matches} />
                    <StatCard title="Trận thắng" value={mockStats.wins} />
                    <StatCard title="Trận thua" value={mockStats.losses} />
                    <StatCard title="Phút thi đấu" value={mockStats.minutes} />
                    <StatCard title="Bàn thắng" value={mockStats.goals} />
                    <StatCard title="Kiến tạo" value={mockStats.assists} />
                    <StatCard title="Thẻ đỏ" value={mockStats.redCards} />
                    <StatCard title="Thẻ vàng" value={mockStats.yellowCards} />
                  </div>
                </div>
              </>
            )}

            {/* Followers view */}
            {sidebarView === "followers" && (
              <div className="space-y-3">
                {followersList.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Chưa có người theo dõi
                  </p>
                ) : (
                  followersList.map((follower) => (
                    <Link
                      key={follower.userid}
                      href={`/profile/${follower.userid}?from=players`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {follower.avatar ? (
                          <img
                            src={follower.avatar}
                            alt={follower.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-green-600 font-semibold text-sm">
                            {follower.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {follower.fullName}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Following view */}
            {sidebarView === "following" && (
              <div className="space-y-3">
                {followingPlayers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Chưa theo dõi ai
                  </p>
                ) : (
                  followingPlayers.map((player) => (
                    <Link
                      key={player.userid}
                      href={`/profile/${player.userid}?from=players`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {player.avatar ? (
                          <img
                            src={player.avatar}
                            alt={player.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-green-600 font-semibold text-sm">
                            {player.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {player.fullName}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Right Sidebar - Following Players List - Only for non-player profiles */}
      {!profileUser.isPlayer && (
        <aside className="md:w-80 mx-4 md:mx-0 mb-32 md:mb-0 md:pt-16 bg-white shadow-lg overflow-auto order-3 md:order-none relative z-10">
          <div className="p-4 md:p-6">
            {/* Header with close button when showing followers/following */}
            {sidebarView !== "default" && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {sidebarView === "followers"
                    ? "Người theo dõi"
                    : "Đang theo dõi"}
                </h3>
                <button
                  onClick={handleCloseSidebar}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            )}

            {sidebarView === "default" && followingPlayers.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-4">
                  Cầu thủ đang theo dõi
                </h3>
                <div className="space-y-3">
                  {followingPlayers.map((player) => (
                    <Link
                      key={player.userid}
                      href={`/profile/${player.userid}?from=players`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {player.avatar ? (
                          <img
                            src={player.avatar}
                            alt={player.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-green-600 font-semibold text-sm">
                            {player.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {player.fullName}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Followers view for non-player */}
            {sidebarView === "followers" && (
              <div className="space-y-3">
                {followersList.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Chưa có người theo dõi
                  </p>
                ) : (
                  followersList.map((follower) => (
                    <Link
                      key={follower.userid}
                      href={`/profile/${follower.userid}?from=players`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {follower.avatar ? (
                          <img
                            src={follower.avatar}
                            alt={follower.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-green-600 font-semibold text-sm">
                            {follower.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {follower.fullName}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Following view for non-player */}
            {sidebarView === "following" && (
              <div className="space-y-3">
                {followingPlayers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Chưa theo dõi ai
                  </p>
                ) : (
                  followingPlayers.map((player) => (
                    <Link
                      key={player.userid}
                      href={`/profile/${player.userid}?from=players`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {player.avatar ? (
                          <img
                            src={player.avatar}
                            alt={player.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-green-600 font-semibold text-sm">
                            {player.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {player.fullName}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && editFormData.fullName && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" key={editFormData.fullName}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Chỉnh sửa hồ sơ
              </h3>
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
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Ảnh đại diện
                </h4>

                <div className="flex items-center gap-6">
                  {/* Avatar Preview */}
                  <div className="relative">
                    {avatarPreviewUrl || profileUser.avatar ? (
                      <img
                        src={avatarPreviewUrl || profileUser.avatar}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-green-200 flex items-center justify-center text-2xl font-bold text-green-600">
                        {profileUser.fullName?.charAt(0) ||
                          profileUser.username.charAt(0)}
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
                          <span className="font-medium">
                            {selectedAvatarFile.name}
                          </span>
                          <span className="text-gray-500 ml-2">
                            ({formatFileSize(selectedAvatarFile.size)})
                          </span>
                        </p>

                        {uploadProgress && (
                          <p className="text-sm text-green-600 font-medium">
                            {uploadProgress}
                          </p>
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
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Thông tin cơ bản
                </h4>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
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
              {profileUser.isPlayer && (
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
                        Cấp độ
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiểu sử
                      </label>
                      <textarea
                        name="bio"
                        value={editFormData.bio || ""}
                        onChange={handleEditFormChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Mô tả ngắn về bản thân..."
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
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <MobileNav backgroundImage="/images/ground.jpg" />
    </div>
  );
}

// Helper Components
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-xs text-gray-600">{title}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}
