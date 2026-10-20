export function formatCategory(category) {
  const withSpaces = category.replace(/-/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export function formatMonth(monthStr) {
  if (!monthStr) return null;

  const [year, month] = monthStr.split("-");
  const date = new Date(year, month - 1);
  return date.toLocaleString("en-GB", { month: "long", year: "numeric" });
}

export function formatPostcode(raw) {
  const clean = raw.replace(/\s+/g, "").toUpperCase();
  return clean.slice(0, -3) + " " + clean.slice(-3);
}