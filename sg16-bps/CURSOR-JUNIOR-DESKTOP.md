# Cursor Junior — PC install (exe)

Cursor works on the PC road. Junior must too. Cloud-only = blind run.

```text
Owner sits in front of the screen
  ↓
SG16-Cursor-Junior-Setup.exe  (install once)
  ↓
Junior lives on this PC — door open for this machine
  ↓
Opens the **developer bench** (`/developer`) — not the public landing
  ↓
Talks to the house brain (sg16engine.com / Railway pipe / VM)
```

## Build the installer (Windows)

```powershell
cd desktop
npm install
npm run dist:win
```

Output: `desktop/release/SG16-Cursor-Junior-Setup-1.0.0.exe`

Install it. Desktop + Start Menu shortcut: **SG16 Personal Developer**.

## Run without installing

```powershell
cd desktop
npm install
npm start
```

Default URL: `https://sg16engine.com/developer`  
Local house: `$env:SG16_JUNIOR_URL="http://localhost:8000"; npm start` (opens `/developer`)

## Names

| Where | Name |
|-------|------|
| Owner house | Cursor Junior |
| Shortcut / window | SG16 Personal Developer |
| Setup file | SG16-Cursor-Junior-Setup |

End users never need the Cursor name.
