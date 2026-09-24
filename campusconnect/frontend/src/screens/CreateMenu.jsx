import { Icon } from "../lib/icons.jsx";

export function openCreateMenu(ui, nav) {
  const items = [
    { ic: "repeat", t: "List a resource", d: "Lend, sell or donate a book, calculator, cycle…", run: () => nav.push("create") },
    { ic: "bulb", t: "Share an experience", d: "Interview, internship, hackathon, notes", run: () => nav.push("post", { compose: true }) },
    { ic: "grad", t: "Offer a skill", d: "Teach what you know. Earn +10 credits an hour", run: () => (nav.go("skills"), setTimeout(() => window.dispatchEvent(new CustomEvent("cc:offer-skill")), 250)) },
    { ic: "bell", t: "Add to wishlist", d: "Get an alert the moment it's listed", run: () => (nav.go("resources"), setTimeout(() => window.dispatchEvent(new CustomEvent("cc:add-wish")), 250)) },
  ];
  ui.openSheet({
    title: "Create",
    render: (close) => (
      <div className="col">
        {items.map((it) => (
          <button key={it.t} className="list-row" onClick={() => (close(), setTimeout(it.run, 120))}>
            <span className="icon-tile"><Icon name={it.ic} /></span>
            <div className="grow"><div className="bold">{it.t}</div><div className="small muted">{it.d}</div></div>
            <Icon name="next" className="muted" />
          </button>
        ))}
      </div>
    ),
  });
}
