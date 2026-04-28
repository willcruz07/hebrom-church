import { Timestamp } from 'firebase/firestore';

export type UserRole = 'visitor' | 'pending_member' | 'member' | 'secretary' | 'pastor';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  sub_groups: string[];
  profile: {
    full_name: string;
    avatar_url: string | null;
    bio: string;
    birth_date: string;
    baptism_date: string | null;
    phone: string;
    address: string;
    is_profile_public: boolean;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface FeedPost {
  id: string;
  author: {
    uid: string;
    name: string;
    avatar_url: string;
  };
  title: string;
  content: string;
  media_url?: string;
  target_groups: string[];
  created_at: number | Timestamp;
}

export interface PrayerRequest {
  id: string;
  author_uid: string;
  author_name: string;
  request_text: string;
  is_confidential: boolean;
  status: 'pending' | 'viewed' | 'praying' | 'answered';
  viewed_by_pastor?: {
    uid: string;
    name: string;
  };
  pastor_response?: string;
  is_archived: boolean;
  created_at: number;
  updated_at: number;
}
export interface ChurchGroup {
  id: string;
  name: string;
  description?: string;
  leader_uid?: string;
  created_at: number;
}

export type EventCategory = 'Culto' | 'Evento' | 'Ensino' | 'Grupo' | 'Outro';

export interface ChurchEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  category: EventCategory;
  created_at: Timestamp | number;
  updated_at?: Timestamp | number;
}
