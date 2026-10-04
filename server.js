const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const app = express();
app.set("trust proxy", 1);
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "votesecure.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  voter_id TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'voter',
  totp_secret TEXT,
  totp_enabled INTEGER NOT NULL DEFAULT 0,
  has_voted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS elections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  election_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  symbol TEXT NOT NULL DEFAULT '◉',
  FOREIGN KEY(election_id) REFERENCES elections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ballots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  election_id INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  receipt_hash TEXT NOT NULL UNIQUE,
  previous_hash TEXT NOT NULL DEFAULT 'GENESIS',
  chain_hash TEXT NOT NULL,
  cast_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(election_id) REFERENCES elections(id),
  FOREIGN KEY(candidate_id) REFERENCES candidates(id)
);

CREATE TABLE IF NOT EXISTS voter_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  election_id INTEGER NOT NULL UNIQUE,
  receipt_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(election_id) REFERENCES elections(id)
);
`);

function seed() {
  const adminEmail = "admin@votesecure.local";
  const voterEmail = "voter@votesecure.local";
  const password = "Demo@12345";

  const admin = db.prepare("SELECT id FROM users WHERE email=?").get(adminEmail);
  if (!admin) {
    const hash = bcrypt.hashSync(password, 12);
    db.prepare(`INSERT INTO users (name,email,voter_id,password_hash,role) VALUES (?,?,?,?,?)`)
      .run("System Admin", adminEmail, "ADMIN001", hash, "admin");
  }

  const voter = db.prepare("SELECT id FROM users WHERE email=?").get(voterEmail);
  if (!voter) {
    const hash = bcrypt.hashSync(password, 12);
    db.prepare(`INSERT INTO users (name,email,voter_id,password_hash,role) VALUES (?,?,?,?,?)`)
      .run("Demo Voter", voterEmail, "VOTER001", hash, "voter");
  }

  let election = db.prepare("SELECT id FROM elections ORDER BY id LIMIT 1").get();
  if (!election) {
    const info = db.prepare(`
      INSERT INTO elections (title,description,status,starts_at,ends_at)
      VALUES (?,?,?,?,?)
    `).run(
      "Student Council 2026",
      "Demo election for a student council. This project is intended for internal/educational use.",
      "open",
      new Date().toISOString(),
      new Date(Date.now() + 7 * 86400000).toISOString()
    );
    election = { id: info.lastInsertRowid };
    const insertCandidate = db.prepare(`
      INSERT INTO candidates (election_id,name,position,bio,symbol) VALUES (?,?,?,?,?)
    `);
    [
      ["Aarav Sharma", "President", "Focuses on student events and campus activities.", "★"],
      ["Meera Singh", "President", "Focuses on clubs, inclusion and student support.", "◆"],
      ["Rohan Verma", "President", "Focuses on technology and student innovation.", "▲"],
      ["Ananya Kapoor", "President", "Focuses on academics and community programs.", "●"]
    ].forEach(c => insertCandidate.run(election.id, ...c));
  }
}
seed();

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-demo-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 4
  }
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Please sign in." });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Please sign in." });
  const user = db.prepare("SELECT id,name,email,role,totp_enabled FROM users WHERE id=?").get(req.session.userId);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Admin access required." });
  if (!user.totp_enabled) return res.status(403).json({ error: "Admin 2FA must be enabled first." });
  next();
}
function csrf(req) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString("hex");
  return req.session.csrf;
}
function checkCsrf(req, res, next) {
  if (req.method !== "GET" && req.get("X-CSRF-Token") !== req.session.csrf) {
    return res.status(403).json({ error: "Invalid CSRF token." });
  }
  next();
}
function safeUser(user) {
  return {
    id: user.id, name: user.name, email: user.email,
    voterId: user.voter_id, role: user.role,
    totpEnabled: !!user.totp_enabled, hasVoted: !!user.has_voted
  };
}
function makeReceipt() {
  return "VS-" + crypto.randomBytes(6).toString("hex").toUpperCase();
}
function hash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

app.get("/api/csrf", (req,res) => res.json({ token: csrf(req) }));

app.post("/api/auth/register", loginLimiter, checkCsrf, (req,res) => {
  const { name, email, voterId, password } = req.body;
  if (!name || !email || !voterId || !password || password.length < 8)
    return res.status(400).json({ error: "Name, email, voter ID and an 8+ character password are required." });

  const exists = db.prepare("SELECT id FROM users WHERE email=? OR voter_id=?").get(email.trim().toLowerCase(), voterId.trim());
  if (exists) return res.status(409).json({ error: "Email or voter ID is already registered." });

  const hashPassword = bcrypt.hashSync(password, 12);
  const info = db.prepare(`
    INSERT INTO users (name,email,voter_id,password_hash,role) VALUES (?,?,?,?,?)
  `).run(name.trim(), email.trim().toLowerCase(), voterId.trim(), hashPassword, "voter");

  req.session.userId = Number(info.lastInsertRowid);
  csrf(req);
  res.json({ user: safeUser(db.prepare("SELECT * FROM users WHERE id=?").get(req.session.userId)) });
});

app.post("/api/auth/login", loginLimiter, checkCsrf, (req,res) => {
  const { email, password, otp } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email=?").get((email || "").trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password || "", user.password_hash))
    return res.status(401).json({ error: "Invalid email or password." });

  if (user.role === "admin") {
    if (!user.totp_enabled) {
      req.session.userId = user.id;
      return res.json({ needs2faSetup: true, user: safeUser(user) });
    }
    if (!otp || !speakeasy.totp.verify({ secret: user.totp_secret, encoding: "base32", token: otp, window: 1 }))
      return res.status(401).json({ error: "A valid 6-digit authenticator code is required." });
  }

  req.session.userId = user.id;
  csrf(req);
  res.json({ user: safeUser(user), csrf: req.session.csrf });
});

app.post("/api/auth/logout", checkCsrf, (req,res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", requireAuth, (req,res) => {
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.session.userId);
  res.json({ user: safeUser(user), csrf: csrf(req) });
});

app.post("/api/admin/2fa/setup", requireAuth, checkCsrf, (req,res) => {
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.session.userId);
  if (user.role !== "admin") return res.status(403).json({ error: "Admin only." });
  if (user.totp_enabled) return res.status(400).json({ error: "2FA is already enabled." });

  const secret = speakeasy.generateSecret({ name: "VoteSecure Admin", length: 20 });
  db.prepare("UPDATE users SET totp_secret=? WHERE id=?").run(secret.base32, user.id);
  res.json({ secret: secret.base32, otpauth: secret.otpauth_url });
});

app.post("/api/admin/2fa/verify", requireAuth, checkCsrf, (req,res) => {
  const { code } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.session.userId);
  if (user.role !== "admin" || !user.totp_secret) return res.status(400).json({ error: "Start 2FA setup first." });
  const valid = speakeasy.totp.verify({ secret: user.totp_secret, encoding: "base32", token: code || "", window: 1 });
  if (!valid) return res.status(400).json({ error: "Invalid authenticator code." });
  db.prepare("UPDATE users SET totp_enabled=1 WHERE id=?").run(user.id);
  res.json({ ok: true });
});

app.get("/api/elections", requireAuth, (req,res) => {
  const elections = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM candidates c WHERE c.election_id=e.id) AS candidate_count,
      EXISTS(SELECT 1 FROM voter_votes vv WHERE vv.election_id=e.id AND vv.user_id=?) AS voted
    FROM elections e ORDER BY e.id DESC
  `).all(req.session.userId);
  res.json({ elections: elections.map(e => ({...e, voted: !!e.voted})) });
});

