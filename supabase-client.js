(() => {
  let client;
  window.getAeromedSupabase = () => {
    const settings = window.AEROMED_SUPABASE || {};
    if (!settings.url || !settings.publishableKey) return null;
    if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
    if (!client) {
      client = window.supabase.createClient(settings.url, settings.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return client;
  };
})();
