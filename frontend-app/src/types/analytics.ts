/**
 * Analytics event names
 * All trackable events in the application
 */
export type AnalyticsEvent =
  // Authentication Events
  | 'user_login'
  | 'user_register'
  | 'user_logout'
  | 'otp_requested'
  | 'otp_verified'
  | 'password_reset'
  // Profile Events
  | 'profile_viewed'
  | 'profile_edit_started'
  | 'profile_edit_completed'
  | 'user_followed'
  | 'user_unfollowed'
  // Discovery Events
  | 'players_page_viewed'
  | 'player_search'
  | 'player_filter_applied'
  | 'players_sort_changed'
  | 'player_card_clicked'
  | 'events_page_viewed'
  | 'event_search'
  | 'event_filter_applied'
  | 'event_card_clicked'
  | 'event_viewed'
  | 'event_registration_started'
  | 'event_registration_completed'
  | 'event_registration_cancelled'
  // Error Events
  | 'api_error'
  | 'form_validation_error'
  | 'page_load_slow';

/**
 * User properties for identification
 */
export interface UserProperties {
  userId?: string;
  phone?: string;
  userid?: string;
  username?: string;
  role?: string;
  createdAt?: string;
  hasAvatar?: boolean;
  hasEmail?: boolean;
  [key: string]: any;
}

/**
 * Event properties by event type
 */
export interface EventProperties {
  // Authentication
  user_login?: {
    method: string;
    role: string;
    isFirstLogin?: boolean;
  };
  user_register?: {
    role: string;
    province_id?: number;
    has_player_profile?: boolean;
  };
  user_logout?: {
    session_duration?: number;
  };

  // Profile
  profile_viewed?: {
    viewed_userid: string;
    viewer_userid?: string;
    is_own_profile: boolean;
    from?: string;
    view_duration?: number;
  };
  profile_edit_completed?: {
    fields_changed: string[];
    section: string;
  };
  user_followed?: {
    followed_userid: string;
    from?: string;
  };

  // Discovery
  players_page_viewed?: {
    applied_filters?: Record<string, any>;
    sort_by?: string;
    results_count?: number;
  };
  player_search?: {
    query: string;
    results_count: number;
    filters_applied: boolean;
  };
  player_filter_applied?: {
    filter_type: string;
    filter_value: any;
  };

  // Events
  event_viewed?: {
    event_id: number;
    event_title: string;
    event_status: string;
    participant_count?: number;
  };
  event_registration_completed?: {
    event_id: number;
    event_title: string;
  };

  // Errors
  api_error?: {
    endpoint: string;
    status_code: number;
    error_message: string;
    user_action?: string;
  };
  form_validation_error?: {
    form_name: string;
    fields_with_errors: string[];
  };

  // Generic properties
  [key: string]: any;
}
