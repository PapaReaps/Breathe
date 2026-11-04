# Breathe Money

**Status: Stage 3 (first working version).** One plain page that works out how much is safe to spend until payday. Nothing is saved yet.

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
| `src/logic/` | The calculation and the code that reads what is typed. No screens in here |
| `src/content/` | All the words people see |
| `tests/` | Automatic checks |
