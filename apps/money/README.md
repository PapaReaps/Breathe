# Breathe Money

**Status: Stage 4 (remembers your numbers).** A calm main screen that shows how much is safe to spend until payday. Your numbers are kept on your own device (not encrypted, never sent anywhere), with a backup file, restore and clear option.

## Run it (Windows PowerShell, inside this folder)

```
npm install        # downloads the tools (first time only)
npm run dev        # starts the app: open http://localhost:5173
npm run dev:phone  # same, but also reachable from your phone on home Wi-Fi
npm test           # runs the automatic checks
npm run typecheck  # checks the code for mistakes
```

Stop the app with `Ctrl+C`.

## Folders

| Folder | Purpose |
|---|---|
| `src/screens/` | The page people see |
| `src/components/` | Small reusable pieces (the amount box) |
| `src/storage/` | Keeping numbers on the device, and checking backup files before trusting them |
| `src/logic/` | The calculation and the code that reads what is typed. No screens in here |
| `src/content/` | All the words people see |
| `tests/` | Automatic checks |
