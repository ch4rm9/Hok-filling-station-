# HOK Filling Station Management

A database-backed Flask application for daily filling-station operations. It includes sales/memos, stock and tank records, purchases, customer and supplier balances, cash and bank ledgers, expenses, shifts, employee attendance, reports, audit history, and database backups.

## Requirements

- Python 3.10 or newer (uses `zoneinfo`)
- SQLite (included with Python)
- Dependencies in `requirements.txt`

## Run locally

```bash
python -m venv .venv
. .venv/bin/activate        # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000` on the same machine. On the first visit, create the owner account. There is no default password. Choose a unique password of at least 10 characters and keep it in a password manager.

By default, the SQLite database, generated session key, and backup files are stored under `data/`. Set `HOK_DATA_DIR` **before starting the app** to keep them elsewhere, for example:

```bash
export HOK_DATA_DIR=/srv/hok-filling-station
export HOK_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
export HOK_COOKIE_SECURE=1
python app.py
```

Use a stable, private data directory and restrict its filesystem permissions to the service account. Do not put the database, session key, or backups in a public web directory or commit them to source control. `HOK_COOKIE_SECURE=1` should be used when the app is served over HTTPS. For a real deployment, run behind a production WSGI server and an HTTPS reverse proxy; do not expose Flask's development server or enable debug mode publicly.

## First-time configuration

1. Sign in with the owner account created during setup.
2. Review **Settings**: business/dealer name and address, contact details, logo, timezone, memo format and next number, opening cash, and backup options.
3. Review the seeded product list and selling prices. These are editable database records, not immutable application constants.
4. Set up bank/mobile accounts, suppliers, customers, employees, pumps/nozzles, tanks, and operating shifts.
5. Record verified opening product stock with a reason, or enter a purchase against the correct tank. The application does not make a tank dip into a stock adjustment.
6. Create individual user accounts and configure role permissions. Never share the owner login among staff.

The initial product catalog and default station settings are convenience defaults. Confirm them against the station's current records before use. New installations do not contain invented sales or dashboard statistics.

## Financial and inventory workflow notes

- Memo totals are calculated from line quantity × rate. Cash, bank/mobile collections, and customer credit are recorded as distinct payment components. Credit sales require a customer.
- Posted sales reduce stock; credit sales update customer due. Changes and cancellations retain revisions and reversal entries rather than deleting the memo.
- Purchases update product stock and moving weighted-average cost, and may be recorded as supplier credit or paid through cash/bank/mobile.
- Physical tank dips are saved as **unverified**. Verification is a separate, audited action; a dip does not automatically alter book stock.
- Expenses are posted according to the user's role. Approved cash/bank expenses affect the relevant ledger; a reversal retains the original expense and posts an opposite ledger movement.
- A shift close records meter totals, sales/payment totals, approved expenses, deposits, expected cash and counted cash. Assign the correct business date and shift to transactions for meaningful reconciliation.
- Reports can be filtered by date and printed or exported to CSV/XLSX. Exports use the report's live database results.

This application provides operational records and basic management reports; it is not a substitute for an accountant's review, statutory VAT/tax reporting, or a tested integration with Bangladesh Bank, NBR, POS hardware, or fuel-company systems. Reconcile opening balances and real cash/bank/stock figures before relying on reports for statutory or financial decisions.

## Backups and restore

Users with backup permission can create a database backup from **Backup**. Restore replaces the live database; the app creates a safety backup before restoring. Test restores periodically on a separate copy, and keep an encrypted off-site copy of both the database and any files needed to operate the service. A backup on the same disk is not a disaster-recovery plan.

## Checks

The project can be syntax-checked with:

```bash
python -m py_compile app.py
node --check static/app.js
```

The Flask routes and UI are intended to be exercised with a fresh temporary `HOK_DATA_DIR`; do not run smoke tests against the station's live database.
