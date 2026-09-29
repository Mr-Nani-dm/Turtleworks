// Flags WhatsApp messages that come from someone we have already messaged in an outbound
// campaign (and who has not asked us to stop). Those go to the outbound reply handler (TW-11)
// instead of being treated as a brand-new inbound lead. If the Prospects tab does not exist yet,
// nothing is flagged and the hub behaves exactly as before.
const toPhone = (v) => {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) d = "91" + d;
  return d.length >= 11 && d.length <= 15 ? d : "";
};
const yes = (v) => ["yes", "true", "1", "y"].includes(String(v ?? "").trim().toLowerCase());

const outreach = new Set(
  $input
    .all()
    .map((i) => i.json)
    .filter((r) => r["Prospect ID"] && Number(r["First Sent Ms"]) > 0 && !yes(r["Do Not Contact"]))
    .map((r) => toPhone(r.Phone))
    .filter(Boolean),
);

return $("Normalise inbound")
  .all()
  .map(({ json }) => ({ json: { ...json, outbound_reply: json.channel === "WhatsApp" && outreach.has(json.phone) } }));
