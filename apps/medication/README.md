# Breathe Medication

Calm, private medicine reminders for ADHD brains. The second app in the Breathe family, built the same way as Breathe Money (`apps/money`).

**Status:** early building (Stage 1 of 6). Not released yet.

- **Today list:** your doses for today, grouped into morning, afternoon and evening. Tap **Taken** when it's done. Nothing is ever red or "missed": it just says **Not taken yet**.
- **Your medicines:** add each one with a name, an optional amount and the times you take it each day.
- **Private:** everything stays on this device (IndexedDB database `breathe-medication`). Nothing is sent anywhere.

Coming next: phone reminders (Android), running-low warnings, a simple history, then settings, PIN, backups and updates shared with Breathe Money.

Breathe Medication is a reminder tool, not medical advice. It never checks doses. Questions about your medicines? Check with your pharmacist or GP.

## Working on it

```bash
npm install
npm run dev
npm test
```
