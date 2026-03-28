import { buildTokenNumber } from '../lib/token.js';
import { requireSupabase } from '../lib/supabase.js';

const supabase = requireSupabase();

const medicines = [
  {
    name: 'Paracetamol 650',
    generic_name: 'Paracetamol',
    brand_names: ['Dolo 650', 'Crocin'],
    stock_qty: 120,
    location: 'Pharmacy A / Rack 3',
    alternatives: ['Acetaminophen 500'],
  },
  {
    name: 'Azithromycin 500',
    generic_name: 'Azithromycin',
    brand_names: ['Azee', 'Zithrox'],
    stock_qty: 10,
    location: 'Pharmacy B / Rack 2',
    alternatives: ['Clarithromycin 250'],
  },
  {
    name: 'Insulin Regular',
    generic_name: 'Human Insulin',
    brand_names: ['Actrapid'],
    stock_qty: 0,
    location: 'Cold Storage Unit 1',
    alternatives: ['Insulin Aspart', 'Insulin Lispro'],
  },
  {
    name: 'Amoxicillin 500',
    generic_name: 'Amoxicillin',
    brand_names: ['Mox', 'Novamox'],
    stock_qty: 48,
    location: 'Pharmacy A / Rack 5',
    alternatives: ['Cefixime 200'],
  },
  {
    name: 'Salbutamol Inhaler',
    generic_name: 'Salbutamol',
    brand_names: ['Asthalin'],
    stock_qty: 16,
    location: 'Respiratory Counter',
    alternatives: ['Levosalbutamol Inhaler'],
  },
  {
    name: 'Pantoprazole 40',
    generic_name: 'Pantoprazole',
    brand_names: ['Pantocid', 'Pan'],
    stock_qty: 76,
    location: 'Pharmacy C / Rack 1',
    alternatives: ['Omeprazole 20'],
  },
];

const beds = [
  { ward: 'Ward A', bed_number: 'A-01', status: 'available', patient_name: null },
  { ward: 'Ward A', bed_number: 'A-02', status: 'occupied', patient_name: 'Rohan Singh' },
  { ward: 'Ward A', bed_number: 'A-03', status: 'cleaning', patient_name: null },
  { ward: 'Ward A', bed_number: 'A-04', status: 'available', patient_name: null },
  { ward: 'Ward B', bed_number: 'B-01', status: 'available', patient_name: null },
  { ward: 'Ward B', bed_number: 'B-02', status: 'occupied', patient_name: 'Anita Sharma' },
  { ward: 'Ward B', bed_number: 'B-03', status: 'available', patient_name: null },
  { ward: 'Ward C', bed_number: 'C-01', status: 'occupied', patient_name: 'Karan Patel' },
  { ward: 'Ward C', bed_number: 'C-02', status: 'cleaning', patient_name: null },
  { ward: 'ICU', bed_number: 'ICU-01', status: 'occupied', patient_name: 'Critical Case' },
  { ward: 'ICU', bed_number: 'ICU-02', status: 'available', patient_name: null },
  { ward: 'ICU', bed_number: 'ICU-03', status: 'occupied', patient_name: 'Shyam Verma' },
];

const doctors = [
  {
    name: 'Dr. Meera Joshi',
    department: 'Cardiology',
    specialization: 'Heart Specialist',
    status: 'available',
    room: 'Block B / Room 201',
    next_slot: 'Available now',
  },
  {
    name: 'Dr. Ravi Menon',
    department: 'Orthopedics',
    specialization: 'Joint and Bone Specialist',
    status: 'busy',
    room: 'Block C / Room 114',
    next_slot: '2:30 PM',
  },
  {
    name: 'Dr. Sana Khan',
    department: 'Pediatrics',
    specialization: 'Child Specialist',
    status: 'off_duty',
    room: 'Block A / Room 018',
    next_slot: 'Tomorrow 10:00 AM',
  },
  {
    name: 'Dr. Arvind Nair',
    department: 'General Medicine',
    specialization: 'Physician',
    status: 'available',
    room: 'OPD / Room 11',
    next_slot: 'Available now',
  },
  {
    name: 'Dr. Pooja Sethi',
    department: 'Dermatology',
    specialization: 'Skin Specialist',
    status: 'busy',
    room: 'Block D / Room 06',
    next_slot: '4:00 PM',
  },
  {
    name: 'Dr. Imran Ali',
    department: 'Neurology',
    specialization: 'Neuro Consultant',
    status: 'available',
    room: 'Block E / Room 302',
    next_slot: '3:15 PM',
  },
];

