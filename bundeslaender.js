(() => {
  const input = document.getElementById("state-search");
  const list = document.getElementById("state-list");
  const status = document.getElementById("state-status");
  const states = window.AEROMED_BUNDESLAENDER || [];

  function render() {
    const term = input.value.trim().toLocaleLowerCase();
    const matches = states.filter(name => name.toLocaleLowerCase().includes(term));
    list.replaceChildren();
    for (const name of matches) {
      const item = document.createElement("li");
      item.textContent = name;
      list.append(item);
    }
    status.textContent = matches.length ? `${matches.length} of 16 states` : "No state matches your search.";
  }

  input.addEventListener("input", render);
  render();
})();
