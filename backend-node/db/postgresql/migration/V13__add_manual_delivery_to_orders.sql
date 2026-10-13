ALTER TABLE orders
  ADD COLUMN delivery_status VARCHAR(30) NOT NULL DEFAULT 'UNASSIGNED',
  ADD COLUMN delivery_person_name VARCHAR(255) NULL,
  ADD COLUMN delivery_person_phone VARCHAR(20) NULL;