const machines = [
  {
    name: 'MRI Scanner',
    category: 'Imaging',
    location: 'Radiology Floor 1',
    quantity: 1,
    status: 'available',
    notes: 'Slot booking required',
  },
  {
    name: 'CT Scanner',
    category: 'Imaging',
    location: 'Radiology Floor 1',
    quantity: 1,
    status: 'in_use',
    notes: 'Current scan running',
  },
  {
    name: 'Ventilator',
    category: 'ICU Support',
    location: 'ICU Store',
    quantity: 6,
    status: 'available',
    notes: 'Portable units ready',
  },
  {
    name: 'Dialysis Machine',
    category: 'Renal Care',
    location: 'Ward D / Unit 2',
    quantity: 2,
    status: 'maintenance',
    notes: 'One unit under service',
  },
  {
    name: 'Ultrasound Machine',
    category: 'Diagnostics',
    location: 'Diagnostic Lab 2',
    quantity: 2,
    status: 'available',
    notes: 'Walk-in allowed',
  },
  {
    name: 'X-Ray Unit',
    category: 'Imaging',
    location: 'Radiology Floor 2',
    quantity: 3,
    status: 'available',
    notes: 'Two digital units and one portable unit',
  },
];

const queuePatients = [
  { patient_name: 'Asha Gupta', department: 'General Medicine', status: 'waiting' },
  { patient_name: 'Deepak Yadav', department: 'General Medicine', status: 'called' },
  { patient_name: 'Neha Kapoor', department: 'Cardiology', status: 'waiting' },
  { patient_name: 'Vikram Das', department: 'Orthopedics', status: 'waiting' },
  { patient_name: 'Ritu Jain', department: 'Pediatrics', status: 'done' },
];

const adminUsers = [
  {
    email: 'admin@opencare.com',
    password: '123456',
    full_name: 'OpenCare Admin',
    role: 'admin',
    is_active: true,
  },
  {
    email: 'staff@opencare.local',
    password: 'ChangeThis123',
    full_name: 'OpenCare Staff',
    role: 'staff',
    is_active: true,
  },
];

const complaints = [
  {
    patient_name: 'Ravi Kumar',
    phone: '9876543210',
    department: 'General Medicine',
    subject: 'Long waiting time',
    message: 'Doctor consultation has been delayed for more than 45 minutes.',
    status: 'open',
    admin_note: '',
  },
  {
    patient_name: 'Aisha Khan',
    phone: '9123456780',
    department: 'Pharmacy',
    subject: 'Medicine not available',
    message: 'The prescribed medicine was not available at the pharmacy counter.',
    status: 'in_review',
    admin_note: 'Pharmacy team is checking an alternative stock source.',
  },
  {
    patient_name: 'Neha Sharma',
    phone: '9988776655',
    department: 'Radiology',
    subject: 'Staff behavior',
    message: 'The staff at the scan desk was not responding properly to patient queries.',
    status: 'resolved',
    admin_note: 'Issue reviewed and staff has been briefed by the supervisor.',
  },
  {
    patient_name: 'Imran Ali',
    phone: '9001122334',
    department: 'Emergency',
    subject: 'Bed delay',
    message: 'Patient admission was delayed because no bed status update was available.',
    status: 'open',
    admin_note: '',
  },
];

const medicalHistories = [
  {
    patient_name: 'Ravi Kumar',
    phone: '9876543210',
    visit_date: '2026-03-20',
    department: 'General Medicine',
    diagnosis: 'Seasonal fever',
    medicines: ['Paracetamol 650', 'ORS'],
    allergies: ['Penicillin'],
    notes: 'Patient recovered after two days of rest.',
    recorded_by: 'Dr. Arvind Nair',
  },
  {
    patient_name: 'Aisha Khan',
    phone: '9123456780',
    visit_date: '2026-03-18',
    department: 'Cardiology',
    diagnosis: 'Chest discomfort',
    medicines: ['Pantoprazole 40'],
    allergies: [],
    notes: 'ECG normal, advised diet changes and follow-up.',
    recorded_by: 'Dr. Meera Joshi',
  },
  {
    patient_name: 'Neha Sharma',
    phone: '9988776655',
    visit_date: '2026-03-15',
    department: 'Orthopedics',
    diagnosis: 'Knee pain',
    medicines: ['Pain relief gel'],
    allergies: ['Ibuprofen'],
    notes: 'Home exercises and warm compress recommended.',
    recorded_by: 'Dr. Ravi Menon',
  },
];

const getErrorText = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return String(error);
};

const isMissingTable = (message: string, table: string) =>
  message.includes(`Could not find the table 'public.${table}'`) || message.includes(`relation "public.${table}" does not exist`);

const runSeed = async (seedName: string, seedAction: () => Promise<number>) => {
  try {
    return { seedName, inserted: await seedAction(), skipped: false, failed: false };
  } catch (error) {
    const message = getErrorText(error);
    if (isMissingTable(message, seedName)) {
      return { seedName, inserted: 0, skipped: true, failed: false };
    }
    return { seedName, inserted: 0, skipped: false, failed: true, error: message };
  }
};

const seedMedicines = async () => {
  const { data: existing, error } = await supabase.from('medicines').select('name');
  if (error) throw error;

  const existingNames = new Set((existing ?? []).map((item) => item.name));
  const missing = medicines.filter((item) => !existingNames.has(item.name));
  if (!missing.length) return 0;

  const { error: insertError } = await supabase.from('medicines').insert(missing);
  if (insertError) throw insertError;
  return missing.length;
};

