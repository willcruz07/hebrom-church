import { Timestamp } from 'firebase/firestore';

export interface User {
  id?: string;
  name: string;
  email: string;
  photoURL: string;
  role?: 'admin' | 'pastor' | 'member' | 'visitor';
  status?: 'active' | 'inactive' | 'pending';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
