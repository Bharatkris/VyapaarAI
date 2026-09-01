# UdhaarAI — Voice-First Digital Ledger (Python & MySQL Edition)

UdhaarAI is a full-stack, voice-first digital ledger application tailored for retail shop owners. It enables shopkeepers to record credit (Udhari) transactions, receive customer payments, generate itemized bills, send automated WhatsApp reminders, and ask business queries via voice and conversational AI in Hindi, Marathi, English, and Hinglish.

---

## Architecture Overview

- **Frontend:** Pure HTML5, CSS3, Modern JavaScript (Fetch API, Web Speech API, i18n support). Pure static frontend with **no Jinja templating tags**.
- **Backend:** Python 3 Flask REST API with modular blueprints and service layer.
- **ORM & Database:** SQLAlchemy ORM models with **MySQL** database support (and SQLite fallback for zero-configuration local development).
- **Voice & NLP Engine:** Multilingual rule-based entity extractor and conversational business intelligence engine.

---

## Project Structure

```
UdhaarAI/
├── frontend/
│   ├── index.html       # Single-Page App HTML (No Jinja {{ }} / {% %})
│   ├── styles.css       # Visual styling, responsive layout, animations & print media
│   └── app.js           # Full SPA logic, SpeechRecognition, Fetch API & i18n
├── backend/
│   ├── app.py           # Flask server entrypoint & static route handler
│   ├── config.py        # Environment configuration
│   ├── database.py      # SQLAlchemy initialization and database seeder
│   ├── models.py        # 11 Database models & relationships
│   ├── routes/
│   │   └── api.py       # REST API Blueprint endpoints
│   ├── services/
│   │   ├── voice_parser.py   # Multilingual speech/text entity extractor
│   │   ├── ai_assistant.py   # Live database query answering service
│   │   ├── ledger_service.py # Transactional balance calculation engine
│   │   └── report_service.py # Metrics aggregation and chart data service
│   └── test_app.py      # Automated unit and integration test suite
├── .env.example         # Database configuration template
├── requirements.txt     # Python dependencies
├── run.sh               # One-click execution script
└── README.md            # Documentation and Ubuntu setup guide
```

---

## Ubuntu / Linux Setup Instructions

### 1. Prerequisites

Ensure Python 3 and MySQL server are installed:

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip mysql-server
```

### 2. Set Up MySQL Database

Log in to MySQL and create the database and user:

```bash
sudo mysql
```

Run the following SQL commands inside the MySQL shell:

```sql
CREATE DATABASE IF NOT EXISTS udhaar_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'udhaar_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON udhaar_ai.* TO 'udhaar_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Verify connection:
```bash
mysql -u udhaar_user -p udhaar_ai
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and configure your MySQL credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=udhaar_ai
DB_USER=udhaar_user
DB_PASSWORD=your_secure_password

SECRET_KEY=udhaar_ai_production_secret_key_2026
```

*(Note: If MySQL is not running or credentials are not supplied, UdhaarAI will automatically use the local SQLite fallback database in `instance/udhaar_ai.sqlite` so you can test immediately.)*

---

## Running the Application

### Option A: Using `run.sh` (Recommended)

```bash
chmod +x run.sh
./run.sh
```

### Option B: Manual Startup

```bash
# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start Flask server
python backend/app.py
```

Open your browser and visit:
```
http://127.0.0.1:5000
```

---

## Running Automated Tests

Run the full test suite verifying REST endpoints, balance calculations, voice parsing, and database transactions:

```bash
source .venv/bin/activate
python -m unittest backend/test_app.py
```

---

## Key Features

1. **Dashboard:** Real-time metrics for total Udhari, received today, given today, pending customers, recent ledger feed, and quick shortcuts.
2. **Customer Management:** Full CRUD, search, filter (Outstanding, Overdue, Paid), and customer ledger drawers.
3. **Credit Ledger (Udhari):** Real-time ledger entries, balance calculation, and automatic overdue status detection.
4. **Payments:** Payment recording (Cash, UPI, Bank Transfer) with instant pre-formatted WhatsApp payment receipts.
5. **Itemized Billing:** Create bills with dynamic product picker, line item calculation, tax/discount calculation, and print-ready invoices (`window.print()`).
6. **Reminders:** Schedule payment due dates, filter by status, and launch 1-click WhatsApp payment reminders with custom pre-filled text.
7. **Reports & Analytics:** Interactive time-period filters (Today, Week, Month, Year), trend bar charts, customer account breakdown donut, and top debtor rankings.
8. **Data-Aware AI Assistant:** Ask conversational questions in English or Hinglish about shop balances, top debtors, today's sales, or customer history.
9. **Voice Assistant with Web Speech API:**
   - Real-time multilingual voice transcription (Hindi, Marathi, English, Hinglish).
   - Entity extraction (Customer, Amount, Action, Item, Quantity, Unit, Price).
   - **Interactive Inline Editing:** Click "Edit" to modify customer name, amount, or action directly before confirming.
   - Financial entry is saved to MySQL only upon explicit confirmation.
10. **Multi-Language UI (i18n):** Switch between English, Hindi (हिंदी), and Marathi (मराठी) with persistent `localStorage` settings.
11. **Global Search:** Instant lookup across customers, bills, transactions, and product catalog.