const seedBeds = async () => {
  const { data: existing, error } = await supabase.from('beds').select('ward, bed_number');
  if (error) throw error;

  const existingBeds = new Set((existing ?? []).map((item) => `${item.ward}:${item.bed_number}`));
  const missing = beds.filter((item) => !existingBeds.has(`${item.ward}:${item.bed_number}`));
  if (!missing.length) return 0;

  const { error: insertError } = await supabase.from('beds').insert(missing);
  if (insertError) throw insertError;
  return missing.length;
};

const seedDoctors = async () => {
  const { data: existing, error } = await supabase.from('doctors').select('name');
  if (error) throw error;

  const existingNames = new Set((existing ?? []).map((item) => item.name));
  const missing = doctors.filter((item) => !existingNames.has(item.name));
  if (!missing.length) return 0;

  const { error: insertError } = await supabase.from('doctors').insert(missing);
  if (insertError) throw insertError;
  return missing.length;
};

const seedMachines = async () => {
  const { data: existing, error } = await supabase.from('machines').select('name');
  if (error) throw error;

  const existingNames = new Set((existing ?? []).map((item) => item.name));
  const missing = machines.filter((item) => !existingNames.has(item.name));
  if (!missing.length) return 0;

  const { error: insertError } = await supabase.from('machines').insert(missing);
  if (insertError) throw insertError;
  return missing.length;
};

const seedQueue = async () => {
  const { data: existing, error } = await supabase.from('queue_items').select('patient_name, department');
  if (error) throw error;

  const existingKeys = new Set((existing ?? []).map((item) => `${item.patient_name}:${item.department}`));
  const departmentCounts = new Map<string, number>();

  (existing ?? []).forEach((item) => {
    departmentCounts.set(item.department, (departmentCounts.get(item.department) ?? 0) + 1);
  });

  const missing = queuePatients
    .filter((item) => !existingKeys.has(`${item.patient_name}:${item.department}`))
    .map((item) => {
      const nextCount = (departmentCounts.get(item.department) ?? 0) + 1;
      departmentCounts.set(item.department, nextCount);

      return {
        ...item,
        token_number: buildTokenNumber(item.department, nextCount),
      };
    });

  if (!missing.length) return 0;

  const { error: insertError } = await supabase.from('queue_items').insert(missing);
  if (insertError) throw insertError;
  return missing.length;
};

const seedAdminUsers = async () => {
  const { data: existing, error } = await supabase.from('admin_users').select('email');
  if (error) throw error;

  const existingEmails = new Set((existing ?? []).map((item) => item.email));
  const missing = adminUsers.filter((item) => !existingEmails.has(item.email));
  if (!missing.length) return 0;

  const { error: insertError } = await supabase.from('admin_users').insert(missing);
  if (insertError) throw insertError;
  return missing.length;
};

const seedComplaints = async () => {
  const { data: existing, error } = await supabase.from('complaints').select('patient_name, subject');
  if (error) throw error;

  const existingKeys = new Set((existing ?? []).map((item) => `${item.patient_name}:${item.subject}`));
  const missing = complaints.filter((item) => !existingKeys.has(`${item.patient_name}:${item.subject}`));
  if (!missing.length) return 0;

  const { error: insertError } = await supabase.from('complaints').insert(missing);
  if (insertError) throw insertError;
  return missing.length;
};

const seedMedicalHistories = async () => {
  const { data: existing, error } = await supabase.from('medical_histories').select('patient_name, phone, visit_date');
  if (error) throw error;

  const existingKeys = new Set((existing ?? []).map((item) => `${item.patient_name}:${item.phone}:${item.visit_date}`));
  const missing = medicalHistories.filter((item) => !existingKeys.has(`${item.patient_name}:${item.phone}:${item.visit_date}`));
  if (!missing.length) return 0;

  const { error: insertError } = await supabase.from('medical_histories').insert(missing);
  if (insertError) throw insertError;
  return missing.length;
};

const main = async () => {
  try {
    const results = await Promise.all([
      runSeed('medicines', seedMedicines),
      runSeed('beds', seedBeds),
      runSeed('doctors', seedDoctors),
      runSeed('machines', seedMachines),
      runSeed('queue_items', seedQueue),
      runSeed('admin_users', seedAdminUsers),
      runSeed('complaints', seedComplaints),
      runSeed('medical_histories', seedMedicalHistories),
    ]);

    const inserted = Object.fromEntries(results.map((item) => [item.seedName, item.inserted]));
    const skipped = results.filter((item) => item.skipped).map((item) => item.seedName);
    const failed = results
      .filter((item) => item.failed)
      .map((item) => ({ seedName: item.seedName, error: item.error }));

    console.log(
      JSON.stringify(
        {
          ok: failed.length === 0,
          inserted,
          skipped,
          failed,
        },
        null,
        2,
      ),
    );
    if (failed.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(getErrorText(error));
    process.exit(1);
  }
};

void main();
