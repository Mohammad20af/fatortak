const paths = {
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c5.3 5.5 5.3 12.5 0 18-5.3-5.5-5.3-12.5 0-18",
  check: "M5 12l4 4L19 6",
  sun: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4.93 4.93l1.42 1.42 M17.65 17.65l1.42 1.42 M4.93 19.07l1.42-1.42 M17.65 6.35l1.42-1.42",
  moon: "M20.9 13.1A9 9 0 0 1 10.9 3.1a9 9 0 1 0 10 10Z",
  dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  expenses: "M4 5h16v14H4z M8 9h8 M8 13h5 M8 16h3",
  budget: "M3 7h18v13H3z M3 7V4h14 M16 12h5v4h-5z",
  customers:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4",
  suppliers: "M3 7h11v12H3z M14 11h4l3 4v4h-7 M6 19v2 M18 19v2",
  reports: "M4 3v18h17 M8 16v-4 M13 16V8 M18 16V5",
  profile: "M4 21V3h12v18 M16 9h5v12 M8 7h4 M8 11h4 M8 15h4 M1 21h22",
};
export default function NavIcon({ name }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.expenses} />
    </svg>
  );
}
