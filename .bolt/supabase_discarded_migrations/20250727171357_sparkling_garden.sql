/*
  # Create documents table

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `move_id` (uuid, foreign key to moves)
      - `filename` (text, original filename)
      - `file_url` (text, storage URL)
      - `file_size` (integer, file size in bytes)
      - `content_type` (text, MIME type)
      - `uploaded_at` (timestamp)

  2. Security
    - Enable RLS on `documents` table
    - Add policy for clients to read their documents
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id uuid REFERENCES moves(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  content_type text,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    move_id IN (
      SELECT id FROM moves WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Clients can insert own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    move_id IN (
      SELECT id FROM moves WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );