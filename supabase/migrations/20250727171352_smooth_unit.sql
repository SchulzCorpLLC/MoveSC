/*
  # Create quotes table

  1. New Tables
    - `quotes`
      - `id` (uuid, primary key)
      - `move_id` (uuid, foreign key to moves)
      - `line_items` (jsonb, quote line items)
      - `subtotal` (numeric, subtotal amount)
      - `tax` (numeric, tax amount)
      - `total` (numeric, total amount)
      - `approved` (boolean, approval status)
      - `client_notes` (text, optional client notes)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `quotes` table
    - Add policies for clients to read and update their quotes
*/

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id uuid REFERENCES moves(id) ON DELETE CASCADE,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  approved boolean DEFAULT false,
  client_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read own quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (
    move_id IN (
      SELECT id FROM moves WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Clients can update own quotes"
  ON quotes
  FOR UPDATE
  TO authenticated
  USING (
    move_id IN (
      SELECT id FROM moves WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    move_id IN (
      SELECT id FROM moves WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );