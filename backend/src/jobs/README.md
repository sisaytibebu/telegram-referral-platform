# Scheduled Jobs

This directory contains background jobs for the platform.

## Planned Jobs (Phase 13+)

- `referralQualifier.js` — periodic check for pending referrals
- `withdrawalReminder.js` — notify users of pending withdrawals
- `cleanupJob.js` — clean expired sessions/tokens

Jobs will be implemented using `node-cron` in a later phase.
