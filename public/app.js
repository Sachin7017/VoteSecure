const app = document.querySelector("#app");
const nav = document.querySelector("#nav");
const toast = document.querySelector("#toast");
let csrfToken = "";
let currentUser = null;

async function api(url, options = {}) {
  const opts = { ...options, headers: { ...(options.headers || {}) } };
  if (opts.body && typeof opts.body !== "string") {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(opts.body);
  }
  if (opts.method && opts.method !== "GET") opts.headers["X-CSRF-Token"] = csrfToken;
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function showToast(msg) { toast.textContent = msg; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2800) }
function escapeHtml(s = "") { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])) }
function setNav() {
  if (currentUser) {
    nav.innerHTML = `
      <div class="nav">
        <a href="#/dashboard">Dashboard</a>
        ${currentUser.role === "admin" ? `<a href="#/admin">Admin</a>` : ""}
        <a href="#/verify">Verify receipt</a>
        <button id="logoutBtn">Logout</button>
      </div>`;
    document.querySelector("#logoutBtn").onclick = async () => { try { await api("/api/auth/logout", { method: "POST" }); const fresh = await api("/api/csrf"); csrfToken = fresh.token; currentUser = null; location.hash = "#/"; render() } catch (err) { showToast(err.message) } };
  } else {
    nav.innerHTML = `<div class="nav"><a href="#/verify">Verify receipt</a><a href="#/login">Sign in</a><a class="btn btn-primary" href="#/register">Create account</a></div>`;
  }
}
async function init() {
  try {
    const d = await api("/api/csrf");
    csrfToken = d.token;
    try { const me = await api("/api/me"); currentUser = me.user; csrfToken = me.csrf || csrfToken } catch { }
  } catch (e) { }
  setNav(); render();
}
function layout(content) { app.innerHTML = `<div class="container">${content}</div>` }

function home() {
  app.innerHTML = `
  <section class="container hero">
    <div class="hero-content">
      <div class="eyebrow">SECURE • PRIVATE • TRANSPARENT</div>

      <h1>
        Your vote.<br>
        <span class="hero-highlight">Your voice.</span>
      </h1>

      <p class="hero-description">
        A modern online voting platform designed to make internal
        elections simple, secure and transparent.
      </p>

      <div class="hero-actions">
        <a class="btn btn-primary" href="${currentUser ? "#/dashboard" : "#/register"}">
          ${currentUser ? "Open Dashboard" : "Get Started"} →
        </a>

        <a class="btn btn-ghost" href="#/verify">
          Verify a Receipt
        </a>
      </div>

      <div class="hero-trust">
        <span>✓ Secure authentication</span>
        <span>✓ One vote per election</span>
        <span>✓ Private receipts</span>
      </div>
    </div>

    <div class="hero-visual">
      <div class="vote-card">
        <div class="vote-card-top">
          <span class="mini-logo">✓</span>
          <div>
            <strong>Student Council 2026</strong>
            <small>Election is open</small>
          </div>
          <span class="status-dot"></span>
        </div>

        <div class="vote-line"></div>

        <div class="candidate-mini selected">
          <span class="candidate-symbol">★</span>
          <div>
            <strong>Aarav Sharma</strong>
            <small>President</small>
          </div>
          <span class="selected-check">✓</span>
        </div>

        <div class="candidate-mini">
          <span class="candidate-symbol">◆</span>
          <div>
            <strong>Meera Singh</strong>
            <small>President</small>
          </div>
        </div>

        <div class="candidate-mini">
          <span class="candidate-symbol">▲</span>
          <div>
            <strong>Rohan Verma</strong>
            <small>President</small>
          </div>
        </div>

        <button class="demo-vote-button">
          Vote securely
          <span>→</span>
        </button>
      </div>

      <div class="floating-card floating-security">
        <span class="floating-icon">🔐</span>
        <div>
          <strong>Protected</strong>
          <small>Your vote is secure</small>
        </div>
      </div>

      <div class="floating-card floating-receipt">
        <span class="floating-icon">✓</span>
        <div>
          <strong>Receipt verified</strong>
          <small>Ballot recorded</small>
        </div>
      </div>
    </div>
  </section>

  <section class="section container">
    <div class="section-heading">
      <div>
        <div class="eyebrow">WHY VOTESECURE</div>
        <h2 class="section-title">Built for trusted elections.</h2>
      </div>

      <p class="muted">
        Everything you need to run a clean and secure internal election.
      </p>
    </div>

    <div class="grid feature-grid">
      ${feature("01", "Secure Voting", "Authenticate voters, confirm their vote and enforce one vote per election.")}
      ${feature("02", "Private Receipts", "Every voter receives a unique receipt that can verify a ballot without revealing the choice.")}
      ${feature("03", "Admin Control", "Manage elections, candidates, voters and publish results after voting closes.")}
    </div>
  </section>

  <section class="how-section">
    <div class="container">
      <div class="center-heading">
        <div class="eyebrow">HOW IT WORKS</div>
        <h2 class="section-title">Voting made simple.</h2>
        <p class="muted">
          From signing in to receipt verification, the entire process takes only a few steps.
        </p>
      </div>

      <div class="steps-grid">
        <div class="step-card">
          <span class="step-number">01</span>
          <div class="step-icon">👤</div>
          <h3>Sign in</h3>
          <p>Use your registered voter account to access available elections.</p>
        </div>

        <div class="step-card">
          <span class="step-number">02</span>
          <div class="step-icon">🗳️</div>
          <h3>Cast your vote</h3>
          <p>Select your candidate and confirm your vote securely.</p>
        </div>

        <div class="step-card">
          <span class="step-number">03</span>
          <div class="step-icon">🎫</div>
          <h3>Get your receipt</h3>
          <p>Receive a unique receipt code after your ballot is recorded.</p>
        </div>

        <div class="step-card">
          <span class="step-number">04</span>
          <div class="step-icon">✓</div>
          <h3>Verify</h3>
          <p>Check your receipt later without exposing who you voted for.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section container security-section">
    <div class="security-banner">
      <div>
        <div class="eyebrow">SECURITY FIRST</div>
        <h2>Designed with protection in mind.</h2>
        <p>
          VoteSecure uses authentication, password hashing, CSRF protection,
          rate limiting, administrator 2FA and tamper-evident ballot records.
        </p>
      </div>

      <div class="security-points">
        <div><span>✓</span> Password protection</div>
        <div><span>✓</span> Admin 2FA</div>
        <div><span>✓</span> CSRF protection</div>
        <div><span>✓</span> Tamper detection</div>
      </div>
    </div>
  </section>

  <section class="cta-section">
    <div class="container cta-inner">
      <div>
        <div class="eyebrow">READY TO VOTE?</div>
        <h2>Make every vote count.</h2>
        <p>
          Start with a secure and simple voting experience.
        </p>
      </div>

      <a class="btn btn-primary cta-button"
         href="${currentUser ? "#/dashboard" : "#/register"}">
        ${currentUser ? "Go to Dashboard →" : "Create Your Account →"}
      </a>
    </div>
  </section>
  `;
}
function feature(n, title, text) { return `<div class="card"><div class="icon-box">${n}</div><h3>${title}</h3><p class="muted">${text}</p></div>` }

