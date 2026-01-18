# JTAF - Jumper Test Automation Framework

This repository contains a unified testing framework for **Jumper.exchange** and the **LI.FI API**. It leverages a "Quality Pyramid" approach, combining functional UI tests, robust API validation, and high-concurrency performance testing.

---

## 🏗 Project Architecture

The project is structured to separate concerns while sharing global configuration like base URLs and chain IDs.

```text
├── .github/workflows/    # CI/CD: Automated UI, API, and k6 runs
├── pages/                # UI Page Object Models (Locators & Actions)
├── utils/                # Shared helpers, Constant, Schemas
├── tests/
│   ├── ui/               # Playwright UI E2E tests
│   ├── api/              # Playwright API functional tests
│   └── performance/      # k6 Performance/Load scripts (.ts)
├── playwright.config.ts  # Playwright multi-project configuration
└── package.json          # Dependencies and script shortcuts
```

## 🛠 Setup & Installation
1. Prerequisites
  Node.js: v18+ (LTS recommended)
  k6: Install k6 locally to run performance scripts.

2. Install Dependencies
#### Install Node modules
`npm install`

#### Install Playwright browser binaries
`npx playwright install --with-deps`

## 🚀 Execution Guide
1. Functional UI Testing (Playwright)
Validates the user interface and end-to-end swap flows.

#### Run all UI tests (Headless)
`npx playwright test --project=ui`

#### Run UI tests in Headless mode with a browser open
`npx playwright test --project=ui --headed`

2. Functional API Testing (Playwright)
Validates the LI.FI API response logic, status codes, and data integrity.

#### Run all API tests
`npx playwright test --project=api`

#### Run a specific API test file
`npx playwright test tests/api/quote.spec.ts`

3. Performance Testing (k6)
Simulates parallel swap requests to check for rate limits and system stability.

#### Run the performance script
`k6 run tests/performance/quote.perf.ts`

## 🔧 Configuration Details

Base URL Invocation
The framework uses Playwright's Project-based configuration. Depending on which project you run, the baseURL is automatically swapped:

UI Project: Targets https://jumper.exchange

API Project: Targets https://li.quest/v1


## 🤖 CI/CD Workflow
The .github/workflows/tests.yml is configured to:

Trigger: Runs on every push or pull_request to main.

Step 1: Execute Playwright UI and API tests.

Step 2: Execute k6 Performance tests (only if Step 1 passes).

Artifacts: Uploads Playwright HTML reports and k6 logs for review.

## 📊 Reporting
JTAF provides two types of reporting to balance speed and depth of insight.

1. Playwright Built-in HTML Report
  - Generate/Open: `npx playwright show-report`
  - Artifacts: Results are stored in the playwright-report/ directory

2. Allure Advanced Reporting  
  - Pre-requisites: `npm install -D allure-playwright allure-commandline`
  - Generate & View: Run tests: `npx playwright test`
  - Artifacts: Results are stored in the allure-results/ directory.
  - Open report: `allure serve allure-results`
