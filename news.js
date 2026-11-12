(() => {
  const status = document.getElementById("news-status");
  const list = document.getElementById("news-list");
  const supabase = window.getAeromedSupabase?.();

  if (!supabase) {
    status.textContent = "News is being set up. Please check back soon.";
    document.querySelector(".news-listing").setAttribute("aria-busy", "false");
    return;
  }

  const formatDate = value => new Intl.DateTimeFormat(undefined, {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));

  supabase.from("announcements")
    .select("id, title, published_on, google_doc_url")
    .eq("is_published", true)
    .order("published_on", { ascending: false })
    .then(({ data, error }) => {
      if (error) throw error;
      list.replaceChildren();
      if (!data?.length) {
        status.textContent = "There are no announcements yet.";
        document.querySelector(".news-listing").setAttribute("aria-busy", "false");
        return;
      }
      status.textContent = "";
      document.querySelector(".news-listing").setAttribute("aria-busy", "false");
      for (const item of data) {
        const article = document.createElement("article");
        article.className = "news-card";
        const date = document.createElement("time");
        date.dateTime = item.published_on;
        date.textContent = formatDate(item.published_on);
        const title = document.createElement("h2");
        title.textContent = item.title;
        const link = document.createElement("a");
        link.href = item.google_doc_url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Read the Google Docs update ↗";
        article.append(date, title, link);
        list.append(article);
      }
    })
    .catch(error => {
      console.error("Could not load announcements", error);
      status.textContent = "News could not be loaded right now. Please try again later.";
      document.querySelector(".news-listing").setAttribute("aria-busy", "false");
    });
})();
