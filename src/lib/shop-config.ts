import { supabase } from "@/integrations/supabase/client";

// Default shop organization ID - should be configured in environment
const SHOP_ORGANIZATION_ID = import.meta.env.VITE_SHOP_ORGANIZATION_ID;

interface ShopOrganization {
  id: string;
  name: string;
  is_active: boolean;
}

let cachedOrganization: ShopOrganization | null = null;

export async function getShopOrganization(): Promise<ShopOrganization | null> {
  // Return cached organization if available
  if (cachedOrganization) {
    return cachedOrganization;
  }

  // If environment variable is set, use it
  if (SHOP_ORGANIZATION_ID) {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, is_active")
      .eq("id", SHOP_ORGANIZATION_ID)
      .eq("is_active", true)
      .single();

    if (!error && data) {
      cachedOrganization = data;
      return data;
    }
    console.error("Configured shop organization not found or inactive");
    return null;
  }

  // Fallback: Get the first active organization
  // This is for backward compatibility but should be replaced with env config
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    console.error("No active organization found for shop");
    return null;
  }

  cachedOrganization = data;
  return data;
}

export function getShopOrganizationId(): string | undefined {
  return SHOP_ORGANIZATION_ID || cachedOrganization?.id;
}

export function clearShopOrganizationCache(): void {
  cachedOrganization = null;
}