function login() {
  layout(`
    <div class="auth-page">
      <div class="auth-container">

        <div class="auth-brand">
          <span class="auth-brand-icon">✓</span>
          <span>VoteSecure</span>
        </div>

        <div class="auth-card">

          <div class="auth-card-header">
            <div class="auth-icon">🔐</div>
            <div>
              <div class="eyebrow">WELCOME BACK</div>
              <h1>Sign in to vote</h1>
              <p>Access your secure voting dashboard.</p>
            </div>
          </div>

          <form id="loginForm">

            <div class="field">
              <label for="email">Email address</label>

              <div class="input-wrap">
                <span>✉</span>

                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  autocomplete="email"
                >
              </div>
            </div>


            <div class="field">
              <label for="password">Password</label>

              <div class="input-wrap">
                <span>🔒</span>

                <input
                  id="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  autocomplete="current-password"
                >
              </div>
            </div>


            <!-- ADMIN OTP WILL APPEAR HERE -->
            <div id="otpSection"></div>


            <button
              class="btn btn-primary auth-submit"
              type="submit"
            >
              Sign in securely
              <span>→</span>
            </button>

          </form>


          <div class="auth-divider">
            <span>New to VoteSecure?</span>
          </div>


          <a class="auth-create" href="#/register">
            Create a voter account
            <span>→</span>
          </a>


          <div class="auth-security">
            <span>✓</span>
            Your credentials are protected with secure authentication.
          </div>

        </div>


        <div class="demo-box">
          <strong>Demo accounts</strong>

          <div>
            <span>Voter</span>
            <code>voter@votesecure.local</code>
            <small>Demo@12345</small>
          </div>

          <div>
            <span>Admin</span>
            <code>admin@votesecure.local</code>
            <small>Demo@12345</small>
          </div>

        </div>

      </div>
    </div>
  `);


  // EMAIL INPUT
  const emailInput = document.querySelector("#email");

  // OTP CONTAINER
  const otpSection = document.querySelector("#otpSection");


  // CHECK EMAIL WHILE TYPING
  emailInput.addEventListener("input", () => {

    const email = emailInput.value.trim().toLowerCase();


    // ADMIN EMAIL
    if (email === "admin@votesecure.local") {

      otpSection.innerHTML = `
        <div class="field">

          <label for="otp">
            Authenticator code
            <span class="optional">(admin only)</span>
          </label>

          <div class="input-wrap">

            <span>🛡</span>

            <input
              id="otp"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="6-digit code"
              autocomplete="one-time-code"
            >

          </div>

        </div>
      `;

    }

    // VOTER / OTHER EMAIL
    else {

      otpSection.innerHTML = "";

    }

  });


  // LOGIN SUBMIT
  document.querySelector("#loginForm").onsubmit = async e => {

    e.preventDefault();


    const email = document.querySelector("#email").value;

    const password = document.querySelector("#password").value;

    const otp = document.querySelector("#otp")?.value || "";


    try {

      const d = await api("/api/auth/login", {

        method: "POST",

        body: {
          email: email,
          password: password,
          otp: otp
        }

      });


      currentUser = d.user;

      csrfToken = d.csrf || csrfToken;


      showToast("Signed in successfully");


      location.hash = "#/dashboard";

      setNav();

      render();


    } catch (err) {

      showToast(err.message);

    }

  };

}

function register() {
  layout(`
    <div class="auth-page">
      <div class="auth-container">

        <div class="auth-brand">
          <span class="auth-brand-icon">✓</span>
          <span>VoteSecure</span>
        </div>

        <div class="auth-card">

          <div class="auth-card-header">
            <div class="auth-icon">👤</div>

            <div>
              <div class="eyebrow">JOIN VOTESECURE</div>
              <h1>Create your account</h1>
              <p>Register securely to participate in elections.</p>
            </div>
          </div>

          <form id="regForm">

            <div class="field">
              <label for="name">Full name</label>

              <div class="input-wrap">
                <span>👤</span>

                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Enter your full name"
                  autocomplete="name"
                >
              </div>
            </div>


            <div class="field">
              <label for="email">Email address</label>

              <div class="input-wrap">
                <span>✉</span>

                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  autocomplete="email"
                >
              </div>
            </div>


            <div class="field">
              <label for="voterId">Voter ID</label>

              <div class="input-wrap">
                <span>🪪</span>

                <input
                  id="voterId"
                  type="text"
                  required
                  placeholder="Enter your voter ID"
                  autocomplete="off"
                >
              </div>

              <small class="field-help">
                Your voter ID must be present on the election roll.
              </small>
            </div>


            <div class="field">
              <label for="password">Password</label>

              <div class="input-wrap">
                <span>🔒</span>

                <input
                  id="password"
                  type="password"
                  minlength="8"
                  required
                  placeholder="Create a password"
                  autocomplete="new-password"
                >
              </div>

              <small class="field-help">
                Use at least 8 characters.
              </small>
            </div>


            <button
              class="btn btn-primary auth-submit"
              type="submit"
            >
              Create account
              <span>→</span>
            </button>

          </form>


          <div class="auth-divider">
            <span>Already registered?</span>
          </div>


          <a class="auth-create" href="#/login">
            Sign in to your account
            <span>→</span>
          </a>


          <div class="auth-security">
            <span>✓</span>
            Your password is securely protected.
          </div>

        </div>


        <div class="register-info">

          <div>
            <span>🔐</span>
            <strong>Secure authentication</strong>
            <small>Your account is protected with password hashing.</small>
          </div>

          <div>
            <span>🗳️</span>
            <strong>One vote per election</strong>
            <small>Voting is enforced at the database level.</small>
          </div>

          <div>
            <span>🎫</span>
            <strong>Private receipt</strong>
            <small>Verify your ballot without revealing your choice.</small>
          </div>

        </div>

      </div>
    </div>
  `);


  document.querySelector("#regForm").onsubmit = async e => {

    e.preventDefault();


    const name =
      document.querySelector("#name").value.trim();

    const email =
      document.querySelector("#email").value.trim();

    const voterId =
      document.querySelector("#voterId").value.trim();

    const password =
      document.querySelector("#password").value;


    try {

      const d = await api("/api/auth/register", {

        method: "POST",

        body: {
          name,
          email,
          voterId,
          password
        }

      });


      currentUser = d.user;


      showToast("Account created successfully");


      location.hash = "#/dashboard";

      setNav();

      render();


    } catch (err) {

      showToast(err.message);

    }

  };
}

