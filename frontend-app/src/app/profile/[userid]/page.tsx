"use client";

import HexagonChart from "@/components/HexagonChart";
import MobileNav from "@/components/layout/MobileNav";
import RightNavigator from "@/components/layout/RightNavigator";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import TopUserCard from "@/components/layout/TopUserCard";
import EventCard from "@/components/profile/EventCard";
import FeedList from "@/components/profile/FeedList";
import EditProfileHandler from "@/components/profile/EditProfileHandler";
import { appConfig } from "@/config/app.config";
import { profileCompletionConfig } from "@/config/profile-completion.config";
import { useAuth } from "@/contexts/AuthContext";
import { useEditProfile } from "@/contexts/EditProfileContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { getMockUserByPhone } from "@/mocks/user.mock";
import { eventService } from "@/services/event.service";
import { feedService } from "@/services/feed.service";
import { followService } from "@/services/follow.service";
import { userService } from "@/services/user.service";
import { EventListItem } from "@/types/event";
import { FeedItem } from "@/types/feed";
import { UserListItem } from "@/types/user";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserProfilePage() {
  const {
    user: currentUser,
    isAuthenticated,
    isLoading: authLoading,
    logout,
    shouldCheckProfileCompletion,
    setProfileCompletionChecked,
  } = useAuth();
  const { isCollapsed } = useSidebar();
  const { closeEditProfile, setOpenCallback, openEditProfile } = useEditProfile();
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

  // Recent activities (feeds) state
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
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
              academy: apiUser.academy,
              club: apiUser.club,
              socials: apiUser.socials || [],
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

  // Check profile completion for own profile
  useEffect(() => {
    if (
      isOwnProfile &&
      profileUser &&
      (shouldCheckProfileCompletion || userid === currentUser?.userid)
    ) {
      console.log('[Profile Check] Checking profile completion...');
      const isIncomplete = profileCompletionConfig.isPlayerProfileIncomplete(profileUser);

      if (isIncomplete) {
        console.log('[Profile Check] Profile incomplete, opening edit modal');
        // Small delay to ensure the page is rendered before opening modal
        setTimeout(() => {
          openEditProfile();
        }, 500);
      }

      // Mark as checked to prevent repeated checks
      if (shouldCheckProfileCompletion) {
        setProfileCompletionChecked();
      }
    }
  }, [isOwnProfile, profileUser, shouldCheckProfileCompletion, currentUser, userid, openEditProfile, setProfileCompletionChecked]);

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
      const fetchFeeds = async () => {
        setRecentEventsLoading(true);
        try {
          const feedsData = await feedService.getUserFeeds(userid);
          setFeeds(feedsData);
        } catch (err) {
          console.error("Error fetching feeds:", err);
        } finally {
          setRecentEventsLoading(false);
        }
      };

      fetchFeeds();
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
        scrollOnOpen={
          sidebarView === "followers" || sidebarView === "following"
        }
      >
        {(sidebarView === "followers" || sidebarView === "following") && (
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-green-900 via-green-800 to-green-950 p-4">
              <h2 className="text-white text-lg font-semibold">
                {sidebarView === "followers"
                  ? "Người theo dõi"
                  : "Đang theo dõi"}
              </h2>
            </div>

            {/* List */}
            <div className="p-4">
              {(sidebarView === "followers" ? followersList : followingPlayers)
                .length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {sidebarView === "followers"
                    ? "Chưa có người theo dõi"
                    : "Chưa theo dõi ai"}
                </p>
              ) : (
                <div className="space-y-3">
                  {(sidebarView === "followers"
                    ? followersList
                    : followingPlayers
                  ).map((user) => (
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
        <div
          className={`fixed bottom-0 left-0 right-0 h-48 pointer-events-none z-0 transition-all duration-300 ${isCollapsed ? "md:left-16" : "md:left-64"}`}
        >
          <div
            className="absolute inset-0 bg-cover bg-bottom"
            style={{ backgroundImage: `url(/images/ground.jpg)` }}
          >
            {/* Primary color overlay - dark at bottom, fade to transparent at top */}
            <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 via-green-900/20 to-transparent"></div>
            {/* White fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-white"></div>
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

            <div className="bg-white rounded-lg shadow p-3 mb-4">
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
            <div className="bg-white rounded-lg shadow mb-4">
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
              </div>
            </div>

            <div className="">
              {/* Tab Content */}
              <div className="">
                {activeTab === "profile" && (
                  <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Left: User Info */}
                    <div className="lg:col-span-1">
                      <div className="bg-white mb-4 p-4 md:p-6 rounded-lg shadow ">
                        <h3 className="text-lg font-semibold mb-4">
                          Thông tin cá nhân
                        </h3>
                        <div className="space-y-3">
                          {(() => {
                            const infoItems: Array<{
                              key: string;
                              label: string;
                              value?: string;
                              component?: JSX.Element;
                            }> = [];

                            // Always show full name
                            infoItems.push({
                              key: "fullname",
                              label: "Họ và tên",
                              value: profileUser.fullName || "N/A",
                            });

                            // Show phone if own profile
                            if (isOwnProfile) {
                              infoItems.push({
                                key: "phone",
                                label: "Số điện thoại",
                                value: profileUser.username,
                              });
                            }

                            // Show email if exists
                            if (profileUser.email) {
                              infoItems.push({
                                key: "email",
                                label: "Email",
                                value: profileUser.email,
                              });
                            }

                            // Show DOB if exists
                            if (profileUser.dob) {
                              infoItems.push({
                                key: "dob",
                                label: "Ngày sinh",
                                value: new Date(profileUser.dob).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }),
                              });
                            }

                            // Show province if exists
                            if (profileUser.province) {
                              infoItems.push({
                                key: "province",
                                label: "Địa chỉ",
                                value: profileUser.province,
                              });
                            }

                            // Show created date if exists
                            if (profileUser.createdAt) {
                              infoItems.push({
                                key: "created",
                                label: "Thành viên từ",
                                value: new Date(profileUser.createdAt).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }),
                              });
                            }

                            // Show socials if player and has socials
                            if (profileUser.isPlayer && profileUser.socials && profileUser.socials.length > 0) {
                              infoItems.push({
                                key: "socials",
                                label: "Mạng xã hội",
                                component: (
                                  <div className="flex gap-3">
                                    {profileUser.socials.map(
                                      (social: any, index: number) => {
                                        const platform =
                                          social.platform?.toLowerCase();
                                        const getSocialIcon = () => {
                                          switch (platform) {
                                            case "facebook":
                                              return (
                                                <svg
                                                  className="w-5 h-5 text-[#1877F2]"
                                                  fill="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                </svg>
                                              );
                                            case "instagram":
                                              return (
                                                <svg
                                                  className="w-5 h-5 text-[#E4405F]"
                                                  fill="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                                </svg>
                                              );
                                            case "tiktok":
                                              return (
                                                <svg
                                                  className="w-5 h-5"
                                                  fill="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                                                </svg>
                                              );
                                            case "youtube":
                                              return (
                                                <svg
                                                  className="w-5 h-5 text-[#FF0000]"
                                                  fill="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                                </svg>
                                              );
                                            case "twitter":
                                            case "x":
                                              return (
                                                <svg
                                                  className="w-5 h-5"
                                                  fill="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                </svg>
                                              );
                                            default:
                                              return (
                                                <svg
                                                  className="w-5 h-5 text-gray-600"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                                  />
                                                </svg>
                                              );
                                          }
                                        };
                                        return (
                                          <a
                                            key={index}
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:opacity-70 transition"
                                            title={platform}
                                          >
                                            {getSocialIcon()}
                                          </a>
                                        );
                                      },
                                    )}
                                  </div>
                                ),
                              });
                            }

                            // Render all items
                            return infoItems.map((item, index) => {
                              const isLast = index === infoItems.length - 1;

                              if (item.component) {
                                // For custom component (socials)
                                return (
                                  <div key={item.key} className={`flex justify-between py-2 ${!isLast ? 'border-b border-gray-100' : ''}`}>
                                    <span className="text-sm text-gray-600">{item.label}</span>
                                    {item.component}
                                  </div>
                                );
                              } else {
                                // For regular InfoRow
                                return (
                                  <InfoRow
                                    key={item.key}
                                    label={item.label}
                                    value={item.value!}
                                    isLast={isLast}
                                  />
                                );
                              }
                            });
                          })()}
                        </div>
                      </div>
                      {profileUser.isPlayer && profileUser.bio && (
                        <div className="bg-white p-4 md:p-6 rounded-lg shadow ">
                          <div className="">
                            <h3 className="text-lg font-semibold mb-4">
                              Tiểu sử
                            </h3>
                            <p className="text-sm font-medium text-gray-900 leading-relaxed whitespace-pre-wrap">
                              {profileUser.bio}
                            </p>
                          </div>
                        </div>
                      )}
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
                      ) : (
                        <FeedList feeds={feeds} currentUserid={currentUser?.userid} />
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
                    <StatRow
                      label="Cấp độ"
                      value={
                        profileUser.level === "CAU_THU_MOI"
                          ? "Cầu thủ mới"
                          : profileUser.level === "NGHIEP_DU"
                            ? "Nghiệp dư"
                            : profileUser.level === "TUYEN_TRE"
                              ? "Tuyển trẻ"
                              : profileUser.level === "CHUYEN_NGHIEP"
                                ? "Chuyên nghiệp"
                                : "N/A"
                      }
                    />
                    {profileUser.academy && (
                      <StatRow label="Học viện" value={profileUser.academy} />
                    )}
                    {profileUser.club && (
                      <StatRow label="Đội bóng" value={profileUser.club} />
                    )}
                  </div>
                </div>

                {/* Skills - Hexagon Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Kỹ năng</h3>
                  <div className="flex justify-center">
                    {profileUser?.attributes &&
                    profileUser.attributes.length > 0 ? (
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

      {/* Edit Profile Handler Component */}
      <EditProfileHandler />

      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <MobileNav backgroundImage="/images/ground.jpg" />
    </div>
  );
}

// Helper Components
function InfoRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <div className={`flex justify-between py-2 ${!isLast ? 'border-b border-gray-100' : ''}`}>
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
