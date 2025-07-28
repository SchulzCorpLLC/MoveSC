/*
  # Create feedback table

  1. New Tables
    - `feedback`
      - `id` (uuid, primary key)
      - `move_id` (uuid, foreign key to moves)
      - `stars` (integer, rating 1-5)
      - `comment` (text, optional comment)
      - `submitted_at` (timestamp)

  2. Security
    - Enable RLS on `feedback` table
    - Add policy for clients to insert and read their own feedback
*/

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id uuid REFERENCES moves(id) ON DELETE CASCADE,
  stars integer NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment text,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (
    move_id IN (
      SELECT id FROM moves WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Clients can insert own feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    move_id IN (
      SELECT id FROM moves WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );