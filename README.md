# VoteSecure — Full-Stack Online E-Voting System

VoteSecure is a portfolio-ready web application for **clubs, student councils, co-ops and internal polls**. It is intentionally not presented as a public/government election system.

## Stack

- Node.js + Express
- SQLite + better-sqlite3
- Vanilla HTML/CSS/JavaScript frontend
- bcrypt password hashing
- Session authentication
- Authenticator-app TOTP for administrators
- Helmet security headers
- Express rate limiting
- CSRF token checks
- Database transaction for one-vote enforcement
- Append-only ballot hash chain
- Receipt verification without revealing candidate choice

## Run locally

Requirements: Node.js 20+

```bash
npm install
npm start
```

Open:

```text
http://127.0.0.1:3000
```

## Demo accounts

**Voter**
- Email: `voter@votesecure.local`
- Password: `Demo@12345`

**Admin**
- Email: `admin@votesecure.local`
- Password: `Demo@12345`

The first time you open the admin panel, enable 2FA. The setup screen gives you a secret that can be entered manually in an authenticator app.

## Main flow

1. Register/sign in.
2. Open the voter dashboard.
3. Select an open election.
4. Choose a candidate.
5. Re-enter your password.
6. Receive a one-time receipt.
7. Use the public verification page to verify the receipt.
8. Admin closes the election.
9. Admin can view results only after closure.

## Important security scope

This project demonstrates practical application-security patterns, but it is **not suitable for binding public elections** without independent security review, threat modeling, stronger end-to-end verifiability, operational controls, and a formal audit.

Remote voting also cannot fully prevent coercion or vote buying. The server remains part of the trust model.

## Production checklist

- Use HTTPS/TLS.
- Set a strong `SESSION_SECRET`.
- Use a persistent production session store.
- Add password reset and email verification.
- Add independent penetration testing.
- Add two-person approval for sensitive admin actions.
- Add database backups and recovery procedures.
- Review privacy and retention requirements.
- Run dependency and supply-chain security scans.
