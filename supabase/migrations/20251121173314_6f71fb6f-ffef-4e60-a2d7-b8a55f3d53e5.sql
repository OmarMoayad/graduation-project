-- Update policies to allow all organization members to manage access groups
-- This can be restricted later once proper roles are assigned

DROP POLICY IF EXISTS "Admins can manage access groups" ON access_groups;
DROP POLICY IF EXISTS "Admins can manage user access groups" ON user_access_groups;
DROP POLICY IF EXISTS "Admins can manage module permissions" ON module_permissions;
DROP POLICY IF EXISTS "Admins can manage field permissions" ON field_permissions;

-- Allow all organization members to manage access groups
CREATE POLICY "Organization members can manage access groups"
ON access_groups
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Allow all organization members to manage user access groups
CREATE POLICY "Organization members can manage user access groups"
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
)
WITH CHECK (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Allow all organization members to manage module permissions
CREATE POLICY "Organization members can manage module permissions"
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
)
WITH CHECK (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Allow all organization members to manage field permissions
CREATE POLICY "Organization members can manage field permissions"
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
)
WITH CHECK (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);