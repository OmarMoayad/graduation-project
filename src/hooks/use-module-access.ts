import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppModuleName =
  | "dashboard"
  | "inventory"
  | "purchases"
  | "branches"
  | "pos"
  | "sales"
  | "ecommerce"
  | "inquiries"
  | "hr"
  | "reports"
  | "accounts"
  | "settings";

type ModuleAccessState = {
  loading: boolean;
  allowedModules: Set<string>;
};

export function useModuleAccess() {
  const [state, setState] = useState<ModuleAccessState>({
    loading: true,
    allowedModules: new Set(),
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setState((s) => ({ ...s, loading: true }));

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) {
            setState({ loading: false, allowedModules: new Set() });
          }
          return;
        }

        // Permissions are derived from the user's assigned access groups.
        const { data: groups, error: groupsError } = await supabase
          .from("user_access_groups")
          .select("group_id")
          .eq("user_id", user.id);

        if (groupsError) throw groupsError;

        const groupIds = (groups ?? []).map((g) => g.group_id).filter(Boolean);
        if (groupIds.length === 0) {
          if (!cancelled) {
            setState({ loading: false, allowedModules: new Set() });
          }
          return;
        }

        const { data: perms, error: permsError } = await supabase
          .from("module_permissions")
          .select("module_name")
          .in("group_id", groupIds)
          .eq("can_read", true);

        if (permsError) throw permsError;

        const allowedModules = new Set((perms ?? []).map((p) => p.module_name));

        if (!cancelled) {
          setState({ loading: false, allowedModules });
        }
      } catch (error) {
        console.error("Error loading module access:", error);
        if (!cancelled) {
          setState({ loading: false, allowedModules: new Set() });
        }
      }
    };

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const canReadModule = useMemo(() => {
    return (moduleName: string) => {
      if (moduleName === "dashboard") return true;
      return state.allowedModules.has(moduleName);
    };
  }, [state.allowedModules]);

  return {
    loading: state.loading,
    allowedModules: state.allowedModules,
    canReadModule,
  };
}
