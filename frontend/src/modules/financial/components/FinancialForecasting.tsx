import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './FinancialForecasting.css';

interface ForecastResult {
  account_code: string;
  historical_months: number;
  forecast_months: number;
  model_type: string;
  model_parameters: {
    slope: number;
    intercept: number;
  };
  forecasts: {
    month: number;
    predicted_value: number;
    model_type: string;
  }[];
}

const FinancialForecasting: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [historicalMonths, setHistoricalMonths] = useState<number>(12);
  const [forecastMonths, setForecastMonths] = useState<number>(6);
  const [modelType, setModelType] = useState<string>('LINEAR');
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/accounts`);
      const data = await response.json();
      
      if (data.success) {
        // Filter to revenue and expense accounts for forecasting
        const forecastableAccounts = data.accounts.filter(
          (acc: any) => acc.account_type === 'REVENUE' || acc.account_type === 'EXPENSE'
        );
        setAccounts(forecastableAccounts);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleGenerateForecast = async () => {
    if (!selectedAccount) {
      showMessage('error', 'Please select an account to forecast');
      return;
    }

    setLoading(true);
    setForecastResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/forecasting/forecast/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_code: selectedAccount,
          historical_months: historicalMonths,
          forecast_months: forecastMonths,
          model_type: modelType
        })
      });

      const data = await response.json();

      if (data.success) {
        setForecastResult(data);
        showMessage('success', 'Forecast generated successfully');
      } else {
        showMessage('error', data.message || 'Failed to generate forecast');
      }
    } catch (error: any) {
      console.error('Error generating forecast:', error);
      showMessage('error', 'Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMonthName = (monthIndex: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const targetMonth = (currentMonth + monthIndex) % 12;
    return months[targetMonth];
  };

  const calculateTrend = () => {
    if (!forecastResult) return 'N/A';
    
    const slope = forecastResult.model_parameters.slope;
    if (slope > 0) return 'INCREASING';
    if (slope < 0) return 'DECREASING';
    return 'STABLE';
  };

  const getTrendClass = (trend: string) => {
    if (trend === 'INCREASING') return 'trend-up';
    if (trend === 'DECREASING') return 'trend-down';
    return 'trend-stable';
  };

  return (
    <div className="financial-forecasting">
      <div className="header">
        <div>
          <h2>Financial Forecasting</h2>
          <p className="subtitle">Generate predictive forecasts using historical data</p>
        </div>
      </div>

      {message && (
        <div className={`message-banner message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Forecast Configuration */}
      <div className="forecast-config-panel">
        <h3>Forecast Configuration</h3>

        <div className="config-form">
          <div className="form-row">
            <div className="form-group">
              <label>Select Account *</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="">Choose an account...</option>
                {accounts.map(account => (
                  <option key={account.code} value={account.code}>
                    {account.code} - {account.name} ({account.account_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Model Type</label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
              >
                <option value="LINEAR">Linear Regression</option>
                <option value="EXPONENTIAL">Exponential (Coming Soon)</option>
                <option value="MOVING_AVERAGE">Moving Average (Coming Soon)</option>
                <option value="SEASONAL">Seasonal (Coming Soon)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Historical Months</label>
              <input
                type="number"
                min="3"
                max="36"
                value={historicalMonths}
                onChange={(e) => setHistoricalMonths(parseInt(e.target.value))}
              />
              <span className="helper-text">Number of past months to analyze (min: 3)</span>
            </div>

            <div className="form-group">
              <label>Forecast Months</label>
              <input
                type="number"
                min="1"
                max="24"
                value={forecastMonths}
                onChange={(e) => setForecastMonths(parseInt(e.target.value))}
              />
              <span className="helper-text">Number of future months to predict</span>
            </div>
          </div>

          <div className="action-row">
            <button
              className="btn-generate"
              onClick={handleGenerateForecast}
              disabled={loading || !selectedAccount}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="icon">📈</span>
                  Generate Forecast
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Forecast Results */}
      {forecastResult && (
        <div className="forecast-results">
          <div className="results-header">
            <h3>Forecast Results</h3>
            <div className="result-meta">
              <span>Account: <strong>{forecastResult.account_code}</strong></span>
              <span>Model: <strong>{forecastResult.model_type}</strong></span>
              <span>Historical Data: <strong>{forecastResult.historical_months} months</strong></span>
            </div>
          </div>

          {/* Model Insights */}
          <div className="model-insights">
            <div className="insight-card">
              <div className="insight-label">Trend Direction</div>
              <div className={`insight-value ${getTrendClass(calculateTrend())}`}>
                {calculateTrend()}
                {calculateTrend() === 'INCREASING' && ' ↑'}
                {calculateTrend() === 'DECREASING' && ' ↓'}
                {calculateTrend() === 'STABLE' && ' →'}
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-label">Growth Rate (Monthly)</div>
              <div className="insight-value">
                {forecastResult.model_parameters.slope >= 0 ? '+' : ''}
                {formatCurrency(forecastResult.model_parameters.slope)}
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-label">Base Value (Intercept)</div>
              <div className="insight-value">
                {formatCurrency(forecastResult.model_parameters.intercept)}
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-label">Total Forecasted</div>
              <div className="insight-value">
                {formatCurrency(
                  forecastResult.forecasts.reduce((sum, f) => sum + f.predicted_value, 0)
                )}
              </div>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="forecast-chart">
            <h4>Projected Values</h4>
            <div className="chart-container">
              <div className="chart-bars">
                {forecastResult.forecasts.map((forecast, index) => {
                  const maxValue = Math.max(...forecastResult.forecasts.map(f => f.predicted_value));
                  const height = (forecast.predicted_value / maxValue) * 100;

                  return (
                    <div key={index} className="chart-bar-item">
                      <div className="bar-wrapper">
                        <div
                          className="bar-fill"
                          style={{ height: `${height}%` }}
                          title={formatCurrency(forecast.predicted_value)}
                        >
                          <span className="bar-value">{formatCurrency(forecast.predicted_value)}</span>
                        </div>
                      </div>
                      <div className="bar-label">{getMonthName(index)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Forecast Table */}
          <div className="forecast-table-container">
            <h4>Detailed Forecast</h4>
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Period</th>
                  <th>Predicted Value</th>
                  <th>Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {forecastResult.forecasts.map((forecast, index) => {
                  const cumulative = forecastResult.forecasts
                    .slice(0, index + 1)
                    .reduce((sum, f) => sum + f.predicted_value, 0);

                  return (
                    <tr key={index}>
                      <td>{forecast.month}</td>
                      <td>{getMonthName(index)}</td>
                      <td className="amount-cell">{formatCurrency(forecast.predicted_value)}</td>
                      <td className="amount-cell cumulative">{formatCurrency(cumulative)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}><strong>Total</strong></td>
                  <td className="amount-cell">
                    <strong>
                      {formatCurrency(
                        forecastResult.forecasts.reduce((sum, f) => sum + f.predicted_value, 0)
                      )}
                    </strong>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Model Information */}
          <div className="model-info">
            <h4>Model Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Algorithm:</span>
                <span className="info-value">Linear Regression (Least Squares)</span>
              </div>
              <div className="info-item">
                <span className="info-label">Formula:</span>
                <span className="info-value">
                  y = {forecastResult.model_parameters.slope.toFixed(2)}x + {forecastResult.model_parameters.intercept.toFixed(2)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Data Points Used:</span>
                <span className="info-value">{forecastResult.historical_months} months</span>
              </div>
              <div className="info-item">
                <span className="info-label">Confidence Level:</span>
                <span className="info-value">Moderate (based on limited historical data)</span>
              </div>
            </div>

            <div className="disclaimer">
              <strong>Note:</strong> Forecasts are predictive estimates based on historical trends and should be used as guidance only. 
              Actual results may vary due to market conditions, business changes, and other external factors.
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!forecastResult && !loading && (
        <div className="empty-forecast-state">
          <div className="empty-icon">📊</div>
          <h3>No Forecast Generated Yet</h3>
          <p>Select an account and configure the parameters above to generate a financial forecast.</p>
          <div className="forecast-features">
            <div className="feature-item">
              <span className="feature-icon">📈</span>
              <span>Trend Analysis</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔮</span>
              <span>Future Projections</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>Visual Charts</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💡</span>
              <span>Data-Driven Insights</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialForecasting;
