/**
 * Depreciation Calculation Service
 * Implements 3 depreciation methods: Straight Line, Reducing Balance, Units of Production
 */

import {
  DepreciationMethod,
  DepreciationCalculationParams,
  DepreciationCalculationResult
} from '../models/asset-management.model';

export class DepreciationCalculator {
  /**
   * Calculate depreciation for a given period using the specified method
   */
  static calculateDepreciation(
    method: DepreciationMethod,
    params: DepreciationCalculationParams
  ): DepreciationCalculationResult {
    switch (method) {
      case DepreciationMethod.STRAIGHT_LINE:
        return this.calculateStraightLine(params);
      
      case DepreciationMethod.REDUCING_BALANCE:
        return this.calculateReducingBalance(params);
      
      case DepreciationMethod.UNITS_OF_PRODUCTION:
        return this.calculateUnitsOfProduction(params);
      
      default:
        throw new Error(`Unknown depreciation method: ${method}`);
    }
  }

  /**
   * Straight Line Depreciation
   * Formula: (Cost - Residual Value) / Useful Life
   * Equal depreciation each period
   */
  private static calculateStraightLine(
    params: DepreciationCalculationParams
  ): DepreciationCalculationResult {
    const { acquisition_cost, residual_value, useful_life_years, accumulated_depreciation } = params;

    if (!useful_life_years || useful_life_years <= 0) {
      throw new Error('Useful life in years is required for straight-line depreciation');
    }

    // Calculate annual depreciation
    const depreciable_amount = acquisition_cost - residual_value;
    const annual_depreciation = depreciable_amount / useful_life_years;
    
    // Monthly depreciation (divide by 12)
    const monthly_depreciation = annual_depreciation / 12;

    // Ensure we don't exceed depreciable amount
    const remaining_depreciable = depreciable_amount - accumulated_depreciation;
    const depreciation_amount = Math.min(monthly_depreciation, remaining_depreciable);

    // Calculate new accumulated depreciation
    const new_accumulated = accumulated_depreciation + depreciation_amount;
    const closing_book_value = acquisition_cost - new_accumulated;

    return {
      depreciation_amount: Math.round(depreciation_amount * 100) / 100,
      accumulated_depreciation: Math.round(new_accumulated * 100) / 100,
      closing_book_value: Math.round(closing_book_value * 100) / 100
    };
  }

  /**
   * Reducing Balance (Declining Balance) Depreciation
   * Formula: Book Value × Depreciation Rate
   * Accelerated depreciation - more in early years
   */
  private static calculateReducingBalance(
    params: DepreciationCalculationParams
  ): DepreciationCalculationResult {
    const {
      acquisition_cost,
      residual_value,
      depreciation_rate,
      accumulated_depreciation,
      current_book_value
    } = params;

    if (!depreciation_rate || depreciation_rate <= 0) {
      throw new Error('Depreciation rate is required for reducing balance method');
    }

    // Calculate monthly depreciation rate
    const annual_rate = depreciation_rate / 100; // Convert percentage to decimal
    const monthly_rate = annual_rate / 12;

    // Apply rate to current book value
    const monthly_depreciation = current_book_value * monthly_rate;

    // Ensure book value doesn't fall below residual value
    const minimum_book_value = residual_value;
    const maximum_depreciation = current_book_value - minimum_book_value;
    const depreciation_amount = Math.min(monthly_depreciation, maximum_depreciation);

    // Calculate new values
    const new_accumulated = accumulated_depreciation + depreciation_amount;
    const closing_book_value = acquisition_cost - new_accumulated;

    return {
      depreciation_amount: Math.round(depreciation_amount * 100) / 100,
      accumulated_depreciation: Math.round(new_accumulated * 100) / 100,
      closing_book_value: Math.round(closing_book_value * 100) / 100
    };
  }

