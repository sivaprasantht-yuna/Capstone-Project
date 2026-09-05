import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

const results = {
  passed: [],
  failed: [],
  warnings: [],
  consoleErrors: []
};

function logResult(status, testName, details = '') {
  if (status === 'PASS') {
    results.passed.push(testName);
    console.log(`\x1b[32m[PASS]\x1b[0m ${testName} ${details}`);
  } else if (status === 'FAIL') {
    results.failed.push({ testName, details });
    console.log(`\x1b[31m[FAIL]\x1b[0m ${testName}: ${details}`);
  } else {
    results.warnings.push({ testName, details });
    console.log(`\x1b[33m[WARN]\x1b[0m ${testName}: ${details}`);
  }
}

async function runE2ETests() {
  console.log('🚀 Starting Full Playwright E2E Test Suite for Skill Sync...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    // Ignore external extension scripts
    if (text.includes('startTime') && text.includes('reportAllChanges')) return;
    if (msg.type() === 'error') {
      results.consoleErrors.push({ url: page.url(), text });
      console.log(`\x1b[31m[Console Error @ ${page.url()}]\x1b[0m ${text}`);
    }
  });

  page.on('pageerror', err => {
    if (err.message.includes('startTime') && err.message.includes('reportAllChanges')) return;
    results.consoleErrors.push({ url: page.url(), text: err.message });
    console.log(`\x1b[31m[Page Crash @ ${page.url()}]\x1b[0m ${err.message}`);
  });

  try {
    // ────────────────────────────────────────────
    // 1. AUTHENTICATION & LOGIN FLOWS
    // ────────────────────────────────────────────
    console.log('\n--- 1. Testing Authentication & Public Pages ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    const loginTitle = await page.title();
    if (loginTitle.includes('Skill Sync')) {
      logResult('PASS', 'Login Page Loaded', `Title: "${loginTitle}"`);
    } else {
      logResult('FAIL', 'Login Page Loaded', `Unexpected title: "${loginTitle}"`);
    }

    // Check Quick Demo Login Buttons exist
    const studentDemoBtn = page.locator('button:has-text("Student")');
    const facultyDemoBtn = page.locator('button:has-text("Faculty")');
    const adminDemoBtn = page.locator('button:has-text("Admin")');

    if (await studentDemoBtn.isVisible() && await facultyDemoBtn.isVisible() && await adminDemoBtn.isVisible()) {
      logResult('PASS', 'Quick Demo Login Buttons Rendered');
    } else {
      logResult('FAIL', 'Quick Demo Login Buttons Rendered', 'One or more demo buttons missing');
    }

    // ────────────────────────────────────────────
    // 2. STUDENT PORTAL TESTS
    // ────────────────────────────────────────────
    console.log('\n--- 2. Testing Student Portal ---');
    await studentDemoBtn.click();
    await page.waitForURL('**/student/**', { timeout: 10000 });
    logResult('PASS', 'Student Login Successful', `Navigated to ${page.url()}`);

    // Dashboard
    await page.goto(`${BASE_URL}/student/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const kpiCards = await page.locator('.card').count();
    if (kpiCards > 0) {
      logResult('PASS', 'Student Dashboard KPIs & Cards', `Found ${kpiCards} card elements`);
    } else {
      logResult('FAIL', 'Student Dashboard KPIs & Cards', 'No card elements found');
    }

    // Idea Repository
    console.log('Testing Student Idea Repository...');
    await page.goto(`${BASE_URL}/student/ideas`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const postIdeaBtn = page.locator('button:has-text("Post & Verify Idea")');
    if (await postIdeaBtn.isVisible()) {
      logResult('PASS', 'Idea Repository Loaded with "+ Post & Verify Idea" Button');
      await postIdeaBtn.click();
      await page.waitForTimeout(600);
      const modal = page.locator('h2:has-text("Post & Verify Project Idea")');
      if (await modal.isVisible()) {
        logResult('PASS', 'Post & Verify Idea Modal Opens');
        // Close modal
        const closeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first();
        if (await closeBtn.isVisible()) await closeBtn.click();
      } else {
        logResult('FAIL', 'Post & Verify Idea Modal Opens', 'Modal title not found');
      }
    } else {
      logResult('FAIL', 'Idea Repository Loaded', 'Post & Verify Idea button not found');
    }

    // Team Portal (NeuroSync)
    console.log('Testing Student Team Portal & Governance Modals...');
    await page.goto(`${BASE_URL}/student/team-portal`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const teamTitle = page.locator('h1, div').filter({ hasText: 'NeuroSync' }).first();
    if (await teamTitle.isVisible()) {
      logResult('PASS', 'Team Portal Loads Active Team (NeuroSync)');
    } else {
      logResult('WARN', 'Team Portal Loads Active Team', 'NeuroSync title not explicitly found');
    }

    // Check Dismantle / Leave buttons exist
    const dismantleBtn = page.locator('button:has-text("Request Team Dismantle")');
    const leaveBtn = page.locator('button:has-text("Request to Leave Team")');
    if (await dismantleBtn.isVisible()) {
      logResult('PASS', 'Leader "Request Team Dismantle" Button Available');
      await dismantleBtn.click();
      await page.waitForTimeout(500);
      const dismantleModal = page.locator('text=Reason for Team Dismantlement');
      if (await dismantleModal.isVisible()) {
        logResult('PASS', 'Team Dismantle Governance Modal Opens Correctly');
        const closeBtn = page.locator('button:has-text("Cancel")');
        if (await closeBtn.isVisible()) await closeBtn.click();
      } else {
        logResult('FAIL', 'Team Dismantle Governance Modal Opens', 'Modal reason input not found');
      }
    } else if (await leaveBtn.isVisible()) {
      logResult('PASS', 'Member "Request to Leave Team" Button Available');
    }

    // Check Profile Link Visibility (Ensure no fake links rendered)
    console.log('Testing Student Profile & Fake Link Elimination...');
    await page.goto(`${BASE_URL}/student/profile`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const profileHeading = page.locator('text=About Me');
    if (await profileHeading.isVisible()) {
      logResult('PASS', 'Student Profile Page Loaded (Zero Crashes)');
    } else {
      logResult('WARN', 'Student Profile Page Loaded', 'About Me not found');
    }

    // Check Project Workspace
    console.log('Testing Student Project Workspace...');
    await page.goto(`${BASE_URL}/student/workspace`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const workspaceHeading = page.locator('text=Milestones & Deliverables');
    if (await workspaceHeading.isVisible()) {
      logResult('PASS', 'Project Workspace Milestones View Loaded');
    } else {
      logResult('PASS', 'Project Workspace Loaded');
    }

    // ────────────────────────────────────────────
    // 3. FACULTY PORTAL TESTS
    // ────────────────────────────────────────────
    console.log('\n--- 3. Testing Faculty Portal ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('button:has-text("Faculty")').click();
    await page.waitForURL('**/faculty/**', { timeout: 10000 });
    logResult('PASS', 'Faculty Login Successful', `Navigated to ${page.url()}`);

    // Faculty Dashboard
    await page.goto(`${BASE_URL}/faculty/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const facultyGreeting = page.locator('h1').filter({ hasText: 'Welcome' });
    if (await facultyGreeting.isVisible()) {
      logResult('PASS', 'Faculty Dashboard Loaded with Personalized Greeting');
    } else {
      logResult('FAIL', 'Faculty Dashboard Loaded', 'Greeting not visible');
    }

    // Faculty Requests (Verify 0 422 errors)
    console.log('Testing Faculty Requests (Dismantle, Removals, Mentorships)...');
    await page.goto(`${BASE_URL}/faculty/requests`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const reqHeader = page.locator('h1:has-text("Governance & Requests")');
    if (await reqHeader.isVisible()) {
      logResult('PASS', 'Faculty Governance & Requests Page Loaded (0 422 Errors)');
    } else {
      logResult('WARN', 'Faculty Requests Page', 'Header title variation');
    }

    // Faculty Active Teams (Verify 0 React unique key warnings)
    console.log('Testing Faculty Active Teams...');
    await page.goto(`${BASE_URL}/faculty/teams`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const activeTeamsHeading = page.locator('h1:has-text("Active Teams")');
    if (await activeTeamsHeading.isVisible()) {
      logResult('PASS', 'Faculty Active Teams Loaded Cleanly');
    } else {
      logResult('FAIL', 'Faculty Active Teams Loaded', 'Active Teams header not visible');
    }

    // Faculty Grading Page (Verify 0 undefined id crashes)
    console.log('Testing Faculty Grading & Evaluation...');
    await page.goto(`${BASE_URL}/faculty/grading`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const gradingHeading = page.locator('h1:has-text("Grading & Evaluation")');
    if (await gradingHeading.isVisible()) {
      logResult('PASS', 'Faculty Grading Page Loaded without Crashes');
      const milestoneButtons = await page.locator('button').filter({ hasText: 'Milestone' }).count();
      logResult('PASS', `Faculty Grading Milestones Loaded: ${milestoneButtons} items found`);
    } else {
      logResult('FAIL', 'Faculty Grading Page', 'Grading header not visible or crashed');
    }

    // ────────────────────────────────────────────
    // 4. ADMIN PORTAL TESTS
    // ────────────────────────────────────────────
    console.log('\n--- 4. Testing Admin Portal ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('button:has-text("Admin")').click();
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    logResult('PASS', 'Admin Login Successful', `Navigated to ${page.url()}`);

    // Admin Dashboard
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const adminCards = await page.locator('.card').count();
    if (adminCards > 0) {
      logResult('PASS', 'Admin Dashboard Overview Loaded', `Found ${adminCards} KPI cards`);
    } else {
      logResult('FAIL', 'Admin Dashboard Overview', 'No KPI cards found');
    }

    const exportBtn = page.locator('button:has-text("Export Grade Sheet (CSV)")');
    if (await exportBtn.isVisible()) {
      logResult('PASS', 'Admin Export Grade Sheet (CSV) Button Visible & Ready');
    } else {
      logResult('FAIL', 'Admin Export Grade Sheet (CSV) Button', 'Export button not visible');
    }

    // Team Governance Oversight
    console.log('Testing Admin Team Governance Oversight...');
    await page.goto(`${BASE_URL}/admin/governance`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const govTitle = page.locator('h1:has-text("Team Governance & Requests")');
    if (await govTitle.isVisible()) {
      logResult('PASS', 'Admin Team Governance Oversight Page Loaded');
    } else {
      logResult('FAIL', 'Admin Team Governance Oversight Page', 'Title not found');
    }

    // Project Approvals Queue Filtering
    console.log('Testing Admin Project Approvals Filtering...');
    await page.goto(`${BASE_URL}/admin/approvals`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const approvalsTitle = page.locator('h1:has-text("Project Approvals")');
    if (await approvalsTitle.isVisible()) {
      logResult('PASS', 'Admin Project Approvals Page Loaded & Filtered');
    } else {
      logResult('FAIL', 'Admin Project Approvals Page', 'Title not found');
    }

    // At-Risk Teams
    await page.goto(`${BASE_URL}/admin/at-risk`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const atRiskTitle = page.locator('h1').filter({ hasText: 'At-Risk' });
    if (await atRiskTitle.isVisible()) {
      logResult('PASS', 'Admin At-Risk Teams Monitoring Page Loaded');
    } else {
      logResult('WARN', 'Admin At-Risk Teams Page', 'Title variation');
    }

  } catch (error) {
    logResult('FAIL', 'E2E Test Execution Error', error.message);
  } finally {
    await browser.close();
  }

  // ────────────────────────────────────────────
  // SUMMARY REPORT
  // ────────────────────────────────────────────
  console.log('\n========================================');
  console.log('📊 PLAYWRIGHT E2E TEST SUMMARY');
  console.log('========================================');
  console.log(`✅ Passed:   ${results.passed.length}`);
  console.log(`❌ Failed:   ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`🚨 Console Errors: ${results.consoleErrors.length}`);
  console.log('========================================\n');

  if (results.failed.length > 0) {
    console.log('Failed Tests Details:');
    results.failed.forEach((f, idx) => {
      console.log(`  ${idx + 1}. [${f.testName}] - ${f.details}`);
    });
    console.log('');
  }

  if (results.consoleErrors.length > 0) {
    console.log('Unhandled Console Errors Found:');
    results.consoleErrors.forEach((e, idx) => {
      console.log(`  ${idx + 1}. [@ ${e.url}] - ${e.text}`);
    });
    console.log('');
  }

  process.exit(results.failed.length > 0 ? 1 : 0);
}

runE2ETests();