async function dashboard() {
  if (!currentUser) {
    location.hash = "#/login";
    return;
  }

  layout(`
    <div class="page dashboard-page">

      <div class="dashboard-hero">

        <div>
          <div class="eyebrow">VOTER DASHBOARD</div>

          <h1>
            Hello, ${escapeHtml(currentUser.name.split(" ")[0])} 👋
          </h1>

          <p class="muted dashboard-subtitle">
            Welcome back. Choose an open election and cast your vote securely.
          </p>
        </div>

        <div class="dashboard-user-card">
          <div class="dashboard-avatar">
            ${escapeHtml(currentUser.name.charAt(0).toUpperCase())}
          </div>

          <div>
            <strong>${escapeHtml(currentUser.name)}</strong>
            <small>${escapeHtml(currentUser.email || "Verified voter")}</small>
          </div>
        </div>

      </div>


      <div class="dashboard-stats">

        <div class="dashboard-stat">
          <div class="stat-icon">🗳️</div>
          <div>
            <strong>Your Elections</strong>
            <span>Available voting opportunities</span>
          </div>
        </div>

        <div class="dashboard-stat">
          <div class="stat-icon">🔐</div>
          <div>
            <strong>Secure Voting</strong>
            <span>Your ballot is protected</span>
          </div>
        </div>

        <div class="dashboard-stat">
          <div class="stat-icon">🎫</div>
          <div>
            <strong>Private Receipt</strong>
            <span>Verify your ballot anytime</span>
          </div>
        </div>

      </div>


      <div class="dashboard-section-head">

        <div>
          <div class="eyebrow">AVAILABLE ELECTIONS</div>
          <h2>Choose an election</h2>
        </div>

        <div class="dashboard-secure-badge">
          <span>✓</span>
          Secure & verified
        </div>

      </div>


      <div id="elections" class="election-grid"></div>


      <div class="dashboard-security">

        <div class="security-icon">🛡️</div>

        <div>
          <strong>Your vote matters</strong>

          <p>
            VoteSecure is designed to prevent duplicate voting and
            provides a private receipt for ballot verification.
          </p>
        </div>

      </div>

    </div>
  `);


  try {

    const d = await api("/api/elections");


    document.querySelector("#elections").innerHTML =
      d.elections.map(e => `

        <article class="election-card premium-election-card">

          <div class="election-card-top">

            <span class="badge ${e.status}">
              ${e.status}
            </span>

            <span class="election-candidate-count">
              👥 ${e.candidate_count} candidates
            </span>

          </div>


          <h3>
            ${escapeHtml(e.title)}
          </h3>


          <p class="muted election-description">
            ${escapeHtml(e.description || "Participate in this election securely.")}
          </p>


          <div class="election-meta">

            <div>
              <span class="meta-icon">👥</span>
              <div>
                <small>Candidates</small>
                <strong>${e.candidate_count}</strong>
              </div>
            </div>


            <div>
              <span class="meta-icon">
                ${e.voted ? "✓" : "○"}
              </span>

              <div>
                <small>Your status</small>
                <strong>
                  ${e.voted ? "Vote recorded" : "Not voted"}
                </strong>
              </div>
            </div>

          </div>


          <div class="election-action">

            ${e.status === "open" && !e.voted
          ? `
                  <a
                    class="btn btn-primary election-vote-btn"
                    href="#/election/${e.id}"
                  >
                    Cast your vote
                    <span>→</span>
                  </a>
                `
          : e.voted
            ? `
                  <a
                    class="btn btn-ghost election-vote-btn"
                    href="#/election/${e.id}"
                  >
                    View your receipt
                    <span>→</span>
                  </a>
                `
            : `
                  <span class="election-unavailable">
                    Voting unavailable
                  </span>
                `
        }

          </div>

        </article>

      `).join("") ||

      `
        <div class="empty dashboard-empty">

          <div class="empty-icon">🗳️</div>

          <h3>No elections available</h3>

          <p class="muted">
            There are currently no elections available for voting.
          </p>

        </div>
      `;


  } catch (err) {

    showToast(err.message);

  }
}

