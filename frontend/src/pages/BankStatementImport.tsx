import React, { useState, useRef } from 'react';
import EnterpriseLayout from '../components/layout/EnterpriseLayout';
import GlassCard from '../components/ui/GlassCard';
import DataTable from '../components/ui/DataTable';
import './BankStatementImport.css';

interface Transaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  selected: boolean;
}

const BankStatementImport: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('upload');
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccount, setBankAccount] = useState('');
  const [statementDate, setStatementDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    { label: 'Banking & Cash', href: '/banking' },
    { label: 'Import Statement', href: '/banking/import' }
  ];

  const tabs = [
    { id: 'upload', label: 'Upload File' },
    { id: 'review', label: 'Review & Match' },
    { id: 'confirm', label: 'Confirm Import' }
  ];

  const headerActions = (
    <>
      <button className="btn-secondary" onClick={() => window.history.back()}>
        <span>←</span> Back
      </button>
      <button className="btn-primary" disabled={transactions.length === 0}>
        <span>✓</span> Import {transactions.filter(t => t.selected).length} Transactions
      </button>
    </>
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !bankAccount || !statementDate) {
      alert('Please select a file, bank account, and statement date');
      return;
    }

    setUploading(true);
    
    // Simulate file upload and parsing
    setTimeout(() => {
      // Sample parsed transactions
      const sampleTransactions: Transaction[] = [
        {
          id: '1',
          date: '2025-11-01',
          description: 'Payment from ABC Company',
          reference: 'PMT001',
          debit: 0,
          credit: 15000.00,
          balance: 115000.00,
          selected: true
        },
        {
          id: '2',
          date: '2025-11-02',
          description: 'Salary Payment - October',
          reference: 'SAL202410',
          debit: 45000.00,
          credit: 0,
          balance: 70000.00,
          selected: true
        },
        {
          id: '3',
          date: '2025-11-03',
          description: 'Office Rent - November',
          reference: 'RENT202411',
          debit: 12000.00,
          credit: 0,
          balance: 58000.00,
          selected: true
        },
        {
          id: '4',
          date: '2025-11-05',
          description: 'Payment from XYZ Ltd',
          reference: 'PMT002',
          debit: 0,
          credit: 22500.00,
          balance: 80500.00,
          selected: true
        },
        {
          id: '5',
          date: '2025-11-07',
          description: 'Supplier Payment - DEF Supplies',
          reference: 'SUP003',
          debit: 8300.00,
          credit: 0,
          balance: 72200.00,
          selected: true
        }
      ];

      setTransactions(sampleTransactions);
      setSelectedTab('review');
      setUploading(false);
    }, 2000);
  };

  const handleSelectAll = (checked: boolean) => {
    setTransactions(prev => prev.map(t => ({ ...t, selected: checked })));
  };

  const handleSelectTransaction = (id: string, checked: boolean) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, selected: checked } : t
    ));
  };

  const transactionColumns = [
    { key: 'select', label: '', width: '50px' },
    { key: 'date', label: 'DATE' },
    { key: 'description', label: 'DESCRIPTION' },
    { key: 'reference', label: 'REFERENCE' },
    { key: 'debit', label: 'DEBIT', align: 'right' as const },
    { key: 'credit', label: 'CREDIT', align: 'right' as const },
    { key: 'balance', label: 'BALANCE', align: 'right' as const },
    { key: 'status', label: 'STATUS' }
  ];

  const transactionData = transactions.map(txn => ({
    select: (
      <input
        type="checkbox"
        checked={txn.selected}
        onChange={(e) => handleSelectTransaction(txn.id, e.target.checked)}
      />
    ),
    date: new Date(txn.date).toLocaleDateString('en-ZA'),
    description: txn.description,
    reference: txn.reference,
    debit: txn.debit > 0 ? (
      <span className="amount-debit">
        R {txn.debit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
      </span>
    ) : '-',
    credit: txn.credit > 0 ? (
      <span className="amount-credit">
        R {txn.credit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
      </span>
    ) : '-',
    balance: (
      <span className="amount-balance">
        R {txn.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
      </span>
    ),
    status: (
      <span className="badge badge-new">New</span>
    )
  }));

  return (
    <EnterpriseLayout
      title="Import Bank Statement"
      subtitle="Upload and process bank transactions"
      breadcrumbs={breadcrumbs}
      tabs={tabs}
      selectedTab={selectedTab}
      onTabChange={setSelectedTab}
      actions={headerActions}
    >
      <div className="bank-statement-import">
        {selectedTab === 'upload' && (
          <div className="upload-section">
            <GlassCard className="upload-card">
              <h3>📄 Upload Bank Statement</h3>
              <p className="upload-description">
                Upload your bank statement in CSV, OFX, MT940, or Excel format. 
                We'll automatically parse and match transactions.
              </p>

              <div className="form-group">
                <label>Bank Account</label>
                <select 
                  value={bankAccount} 
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="form-control"
                >
                  <option value="">Select bank account...</option>
                  <option value="fnb-1234">FNB Current Account (****1234)</option>
                  <option value="standardbank-5678">Standard Bank Savings (****5678)</option>
                  <option value="nedbank-9012">Nedbank Business (****9012)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Statement Date</label>
                <input
                  type="date"
                  value={statementDate}
                  onChange={(e) => setStatementDate(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="file-upload-area" onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".csv,.ofx,.940,.xlsx,.xls"
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">📁</div>
                <div className="upload-text">
                  {file ? (
                    <>
                      <strong>{file.name}</strong>
                      <span>{(file.size / 1024).toFixed(2)} KB</span>
                    </>
                  ) : (
                    <>
                      <strong>Click to upload or drag and drop</strong>
                      <span>CSV, OFX, MT940, or Excel (max 10MB)</span>
                    </>
                  )}
                </div>
              </div>

              <button 
                className="btn-primary btn-large"
                onClick={handleUpload}
                disabled={!file || !bankAccount || !statementDate || uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner-small"></span> Processing...
                  </>
                ) : (
                  <>
                    <span>⬆️</span> Upload & Parse Statement
                  </>
                )}
              </button>

              <div className="supported-formats">
                <h4>Supported Formats:</h4>
                <ul>
                  <li><strong>CSV:</strong> Standard bank CSV exports</li>
                  <li><strong>OFX:</strong> Open Financial Exchange format</li>
                  <li><strong>MT940:</strong> SWIFT format for electronic statements</li>
                  <li><strong>Excel:</strong> .xlsx or .xls files</li>
                </ul>
              </div>
            </GlassCard>
          </div>
        )}

        {selectedTab === 'review' && transactions.length > 0 && (
          <div className="review-section">
            <GlassCard className="summary-info">
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Transactions</span>
                  <span className="stat-value">{transactions.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Selected</span>
                  <span className="stat-value">{transactions.filter(t => t.selected).length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Debits</span>
                  <span className="stat-value amount-debit">
                    R {transactions.reduce((sum, t) => sum + t.debit, 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Credits</span>
                  <span className="stat-value amount-credit">
                    R {transactions.reduce((sum, t) => sum + t.credit, 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="table-header">
                <div className="table-title">
                  <input
                    type="checkbox"
                    checked={transactions.every(t => t.selected)}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <h3>Parsed Transactions</h3>
                </div>
                <div className="table-actions">
                  <button className="btn-sm btn-secondary">Match Existing</button>
                  <button className="btn-sm btn-secondary">Set Rules</button>
                </div>
              </div>

              <DataTable
                columns={transactionColumns}
                data={transactionData}
              />
            </GlassCard>
          </div>
        )}
      </div>
    </EnterpriseLayout>
  );
};

export default BankStatementImport;