  /**
   * Units of Production Depreciation
   * Formula: (Cost - Residual) × (Units This Period / Total Expected Units)
   * Depreciation based on usage
   */
  private static calculateUnitsOfProduction(
    params: DepreciationCalculationParams
  ): DepreciationCalculationResult {
    const {
      acquisition_cost,
      residual_value,
      useful_life_units,
      units_produced_in_period,
      accumulated_depreciation
    } = params;

    if (!useful_life_units || useful_life_units <= 0) {
      throw new Error('Useful life in units is required for units of production method');
    }

    if (units_produced_in_period === undefined || units_produced_in_period < 0) {
      throw new Error('Units produced in period is required for units of production method');
    }

    // Calculate depreciation per unit
    const depreciable_amount = acquisition_cost - residual_value;
    const depreciation_per_unit = depreciable_amount / useful_life_units;

    // Calculate depreciation for this period
    const monthly_depreciation = depreciation_per_unit * units_produced_in_period;

    // Ensure we don't exceed depreciable amount
    const remaining_depreciable = depreciable_amount - accumulated_depreciation;
    const depreciation_amount = Math.min(monthly_depreciation, remaining_depreciable);

    // Calculate new values
    const new_accumulated = accumulated_depreciation + depreciation_amount;
    const closing_book_value = acquisition_cost - new_accumulated;

    return {
      depreciation_amount: Math.round(depreciation_amount * 100) / 100,
      accumulated_depreciation: Math.round(new_accumulated * 100) / 100,
      closing_book_value: Math.round(closing_book_value * 100) / 100
    };
  }

  /**
   * Generate depreciation schedule for entire life of asset
   * Returns array of monthly depreciation entries
   */
  static generateFullSchedule(
    method: DepreciationMethod,
    acquisition_cost: number,
    residual_value: number,
    useful_life_years: number,
    depreciation_rate?: number,
    useful_life_units?: number
  ): Array<{
    period_number: number;
    opening_balance: number;
    depreciation: number;
    accumulated_depreciation: number;
    closing_balance: number;
  }> {
    const schedule: Array<any> = [];
    let accumulated = 0;
    let book_value = acquisition_cost;

    const total_periods = useful_life_years * 12; // Monthly schedule

    for (let period = 1; period <= total_periods; period++) {
      const result = this.calculateDepreciation(method, {
        acquisition_cost,
        residual_value,
        useful_life_years,
        useful_life_units,
        depreciation_rate,
        accumulated_depreciation: accumulated,
        current_book_value: book_value,
        period_year: Math.floor((period - 1) / 12) + 1,
        period_month: ((period - 1) % 12) + 1,
        units_produced_in_period: method === DepreciationMethod.UNITS_OF_PRODUCTION 
          ? (useful_life_units || 0) / total_periods 
          : undefined
      });

      schedule.push({
        period_number: period,
        opening_balance: book_value,
        depreciation: result.depreciation_amount,
        accumulated_depreciation: result.accumulated_depreciation,
        closing_balance: result.closing_book_value
      });

      accumulated = result.accumulated_depreciation;
      book_value = result.closing_book_value;

      // Stop if fully depreciated
      if (book_value <= residual_value) {
        break;
      }
    }

    return schedule;
  }

  /**
   * Calculate remaining useful life based on current depreciation
   */
  static calculateRemainingLife(
    method: DepreciationMethod,
    acquisition_cost: number,
    residual_value: number,
    accumulated_depreciation: number,
    useful_life_years?: number,
    depreciation_rate?: number
  ): number {
    const current_book_value = acquisition_cost - accumulated_depreciation;
    const remaining_depreciable = current_book_value - residual_value;

    if (remaining_depreciable <= 0) {
      return 0; // Fully depreciated
    }

    switch (method) {
      case DepreciationMethod.STRAIGHT_LINE:
        if (!useful_life_years) return 0;
        const depreciable_amount = acquisition_cost - residual_value;
        const annual_depreciation = depreciable_amount / useful_life_years;
        const monthly_depreciation = annual_depreciation / 12;
        return Math.ceil(remaining_depreciable / monthly_depreciation);

      case DepreciationMethod.REDUCING_BALANCE:
        if (!depreciation_rate) return 0;
        const monthly_rate = (depreciation_rate / 100) / 12;
        // Using logarithm to solve: FV = PV × (1 - rate)^n
        const periods = Math.log(residual_value / current_book_value) / Math.log(1 - monthly_rate);
        return Math.ceil(periods);

      default:
        return 0;
    }
  }
}
