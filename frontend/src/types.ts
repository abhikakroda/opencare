export type QueueStatus = 'waiting' | 'called' | 'done';
export type BedStatus = 'available' | 'occupied' | 'cleaning';

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