app.get("/api/elections/:id", requireAuth, (req,res) => {
  const election = db.prepare("SELECT * FROM elections WHERE id=?").get(req.params.id);
  if (!election) return res.status(404).json({ error: "Election not found." });
  const candidates = db.prepare("SELECT id,name,position,bio,symbol FROM candidates WHERE election_id=?").all(election.id);
  const vote = db.prepare("SELECT receipt_code FROM voter_votes WHERE election_id=? AND user_id=?").get(election.id, req.session.userId);
  res.json({ election, candidates, voted: !!vote, receipt: vote?.receipt_code || null });
});

app.post("/api/elections/:id/vote", requireAuth, checkCsrf, (req,res) => {
  const electionId = Number(req.params.id);
  const candidateId = Number(req.body.candidateId);
  const password = req.body.password || "";

  const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.session.userId);
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: "Password confirmation failed." });

  const election = db.prepare("SELECT * FROM elections WHERE id=?").get(electionId);
  if (!election || election.status !== "open") return res.status(400).json({ error: "Voting is not open for this election." });

  const candidate = db.prepare("SELECT id FROM candidates WHERE id=? AND election_id=?").get(candidateId, electionId);
  if (!candidate) return res.status(400).json({ error: "Invalid candidate." });

  const already = db.prepare("SELECT id FROM voter_votes WHERE user_id=? AND election_id=?").get(user.id, electionId);
  if (already) return res.status(409).json({ error: "You have already voted in this election." });

  const receipt = makeReceipt();
  const receiptHash = hash(receipt);
  const previous = db.prepare("SELECT chain_hash FROM ballots ORDER BY id DESC LIMIT 1").get()?.chain_hash || "GENESIS";
  const chainHash = hash(`${previous}:${electionId}:${candidateId}:${receiptHash}`);

  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO ballots (election_id,candidate_id,receipt_hash,previous_hash,chain_hash) VALUES (?,?,?,?,?)`)
      .run(electionId, candidateId, receiptHash, previous, chainHash);
    db.prepare(`INSERT INTO voter_votes (user_id,election_id,receipt_code) VALUES (?,?,?)`)
      .run(user.id, electionId, receipt);
    db.prepare("UPDATE users SET has_voted=1 WHERE id=?").run(user.id);
  });

  try {
    tx();
    res.json({ receipt });
  } catch {
    res.status(409).json({ error: "Your vote could not be recorded. Please try again." });
  }
});

app.get("/api/receipts/:receipt", (req,res) => {
  const receipt = String(req.params.receipt || "").trim().toUpperCase();
  const row = db.prepare(`
    SELECT b.id,b.election_id,b.receipt_hash,e.title
    FROM ballots b JOIN elections e ON e.id=b.election_id
    WHERE b.receipt_hash=?
  `).get(hash(receipt));
  if (!row) return res.status(404).json({ verified: false, error: "Receipt not found." });
  res.json({ verified: true, election: row.title, message: "Receipt is valid. The ballot is recorded without revealing the selected candidate." });
});

app.get("/api/admin/dashboard", requireAdmin, (req,res) => {
  const users = db.prepare("SELECT COUNT(*) c FROM users WHERE role='voter'").get().c;
  const elections = db.prepare("SELECT COUNT(*) c FROM elections").get().c;
  const ballots = db.prepare("SELECT COUNT(*) c FROM ballots").get().c;
  const open = db.prepare("SELECT COUNT(*) c FROM elections WHERE status='open'").get().c;
  res.json({ stats: { users, elections, ballots, open } });
});

app.get("/api/admin/elections/:id/results", requireAdmin, (req,res) => {
  const election = db.prepare("SELECT * FROM elections WHERE id=?").get(req.params.id);
  if (!election) return res.status(404).json({ error: "Election not found." });
  if (election.status !== "closed") return res.status(403).json({ error: "Results are available only after the election is closed." });
  const results = db.prepare(`
    SELECT c.id,c.name,c.position,c.symbol,COUNT(b.id) AS votes
    FROM candidates c LEFT JOIN ballots b ON b.candidate_id=c.id
    WHERE c.election_id=? GROUP BY c.id ORDER BY votes DESC,c.name
  `).all(election.id);
  res.json({ election, results });
});

app.post("/api/admin/elections", requireAdmin, checkCsrf, (req,res) => {
  const { title, description, startsAt, endsAt } = req.body;
  if (!title || !description) return res.status(400).json({ error: "Title and description are required." });
  const info = db.prepare(`
    INSERT INTO elections (title,description,status,starts_at,ends_at) VALUES (?,?,?,?,?)
  `).run(title.trim(), description.trim(), "draft", startsAt || null, endsAt || null);
  res.json({ id: Number(info.lastInsertRowid) });
});

app.post("/api/admin/elections/:id/status", requireAdmin, checkCsrf, (req,res) => {
  const status = req.body.status;
  if (!["draft","open","closed"].includes(status)) return res.status(400).json({ error: "Invalid status." });
  db.prepare("UPDATE elections SET status=? WHERE id=?").run(status, req.params.id);
  res.json({ ok: true });
});

app.post("/api/admin/elections/:id/candidates", requireAdmin, checkCsrf, (req,res) => {
  const { name, position, bio, symbol } = req.body;
  if (!name || !position) return res.status(400).json({ error: "Candidate name and position are required." });
  const election = db.prepare("SELECT id FROM elections WHERE id=?").get(req.params.id);
  if (!election) return res.status(404).json({ error: "Election not found." });
  const info = db.prepare(`
    INSERT INTO candidates (election_id,name,position,bio,symbol) VALUES (?,?,?,?,?)
  `).run(election.id, name.trim(), position.trim(), (bio || "").trim(), (symbol || "◉").trim());
  res.json({ id: Number(info.lastInsertRowid) });
});

app.get("/api/admin/users", requireAdmin, (req,res) => {
  const users = db.prepare(`
    SELECT id,name,email,voter_id,role,totp_enabled,has_voted,created_at
    FROM users ORDER BY id DESC
  `).all();
  res.json({ users });
});

app.get("/api/admin/audit", requireAdmin, (req,res) => {
  const rows = db.prepare(`
    SELECT b.id,b.election_id,e.title,b.previous_hash,b.chain_hash,b.cast_at
    FROM ballots b JOIN elections e ON e.id=b.election_id ORDER BY b.id DESC LIMIT 50
  `).all();
  res.json({ rows });
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`VoteSecure running at http://127.0.0.1:${PORT}`);
  console.log("Demo voter: voter@votesecure.local / Demo@12345");
  console.log("Demo admin: admin@votesecure.local / Demo@12345");
});
