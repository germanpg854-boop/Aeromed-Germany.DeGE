(() => {
  const status = document.getElementById("member-status");
  const list = document.getElementById("member-resource-list");
  const signout = document.getElementById("signout-button");
  const supabase = window.getAeromedSupabase?.();

  if (!supabase) {
    status.textContent = "The member library is not connected yet.";
    signout.disabled = true;
    return;
  }

  signout.addEventListener("click", async () => {
    await supabase.auth.signOut();
    location.href = "login.html";
  });

  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      location.href = "login.html?next=members.html";
      return;
    }
    const { data: adminRow } = await supabase.from("aeromed_admins").select("user_id").eq("user_id", session.user.id).maybeSingle();
    if (adminRow) document.getElementById("admin-shortcut").hidden = false;

    const { data, error } = await supabase.from("member_resources").select("id,title,description,file_path,original_file_name").order("created_at", { ascending: false });
    if (error) {
      status.textContent = "Resources could not be loaded. Please contact AeroMed Germany.";
      return;
    }
    list.replaceChildren();
    if (!data?.length) {
      status.textContent = "No member resources have been added yet.";
      return;
    }
    status.textContent = "";
    for (const item of data) {
      const li = document.createElement("li");
      const details = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = item.title;
      const description = document.createElement("small");
      description.textContent = item.description || item.original_file_name;
      const link = document.createElement("a");
      link.textContent = "Download ↗";
      link.href = "#";
      link.addEventListener("click", async event => {
        event.preventDefault();
        const downloadWindow = window.open("about:blank", "_blank");
        if (!downloadWindow) {
          status.textContent = "Allow pop-ups for this site to open the private download.";
          return;
        }
        const { data: signed, error: urlError } = await supabase.storage.from("aeromed-member-resources").createSignedUrl(item.file_path, 300);
        if (urlError) {
          downloadWindow.close();
          status.textContent = "This file could not be opened. Please try again or contact AeroMed Germany.";
          return;
        }
        downloadWindow.opener = null;
        downloadWindow.location = signed.signedUrl;
      });
      details.append(title, description);
      li.append(details, link);
      list.append(li);
    }
  })().catch(error => {
    console.error("Member library error", error);
    status.textContent = "The member library could not be loaded.";
  });
})();
