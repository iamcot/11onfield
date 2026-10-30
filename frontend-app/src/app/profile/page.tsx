"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useT } from "@/i18n/I18nProvider";

export default function ProfilePage() {
  const t = useT();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    } else if (!isLoading && user) {
      // Redirect to user's profile page with userid
      router.push(`/profile/${user.userid}`);
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>{t("Đang tải...")}</p>
    </div>
  );
}
