/*
  # Create moves table

  1. New Tables
    - `moves`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `company_id` (uuid, foreign key to companies)
      - `date` (date, move date)
      - `origin` (text, origin address)
      - `destination` (text, destination address)
      - `status` (enum, move status)
      - `crew_info` (text, optional crew information)
      - `estimated_duration` (text, estimated duration)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `moves` table
    - Add policy for clients to read their own moves
*/

DO $$ BEGIN
  CREATE TYPE move_status AS ENUM ('quote_sent', 'approved', 'scheduled', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  date date NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  status move_status DEFAULT 'quote_sent',
  crew_info text,
  estimated_duration text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read own moves"
  ON moves
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );