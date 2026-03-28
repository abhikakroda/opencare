insert into public.medicines (name, generic_name, brand_names, stock_qty, location, alternatives)
values
  ('Paracetamol 650', 'Paracetamol', '{"Dolo 650","Crocin"}', 120, 'Pharmacy A / Rack 3', '{"Acetaminophen 500"}'),
  ('Azithromycin 500', 'Azithromycin', '{"Azee","Zithrox"}', 10, 'Pharmacy B / Rack 2', '{"Clarithromycin 250"}'),
  ('Insulin Regular', 'Human Insulin', '{"Actrapid"}', 0, 'Cold Storage Unit 1', '{"Insulin Aspart","Insulin Lispro"}');

insert into public.beds (ward, bed_number, status, patient_name)
values
  ('Ward A', 'A-01', 'available', null),
  ('Ward A', 'A-02', 'occupied', 'Rohan Singh'),
  ('Ward A', 'A-03', 'cleaning', null),
  ('Ward B', 'B-01', 'available', null),
  ('Ward B', 'B-02', 'occupied', 'Anita Sharma'),
  ('ICU', 'ICU-01', 'occupied', 'Critical Case'),
  ('ICU', 'ICU-02', 'available', null);

insert into public.doctors (name, department, specialization, status, room, next_slot)
values
  ('Dr. Meera Joshi', 'Cardiology', 'Heart Specialist', 'available', 'Block B / Room 201', 'Available now'),
  ('Dr. Ravi Menon', 'Orthopedics', 'Joint and Bone Specialist', 'busy', 'Block C / Room 114', '2:30 PM'),
  ('Dr. Sana Khan', 'Pediatrics', 'Child Specialist', 'off_duty', 'Block A / Room 018', 'Tomorrow 10:00 AM');

insert into public.machines (name, category, location, quantity, status, notes)
values
  ('MRI Scanner', 'Imaging', 'Radiology Floor 1', 1, 'available', 'Slot booking required'),
  ('CT Scanner', 'Imaging', 'Radiology Floor 1', 1, 'in_use', 'Current scan running'),
  ('Ventilator', 'ICU Support', 'ICU Store', 6, 'available', 'Portable units ready'),
  ('Dialysis Machine', 'Renal Care', 'Ward D / Unit 2', 2, 'maintenance', 'One unit under service');
