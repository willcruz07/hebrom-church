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
    // Expanded data
    gender?: 'M' | 'F' | 'O';
    marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
    spouse_name?: string;
    children_count?: number;
    profession?: string;
    rg?: string;
    cpf?: string;
    father_name?: string;
    mother_name?: string;
    naturalness?: string;
    communion_date?: string;
    
    address: string;
    address_number?: string;
    address_complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    blood_type?: string;
    church_position?: string;
    
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

export interface DailyWord {
  id: string;
  content: string;
  reference?: string;
  theme: string;
  author_uid: string;
  author_name: string;
  publish_date: string; // YYYY-MM-DD
  created_at: Timestamp | number;
}