async function election(id) {

  layout(`
    <div class="page voting-page">

      <a class="link back-link" href="#/dashboard">
        ← Back to dashboard
      </a>

      <div id="electionBox" class="voting-container"></div>

    </div>
  `);


  try {

    const d = await api("/api/elections/" + id);
    const e = d.election;


    document.querySelector("#electionBox").innerHTML = `

      <div class="voting-header">

        <div>

          <div class="eyebrow">
            ${e.status === "open" ? "OPEN ELECTION" : "ELECTION CLOSED"}
          </div>

          <h1 class="section-title">
            ${escapeHtml(e.title)}
          </h1>

          <p class="muted voting-description">
            ${escapeHtml(e.description || "")}
          </p>

        </div>


        <div class="voting-status ${e.status}">
          <span></span>
          ${e.status}
        </div>

      </div>


      ${
        d.voted

          ? `

            <div class="vote-complete-card">

              <div class="complete-icon">
                ✓
              </div>

              <div class="eyebrow">
                VOTE RECORDED
              </div>

              <h2>Your vote has been recorded</h2>

              <p class="muted">
                Your ballot was successfully submitted.
                Keep your receipt safe for future verification.
              </p>


              <div class="receipt-box">

                <small>Your private receipt</small>

                <strong>
                  ${escapeHtml(d.receipt)}
                </strong>

              </div>


              <a
                class="btn btn-primary"
                href="#/verify?receipt=${encodeURIComponent(d.receipt)}"
              >
                Verify this receipt
                <span>→</span>
              </a>

            </div>

          `

          : e.status !== "open"

          ? `

            <div class="vote-closed-card">

              <div class="closed-icon">
                🔒
              </div>

              <h2>Voting is closed</h2>

              <p class="muted">
                Voting is not currently open for this election.
              </p>

              <a
                class="btn btn-ghost"
                href="#/dashboard"
              >
                ← Back to dashboard
              </a>

            </div>

          `

          : `

            <form id="voteForm">

              <div class="voting-section-head">

                <div>
                  <div class="eyebrow">
                    STEP 1
                  </div>

                  <h2>Select your candidate</h2>

                  <p class="muted">
                    Choose one candidate to continue.
                  </p>
                </div>

                <div class="selection-hint">
                  ○ One choice only
                </div>

              </div>


              <div class="candidate-grid premium-candidate-grid">

                ${d.candidates.map((c, i) => `

                  <label class="candidate premium-candidate">

                    <input
                      type="radio"
                      name="candidate"
                      value="${c.id}"
                      ${i === 0 ? "required" : ""}
                    >


                    <div class="candidate-check">
                      ✓
                    </div>


                    <div class="candidate-symbol">
                      ${escapeHtml(c.symbol)}
                    </div>


                    <div class="candidate-info">

                      <h3>
                        ${escapeHtml(c.name)}
                      </h3>

                      <span class="candidate-position">
                        ${escapeHtml(c.position)}
                      </span>

                      <p>
                        ${escapeHtml(c.bio)}
                      </p>

                    </div>

                  </label>

                `).join("")}

              </div>


              <div class="vote-confirm-card">

                <div class="confirm-heading">

                  <div class="confirm-icon">
                    🔐
                  </div>

                  <div>
                    <div class="eyebrow">
                      STEP 2
                    </div>

                    <h3>Confirm your vote</h3>
                  </div>

                </div>


                <p class="muted">
                  Re-enter your password to securely confirm your vote.
                  Your private receipt will not reveal your candidate choice.
                </p>


                <div class="field">

                  <label for="confirmPassword">
                    Account password
                  </label>

                  <div class="input-wrap">

                    <span>🔒</span>

                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      placeholder="Enter your password"
                      autocomplete="current-password"
                    >

                  </div>

                </div>


                <div class="vote-security-note">

                  <span>✓</span>

                  <div>
                    <strong>Secure ballot</strong>

                    <small>
                      One vote per election. Your selection is protected.
                    </small>
                  </div>

                </div>


                <button
                  class="btn btn-primary vote-submit-btn"
                  type="submit"
                >
                  Cast my vote securely
                  <span>→</span>
                </button>

              </div>

            </form>

          `
      }

    `;


    /*
      Candidate selection
    */

    document
      .querySelectorAll(".candidate")
      .forEach(candidate => {

        candidate.onclick = () => {

          document
            .querySelectorAll(".candidate")
            .forEach(c =>
              c.classList.remove("selected")
            );


          candidate.classList.add("selected");


          candidate
            .querySelector("input")
            .checked = true;

        };

      });


    /*
      Vote submission
    */

    const form = document.querySelector("#voteForm");


    if (form) {

      form.onsubmit = async ev => {

        ev.preventDefault();


        const selected =
          document.querySelector(
            "input[name=candidate]:checked"
          );


        if (!selected) {

          return showToast(
            "Choose a candidate."
          );

        }


        const password =
          document.querySelector(
            "#confirmPassword"
          ).value;


        try {

          await api(
            "/api/elections/" + id + "/vote",
            {
              method: "POST",

              body: {
                candidateId: selected.value,
                password
              }
            }
          );


          showToast("Vote recorded successfully");


          election(id);


        } catch (err) {

          showToast(err.message);

        }

      };

    }


  } catch (err) {

    showToast(err.message);

  }

}

function verify() {
  const initialReceipt = new URLSearchParams(location.hash.split("?")[1] || "").get("receipt") || "";
  layout(`<div class="auth-wrap"><div class="form-card"><div class="eyebrow">Public verification</div><h1>Check a receipt</h1><p class="muted">Verify that a ballot was recorded without exposing the selected candidate.</p>
  <form id="verifyForm"><div class="field"><label>Receipt code</label><input id="receiptInput" value="${escapeHtml(initialReceipt)}" placeholder="VS-XXXXXXXXXXXX" required></div><button class="btn btn-primary">Verify receipt</button></form><div id="result"></div></div></div>`);
  document.querySelector("#verifyForm").onsubmit = async e => { e.preventDefault(); const code = document.querySelector("#receiptInput").value.trim(); try { const d = await api("/api/receipts/" + encodeURIComponent(code)); document.querySelector("#result").innerHTML = `<div class="notice success"><strong>✓ Receipt verified</strong><br>${escapeHtml(d.election)}<br><small>${escapeHtml(d.message)}</small></div>` } catch (err) { document.querySelector("#result").innerHTML = `<div class="notice error">${escapeHtml(err.message)}</div>` } }
}

