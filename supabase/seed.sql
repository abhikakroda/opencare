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
