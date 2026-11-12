(() => {
  const supabase = window.getAeromedSupabase?.();
  const status = document.getElementById("admin-status");
  const toolsPanel = document.getElementById("admin-tools");
  const newsList = document.getElementById("admin-news-list");
  const resourceList = document.getElementById("admin-resource-list");
  const bucket = "aeromed-member-resources";

  if (!supabase) {
    status.textContent = "Admin tools are not connected yet. Add the Supabase URL and publishable key first.";
    return;
  }

  document.getElementById("admin-signout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    location.href = "login.html";
  });

  const setStatus = message => { status.textContent = message; };
  const safeDocumentUrl = value => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && ["docs.google.com", "drive.google.com"].includes(url.hostname) ? url.href : null;
    } catch (_) { return null; }
  };

  async function requireAdmin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      location.href = "login.html?next=admin.html";
      return null;
    }
    const { data, error } = await supabase.from("aeromed_admins").select("user_id").eq("user_id", session.user.id).maybeSingle();
    if (error || !data) {
      setStatus("This signed-in account is not listed as a site administrator.");
      return null;
    }
    toolsPanel.hidden = false;
    setStatus(`Signed in as ${session.user.email}.`);
    return session.user;
  }

  async function loadNews() {
    const { data, error } = await supabase.from("announcements").select("id,title,published_on,google_doc_url").order("published_on", { ascending: false });
    if (error) throw error;
    newsList.replaceChildren();
    for (const item of data || []) {
      const li = document.createElement("li");
      const detail = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = `${item.title} — ${item.published_on}`;
      const link = document.createElement("a");
      link.href = item.google_doc_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open Doc ↗";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "document-delete";
      remove.textContent = "Delete";
      remove.addEventListener("click", async () => {
        if (!window.confirm("Delete this announcement?")) return;
        const { error: deleteError } = await supabase.from("announcements").delete().eq("id", item.id);
        setStatus(deleteError ? "Could not delete announcement." : "Announcement deleted.");
        if (!deleteError) await loadNews();
      });
      detail.append(title, link);
      li.append(detail, remove);
      newsList.append(li);
    }
  }

  async function loadResources() {
    const { data, error } = await supabase.from("member_resources").select("id,title,description,original_file_name,file_path").order("created_at", { ascending: false });
    if (error) throw error;
    resourceList.replaceChildren();
    for (const item of data || []) {
      const li = document.createElement("li");
      const detail = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = item.title;
      const small = document.createElement("small");
      small.textContent = item.description || item.original_file_name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "document-delete";
      remove.textContent = "Delete";
      remove.addEventListener("click", async () => {
        if (!window.confirm("Delete this member resource and its file?")) return;
        const { error: fileError } = await supabase.storage.from(bucket).remove([item.file_path]);
        if (fileError) { setStatus("Could not delete the stored file."); return; }
        const { error: rowError } = await supabase.from("member_resources").delete().eq("id", item.id);
        setStatus(rowError ? "The file was removed, but its list entry could not be deleted." : "Resource deleted.");
        if (!rowError) await loadResources();
      });
      detail.append(title, small);
      li.append(detail, remove);
      resourceList.append(li);
    }
  }

  document.getElementById("announcement-form").addEventListener("submit", async event => {
    event.preventDefault();
    const user = await requireAdmin();
    if (!user) return;
    const form = event.currentTarget;
    const url = safeDocumentUrl(form.elements.google_doc_url.value.trim());
    if (!url) { setStatus("Enter a valid HTTPS link from docs.google.com or drive.google.com."); return; }
    const { error } = await supabase.from("announcements").insert({
      title: form.elements.title.value.trim(),
      published_on: form.elements.published_on.value,
      google_doc_url: url,
      is_published: true,
      created_by: user.id
    });
    if (error) { setStatus("Could not publish this update. Check the database setup and Google link."); return; }
    form.reset();
    setStatus("Announcement published.");
    await loadNews();
  });

  document.getElementById("resource-form").addEventListener("submit", async event => {
    event.preventDefault();
    const user = await requireAdmin();
    if (!user) return;
    const form = event.currentTarget;
    const file = form.elements.file.files[0];
    if (!file) { setStatus("Choose a file first."); return; }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: false });
    if (uploadError) { setStatus("Upload failed. Check the file size and Storage setup."); return; }
    const { error: rowError } = await supabase.from("member_resources").insert({
      title: form.elements.title.value.trim(),
      description: form.elements.description.value.trim() || null,
      original_file_name: file.name,
      file_path: filePath,
      created_by: user.id
    });
    if (rowError) {
      await supabase.storage.from(bucket).remove([filePath]);
      setStatus("The file uploaded but could not be added to the library. The uploaded file was cleaned up.");
      return;
    }
    form.reset();
    setStatus("Member resource uploaded.");
    await loadResources();
  });

  requireAdmin().then(async user => {
    if (!user) return;
    try { await Promise.all([loadNews(), loadResources()]); }
    catch (error) { console.error("Could not load admin lists", error); setStatus("Admin controls opened, but one list could not be loaded. Confirm SQL setup."); }
  }).catch(error => { console.error(error); setStatus("Could not check admin access."); });
})();
