(() => {
  const form = document.getElementById("login-form");
  const status = document.getElementById("login-status");
  const warning = document.getElementById("login-config-warning");
  const button = document.getElementById("login-button");
  const supabase = window.getAeromedSupabase?.();

  if (!supabase) {
    warning.hidden = false;
    form.addEventListener("submit", event => {
      event.preventDefault();
      status.textContent = "Member sign-in has not been connected yet.";
    });
    return;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    button.disabled = true;
    status.textContent = "Signing in…";
    const { error } = await supabase.auth.signInWithPassword({
      email: form.elements.email.value.trim(),
      password: form.elements.password.value
    });
    button.disabled = false;
    if (error) {
      status.textContent = "Sign-in failed. Check your email and password, then try again.";
      return;
    }
    const requested = new URLSearchParams(location.search).get("next");
    location.href = requested === "admin.html" ? "admin.html" : "members.html";
  });
})();
