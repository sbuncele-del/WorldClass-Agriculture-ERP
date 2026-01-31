import React, { useState, useEffect } from 'react';
import { cashManagementApi } from '../../services/cash-management-api.service';
import type {
  BankStatementLine,
  JournalEntryLine,
  MultiLineMatchCombination
} from '../../types/cash-management.types';
import '../../styles/erp-ui.css';

const ReconciliationWorkspace: React.FC = () => {
  const [bankLines, setBankLines] = useState<BankStatementLine[]>([]);
  const [journalLines, setJournalLines] = useState<JournalEntryLine[]>([]);
  const [selectedBankLines, setSelectedBankLines] = useState<number[]>([]);
  const [selectedJournalLines, setSelectedJournalLines] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchCombinations, setMatchCombinations] = useState<MultiLineMatchCombination[]>([]);
  const [showCombinationsModal, setShowCombinationsModal] = useState(false);
  const [filterMatched, setFilterMatched] = useState<'all' | 'matched' | 'unmatched'>('unmatched');

  useEffect(() => {
    fetchReconciliationData();
  }, []);

  const fetchReconciliationData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from backend
      // Note: You'll need to pass the actual statement ID
      // For now, using a default or fetching all unmatched lines
      const bankLinesResponse = await cashManagementApi.getStatementLines(1); // TODO: Get actual statement ID
      const journalLinesResponse = await cashManagementApi.getJournalEntries({});
      
      // Handle API response structure
      const bankLinesData = bankLinesResponse?.data || [];
      const journalLinesData = journalLinesResponse?.data || [];
      
      setBankLines(bankLinesData);
      setJournalLines(journalLinesData);
      
      if (bankLinesData.length === 0 && journalLinesData.length === 0) {
        console.log('No unmatched transactions found');
      }
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      // Set empty arrays on error
      setBankLines([]);
      setJournalLines([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBankLineSelection = (id: number) => {
    setSelectedBankLines(prev =>
      prev.includes(id) ? prev.filter(lineId => lineId !== id) : [...prev, id]
    );
  };

  const toggleJournalLineSelection = (id: number) => {
    setSelectedJournalLines(prev =>
      prev.includes(id) ? prev.filter(lineId => lineId !== id) : [...prev, id]
    );
  };

  const handleFindCombinations = async () => {
    if (selectedBankLines.length === 0) {
      alert('Please select at least one bank line');
      return;
    }

    try {
      const response = await cashManagementApi.multiLineMatch.findCombinations({
        bankLineIds: selectedBankLines,
        maxCombinationSize: 10,
        toleranceAmount: 0.01,
        dateRange: 14
      });

      setMatchCombinations(response.combinations);
      setShowCombinationsModal(true);
    } catch (error) {
      console.error('Error finding combinations:', error);
      alert('Error finding combinations. Please try again.');
    }
  };

  const handleSimpleMatch = async () => {
    if (selectedBankLines.length !== 1 || selectedJournalLines.length !== 1) {
      alert('Please select exactly one bank line and one journal line for simple matching');
      return;
    }

    try {
      await cashManagementApi.createSimpleMatch({
        bankLineId: selectedBankLines[0],
        journalLineId: selectedJournalLines[0]
      });

      alert('Match created successfully!');
      fetchReconciliationData();
      setSelectedBankLines([]);
      setSelectedJournalLines([]);
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Error creating match. Please try again.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return '#94a3b8';
    if (confidence >= 0.9) return '#10b981';
    if (confidence >= 0.7) return '#f59e0b';
    return '#ef4444';
  };

  const filteredBankLines = bankLines.filter(line => {
    if (filterMatched === 'all') return true;
    if (filterMatched === 'matched') return line.is_matched;
    return !line.is_matched;
  });

  const filteredJournalLines = journalLines.filter(line => {
    if (filterMatched === 'all') return true;
    if (filterMatched === 'matched') return line.is_matched;
    return !line.is_matched;
  });

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>Loading reconciliation workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">🔄 Bank Reconciliation</h1>
          <p className="dashboard-subtitle">Match bank transactions with journal entries</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            value={filterMatched}
            onChange={(e) => setFilterMatched(e.target.value as 'all' | 'matched' | 'unmatched')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">All</option>
            <option value="matched">Matched</option>
            <option value="unmatched">Unmatched</option>
          </select>
          <button
            className="action-button"
            onClick={() => alert('Bulk operations coming soon!')}
          >
            ⚡ Bulk Auto-Match
          </button>
        </div>
      </div>

      {/* Action Toolbar */}
      <div
        style={{
          background: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Selected: {selectedBankLines.length} bank lines, {selectedJournalLines.length} journal lines
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="action-button"
            onClick={handleSimpleMatch}
            disabled={selectedBankLines.length !== 1 || selectedJournalLines.length !== 1}
          >
            ✓ Simple Match (1:1)
          </button>
          <button
            className="action-button"
            onClick={handleFindCombinations}
            disabled={selectedBankLines.length === 0}
          >
            🔍 Find Combinations
          </button>
          <button
            className="action-button"
            onClick={() => {
              setSelectedBankLines([]);
              setSelectedJournalLines([]);
            }}
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Bank Statement Lines */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Bank Statement Lines ({filteredBankLines.length})</h2>
          </div>
          <div className="card-content" style={{ padding: 0 }}>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredBankLines.map((line) => (
                <div
                  key={line.id}
                  onClick={() => toggleBankLineSelection(line.id)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    background: selectedBankLines.includes(line.id) ? '#eff6ff' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedBankLines.includes(line.id)}
                        onChange={() => {}}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {new Date(line.transaction_date).toLocaleDateString('en-ZA')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {line.reference}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: line.credit_amount ? '#10b981' : '#ef4444'
                        }}
                      >
                        {line.credit_amount
                          ? `+${formatCurrency(line.credit_amount)}`
                          : `-${formatCurrency(line.debit_amount || 0)}`}
                      </div>
                      {line.match_confidence && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: getConfidenceColor(line.match_confidence)
                          }}
                        >
                          {Math.round(line.match_confidence * 100)}% match
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                    {line.description}
                  </div>
                  {line.is_matched && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        background: '#10b98120',
                        color: '#10b981',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      ✓ Matched
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Journal Entry Lines */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Journal Entry Lines ({filteredJournalLines.length})</h2>
          </div>
          <div className="card-content" style={{ padding: 0 }}>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredJournalLines.map((line) => (
                <div
                  key={line.id}
                  onClick={() => toggleJournalLineSelection(line.id)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    background: selectedJournalLines.includes(line.id) ? '#eff6ff' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedJournalLines.includes(line.id)}
                        onChange={() => {}}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {new Date(line.transaction_date).toLocaleDateString('en-ZA')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {line.account_code} - {line.account_name}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: line.credit_amount > 0 ? '#10b981' : '#ef4444'
                        }}
                      >
                        {line.credit_amount > 0
                          ? `+${formatCurrency(line.credit_amount)}`
                          : `-${formatCurrency(line.debit_amount)}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                    {line.description}
                  </div>
                  {line.is_matched && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        background: '#10b98120',
                        color: '#10b981',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      ✓ Matched
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Combinations Modal */}
      {showCombinationsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowCombinationsModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '0.5rem',
              padding: '2rem',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '1rem' }}>Possible Match Combinations</h2>
            {matchCombinations.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
                No matching combinations found
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {matchCombinations.map((combo, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.375rem',
                      padding: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div>
                        <strong>Combination {index + 1}</strong>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          {combo.matchType} - {combo.journalLineIds.length} journal lines
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>
                          {formatCurrency(combo.totalAmount)}
                        </div>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            color: getConfidenceColor(combo.confidence)
                          }}
                        >
                          {Math.round(combo.confidence * 100)}% confidence
                        </div>
                      </div>
                    </div>
                    {combo.difference !== 0 && (
                      <div style={{ fontSize: '0.875rem', color: '#f59e0b' }}>
                        Difference: {formatCurrency(Math.abs(combo.difference))}
                      </div>
                    )}
                    <button
                      className="action-button primary"
                      style={{ marginTop: '0.75rem', width: '100%' }}
                    >
                      Create This Match
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              className="action-button"
              style={{ marginTop: '1rem', width: '100%' }}
              onClick={() => setShowCombinationsModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconciliationWorkspace;
