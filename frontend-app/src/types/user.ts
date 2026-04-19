export interface UserListItem {
  userid: string;
  fullName: string;
  avatar: string | null;
  role: string;
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
}
