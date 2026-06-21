-- Add new columns for separate comments
ALTER TABLE feedbacks
ADD COLUMN doctor_comment TEXT,
ADD COLUMN is_doctor_public BOOLEAN DEFAULT true,
ADD COLUMN technician_comment TEXT,
ADD COLUMN is_technician_public BOOLEAN DEFAULT true;

-- Migrate existing JSON data
-- Safe check: we only extract if the comment is a valid JSON string starting with '{'
UPDATE feedbacks
SET 
    doctor_comment = (comment::json->>'doctorComment'),
    is_doctor_public = COALESCE((comment::json->>'doctorPublic')::boolean, true),
    technician_comment = (comment::json->>'techComment'),
    is_technician_public = COALESCE((comment::json->>'techPublic')::boolean, true)
WHERE comment IS NOT NULL AND comment LIKE '{%';

-- For backward compatibility, we keep the original comment column for now,
-- but the new columns are fully populated and ready to be used.

-- Fix feedbacks where doctor_id is null by looking up from the linked appointment
UPDATE feedbacks f
SET doctor_id = a.doctor_id
FROM appointments a
WHERE f.appointment_id = a.appointment_id
  AND f.doctor_id IS NULL
  AND a.doctor_id IS NOT NULL;
