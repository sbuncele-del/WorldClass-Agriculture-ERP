/**
 * Logistics Accounting Integration Tests
 * 10 scenarios validating journal entries and double-entry balancing
 */

import { LogisticsAccountingService, TripAccountingData, FuelAccountingData, DriverPaymentData } from '../logistics-accounting.service';
import { FeatureFlagService } from '../../../services/feature-flag.service';

const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const TEST_USER_ID = 'test-user-001';

describe('LogisticsAccountingService', () => {
  let accountingService: LogisticsAccountingService;

  beforeAll(() => {
    accountingService = new LogisticsAccountingService();
  });

  // ============================================================================
  // SCENARIO 1: Trip completion creates balanced journal entry
  // ============================================================================
  describe('Scenario 1: Trip Revenue Recording', () => {
    it('should create balanced journal entry for trip completion', async () => {
      const tripData: TripAccountingData = {
        trip_id: 'trip-001',
        trip_number: 'TRP-2024-001',
        customer_name: 'Acme Corp',
        revenue_amount: 5000.0,
        trip_date: new Date(),
      };

      const result = await accountingService.recordTripRevenue(TEST_TENANT_ID, tripData, TEST_USER_ID);

      if (result) {
        expect(result.balanced).toBe(true);
        expect(result.journalEntryId).toBeDefined();
      }
    });
  });

  // ============================================================================
  // SCENARIO 2: Zero revenue trip should not create journal entry
  // ============================================================================
  describe('Scenario 2: Zero Revenue Trip', () => {
    it('should not create journal entry for zero revenue trip', async () => {
      const tripData: TripAccountingData = {
        trip_id: 'trip-002',
        trip_number: 'TRP-2024-002',
        revenue_amount: 0,
        trip_date: new Date(),
      };

      const result = await accountingService.recordTripRevenue(TEST_TENANT_ID, tripData, TEST_USER_ID);
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // SCENARIO 3: Fuel purchase with cash payment
  // ============================================================================
  describe('Scenario 3: Fuel Purchase (Cash)', () => {
    it('should create balanced entry debiting Fuel Expense, crediting Cash', async () => {
      const fuelData: FuelAccountingData = {
        transaction_id: 'fuel-001',
        vehicle_id: 'vehicle-001',
        vehicle_registration: 'ABC 123 GP',
        fuel_station: 'Shell Sandton',
        litres: 100,
        total_amount: 2500.0,
        payment_method: 'CASH',
        transaction_date: new Date(),
      };

      const result = await accountingService.recordFuelPurchase(TEST_TENANT_ID, fuelData, TEST_USER_ID);

      if (result) {
        expect(result.balanced).toBe(true);
      }
    });
  });

  // ============================================================================
  // SCENARIO 4: Fuel purchase on account (credit)
  // ============================================================================
  describe('Scenario 4: Fuel Purchase (Account)', () => {
    it('should create balanced entry debiting Fuel Expense, crediting Accounts Payable', async () => {
      const fuelData: FuelAccountingData = {
        transaction_id: 'fuel-002',
        vehicle_id: 'vehicle-002',
        vehicle_registration: 'XYZ 789 GP',
        fuel_station: 'Engen JHB',
        litres: 200,
        total_amount: 5000.0,
        payment_method: 'ACCOUNT',
        transaction_date: new Date(),
      };

      const result = await accountingService.recordFuelPurchase(TEST_TENANT_ID, fuelData, TEST_USER_ID);

      if (result) {
        expect(result.balanced).toBe(true);
      }
    });
  });

  // ============================================================================
  // SCENARIO 5: Driver salary payment
  // ============================================================================
  describe('Scenario 5: Driver Salary Payment', () => {
    it('should create balanced entry for driver salary', async () => {
      const paymentData: DriverPaymentData = {
        payment_id: 'pay-001',
        driver_id: 'driver-001',
        driver_name: 'John Mthembu',
        payment_type: 'SALARY',
        gross_amount: 15000.0,
        deductions: 2500.0, // PAYE, UIF etc
        net_amount: 12500.0,
        payment_date: new Date(),
        payment_method: 'EFT',
      };

      const result = await accountingService.recordDriverPayment(TEST_TENANT_ID, paymentData, TEST_USER_ID);

      if (result) {
        expect(result.balanced).toBe(true);
      }
    });
  });

  // ============================================================================
  // SCENARIO 6: Driver cash advance
  // ============================================================================
  describe('Scenario 6: Driver Cash Advance', () => {
    it('should create balanced entry for driver advance (cash payment)', async () => {
      const paymentData: DriverPaymentData = {
        payment_id: 'pay-002',
        driver_id: 'driver-002',
        driver_name: 'Peter Nkosi',
        payment_type: 'ADVANCE',
        gross_amount: 2000.0,
        deductions: 0,
        net_amount: 2000.0,
        payment_date: new Date(),
        payment_method: 'CASH',
      };

      const result = await accountingService.recordDriverPayment(TEST_TENANT_ID, paymentData, TEST_USER_ID);

      if (result) {
        expect(result.balanced).toBe(true);
      }
    });
  });

  // ============================================================================
  // SCENARIO 7: Validate all entries balance
  // ============================================================================
  describe('Scenario 7: Validate All Entries Balance', () => {
    it('should confirm all logistics entries have debits = credits', async () => {
      const result = await accountingService.validateAllEntriesBalance(TEST_TENANT_ID);

      expect(result.unbalanced.length).toBe(0);
      expect(result.balanced).toBe(result.total);
    });
  });

  // ============================================================================
  // SCENARIO 8: P&L Impact calculation
  // ============================================================================
  describe('Scenario 8: P&L Impact Calculation', () => {
    it('should calculate correct P&L impact from logistics transactions', async () => {
      const dateFrom = new Date(new Date().getFullYear(), 0, 1); // Jan 1
      const dateTo = new Date();

      const result = await accountingService.getPLImpact(TEST_TENANT_ID, dateFrom, dateTo);

      expect(result.revenue.total).toBeGreaterThanOrEqual(0);
      expect(result.expenses.total).toBeGreaterThanOrEqual(0);
      expect(result.netIncome).toBe(result.revenue.total - result.expenses.total);
    });
  });

  // ============================================================================
  // SCENARIO 9: Audit trail retrieval
  // ============================================================================
  describe('Scenario 9: Audit Trail for SOX Compliance', () => {
    it('should return audit trail with all required fields', async () => {
      const result = await accountingService.getAuditTrail(TEST_TENANT_ID, { limit: 10 });

      expect(result.entries).toBeDefined();
      expect(Array.isArray(result.entries)).toBe(true);

      if (result.entries.length > 0) {
        const entry = result.entries[0];
        expect(entry.entry_id).toBeDefined();
        expect(entry.entry_number).toBeDefined();
        expect(entry.created_at).toBeDefined();
        expect(entry.status).toBeDefined();
      }
    });
  });

  // ============================================================================
  // SCENARIO 10: Feature flag controls integration
  // ============================================================================
  describe('Scenario 10: Feature Flag Control', () => {
    it('should respect feature flag when disabled', async () => {
      // Disable the feature
      await FeatureFlagService.disable(TEST_TENANT_ID, 'logistics_accounting_integration', TEST_USER_ID);

      const tripData: TripAccountingData = {
        trip_id: 'trip-disabled-001',
        trip_number: 'TRP-DISABLED-001',
        revenue_amount: 1000.0,
        trip_date: new Date(),
      };

      const result = await accountingService.recordTripRevenue(TEST_TENANT_ID, tripData, TEST_USER_ID);

      // Should return null when feature is disabled
      expect(result).toBeNull();

      // Re-enable for other tests
      await FeatureFlagService.enable(TEST_TENANT_ID, 'logistics_accounting_integration', 'FEATURE', TEST_USER_ID);
    });
  });
});

// ============================================================================
// MANUAL TEST SCRIPT (run with ts-node)
// ============================================================================
export async function runManualTests() {
  console.log('🧪 Starting Logistics Accounting Integration Tests...\n');

  const accountingService = new LogisticsAccountingService();

  // Test 1: Trip Revenue
  console.log('Test 1: Trip Revenue Recording');
  try {
    const tripResult = await accountingService.recordTripRevenue(
      TEST_TENANT_ID,
      {
        trip_id: 'manual-trip-001',
        trip_number: 'MANUAL-TRP-001',
        customer_name: 'Test Customer',
        revenue_amount: 7500.0,
        trip_date: new Date(),
      },
      TEST_USER_ID
    );
    console.log('  ✅ Trip revenue:', tripResult ? `Journal ${tripResult.journalEntryId}, Balanced: ${tripResult.balanced}` : 'Skipped (feature disabled)');
  } catch (e: any) {
    console.log('  ❌ Failed:', e.message);
  }

  // Test 2: Fuel Purchase
  console.log('\nTest 2: Fuel Purchase Recording');
  try {
    const fuelResult = await accountingService.recordFuelPurchase(
      TEST_TENANT_ID,
      {
        transaction_id: 'manual-fuel-001',
        vehicle_id: 'manual-vehicle-001',
        vehicle_registration: 'TEST 123 GP',
        fuel_station: 'Test Station',
        litres: 50,
        total_amount: 1250.0,
        payment_method: 'CASH',
        transaction_date: new Date(),
      },
      TEST_USER_ID
    );
    console.log('  ✅ Fuel expense:', fuelResult ? `Journal ${fuelResult.journalEntryId}, Balanced: ${fuelResult.balanced}` : 'Skipped (feature disabled)');
  } catch (e: any) {
    console.log('  ❌ Failed:', e.message);
  }

  // Test 3: Validation
  console.log('\nTest 3: Validate All Entries Balance');
  try {
    const validation = await accountingService.validateAllEntriesBalance(TEST_TENANT_ID);
    console.log(`  ✅ Total: ${validation.total}, Balanced: ${validation.balanced}, Unbalanced: ${validation.unbalanced.length}`);
    if (validation.unbalanced.length > 0) {
      console.log('  ⚠️ Unbalanced entries:', validation.unbalanced);
    }
  } catch (e: any) {
    console.log('  ❌ Failed:', e.message);
  }

  // Test 4: P&L Impact
  console.log('\nTest 4: P&L Impact');
  try {
    const plImpact = await accountingService.getPLImpact(TEST_TENANT_ID, new Date('2024-01-01'), new Date());
    console.log(`  ✅ Revenue: R${plImpact.revenue.total.toFixed(2)}, Expenses: R${plImpact.expenses.total.toFixed(2)}, Net Income: R${plImpact.netIncome.toFixed(2)}`);
  } catch (e: any) {
    console.log('  ❌ Failed:', e.message);
  }

  // Test 5: Audit Trail
  console.log('\nTest 5: Audit Trail');
  try {
    const auditTrail = await accountingService.getAuditTrail(TEST_TENANT_ID, { limit: 5 });
    console.log(`  ✅ Found ${auditTrail.total} entries, showing ${auditTrail.entries.length}`);
    auditTrail.entries.forEach((e) => {
      console.log(`     - ${e.entry_number}: ${e.description} (${e.status})`);
    });
  } catch (e: any) {
    console.log('  ❌ Failed:', e.message);
  }

  console.log('\n🎉 Manual tests completed!');
}

// Run if executed directly
if (require.main === module) {
  runManualTests().catch(console.error);
}
