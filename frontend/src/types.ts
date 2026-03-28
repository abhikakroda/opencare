export type QueueStatus = 'waiting' | 'called' | 'done';
export type BedStatus = 'available' | 'occupied' | 'cleaning';
export type DoctorStatus = 'available' | 'busy' | 'off_duty';
export type MachineStatus = 'available' | 'in_use' | 'maintenance';
export type ComplaintStatus = 'open' | 'in_review' | 'resolved';

export type QueueItem = {
  id: string;
  patient_name: string;
  department: string;
  token_number: string;
  status: QueueStatus;
  created_at: string;
  called_at: string | null;
  completed_at: string | null;
};

export type Medicine = {
  id: string;
  name: string;
  generic_name: string;
  brand_names: string[];
  stock_qty: number;
  location: string;
  alternatives: string[];
  updated_at: string;
};

export type Bed = {
  id: string;
  ward: string;
  bed_number: string;
  status: BedStatus;
  patient_name: string | null;
  updated_at: string;
};

export type Doctor = {
  id: string;
  name: string;
  department: string;
  specialization: string;
  status: DoctorStatus;
  room: string;
  next_slot: string;
  updated_at: string;
};

export type Machine = {
  id: string;
  name: string;
  category: string;
  location: string;
  quantity: number;
  status: MachineStatus;
  notes: string;
  updated_at: string;
};

export type Complaint = {
  id: string;
  patient_name: string;
  phone: string | null;
  department: string;
  subject: string;
  message: string;
  status: ComplaintStatus;
  admin_note: string;
  created_at: string;
  updated_at: string;
};

export type MedicalHistory = {
  id: string;
  patient_name: string;
  phone: string;
  visit_date: string;
  department: string;
  diagnosis: string;
  medicines: string[];
  allergies: string[];
  notes: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
};