async function admin() {
  if (!currentUser || currentUser.role !== "admin") { location.hash = "#/login"; return }
  layout(`<div class="page"><div class="dashboard-head"><div><div class="eyebrow">Administration</div><h1>Control center</h1><p class="muted">Manage elections and review operational data.</p></div></div><div id="adminContent"></div></div>`);
  const box = document.querySelector("#adminContent");
  if (!currentUser.totpEnabled) {
    box.innerHTML = `<div class="form-card"><h2 style="font-family:'Space Grotesk'">Protect the admin account</h2><p class="muted">Enable authenticator-app 2FA before using admin tools.</p><button id="setup2fa" class="btn btn-primary">Set up 2FA</button><div id="twofaBox"></div></div>`;
    document.querySelector("#setup2fa").onclick = async () => { try { const d = await api("/api/admin/2fa/setup", { method: "POST" }); document.querySelector("#twofaBox").innerHTML = `<div class="notice" style="margin-top:18px"><strong>Authenticator secret</strong><br><code>${escapeHtml(d.secret)}</code><p>In Google Authenticator/Microsoft Authenticator, choose “Enter setup key” and use this secret. Then enter the 6-digit code below.</p><div class="field"><input id="twofaCode" maxlength="6" inputmode="numeric" placeholder="123456"></div><button id="verify2fa" class="btn btn-primary">Enable 2FA</button></div>`; document.querySelector("#verify2fa").onclick = async () => { try { await api("/api/admin/2fa/verify", { method: "POST", body: { code: twofaCode.value } }); currentUser.totpEnabled = true; showToast("Admin 2FA enabled"); admin() } catch (err) { showToast(err.message) } } } catch (err) { showToast(err.message) } }; return;
  }
  const d = await api("/api/admin/dashboard");
  box.innerHTML = `<div class="stats"><div class="card stat"><strong>${d.stats.users}</strong><span>Registered voters</span></div><div class="card stat"><strong>${d.stats.elections}</strong><span>Elections</span></div><div class="card stat"><strong>${d.stats.ballots}</strong><span>Ballots cast</span></div><div class="card stat"><strong>${d.stats.open}</strong><span>Open elections</span></div></div>
  <div class="admin-tabs"><button class="tab active" data-tab="elections">Elections</button><button class="tab" data-tab="create">Create election</button><button class="tab" data-tab="users">Voters</button></div><div id="adminTab"></div>`;
  document.querySelectorAll(".tab").forEach(b => b.onclick = () => { document.querySelectorAll(".tab").forEach(x => x.classList.remove("active")); b.classList.add("active"); adminTab(b.dataset.tab) });
  adminTab("elections");
}
async function adminTab(tab) {

  const el = document.querySelector("#adminTab");


  /* =========================
     CREATE ELECTION
  ========================= */

  if (tab === "create") {

    el.innerHTML = `

      <div class="admin-create-layout">

        <div class="form-card admin-create-card">

          <div class="eyebrow">NEW ELECTION</div>

          <h2>Create an election</h2>

          <p class="muted">
            Create the election first, then add candidates to it.
          </p>


          <form id="createElection">

            <div class="field">

              <label for="title">
                Election title
              </label>

              <input
                id="title"
                required
                placeholder="e.g. Student Council 2027"
              >

            </div>


            <div class="field">

              <label for="description">
                Description
              </label>

              <textarea
                id="description"
                rows="4"
                required
                placeholder="Describe this election..."
              ></textarea>

            </div>


            <div class="create-info">

              <span>🔒</span>

              <div>
                <strong>Election starts as a draft</strong>

                <small>
                  You can add candidates first and open voting when everything is ready.
                </small>
              </div>

            </div>


            <div class="form-actions">

              <button
                class="btn btn-primary"
                type="submit"
              >
                Create election
                <span>→</span>
              </button>

            </div>

          </form>

        </div>


        <div class="admin-side-card">

          <div class="side-icon">🗳️</div>

          <h3>Build your election</h3>

          <p>
            After creating the election, you can add candidates,
            review the election and then open voting.
          </p>


          <div class="side-step">
            <span>1</span>
            <div>
              <strong>Create election</strong>
              <small>Add title and description.</small>
            </div>
          </div>


          <div class="side-step">
            <span>2</span>
            <div>
              <strong>Add candidates</strong>
              <small>Add candidate details and symbols.</small>
            </div>
          </div>


          <div class="side-step">
            <span>3</span>
            <div>
              <strong>Open voting</strong>
              <small>Allow voters to cast their ballot.</small>
            </div>
          </div>

        </div>

      </div>

    `;


    document.querySelector("#createElection").onsubmit =
      async e => {

        e.preventDefault();


        const title =
          document.querySelector("#title").value.trim();

        const description =
          document.querySelector("#description").value.trim();


        try {

          const created = await api(
            "/api/admin/elections",
            {
              method: "POST",

              body: {
                title,
                description
              }
            }
          );


          showToast("Election created");


          /*
             Open candidate manager immediately
          */

          await adminTab("manage:" + created.id);


        } catch (err) {

          showToast(err.message);

        }

      };


    return;
  }


  /* =========================
     MANAGE ELECTION / CANDIDATES
  ========================= */

  if (tab.startsWith("manage:")) {

    const electionId =
      tab.split(":")[1];


    const d =
      await api("/api/elections/" + electionId);


    const e = d.election;


    el.innerHTML = `

      <div class="admin-manage-head">

        <div>

          <div class="eyebrow">
            ELECTION SETUP
          </div>

          <h2>
            ${escapeHtml(e.title)}
          </h2>

          <p class="muted">
            Add candidates before opening voting.
          </p>

        </div>


        <span class="badge ${e.status}">
          ${e.status}
        </span>

      </div>


      <div class="admin-candidate-layout">


        <div>

          <div class="admin-panel-heading">

            <div>
              <div class="eyebrow">CANDIDATES</div>
              <h3>Election candidates</h3>
            </div>

            <span class="candidate-total">
              ${d.candidates.length} added
            </span>

          </div>


          <div id="candidateList">

            ${
              d.candidates.length

              ? d.candidates.map(c => `

                  <div class="admin-candidate-row">

                    <div class="admin-candidate-symbol">
                      ${escapeHtml(c.symbol)}
                    </div>

                    <div class="admin-candidate-details">

                      <strong>
                        ${escapeHtml(c.name)}
                      </strong>

                      <span>
                        ${escapeHtml(c.position)}
                      </span>

                      <small>
                        ${escapeHtml(c.bio || "No bio added.")}
                      </small>

                    </div>

                  </div>

                `).join("")

              : `

                <div class="admin-empty-candidates">

                  <div>👤</div>

                  <strong>No candidates yet</strong>

                  <span>
                    Add at least two candidates before opening voting.
                  </span>

                </div>

              `
            }

          </div>

        </div>


        <div class="form-card add-candidate-card">

          <div class="eyebrow">ADD CANDIDATE</div>

          <h3>Add a candidate</h3>

          <p class="muted">
            Enter the candidate information below.
          </p>


          <form id="candidateForm">


            <div class="field">

              <label for="candidateName">
                Candidate name
              </label>

              <input
                id="candidateName"
                required
                placeholder="e.g. Rahul Sharma"
              >

            </div>


            <div class="field">

              <label for="candidatePosition">
                Position
              </label>

              <input
                id="candidatePosition"
                required
                placeholder="e.g. President"
              >

            </div>


            <div class="field">

              <label for="candidateSymbol">
                Symbol
              </label>

              <input
                id="candidateSymbol"
                maxlength="10"
                placeholder="e.g. ⭐"
              >

            </div>


            <div class="field">

              <label for="candidateBio">
                Short bio
              </label>

              <textarea
                id="candidateBio"
                rows="3"
                placeholder="Brief candidate description..."
              ></textarea>

            </div>


            <button
              class="btn btn-primary"
              type="submit"
              style="width:100%"
            >
              Add candidate
              <span>+</span>
            </button>


          </form>

        </div>

      </div>


      <div class="admin-manage-actions">

        <button
          class="btn btn-ghost"
          id="backAdmin"
        >
          ← Back to elections
        </button>


        ${
          d.candidates.length >= 2
          ? `
            <button
              class="btn btn-primary"
              id="openElection"
            >
              Open voting
              <span>→</span>
            </button>
          `
          : `
            <span class="muted">
              Add at least 2 candidates to open voting.
            </span>
          `
        }

      </div>

    `;


    /*
      Add candidate
    */

    document.querySelector("#candidateForm").onsubmit =
      async ev => {

        ev.preventDefault();


        const name =
          document.querySelector("#candidateName").value.trim();

        const position =
          document.querySelector("#candidatePosition").value.trim();

        const symbol =
          document.querySelector("#candidateSymbol").value.trim();

        const bio =
          document.querySelector("#candidateBio").value.trim();


        try {

          await api(
            "/api/admin/elections/" +
            electionId +
            "/candidates",
            {
              method: "POST",

              body: {
                name,
                position,
                bio,
                symbol
              }
            }
          );


          showToast("Candidate added");


          await adminTab("manage:" + electionId);


        } catch (err) {

          showToast(err.message);

        }

      };


    /*
      Back
    */

    document.querySelector("#backAdmin").onclick =
      () => adminTab("elections");


    /*
      Open election
    */

    const openButton =
      document.querySelector("#openElection");


    if (openButton) {

      openButton.onclick = async () => {

        try {

          await api(
            "/api/admin/elections/" +
            electionId +
            "/status",
            {
              method: "POST",

              body: {
                status: "open"
              }
            }
          );


          showToast("Voting is now open");


          admin();


        } catch (err) {

          showToast(err.message);

        }

      };

    }


    return;
  }


  /* =========================
     USERS
  ========================= */

  if (tab === "users") {

    const d =
      await api("/api/admin/users");


    el.innerHTML = `

      <div class="table-wrap">

        <table class="table">

          <thead>

            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Voter ID</th>
              <th>Role</th>
              <th>Voted</th>
            </tr>

          </thead>


          <tbody>

            ${d.users.map(u => `

              <tr>

                <td>
                  ${escapeHtml(u.name)}
                </td>

                <td>
                  ${escapeHtml(u.email)}
                </td>

                <td>
                  ${escapeHtml(u.voter_id || "-")}
                </td>

                <td>
                  ${u.role}
                </td>

                <td>
                  ${u.has_voted ? "Yes" : "No"}
                </td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    `;

    return;
  }


  /* =========================
     ELECTION LIST
  ========================= */

  const d =
    await api("/api/elections");


  el.innerHTML = `

    <div class="election-grid">

      ${d.elections.map(e => `

        <article class="election-card">

          <div class="election-card-top">

            <span class="badge ${e.status}">
              ${e.status}
            </span>

            <span class="election-candidate-count">
              👥 ${e.candidate_count} candidates
            </span>

          </div>


          <h3>
            ${escapeHtml(e.title)}
          </h3>


          <p class="muted">
            ${escapeHtml(e.description)}
          </p>


          <div class="meta">

            <span>
              ${e.candidate_count} candidates
            </span>

            <span>
              ${e.voted ? "Your account voted" : "-"}
            </span>

          </div>


          <div class="hero-actions">

            ${
              e.status === "draft"
              ? `
                <button
                  class="btn btn-primary"
                  data-manage="${e.id}"
                >
                  Manage candidates
                </button>
              `
              : ""
            }


            ${
              e.status !== "draft"
              ? `
                <button
                  class="btn ${
                    e.status === "open"
                    ? "btn-danger"
                    : "btn-primary"
                  }"
                  data-id="${e.id}"
                  data-status="${e.status}"
                >
                  ${
                    e.status === "open"
                    ? "Close voting"
                    : e.status === "closed"
                    ? "Closed"
                    : "Open voting"
                  }
                </button>
              `
              : ""
            }


            ${
              e.status === "closed"
              ? `
                <button
                  class="btn btn-ghost"
                  data-result="${e.id}"
                >
                  View results
                </button>
              `
              : ""
            }

          </div>

        </article>

      `).join("")}

    </div>

  `;


  /*
    Manage candidate button
  */

  el.querySelectorAll("[data-manage]")
    .forEach(b => {

      b.onclick = () =>
        adminTab(
          "manage:" + b.dataset.manage
        );

    });


  /*
    Open / close voting
  */

  el.querySelectorAll("[data-status]")
    .forEach(b => {

      b.onclick = async () => {

        const next =
          b.dataset.status === "open"
            ? "closed"
            : "open";


        try {

          await api(
            "/api/admin/elections/" +
            b.dataset.id +
            "/status",
            {
              method: "POST",

              body: {
                status: next
              }
            }
          );


          showToast(
            "Election status updated"
          );


          admin();


        } catch (err) {

          showToast(err.message);

        }

      };

    });


  /*
    Results
  */

  el.querySelectorAll("[data-result]")
    .forEach(b => {

      b.onclick = async () => {

        try {

          const r =
            await api(
              "/api/admin/elections/" +
              b.dataset.result +
              "/results"
            );


          showResults(r);

        } catch (err) {

          showToast(err.message);

        }

      };

    });

}
function showResults(d) { app.insertAdjacentHTML("beforeend", `<div class="modal open" id="resultModal"><div class="modal-card"><div class="eyebrow">Final results</div><h2>${escapeHtml(d.election.title)}</h2>${d.results.map(r => `<div style="display:flex;justify-content:space-between;border-bottom:1px solid #edf0f4;padding:13px 0"><span>${escapeHtml(r.symbol)} ${escapeHtml(r.name)}</span><strong>${r.votes} vote${r.votes === 1 ? "" : "s"}</strong></div>`).join("")}<button class="btn btn-primary" style="margin-top:20px" onclick="document.querySelector('#resultModal').remove()">Close</button></div></div>`) }

function render() {
  setNav();
  const hash = location.hash || "#/";
  if (hash.startsWith("#/login")) login();
  else if (hash.startsWith("#/register")) register();
  else if (hash.startsWith("#/dashboard")) dashboard();
  else if (hash.startsWith("#/election/")) election(hash.split("/")[2]);
  else if (hash.startsWith("#/verify")) verify();
  else if (hash.startsWith("#/admin")) admin();
  else home();
}
window.addEventListener("hashchange", render);
init();
