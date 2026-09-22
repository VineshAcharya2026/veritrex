#!/usr/bin/env node
/**
 * Smoke test: mentorship session outcome + bilateral ratings on a deployed app.
 *
 * Usage:
 *   node scripts/smoke-rating.mjs
 *   node scripts/smoke-rating.mjs --base https://veritrex.org
 */
const DEFAULT_BASE = "https://veritrex.org";
const MENTOR_EMAIL = "mentor@veritra.com";
const MENTEE_EMAIL = "mentee@veritra.com";
const PASSWORD = "Password123!";

const MENTEE_RATING_BODY = {
  impact: 4,
  productivity: 4,
  goalAchievement: 4,
  realisticLearningPath: 4,
  approach: 4,
  mannersRespect: 4,
};

const MENTOR_RATING_BODY = {
  preparedness: 4,
  taskCompletion: 4,
  sessionGoals: 4,
  implementation: 4,
  growth: 4,
  respectBehavior: 4,
};

function parseArgs() {
  const idx = process.argv.indexOf("--base");
  const base = idx >= 0 ? process.argv[idx + 1] : DEFAULT_BASE;
  if (!base) {
    console.error("Missing value for --base");
    process.exit(1);
  }
  return base.replace(/\/$/, "");
}

function cookieHeaderFromResponse(res) {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
  }
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  return raw
    .split(/,(?=\s*[\w-]+=)/)
    .map((c) => c.split(";")[0].trim())
    .join("; ");
}

async function login(base, email, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Login ${email} failed: ${res.status} ${JSON.stringify(body)}`);
  }
  const cookie = cookieHeaderFromResponse(res);
  if (!cookie) throw new Error(`Login ${email}: no session cookie`);
  return cookie;
}

async function api(base, path, cookie, options = {}) {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function main() {
  const base = parseArgs();
  console.log(`Smoke rating @ ${base}\n`);

  const mentorCookie = await login(base, MENTOR_EMAIL, PASSWORD);
  const menteeCookie = await login(base, MENTEE_EMAIL, PASSWORD);
  console.log("✓ Logged in mentor and mentee");

  const { data: mentorships } = await api(base, "/api/mentee/mentorships", menteeCookie);
  const active = (Array.isArray(mentorships) ? mentorships : []).find(
    (m) => m.status === "ACTIVE"
  );
  if (!active?.id) {
    throw new Error("No ACTIVE mentorship for demo mentee — run db:d1:seed:remote");
  }
  const mentorshipId = active.id;
  console.log(`✓ Mentorship ${mentorshipId}`);

  let { data: sessions } = await api(
    base,
    `/api/mentorships/${mentorshipId}/sessions`,
    menteeCookie
  );
  if (!Array.isArray(sessions)) sessions = [];

  let session = sessions.find((s) => !s.outcome);
  if (!session) {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const created = await api(base, `/api/mentorships/${mentorshipId}/sessions`, menteeCookie, {
      method: "POST",
      body: JSON.stringify({ scheduledAt: past }),
    });
    if (!created.res.ok) {
      throw new Error(`Create session failed: ${created.res.status} ${JSON.stringify(created.data)}`);
    }
    session = created.data;
    console.log(`✓ Created session ${session.id}`);
  } else {
    console.log(`✓ Using session ${session.id} (outcome pending)`);
  }

  const sessionId = session.id;

  if (session.outcome !== "COMPLETED") {
    const outcome = await api(base, `/api/sessions/${sessionId}/outcome`, menteeCookie, {
      method: "POST",
      body: JSON.stringify({ outcome: "COMPLETED", durationMinutes: 60 }),
    });
    if (!outcome.res.ok) {
      throw new Error(`Outcome failed: ${outcome.res.status} ${JSON.stringify(outcome.data)}`);
    }
    console.log("✓ Logged outcome COMPLETED");
  } else {
    console.log("✓ Session already COMPLETED");
  }

  const menteeStatus = await api(base, `/api/sessions/${sessionId}/ratings`, menteeCookie);
  if (!menteeStatus.res.ok) {
    throw new Error(`Ratings GET (mentee) failed: ${menteeStatus.res.status}`);
  }

  if (!menteeStatus.data.myRatingSubmitted) {
    const rate = await api(base, `/api/sessions/${sessionId}/rate`, menteeCookie, {
      method: "POST",
      body: JSON.stringify(MENTEE_RATING_BODY),
    });
    if (!rate.res.ok) {
      throw new Error(`Mentee rate failed: ${rate.res.status} ${JSON.stringify(rate.data)}`);
    }
    console.log("✓ Mentee rating submitted");
  } else {
    console.log("✓ Mentee rating already submitted");
  }

  const mentorStatus = await api(base, `/api/sessions/${sessionId}/ratings`, mentorCookie);
  if (!mentorStatus.res.ok) {
    throw new Error(`Ratings GET (mentor) failed: ${mentorStatus.res.status}`);
  }

  if (!mentorStatus.data.myRatingSubmitted) {
    const rate = await api(base, `/api/sessions/${sessionId}/rate`, mentorCookie, {
      method: "POST",
      body: JSON.stringify(MENTOR_RATING_BODY),
    });
    if (!rate.res.ok) {
      throw new Error(`Mentor rate failed: ${rate.res.status} ${JSON.stringify(rate.data)}`);
    }
    console.log("✓ Mentor rating submitted");
  } else {
    console.log("✓ Mentor rating already submitted");
  }

  const finalM = await api(base, `/api/sessions/${sessionId}/ratings`, mentorCookie);
  const finalE = await api(base, `/api/sessions/${sessionId}/ratings`, menteeCookie);
  if (!finalM.data.myRatingSubmitted || !finalM.data.otherRatingSubmitted) {
    throw new Error(`Expected both ratings submitted: ${JSON.stringify(finalM.data)}`);
  }
  if (!finalE.data.myRatingSubmitted || !finalE.data.otherRatingSubmitted) {
    throw new Error(`Expected both ratings submitted (mentee view): ${JSON.stringify(finalE.data)}`);
  }

  console.log("\n✅ Rating smoke test passed");
}

main().catch((err) => {
  console.error("\n❌", err.message || err);
  process.exit(1);
});
