export type UserRole = 'citizen' | 'donor' | 'admin' | 'charity' | 'researcher' | 'medical';

export interface User {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: string;
}
