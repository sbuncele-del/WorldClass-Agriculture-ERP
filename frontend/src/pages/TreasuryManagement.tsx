import React, { useState } from 'react';
import './TreasuryManagement.css';

const TreasuryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('liquidity');

  return (
    <div className="treasury-management">
      <div className="treasury-header">
        <div>
          <h1>💎 Treasury Management</h1>
          <p>Manage cash flow, investments, debt, and financial risks</p>
        </div>
      </div>

      <nav className="treasury-nav">
        <button 
          className={`nav-tab ${activeTab === 'liquidity' ? 'active' : ''}`}
          onClick={() => setActiveTab('liquidity')}
        >
          💧 Liquidity
        </button>
        <button 
          className={`nav-tab ${activeTab === 'fx' ? 'active' : ''}`}
          onClick={() => setActiveTab('fx')}
        >
          💱 FX Management
        </button>
        <button 
          className={`nav-tab ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          📈 Investments
        </button>
        <button 
          className={`nav-tab ${activeTab === 'debt' ? 'active' : ''}`}
          onClick={() => setActiveTab('debt')}
        >
          📊 Debt Management
        </button>
        <button 
          className={`nav-tab ${activeTab === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('risk')}
        >
          ⚠️ Risk Analysis
        </button>
      </nav>

      <div className="treasury-content">
        {activeTab === 'liquidity' && (
          <div className="tab-content">
            <h2>Liquidity Overview</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Current Cash Position</h3>
                <div className="metric-value">R 12,450,000</div>
                <div className="metric-change positive">+5.2% from last month</div>
              </div>
              <div className="metric-card">
                <h3>Cash Flow Forecast (30d)</h3>
                <div className="metric-value">R 3,200,000</div>
                <div className="metric-change positive">+R 850k projected</div>
              </div>
              <div className="metric-card">
                <h3>Working Capital</h3>
                <div className="metric-value">R 8,100,000</div>
                <div className="metric-change">Current ratio: 2.3</div>
              </div>
            </div>
            <div className="treasury-section">
              <h3>Cash Distribution by Account</h3>
              <div className="account-list">
                <div className="account-item">
                  <span className="account-name">FNB Business Account</span>
                  <span className="account-balance">R 4,500,000</span>
                </div>
                <div className="account-item">
                  <span className="account-name">Standard Bank Ops</span>
                  <span className="account-balance">R 3,200,000</span>
                </div>
                <div className="account-item">
                  <span className="account-name">Nedbank Investment</span>
                  <span className="account-balance">R 2,850,000</span>
                </div>
                <div className="account-item">
                  <span className="account-name">ABSA Payroll</span>
                  <span className="account-balance">R 1,900,000</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fx' && (
          <div className="tab-content">
            <h2>Foreign Exchange Management</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>FX Exposure</h3>
                <div className="metric-value">$450,000</div>
                <div className="metric-change">Multiple currencies</div>
              </div>
              <div className="metric-card">
                <h3>Hedging Coverage</h3>
                <div className="metric-value">65%</div>
                <div className="metric-change">Protected positions</div>
              </div>
              <div className="metric-card">
                <h3>FX Gain/Loss (YTD)</h3>
                <div className="metric-value">R 125,000</div>
                <div className="metric-change positive">+R 42k this month</div>
              </div>
            </div>
            <div className="treasury-section">
              <h3>Currency Positions</h3>
              <div className="fx-positions">
                <div className="fx-item">
                  <span className="fx-currency">USD</span>
                  <span className="fx-amount">$250,000</span>
                  <span className="fx-rate">R 18.45</span>
                  <span className="fx-value">R 4,612,500</span>
                </div>
                <div className="fx-item">
                  <span className="fx-currency">EUR</span>
                  <span className="fx-amount">€150,000</span>
                  <span className="fx-rate">R 19.82</span>
                  <span className="fx-value">R 2,973,000</span>
                </div>
                <div className="fx-item">
                  <span className="fx-currency">GBP</span>
                  <span className="fx-amount">£50,000</span>
                  <span className="fx-rate">R 23.15</span>
                  <span className="fx-value">R 1,157,500</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'investments' && (
          <div className="tab-content">
            <h2>Investment Portfolio</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Total Portfolio Value</h3>
                <div className="metric-value">R 25,600,000</div>
                <div className="metric-change positive">+12.5% YTD</div>
              </div>
              <div className="metric-card">
                <h3>Return on Investment</h3>
                <div className="metric-value">8.7%</div>
                <div className="metric-change positive">Above benchmark</div>
              </div>
              <div className="metric-card">
                <h3>Unrealized Gains</h3>
                <div className="metric-value">R 2,850,000</div>
                <div className="metric-change">11.1% of portfolio</div>
              </div>
            </div>
            <div className="treasury-section">
              <h3>Investment Breakdown</h3>
              <div className="investment-list">
                <div className="investment-item">
                  <div className="investment-info">
                    <span className="investment-name">Money Market Fund</span>
                    <span className="investment-type">Low Risk</span>
                  </div>
                  <div className="investment-value">
                    <span className="investment-amount">R 10,000,000</span>
                    <span className="investment-return positive">+4.2%</span>
                  </div>
                </div>
                <div className="investment-item">
                  <div className="investment-info">
                    <span className="investment-name">Corporate Bonds</span>
                    <span className="investment-type">Medium Risk</span>
                  </div>
                  <div className="investment-value">
                    <span className="investment-amount">R 8,500,000</span>
                    <span className="investment-return positive">+6.8%</span>
                  </div>
                </div>
                <div className="investment-item">
                  <div className="investment-info">
                    <span className="investment-name">Equity Funds</span>
                    <span className="investment-type">High Risk</span>
                  </div>
                  <div className="investment-value">
                    <span className="investment-amount">R 5,100,000</span>
                    <span className="investment-return positive">+15.3%</span>
                  </div>
                </div>
                <div className="investment-item">
                  <div className="investment-info">
                    <span className="investment-name">Fixed Deposits</span>
                    <span className="investment-type">Low Risk</span>
                  </div>
                  <div className="investment-value">
                    <span className="investment-amount">R 2,000,000</span>
                    <span className="investment-return positive">+5.5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'debt' && (
          <div className="tab-content">
            <h2>Debt Management</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Total Debt Outstanding</h3>
                <div className="metric-value">R 18,500,000</div>
                <div className="metric-change">Multiple facilities</div>
              </div>
              <div className="metric-card">
                <h3>Debt-to-Equity Ratio</h3>
                <div className="metric-value">0.42</div>
                <div className="metric-change">Healthy leverage</div>
              </div>
              <div className="metric-card">
                <h3>Interest Expense (Annual)</h3>
                <div className="metric-value">R 1,665,000</div>
                <div className="metric-change">Avg rate: 9.0%</div>
              </div>
            </div>
            <div className="treasury-section">
              <h3>Debt Facilities</h3>
              <div className="debt-list">
                <div className="debt-item">
                  <div className="debt-info">
                    <span className="debt-name">Term Loan - FNB</span>
                    <span className="debt-rate">Prime + 1.5%</span>
                  </div>
                  <div className="debt-details">
                    <span className="debt-balance">R 12,000,000</span>
                    <span className="debt-maturity">Matures: Dec 2027</span>
                  </div>
                </div>
                <div className="debt-item">
                  <div className="debt-info">
                    <span className="debt-name">Overdraft Facility</span>
                    <span className="debt-rate">Prime + 2.0%</span>
                  </div>
                  <div className="debt-details">
                    <span className="debt-balance">R 4,500,000</span>
                    <span className="debt-maturity">Revolving</span>
                  </div>
                </div>
                <div className="debt-item">
                  <div className="debt-info">
                    <span className="debt-name">Equipment Finance</span>
                    <span className="debt-rate">Fixed: 8.5%</span>
                  </div>
                  <div className="debt-details">
                    <span className="debt-balance">R 2,000,000</span>
                    <span className="debt-maturity">Matures: Jun 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="tab-content">
            <h2>Financial Risk Analysis</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Overall Risk Score</h3>
                <div className="metric-value">Medium</div>
                <div className="metric-change">Well-managed exposure</div>
              </div>
              <div className="metric-card">
                <h3>Value at Risk (VaR)</h3>
                <div className="metric-value">R 850,000</div>
                <div className="metric-change">95% confidence, 1-day</div>
              </div>
              <div className="metric-card">
                <h3>Credit Risk Exposure</h3>
                <div className="metric-value">R 5,200,000</div>
                <div className="metric-change">Accounts receivable</div>
              </div>
            </div>
            <div className="treasury-section">
              <h3>Risk Factors</h3>
              <div className="risk-list">
                <div className="risk-item low">
                  <span className="risk-icon">✅</span>
                  <div className="risk-details">
                    <span className="risk-name">Liquidity Risk</span>
                    <span className="risk-level">Low - Strong cash position</span>
                  </div>
                </div>
                <div className="risk-item medium">
                  <span className="risk-icon">⚠️</span>
                  <div className="risk-details">
                    <span className="risk-name">Interest Rate Risk</span>
                    <span className="risk-level">Medium - Variable rate exposure</span>
                  </div>
                </div>
                <div className="risk-item medium">
                  <span className="risk-icon">⚠️</span>
                  <div className="risk-details">
                    <span className="risk-name">Currency Risk</span>
                    <span className="risk-level">Medium - FX exposure present</span>
                  </div>
                </div>
                <div className="risk-item low">
                  <span className="risk-icon">✅</span>
                  <div className="risk-details">
                    <span className="risk-name">Credit Risk</span>
                    <span className="risk-level">Low - Quality receivables</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreasuryManagement;
