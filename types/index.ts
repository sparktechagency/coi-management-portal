export type UserRole = 'admin' | 'client';

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessName?: string;
  avatarInitials?: string;
};

export type Client = {
  id: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  certificateCount: number;
  avatarInitials: string;
  phone: string;
  address: string;
  createdAt: string;
};

export type Certificate = {
  id: string;
  clientId: string;
  certificateNumber: string;
  certificateHolderName: string;
  certificateHolderAddress: string;
  certificateDate: string;
  insuredName: string;
  additionalInsured: boolean;
  status: 'active' | 'inactive';
  lastUpdated: string;
  policyType: string;
  policyNumber: string;
  effectiveDate: string;
  expirationDate: string;
  generalAggregateLimit: string;
  eachOccurrenceLimit: string;
  fileSize?: string;
  /** Path in the 'coi-templates' Supabase Storage bucket */
  templateStoragePath?: string;
  /** Pre-filled by admin; fully editable by client */
  descriptionOfOperations?: string;
};

export type Activity = {
  id: string;
  title: string;
  clientName: string;
  action: 'Certificate uploaded' | 'Certificate downloaded' | 'Certificate updated' | 'Client created';
  date: string;
  certificateId?: string | null;
};

