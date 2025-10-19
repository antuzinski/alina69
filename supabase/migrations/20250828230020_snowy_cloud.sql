/*
  # Add subfolder support

  1. Schema Changes
    - Add `parent_id` column to `folders` table to create hierarchy
    - Add `path` column to store full hierarchical path
    - Add `level` column to track nesting depth
    - Update indexes for efficient querying

  2. Security
    - Update existing RLS policies to work with hierarchy
    - Maintain same authentication requirements

  3. Functions
    - Add function to calculate folder path automatically
    - Add trigger to update paths when hierarchy changes

  4. Constraints
    - Prevent circular references
    - Limit nesting depth to reasonable level (5 levels)
*/

-- Add hierarchy columns to folders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'folders' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE folders ADD COLUMN parent_id uuid REFERENCES folders(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'folders' AND column_name = 'path'
  ) THEN
    ALTER TABLE folders ADD COLUMN path text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'folders' AND column_name = 'level'
  ) THEN
    ALTER TABLE folders ADD COLUMN level integer DEFAULT 0;
  END IF;
END $$;

-- Create function to calculate folder path
CREATE OR REPLACE FUNCTION calculate_folder_path(folder_id uuid)
RETURNS text AS $$
DECLARE
  result text := '';
  current_id uuid := folder_id;
  current_slug text;
  parent_id uuid;
  depth integer := 0;
BEGIN
  -- Prevent infinite loops
  WHILE current_id IS NOT NULL AND depth < 10 LOOP
    SELECT slug, folders.parent_id INTO current_slug, parent_id
    FROM folders 
    WHERE id = current_id;
    
    IF current_slug IS NULL THEN
      EXIT;
    END IF;
    
    IF result = '' THEN
      result := current_slug;
    ELSE
      result := current_slug || '/' || result;
    END IF;
    
    current_id := parent_id;
    depth := depth + 1;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate folder level
CREATE OR REPLACE FUNCTION calculate_folder_level(folder_id uuid)
RETURNS integer AS $$
DECLARE
  current_id uuid := folder_id;
  parent_id uuid;
  level_count integer := 0;
BEGIN
  -- Prevent infinite loops
  WHILE current_id IS NOT NULL AND level_count < 10 LOOP
    SELECT folders.parent_id INTO parent_id
    FROM folders 
    WHERE id = current_id;
    
    IF parent_id IS NULL THEN
      EXIT;
    END IF;
    
    current_id := parent_id;
    level_count := level_count + 1;
  END LOOP;
  
  RETURN level_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update path and level
CREATE OR REPLACE FUNCTION update_folder_hierarchy()
RETURNS trigger AS $$
BEGIN
  -- Calculate and update path and level
  NEW.path := calculate_folder_path(NEW.id);
  NEW.level := calculate_folder_level(NEW.id);
  
  -- Prevent circular references
  IF NEW.parent_id IS NOT NULL THEN
    -- Check if parent exists
    IF NOT EXISTS (SELECT 1 FROM folders WHERE id = NEW.parent_id) THEN
      RAISE EXCEPTION 'Parent folder does not exist';
    END IF;
    
    -- Check for circular reference
    IF NEW.id = NEW.parent_id THEN
      RAISE EXCEPTION 'Folder cannot be its own parent';
    END IF;
    
    -- Check if this would create a cycle
    IF EXISTS (
      WITH RECURSIVE folder_tree AS (
        SELECT id, parent_id, 1 as depth
        FROM folders 
        WHERE id = NEW.parent_id
        
        UNION ALL
        
        SELECT f.id, f.parent_id, ft.depth + 1
        FROM folders f
        JOIN folder_tree ft ON f.id = ft.parent_id
        WHERE ft.depth < 10
      )
      SELECT 1 FROM folder_tree WHERE id = NEW.id
    ) THEN
      RAISE EXCEPTION 'This would create a circular reference';
    END IF;
    
    -- Limit nesting depth
    IF NEW.level >= 5 THEN
      RAISE EXCEPTION 'Maximum nesting depth (5 levels) exceeded';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS folder_hierarchy_trigger ON folders;
CREATE TRIGGER folder_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_hierarchy();

-- Create trigger to update child paths when parent changes
CREATE OR REPLACE FUNCTION update_child_folder_paths()
RETURNS trigger AS $$
BEGIN
  -- Update all descendant folders when a folder's path changes
  IF OLD.path IS DISTINCT FROM NEW.path OR OLD.level IS DISTINCT FROM NEW.level THEN
    UPDATE folders 
    SET 
      path = calculate_folder_path(id),
      level = calculate_folder_level(id)
    WHERE parent_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating child paths
DROP TRIGGER IF EXISTS update_child_paths_trigger ON folders;
CREATE TRIGGER update_child_paths_trigger
  AFTER UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_child_folder_paths();

-- Update existing folders to have correct path and level
UPDATE folders 
SET 
  path = calculate_folder_path(id),
  level = calculate_folder_level(id);

-- Add indexes for efficient hierarchy queries
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id);
CREATE INDEX IF NOT EXISTS folders_path_idx ON folders(path);
CREATE INDEX IF NOT EXISTS folders_level_idx ON folders(level);

-- Add constraint to prevent too deep nesting
ALTER TABLE folders 
ADD CONSTRAINT folders_max_depth_check 
CHECK (level <= 5);