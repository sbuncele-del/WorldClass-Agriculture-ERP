/**
 * Capital vs Expense Classification Service
 * IAS 16 compliant asset recognition and classification
 */

export interface AssetClassificationParams {
  acquisition_cost: number;
  expected_useful_life_years: number;
  is_tangible: boolean;
  provides_future_benefits: boolean;
  is_controlled_by_entity: boolean;
  cost_is_measurable: boolean;
  maintenance_nature?: 'improvement' | 'repair' | 'replacement';
  enhances_useful_life?: boolean;
  enhances_capacity?: boolean;
}

export interface ClassificationResult {
  should_capitalize: boolean;
  classification: 'capital' | 'expense' | 'requires_review';
  reason: string;
  ias16_paragraph?: string;
  recommended_useful_life?: number;
  recommended_depreciation_method?: string;
}

export interface CapitalizationThresholds {
  minimum_amount: number;
  minimum_useful_life_years: number;
  low_value_asset_threshold: number;
}

const DEFAULT_THRESHOLDS: CapitalizationThresholds = {
  minimum_amount: 5000, // ZAR
  minimum_useful_life_years: 1,
  low_value_asset_threshold: 2500 // ZAR - can expense immediately
};

export class AssetClassificationService {
  private thresholds: CapitalizationThresholds;

  constructor(thresholds: Partial<CapitalizationThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Determine if expenditure should be capitalized as asset or expensed
   * Based on IAS 16.7-8 recognition criteria
   */
  classifyExpenditure(params: AssetClassificationParams): ClassificationResult {
    const {
      acquisition_cost,
      expected_useful_life_years,
      is_tangible,
      provides_future_benefits,
      is_controlled_by_entity,
      cost_is_measurable,
      maintenance_nature,
      enhances_useful_life,
      enhances_capacity
    } = params;

    // IAS 16.7 Recognition criteria check
    if (!provides_future_benefits) {
      return {
        should_capitalize: false,
        classification: 'expense',
        reason: 'Does not provide probable future economic benefits',
        ias16_paragraph: 'IAS 16.7(a)'
      };
    }

    if (!cost_is_measurable) {
      return {
        should_capitalize: false,
        classification: 'expense',
        reason: 'Cost cannot be measured reliably',
        ias16_paragraph: 'IAS 16.7(b)'
      };
    }

    if (!is_controlled_by_entity) {
      return {
        should_capitalize: false,
        classification: 'expense',
        reason: 'Entity does not control the asset',
        ias16_paragraph: 'IAS 16.7'
      };
    }

    // Low value asset check
    if (acquisition_cost < this.thresholds.low_value_asset_threshold) {
      return {
        should_capitalize: false,
        classification: 'expense',
        reason: `Below low-value threshold of R${this.thresholds.low_value_asset_threshold}`,
        ias16_paragraph: 'Entity policy'
      };
    }

    // Minimum useful life check
    if (expected_useful_life_years < this.thresholds.minimum_useful_life_years) {
      return {
        should_capitalize: false,
        classification: 'expense',
        reason: `Useful life less than ${this.thresholds.minimum_useful_life_years} year(s)`,
        ias16_paragraph: 'Entity policy'
      };
    }

    // Minimum amount check
    if (acquisition_cost < this.thresholds.minimum_amount) {
      return {
        should_capitalize: false,
        classification: 'expense',
        reason: `Below capitalization threshold of R${this.thresholds.minimum_amount}`,
        ias16_paragraph: 'Entity policy'
      };
    }

    // Maintenance/repair vs improvement check (IAS 16.12-14)
    if (maintenance_nature) {
      return this.classifyMaintenance(maintenance_nature, enhances_useful_life, enhances_capacity, acquisition_cost);
    }

    // All recognition criteria met
    return {
      should_capitalize: true,
      classification: 'capital',
      reason: 'Meets IAS 16 recognition criteria',
      ias16_paragraph: 'IAS 16.7',
      recommended_useful_life: this.suggestUsefulLife(acquisition_cost, expected_useful_life_years),
      recommended_depreciation_method: this.suggestDepreciationMethod(is_tangible, expected_useful_life_years)
    };
  }

  /**
   * Classify maintenance expenditure (IAS 16.12-14)
   */
  private classifyMaintenance(
    nature: 'improvement' | 'repair' | 'replacement',
    enhances_useful_life?: boolean,
    enhances_capacity?: boolean,
    cost?: number
  ): ClassificationResult {
    if (nature === 'repair') {
      return {
        should_capitalize: false,
        classification: 'expense',
        reason: 'Day-to-day servicing costs are expensed as incurred',
        ias16_paragraph: 'IAS 16.12'
      };
    }

    if (nature === 'improvement') {
      if (enhances_useful_life || enhances_capacity) {
        return {
          should_capitalize: true,
          classification: 'capital',
          reason: 'Improvement extends useful life or enhances capacity',
          ias16_paragraph: 'IAS 16.13'
        };
      }
      return {
        should_capitalize: false,
        classification: 'requires_review',
        reason: 'Improvement does not clearly enhance asset - requires management review',
        ias16_paragraph: 'IAS 16.13-14'
      };
    }

    if (nature === 'replacement') {
      if (cost && cost >= this.thresholds.minimum_amount) {
        return {
          should_capitalize: true,
          classification: 'capital',
          reason: 'Major component replacement - capitalize and derecognize replaced part',
          ias16_paragraph: 'IAS 16.13'
        };
      }
      return {
        should_capitalize: false,
        classification: 'expense',
        reason: 'Minor replacement below threshold',
        ias16_paragraph: 'Entity policy'
      };
    }

    return {
      should_capitalize: false,
      classification: 'requires_review',
      reason: 'Classification unclear - requires management review'
    };
  }

  /**
   * Suggest useful life based on asset type and cost
   */
  private suggestUsefulLife(cost: number, providedLife: number): number {
    // Use provided life if reasonable
    if (providedLife >= 1 && providedLife <= 50) {
      return providedLife;
    }

    // Default suggestions based on cost bands
    if (cost >= 500000) return 20; // Major equipment/buildings
    if (cost >= 100000) return 10; // Vehicles, heavy equipment
    if (cost >= 20000) return 5;   // Office equipment, furniture
    return 3; // IT equipment, tools
  }

  /**
   * Suggest depreciation method based on asset characteristics
   */
  private suggestDepreciationMethod(is_tangible: boolean, useful_life: number): string {
    // Straight-line is default for most tangible assets
    if (useful_life >= 10) {
      return 'STRAIGHT_LINE'; // Buildings, infrastructure
    }

    // Reducing balance for assets that lose value quickly in early years
    if (useful_life <= 5) {
      return 'REDUCING_BALANCE'; // Vehicles, IT equipment
    }

    return 'STRAIGHT_LINE';
  }

  /**
   * Get current thresholds
   */
  getThresholds(): CapitalizationThresholds {
    return { ...this.thresholds };
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds: Partial<CapitalizationThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

export default AssetClassificationService;
