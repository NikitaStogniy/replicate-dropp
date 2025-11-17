-- Add Replicate API key field to teams table
-- Each team must have their own Replicate API key

ALTER TABLE teams ADD COLUMN replicate_api_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN teams.replicate_api_key IS 'Team-specific Replicate API key for image generation. Required for generation to work.';
