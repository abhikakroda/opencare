const departmentCodes: Record<string, string> = {
  'General Medicine': 'OPD',
  Cardiology: 'CAR',
  Pediatrics: 'PED',
  Orthopedics: 'ORT',
  Neurology: 'NEU',
  Dermatology: 'DER',
  Emergency: 'EMR',
};

export const buildTokenNumber = (department: string, count: number) =>
  `${departmentCodes[department] ?? 'OPD'}-${String(count).padStart(3, '0')}`;

export const estimateWaitMinutes = (peopleAhead: number) => peopleAhead * 8;
