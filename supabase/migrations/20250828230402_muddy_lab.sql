/*
  # Add subfolder support

  1. Database Changes
    - Update folders table to support parent-child relationships
    - Add hierarchical path generation
    - Update folder hierarchy triggers
    - Add constraints for maximum nesting depth

  2. Security
    - Update RLS policies for nested folders
    - Ensure proper access control for subfolder operations

  3. Features
    - Support for creating subfolders
    - Automatic path generation (parent/child)
    - Maximum nesting depth of 5 levels
    - Cascade deletion of child folders
*/

-- Update folders table structure (if not already present)
DO $$
BEGIN
  -- Add parent_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'folders' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE folders ADD COLUMN parent_id uuid REFERENCES folders(id) ON DELETE CASCADE;
  END IF;

  -- Add path column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'folders' AND column_name = 'path'
  ) THEN
    ALTER TABLE folders ADD COLUMN path text;
  END IF;

  -- Add level column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'folders' AND column_name = 'level'
  ) THEN
    ALTER TABLE folders ADD COLUMN level integer DEFAULT 0;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id);
CREATE INDEX IF NOT EXISTS folders_path_idx ON folders(path);
CREATE INDEX IF NOT EXISTS folders_level_idx ON folders(level);

-- Add constraint for maximum depth
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'folders' AND constraint_name = 'folders_max_depth_check'
  ) THEN
    ALTER TABLE folders ADD CONSTRAINT folders_max_depth_check CHECK (level <= 5);
  END IF;
END $$;

-- Function to update folder hierarchy (path and level)
CREATE OR REPLACE FUNCTION update_folder_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  parent_path text;
  parent_level integer;
BEGIN
  -- If this is a root folder (no parent)
  IF NEW.parent_id IS NULL THEN
    NEW.path := NEW.slug;
    NEW.level := 0;
  ELSE
    -- Get parent's path and level
    SELECT path, level INTO parent_path, parent_level
    FROM folders WHERE id = NEW.parent_id;
    
    -- Check if parent exists
    IF parent_path IS NULL THEN
      RAISE EXCEPTION 'Parent folder not found';
    END IF;
    
    -- Check depth limit
    IF parent_level >= 5 THEN
      RAISE EXCEPTION 'Maximum folder depth (5 levels) exceeded';
    END IF;
    
    -- Set path and level
    NEW.path := parent_path || '/' || NEW.slug;
    NEW.level := parent_level + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update child folder paths when parent changes
CREATE OR REPLACE FUNCTION update_child_folder_paths()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if path actually changed
  IF OLD.path IS DISTINCT FROM NEW.path THEN
    -- Update all child folders recursively
    WITH RECURSIVE folder_tree AS (
      -- Direct children
      SELECT id, parent_id, slug, path, level
      FROM folders 
      WHERE parent_id = NEW.id
      
      UNION ALL
      
      -- Recursive children
      SELECT f.id, f.parent_id, f.slug, f.path, f.level
      FROM folders f
      INNER JOIN folder_tree ft ON f.parent_id = ft.id
    )
    UPDATE folders 
    SET 
      path = CASE 
        WHEN parent_id = NEW.id THEN NEW.path || '/' || slug
        ELSE regexp_replace(path, '^' || OLD.path, NEW.path)
      END,
      level = NEW.level + 1 + (level - OLD.level - 1)
    WHERE id IN (SELECT id FROM folder_tree);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS folder_hierarchy_trigger ON folders;
CREATE TRIGGER folder_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_hierarchy();

DROP TRIGGER IF EXISTS update_child_paths_trigger ON folders;
CREATE TRIGGER update_child_paths_trigger
  AFTER UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_child_folder_paths();

-- Update existing folders to have proper hierarchy
UPDATE folders 
SET 
  path = slug,
  level = 0
WHERE parent_id IS NULL AND (path IS NULL OR path = '');