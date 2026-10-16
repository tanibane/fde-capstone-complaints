# Clearview Complaints Management — Setup Guide
# Follow these steps IN ORDER. Do not skip any step.
# =====================================================

# ─────────────────────────────────────────────────────
# STEP 1 — Install Node.js
# ─────────────────────────────────────────────────────
# 1. Open this URL in your browser:
#    https://nodejs.org/en/download
#
# 2. Download: Windows Installer (.msi) — LTS version (20.x)
#
# 3. Run the installer → click Next through all defaults
#
# 4. CLOSE PowerShell and REOPEN it, then run:

node --version
# Expected output: v20.x.x

npm --version
# Expected output: 10.x.x

# ─────────────────────────────────────────────────────
# STEP 2 — Install Docker Desktop
# ─────────────────────────────────────────────────────
# 1. Open this URL in your browser:
#    https://www.docker.com/products/docker-desktop/
#
# 2. Download: Docker Desktop for Windows
#
# 3. Run the installer — if asked to enable WSL2, click YES
#
# 4. RESTART your computer
#
# 5. After restart, open Docker Desktop from Start Menu
#    Wait until you see "Engine running" (green icon)
#
# 6. Verify in PowerShell:

docker --version
# Expected output: Docker version 24.x.x

docker compose version
# Expected output: Docker Compose version v2.x.x

# ─────────────────────────────────────────────────────
# STEP 3 — Set up the .env file
# ─────────────────────────────────────────────────────

cd C:\dump\github_6thMar2024\fde-capstone-complaints

# Copy the example env file
Copy-Item .env.example .env

# Append your Anthropic keys from the launch .env
Get-Content "C:\dump\github_6thMar2024\projectHealthDashboardPRIModel\models\lib\pri\pri\launch\.env" | Add-Content .env

# Verify it looks correct — you should see all 5 lines
Get-Content .env

# Expected output:
# DATABASE_URL=postgresql://clearview:clearview_dev@localhost:5432/complaints
# ANTHROPIC_BASE_URL=https://...
# ANTHROPIC_AUTH_TOKEN=...
# PORT=3001
# NEXT_PUBLIC_API_URL=http://localhost:3001

# ─────────────────────────────────────────────────────
# STEP 4 — Install Python dependencies
# ─────────────────────────────────────────────────────

pip install anthropic

# Expected output: Successfully installed anthropic-x.x.x

# ─────────────────────────────────────────────────────
# STEP 5 — Install Node.js dependencies
# (Only after Step 1 is complete)
# ─────────────────────────────────────────────────────

cd C:\dump\github_6thMar2024\fde-capstone-complaints\backend
npm init -y
npm install express cors pg uuid

cd C:\dump\github_6thMar2024\fde-capstone-complaints\mcp-tools
npm init -y
npm install @modelcontextprotocol/sdk zod pg

cd C:\dump\github_6thMar2024\fde-capstone-complaints\frontend
npm install

cd C:\dump\github_6thMar2024\fde-capstone-complaints

# ─────────────────────────────────────────────────────
# STEP 6 — Start the database
# (Docker Desktop must be running first)
# ─────────────────────────────────────────────────────

cd C:\dump\github_6thMar2024\fde-capstone-complaints

docker compose up postgres -d

# Wait 10 seconds, then check it is healthy:
docker compose ps

# Expected output: clearview_postgres   running (healthy)

# ─────────────────────────────────────────────────────
# STEP 7 — Start the backend API
# Open a NEW PowerShell window for this step
# ─────────────────────────────────────────────────────

cd C:\dump\github_6thMar2024\fde-capstone-complaints\backend

# Compile TypeScript to JavaScript
npx tsc server.ts --esModuleInterop --target ES2020 --module CommonJS --outDir dist

# Start the API server
node dist/server.js

# Expected output: ✅ Clearview API server running on port 3001
# KEEP THIS WINDOW OPEN — do not close it

# ─────────────────────────────────────────────────────
# STEP 8 — Test the API works
# Open a NEW PowerShell window for this step
# ─────────────────────────────────────────────────────

Invoke-RestMethod -Uri http://localhost:3001/dashboard/kpis

# Expected output:
# active_cases      : 300
# in_flight         : 0
# p1_breach_risk    : 0
# avg_redress_payout: 0.00
# stp_rate          : 0%

# ─────────────────────────────────────────────────────
# STEP 9 — Run your first complaint through the pipeline
# Use the same PowerShell window as Step 8
# ─────────────────────────────────────────────────────

# Get a complaint ID
$response = Invoke-RestMethod -Uri "http://localhost:3001/complaints?status=intake&limit=1"
$id = $response.complaints[0].complaint_id
Write-Host "Complaint ID: $id"

# Run the 4-agent pipeline on it
Invoke-RestMethod -Uri "http://localhost:3001/pipeline/run/$id" -Method POST

# Watch the backend window (Step 7) — you will see:
# [orchestrator] Starting pipeline for complaint ...
# [orchestrator] Stage 1: Triage
# [orchestrator] Stage 2: Evidence gathering
# [orchestrator] Stage 3: Policy assessment
# [orchestrator] Stage 4: Draft resolution letter
# [orchestrator] Pipeline complete. Status: hitl_required

# ─────────────────────────────────────────────────────
# STEP 10 — Start the frontend (Monitoring Workbench)
# Open a NEW PowerShell window for this step
# ─────────────────────────────────────────────────────

cd C:\dump\github_6thMar2024\fde-capstone-complaints\frontend

npm run dev

# Expected output:
# ▲ Next.js 15.x.x
# - Local: http://localhost:3000
# KEEP THIS WINDOW OPEN — do not close it

# Now open your browser and go to:
# http://localhost:3000/dashboard   ← Live KPI Dashboard
# http://localhost:3000/complaints  ← All 300 complaints
# http://localhost:3000/review/<id> ← HITL Review Panel

# ─────────────────────────────────────────────────────
# SUMMARY — What should be running at the end
# ─────────────────────────────────────────────────────
#
# Window 1 (Docker):    postgres container  → port 5432
# Window 2 (Backend):   node dist/server.js → port 3001
# Window 3 (Frontend):  npm run dev         → port 3000
#
# Browser URLs:
#   Dashboard  → http://localhost:3000/dashboard
#   Complaints → http://localhost:3000/complaints
#   HITL Panel → http://localhost:3000/review/<complaint_id>
#   API direct → http://localhost:3001/dashboard/kpis
#
# ─────────────────────────────────────────────────────
# TROUBLESHOOTING
# ─────────────────────────────────────────────────────
#
# Problem: "node is not recognized"
# Fix: Restart PowerShell after installing Node.js
#
# Problem: "docker is not recognized"
# Fix: Restart computer after installing Docker Desktop
#
# Problem: postgres container not healthy
# Fix: Wait 30 seconds and run: docker compose ps
#
# Problem: "Cannot connect to database"
# Fix: Make sure Docker Desktop is running (green icon in taskbar)
#
# Problem: Pipeline fails with Anthropic error
# Fix: Check your .env has correct ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN
#      Run: Get-Content C:\dump\github_6thMar2024\fde-capstone-complaints\.env
