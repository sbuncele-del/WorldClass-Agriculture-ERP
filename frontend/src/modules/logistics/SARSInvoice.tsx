import React from 'react';
import { Download, Send, Printer } from 'lucide-react';

interface InvoiceData {
  // Supplier Details (Transporter)
  supplier: {
    company_name: string;
    vat_number: string;
    registration_number: string;
    address: string;
    phone: string;
    email: string;
  };
  
  // Customer Details
  customer: {
    company_name: string;
    vat_number?: string;
    address: string;
    contact_person: string;
  };
  
  // Invoice Details
  invoice: {
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    reference: string;
  };
  
  // Line Items
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
    amount: number;
  }>;
  
  // Totals
  totals: {
    subtotal: number;
    vat_amount: number;
    total: number;
  };
  
  // Banking Details
  banking: {
    bank_name: string;
    account_name: string;
    account_number: string;
    branch_code: string;
  };
}

interface SARSInvoiceProps {
  data: InvoiceData;
  onSend?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
}

const SARSInvoice: React.FC<SARSInvoiceProps> = ({ data, onSend, onDownload, onPrint }) => {
  return (
    <div style={{ maxWidth: '210mm', margin: '0 auto', background: 'white' }}>
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'flex-end', padding: '1rem 0' }}>
        <button
          onClick={onPrint}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          <Printer size={18} />
          Print
        </button>
        <button
          onClick={onDownload}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          <Download size={18} />
          Download PDF
        </button>
        <button
          onClick={onSend}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          <Send size={18} />
          Send to Customer
        </button>
      </div>

      {/* Invoice Document */}
      <div
        id="invoice-document"
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '2cm',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #1e293b' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
              TAX INVOICE
            </h1>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{data.supplier.company_name}</div>
              <div>{data.supplier.address}</div>
              <div>Tel: {data.supplier.phone}</div>
              <div>Email: {data.supplier.email}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>VAT Registration No:</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{data.supplier.vat_number}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Registration No:</div>
              <div style={{ fontWeight: 600 }}>{data.supplier.registration_number}</div>
            </div>
          </div>
        </div>

        {/* Invoice Details & Customer Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Bill To:
            </h3>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>
                {data.customer.company_name}
              </div>
              {data.customer.vat_number && (
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                  VAT No: {data.customer.vat_number}
                </div>
              )}
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {data.customer.address}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                Attn: {data.customer.contact_person}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Invoice Details:
            </h3>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Invoice Number:</span>
                <span style={{ fontWeight: 'bold' }}>{data.invoice.invoice_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Invoice Date:</span>
                <span style={{ fontWeight: 600 }}>{new Date(data.invoice.invoice_date).toLocaleDateString('en-ZA')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Due Date:</span>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>{new Date(data.invoice.due_date).toLocaleDateString('en-ZA')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Reference:</span>
                <span style={{ fontWeight: 600 }}>{data.invoice.reference}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>Description</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>Qty</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>Unit Price</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>VAT %</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.line_items.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{item.description}</td>
                <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{item.quantity.toFixed(4)}</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem' }}>R {item.unit_price.toFixed(2)}</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem' }}>{item.vat_rate}%</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>R {item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <div style={{ width: '300px', background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Subtotal (excl VAT):</span>
              <span style={{ fontWeight: 600 }}>R {data.totals.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>VAT (15%):</span>
              <span style={{ fontWeight: 600 }}>R {data.totals.vat_amount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>TOTAL:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>R {data.totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Banking Details */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Banking Details for Payment:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.25rem' }}>Bank Name:</div>
              <div style={{ fontWeight: 600 }}>{data.banking.bank_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.25rem' }}>Account Name:</div>
              <div style={{ fontWeight: 600 }}>{data.banking.account_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.25rem' }}>Account Number:</div>
              <div style={{ fontWeight: 600 }}>{data.banking.account_number}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.25rem' }}>Branch Code:</div>
              <div style={{ fontWeight: 600 }}>{data.banking.branch_code}</div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem' }}>Payment Terms:</h4>
          <ul style={{ fontSize: '0.75rem', color: '#78350f', marginLeft: '1.5rem', lineHeight: '1.6' }}>
            <li>Payment due within 30 days from invoice date</li>
            <li>Please use invoice number as payment reference</li>
            <li>Interest of 2% per month will be charged on overdue accounts</li>
            <li>All work undertaken in terms of our GENERAL CONDITIONS OF CARRIAGE (available on request)</li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
            This is a computer-generated invoice and is valid without signature
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <strong>SARS Tax Compliance:</strong> This invoice complies with the requirements of Section 20 of the VAT Act, 1991
          </div>
        </div>
      </div>
    </div>
  );
};

export default SARSInvoice;
