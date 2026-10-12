// Tribe marketing site: small, dependency-free interactions.

// Waitlist: the public.join_waitlist() RPC on the hosted Supabase project.
// The publishable key is public by design (RLS + function grants guard the data);
// it is the same value as NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.example.
const SUPABASE_URL = "https://qshqydbvsuvrsfxfryvh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6oh7y8d8BUzOtQJIq7HSsw_DCLVdGlV";
const WAITLIST_ENDPOINT = `${SUPABASE_URL}/rest/v1/rpc/join_waitlist`;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- reveal on scroll ---------- */
const revealables = document.querySelectorAll(".section > *, .final > *");
revealables.forEach((el) => el.classList.add("reveal"));
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }),
  { threshold: 0.12 }
);
revealables.forEach((el) => io.observe(el));

/* ---------- calculator ---------- */
const now = document.getElementById("now");
const goal = document.getElementById("goal");
const fmt = (h) => {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  if (whole === 0) return `${mins}m`;
  return mins ? `${whole}h ${mins}m` : `${whole}h`;
};
const num = (n) => Math.round(n).toLocaleString("en-US");

function updateCalc() {
  const n = parseFloat(now.value);
  const g = parseFloat(goal.value);
  document.getElementById("nowOut").textContent = fmt(n);
  document.getElementById("goalOut").textContent = fmt(g);

  const saved = Math.max(0, n - g) * 365; // hours per year
  document.getElementById("hours").textContent = num(saved);
  document.getElementById("days").textContent = num(saved / 24);
  document.getElementById("books").textContent = num(saved / 7);   // ~7h per novel
  document.getElementById("dinners").textContent = num(saved / 2); // ~2h per long dinner

  const result = document.querySelector(".calc-result");
  result.classList.toggle("zero", saved === 0);
  result.querySelector("small").textContent = saved === 0
    ? "Your goal is above today's time. Try a tighter goal!"
    : "hours back every year";
}
now.addEventListener("input", updateCalc);
goal.addEventListener("input", updateCalc);
updateCalc();

/* ---------- interactive tribe ---------- */
const BANANAS_BASE = 10;      // docs/GAMIFICATION.md §2
const STREAK_BONUS_CAP = 20;
let streak = 12;
let dayOver = false;

const monkeys = [...document.querySelectorAll(".mk")];
const status = document.getElementById("playStatus");
const psTitle = document.getElementById("psTitle");
const psSub = document.getElementById("psSub");
const emoji = status.querySelector(".ps-emoji");
const IMG = { happy: "assets/monkey-wave.svg", sad: "assets/monkey-sad.svg", party: "assets/monkey-happy.svg" };

const overNames = () => monkeys.filter((m) => m.getAttribute("aria-pressed") === "true").map((m) => m.dataset.name);
const tonightBananas = () => BANANAS_BASE + Math.min(streak + 1, STREAK_BONUS_CAP);

function list(names) {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function setStatus(cls, e, title, sub) {
  status.className = `play-status ${cls}`;
  emoji.textContent = e;
  psTitle.textContent = title;
  psSub.textContent = sub;
  void status.offsetWidth; // restart the pop animation
  status.classList.add("pop");
}

function renderLive() {
  const over = overNames();
  if (over.length === 0) {
    setStatus("", "🔥", "Everyone's under. The streak lives!",
      `Day ${streak + 1} of the streak · +${tonightBananas()} bananas each tonight`);
  } else {
    setStatus("risk", "🙈", `${list(over)} went over the limit.`,
      `If the day ended now, the ${streak} day streak would reset for everyone.`);
  }
}

monkeys.forEach((m) => {
  m.addEventListener("click", () => {
    if (dayOver) resetDay(false);
    const isOver = m.getAttribute("aria-pressed") !== "true";
    m.setAttribute("aria-pressed", String(isOver));
    m.querySelector("img").src = isOver ? IMG.sad : IMG.happy;
    m.querySelector(".mk-tag").textContent = isOver ? "over ✗" : "under ✓";
    if (navigator.vibrate) navigator.vibrate(12);
    renderLive();
  });
});

function rain(chars, count) {
  if (reduceMotion) return;
  const box = document.getElementById("confetti");
  for (let i = 0; i < count; i++) {
    const p = document.createElement("i");
    p.textContent = chars[i % chars.length];
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 0.8}s`;
    p.style.fontSize = `${18 + Math.random() * 20}px`;
    box.appendChild(p);
    setTimeout(() => p.remove(), 3200);
  }
}

document.getElementById("endDay").addEventListener("click", () => {
  // After a result, the same button starts a fresh day and keeps the streak.
  if (dayOver) { resetDay(false); return; }
  dayOver = true;
  const over = overNames();
  if (over.length === 0) {
    const earned = tonightBananas();
    streak += 1;
    setStatus("win", "🎉", `Tribe day won! ${streak} day streak.`, `Everyone earns +${earned} bananas. See you tomorrow, phone-free friends.`);
    monkeys.forEach((m) => {
      m.querySelector("img").src = IMG.party;
      m.classList.remove("celebrate"); void m.offsetWidth; m.classList.add("celebrate");
    });
    rain(["🍌", "🎉", "✨", "🍌"], 44);
  } else {
    streak = 0;
    setStatus("lose", "🌱", "Missed it this time. The streak resets to 0.",
      "No bananas lost, no shame. Tomorrow's a new day. Tap a monkey to try again.");
  }
  document.getElementById("endDay").textContent = "☀️ Next day";
});

function resetDay(full = true) {
  dayOver = false;
  if (full) streak = 12;
  monkeys.forEach((m) => {
    m.setAttribute("aria-pressed", "false");
    m.classList.remove("celebrate");
    m.querySelector("img").src = IMG.happy;
    m.querySelector(".mk-tag").textContent = "under ✓";
  });
  document.getElementById("endDay").textContent = "🌙 End the day";
  renderLive();
}

document.getElementById("resetDay").addEventListener("click", () => resetDay(true));

/* ---------- waitlist ---------- */
const form = document.getElementById("waitlistForm");
const msg = document.getElementById("formMsg");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = form.email.value.trim();
  msg.className = "form-msg";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.classList.add("err");
    msg.textContent = "That email doesn't look quite right 🙈";
    return;
  }
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    const res = await fetch(WAITLIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ p_email: email }),
    });
    if (!res.ok) throw new Error(String(res.status));
    msg.classList.add("ok");
    msg.textContent = "You're on the list! Your monkey is thrilled. 🐵🍌";
    form.reset();
  } catch {
    msg.classList.add("err");
    msg.textContent = "Something went wrong. Please try again in a minute.";
  } finally {
    button.disabled = false;
  }
});
