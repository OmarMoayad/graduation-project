-- Enable RLS on access_groups (if not already enabled)
ALTER TABLE access_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view access groups in their organization
CREATE POLICY "Users can view access groups in their organization"
ON access_groups
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Users can create access groups in their organization
CREATE POLICY "Users can create access groups in their organization"
ON access_groups
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Users can update access groups in their organization
CREATE POLICY "Users can update access groups in their organization"
ON access_groups
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Users can delete access groups in their organization
CREATE POLICY "Users can delete access groups in their organization"
ON access_groups
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Enable RLS on user_access_groups
ALTER TABLE user_access_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view user-group assignments in their organization
CREATE POLICY "Users can view user access groups in their org"
ON user_access_groups
FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Policy: Users can assign users to groups in their organization
CREATE POLICY "Users can manage user access groups in their org"
ON user_access_groups
FOR ALL
TO authenticated
USING (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Enable RLS on module_permissions
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view module permissions for their organization's groups
CREATE POLICY "Users can view module permissions in their org"
ON module_permissions
FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Policy: Users can manage module permissions for their organization's groups
CREATE POLICY "Users can manage module permissions in their org"
ON module_permissions
FOR ALL
TO authenticated
USING (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Enable RLS on field_permissions
ALTER TABLE field_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view field permissions for their organization's groups
CREATE POLICY "Users can view field permissions in their org"
ON field_permissions
FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Policy: Users can manage field permissions for their organization's groups
CREATE POLICY "Users can manage field permissions in their org"
ON field_permissions
FOR ALL
TO authenticated
USING (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);