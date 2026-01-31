/**
 * Test Results Tracker
 * Tracks all test results for comprehensive reporting
 */

export interface TestResult {
  phase: string;
  scenario: string;
  step: string;
  status: 'pass' | 'fail' | 'skip' | 'pending';
  duration: number;
  details?: string;
  screenshot?: string;
  error?: string;
}

export interface ButtonTest {
  name: string;
  selector: string;
  found: boolean;
  visible: boolean;
  enabled: boolean;
  clicked: boolean;
  response?: string;
}

export interface ValidationResult {
  level: 'transaction' | 'integration' | 'financial' | 'reporting' | 'compliance';
  check: string;
  passed: boolean;
  expected?: string;
  actual?: string;
}

class TestTracker {
  private results: TestResult[] = [];
  private buttons: ButtonTest[] = [];
  private validations: ValidationResult[] = [];
  private startTime: number = Date.now();
  
  // Add a test result
  addResult(result: Omit<TestResult, 'duration'>): void {
    this.results.push({
      ...result,
      duration: Date.now() - this.startTime,
    });
  }
  
  // Add button test result
  addButtonTest(button: ButtonTest): void {
    this.buttons.push(button);
  }
  
  // Add validation result
  addValidation(validation: ValidationResult): void {
    this.validations.push(validation);
  }
  
  // Get summary statistics
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    buttonsTested: number;
    buttonsWorking: number;
    validationsPassed: number;
    validationsFailed: number;
  } {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;
    const buttonsWorking = this.buttons.filter(b => b.clicked).length;
    const validationsPassed = this.validations.filter(v => v.passed).length;
    
    return {
      total: this.results.length,
      passed,
      failed,
      skipped,
      duration: Date.now() - this.startTime,
      buttonsTested: this.buttons.length,
      buttonsWorking,
      validationsPassed,
      validationsFailed: this.validations.length - validationsPassed,
    };
  }
  
  // Get results by phase
  getResultsByPhase(phase: string): TestResult[] {
    return this.results.filter(r => r.phase === phase);
  }
  
  // Get failed tests
  getFailedTests(): TestResult[] {
    return this.results.filter(r => r.status === 'fail');
  }
  
  // Get button test results
  getButtonResults(): { working: ButtonTest[]; broken: ButtonTest[] } {
    return {
      working: this.buttons.filter(b => b.clicked),
      broken: this.buttons.filter(b => !b.clicked && b.found),
    };
  }
  
  // Get validation results by level
  getValidationsByLevel(level: ValidationResult['level']): ValidationResult[] {
    return this.validations.filter(v => v.level === level);
  }
  
  // Generate comprehensive report
  generateReport(): string {
    const summary = this.getSummary();
    const buttonResults = this.getButtonResults();
    const failedTests = this.getFailedTests();
    
    let report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    COMPREHENSIVE ERP SYSTEM TEST REPORT                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Generated: ${new Date().toISOString()}
║  Duration: ${Math.round(summary.duration / 1000)}s
╚══════════════════════════════════════════════════════════════════════════════╝

📊 OVERALL SUMMARY
${'─'.repeat(78)}
  Total Tests:     ${summary.total}
  ✅ Passed:       ${summary.passed}
  ❌ Failed:       ${summary.failed}
  ⏭️  Skipped:      ${summary.skipped}
  
  Pass Rate:       ${summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0}%

🔘 BUTTON TESTING
${'─'.repeat(78)}
  Buttons Tested:  ${summary.buttonsTested}
  Working:         ${summary.buttonsWorking}
  Broken:          ${buttonResults.broken.length}
  
  Button Status:   ${summary.buttonsTested > 0 ? Math.round((summary.buttonsWorking / summary.buttonsTested) * 100) : 0}% operational

✓ VALIDATION MATRIX
${'─'.repeat(78)}
  Total Checks:    ${this.validations.length}
  Passed:          ${summary.validationsPassed}
  Failed:          ${summary.validationsFailed}
`;

    // Add failed tests details
    if (failedTests.length > 0) {
      report += `
❌ FAILED TESTS DETAILS
${'─'.repeat(78)}
`;
      failedTests.forEach((test, i) => {
        report += `  ${i + 1}. [${test.phase}] ${test.scenario} - ${test.step}
     Error: ${test.error || 'Unknown error'}
     Details: ${test.details || 'N/A'}
`;
      });
    }

    // Add broken buttons details
    if (buttonResults.broken.length > 0) {
      report += `
🔴 BROKEN BUTTONS
${'─'.repeat(78)}
`;
      buttonResults.broken.forEach((btn, i) => {
        report += `  ${i + 1}. ${btn.name}
     Selector: ${btn.selector}
     Visible: ${btn.visible}, Enabled: ${btn.enabled}
`;
      });
    }

    // Add validation failures
    const failedValidations = this.validations.filter(v => !v.passed);
    if (failedValidations.length > 0) {
      report += `
⚠️ VALIDATION FAILURES
${'─'.repeat(78)}
`;
      failedValidations.forEach((v, i) => {
        report += `  ${i + 1}. [${v.level.toUpperCase()}] ${v.check}
     Expected: ${v.expected || 'N/A'}
     Actual: ${v.actual || 'N/A'}
`;
      });
    }

    // Results by phase
    const phases = [...new Set(this.results.map(r => r.phase))];
    report += `
📋 RESULTS BY PHASE
${'─'.repeat(78)}
`;
    phases.forEach(phase => {
      const phaseResults = this.getResultsByPhase(phase);
      const phasePassed = phaseResults.filter(r => r.status === 'pass').length;
      const phaseFailed = phaseResults.filter(r => r.status === 'fail').length;
      report += `  ${phase}: ${phasePassed}/${phaseResults.length} passed${phaseFailed > 0 ? ` (${phaseFailed} failed)` : ''}
`;
    });

    report += `
${'═'.repeat(78)}
                              END OF REPORT
${'═'.repeat(78)}
`;

    return report;
  }
  
  // Reset tracker for new test run
  reset(): void {
    this.results = [];
    this.buttons = [];
    this.validations = [];
    this.startTime = Date.now();
  }
}

// Singleton instance
export const tracker = new TestTracker();

export default tracker;
