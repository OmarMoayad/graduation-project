import { supabase } from "@/integrations/supabase/client";

function isRefreshTokenNotFoundError(err: unknown) {
  const anyErr = err as any;
  const code = anyErr?.code ?? anyErr?.error_code;
  const message = String(anyErr?.message ?? "");

  return (
    code === "refresh_token_not_found" ||
    message.includes("Refresh Token Not Found") ||
    message.includes("Invalid Refresh Token")
  );
}

/**
 * Recovers from a broken persisted session (common in preview/dev when tokens are revoked).
 * Returns true when a local sign-out was performed (storage cleared).
 */
export async function clearInvalidAuthSessionIfNeeded(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.getSession();

    if (error && isRefreshTokenNotFoundError(error)) {
      await supabase.auth.signOut({ scope: "local" });
      return true;
    }

    return false;
  } catch (err) {
    if (isRefreshTokenNotFoundError(err)) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // ignore
      }
      return true;
    }

    return false;
  }
}
