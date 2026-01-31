import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './GoodsReceivedManagement.css';

interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_name: string;
  order_date: string;
  expected_delivery_date: string;
  total_amount: number;
  status: string;
}

interface POLineItem {
  id: number;
  line_number: number;
  item_code: string;
  description: string;
  quantity: number;
  received_quantity: number;
  pending_quantity: number;
  unit_price: number;
  uom: string;
}

interface GRN {
  id: number;
  grn_number: string;
  po_number: string;
  vendor_name: string;
  received_date: string;
  received_by: string;
  warehouse_location: string;
  status: string;
  total_items: number;
  inspection_status: string;
}

interface GRNLineItem {
  line_number: number;
  item_code: string;
  description: string;
  ordered_quantity: number;
  received_quantity: number;
  rejected_quantity: number;
  accepted_quantity: number;
  uom: string;
  warehouse_location: string;
  quality_status: 'PASS' | 'FAIL' | 'PARTIAL' | 'PENDING';
  inspection_notes: string;
}

const GoodsReceivedManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'grns' | 'receive'>('grns');
  const [grns, setGrns] = useState<GRN[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [availablePOs, setAvailablePOs] = useState<PurchaseOrder[]>([]);
  const [poLineItems, setPOLineItems] = useState<POLineItem[]>([]);
  const [grnData, setGrnData] = useState({
    received_date: new Date().toISOString().split('T')[0],
    received_by: '',
    warehouse_location: '',
    delivery_note_number: '',
    vehicle_number: '',
    driver_name: '',
    notes: ''
  });
  const [grnLineItems, setGRNLineItems] = useState<GRNLineItem[]>([]);

  useEffect(() => {
    fetchGRNs();
    fetchAvailablePOs();
  }, []);

  const fetchGRNs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/goods-received-notes`);
      const data = await response.json();
      setGrns(data);
    } catch (error) {
      console.error('Error fetching GRNs:', error);
    }
  };

  const fetchAvailablePOs = async () => {
    try {
      // Fetch POs with status ACKNOWLEDGED or SENT (ready to receive)
      const response = await fetch(`${API_BASE_URL}/api/purchase/purchase-orders?status=ACKNOWLEDGED,SENT`);
      const data = await response.json();
      setAvailablePOs(data);
    } catch (error) {
      console.error('Error fetching available POs:', error);
    }
  };

  const fetchPOLineItems = async (poId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/purchase-orders/${poId}/lines`);
      const data = await response.json();
      
      setPOLineItems(data);
      
      // Initialize GRN line items from PO lines
      const initialGRNLines: GRNLineItem[] = data.map((line: POLineItem) => ({
        line_number: line.line_number,
        item_code: line.item_code,
        description: line.description,
        ordered_quantity: line.quantity,
        received_quantity: line.pending_quantity, // Default to full pending quantity
        rejected_quantity: 0,
        accepted_quantity: line.pending_quantity,
        uom: line.uom,
        warehouse_location: '',
        quality_status: 'PENDING' as const,
        inspection_notes: ''
      }));
      
      setGRNLineItems(initialGRNLines);
    } catch (error) {
      console.error('Error fetching PO line items:', error);
    }
  };

  const handlePOSelect = (po: PurchaseOrder) => {
    setSelectedPO(po);
    fetchPOLineItems(po.id);
  };

  const handleLineItemChange = (index: number, field: keyof GRNLineItem, value: any) => {
    const updatedLines = [...grnLineItems];
    updatedLines[index] = {
      ...updatedLines[index],
      [field]: value
    };

    // Auto-calculate accepted quantity
    if (field === 'received_quantity' || field === 'rejected_quantity') {
      const received = field === 'received_quantity' ? Number(value) : updatedLines[index].received_quantity;
      const rejected = field === 'rejected_quantity' ? Number(value) : updatedLines[index].rejected_quantity;
      updatedLines[index].accepted_quantity = received - rejected;

      // Auto-update quality status
      if (rejected === 0 && received > 0) {
        updatedLines[index].quality_status = 'PASS';
      } else if (rejected > 0 && rejected < received) {
        updatedLines[index].quality_status = 'PARTIAL';
      } else if (rejected === received && received > 0) {
        updatedLines[index].quality_status = 'FAIL';
      }
    }

    setGRNLineItems(updatedLines);
  };

  const handleCreateGRN = async () => {
    if (!selectedPO) return;

    // Validation
    if (!grnData.received_by.trim()) {
      alert('Please enter the name of the person receiving the goods');
      return;
    }

    if (!grnData.warehouse_location.trim()) {
      alert('Please enter the warehouse location');
      return;
    }

    // Check if at least one item has been received
    const hasReceivedItems = grnLineItems.some(line => line.received_quantity > 0);
    if (!hasReceivedItems) {
      alert('Please enter received quantities for at least one item');
      return;
    }

    // Check for over-receipts
    const hasOverReceipt = grnLineItems.some(line => 
      line.received_quantity > line.ordered_quantity
    );
    if (hasOverReceipt) {
      if (!confirm('Some items have received quantities exceeding ordered quantities. Do you want to continue?')) {
        return;
      }
    }

    try {
      const payload = {
        purchase_order_id: selectedPO.id,
        ...grnData,
        lines: grnLineItems.filter(line => line.received_quantity > 0).map(line => ({
          po_line_id: poLineItems.find(pl => pl.line_number === line.line_number)?.id,
          received_quantity: line.received_quantity,
          rejected_quantity: line.rejected_quantity,
          accepted_quantity: line.accepted_quantity,
          warehouse_location: line.warehouse_location || grnData.warehouse_location,
          quality_status: line.quality_status,
          inspection_notes: line.inspection_notes
        }))
      };

      const response = await fetch(`${API_BASE_URL}/api/purchase/goods-received-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Goods Received Note created successfully!');
        setShowReceiveModal(false);
        resetForm();
        fetchGRNs();
        fetchAvailablePOs();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to create GRN'}`);
      }
    } catch (error) {
      console.error('Error creating GRN:', error);
      alert('Failed to create GRN. Please try again.');
    }
  };

  const resetForm = () => {
    setSelectedPO(null);
    setPOLineItems([]);
    setGRNLineItems([]);
    setGrnData({
      received_date: new Date().toISOString().split('T')[0],
      received_by: '',
      warehouse_location: '',
      delivery_note_number: '',
      vehicle_number: '',
      driver_name: '',
      notes: ''
    });
  };

  const filteredGRNs = grns.filter(grn => {
    const matchesSearch = 
      grn.grn_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || grn.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getQualityStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { class: string; label: string } } = {
      PASS: { class: 'pass', label: 'Passed' },
      FAIL: { class: 'fail', label: 'Failed' },
      PARTIAL: { class: 'partial', label: 'Partial' },
      PENDING: { class: 'pending', label: 'Pending' }
    };
    
    const config = statusMap[status] || statusMap.PENDING;
    return <span className={`quality-badge ${config.class}`}>{config.label}</span>;
  };

  const calculateReceiptSummary = () => {
    const totalOrdered = grnLineItems.reduce((sum, line) => sum + line.ordered_quantity, 0);
    const totalReceived = grnLineItems.reduce((sum, line) => sum + line.received_quantity, 0);
    const totalRejected = grnLineItems.reduce((sum, line) => sum + line.rejected_quantity, 0);
    const totalAccepted = grnLineItems.reduce((sum, line) => sum + line.accepted_quantity, 0);
    
    return { totalOrdered, totalReceived, totalRejected, totalAccepted };
  };

  return (
    <div className="grn-management">
      <h2>📦 Goods Received Notes</h2>

      <div className="grn-tabs">
        <button
          className={`grn-tab ${activeTab === 'grns' ? 'active' : ''}`}
          onClick={() => setActiveTab('grns')}
        >
          All GRNs
        </button>
        <button
          className={`grn-tab ${activeTab === 'receive' ? 'active' : ''}`}
          onClick={() => setActiveTab('receive')}
        >
          Receive Goods
        </button>
      </div>

      {activeTab === 'grns' && (
        <>
          <div className="grn-controls">
            <div className="grn-search-filter">
              <div className="grn-search">
                <input
                  type="text"
                  placeholder="Search GRNs, POs, or vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="grn-filter">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="RECEIVED">Received</option>
                  <option value="INSPECTED">Inspected</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
            <div className="grn-actions">
              <button className="btn-receive-goods" onClick={() => setActiveTab('receive')}>
                + Receive Goods
              </button>
            </div>
          </div>

          {filteredGRNs.length === 0 ? (
            <div className="grn-empty-state">
              <p>No goods received notes found</p>
              <button onClick={() => setActiveTab('receive')}>Receive Goods</button>
            </div>
          ) : (
            <div className="grn-grid">
              {filteredGRNs.map(grn => (
                <div key={grn.id} className="grn-card">
                  <div className="grn-card-header">
                    <div>
                      <div className="grn-number">{grn.grn_number}</div>
                      <div className="grn-date">{new Date(grn.received_date).toLocaleDateString()}</div>
                    </div>
                    <span className={`grn-status-badge ${grn.status.toLowerCase()}`}>
                      {grn.status}
                    </span>
                  </div>
                  <div className="grn-card-body">
                    <div className="grn-vendor">{grn.vendor_name}</div>
                    <div className="grn-details">
                      <div className="grn-detail-item">
                        <span className="grn-detail-label">PO Number</span>
                        <span className="grn-detail-value">{grn.po_number}</span>
                      </div>
                      <div className="grn-detail-item">
                        <span className="grn-detail-label">Received By</span>
                        <span className="grn-detail-value">{grn.received_by}</span>
                      </div>
                      <div className="grn-detail-item">
                        <span className="grn-detail-label">Location</span>
                        <span className="grn-detail-value">{grn.warehouse_location}</span>
                      </div>
                      <div className="grn-detail-item">
                        <span className="grn-detail-label">Quality Status</span>
                        {getQualityStatusBadge(grn.inspection_status)}
                      </div>
                    </div>
                  </div>
                  <div className="grn-card-footer">
                    <span className="grn-items-count">{grn.total_items} items</span>
                    <div className="grn-quick-actions">
                      <button onClick={() => console.log('View GRN', grn.id)}>View</button>
                      <button onClick={() => console.log('Print GRN', grn.id)}>Print</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'receive' && (
        <div className="receive-goods-section">
          {!selectedPO ? (
            <>
              <h3>Select Purchase Order to Receive</h3>
              <div className="po-selection-grid">
                {availablePOs.length === 0 ? (
                  <div className="grn-empty-state">
                    <p>No purchase orders available for receiving</p>
                  </div>
                ) : (
                  availablePOs.map(po => (
                    <div key={po.id} className="po-selection-card" onClick={() => handlePOSelect(po)}>
                      <div className="po-selection-header">
                        <div className="po-selection-number">{po.po_number}</div>
                        <span className={`po-selection-status ${po.status.toLowerCase()}`}>
                          {po.status}
                        </span>
                      </div>
                      <div className="po-selection-body">
                        <div className="po-selection-vendor">{po.vendor_name}</div>
                        <div className="po-selection-details">
                          <div>
                            <span className="label">Order Date:</span>
                            <span>{new Date(po.order_date).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="label">Expected:</span>
                            <span>{new Date(po.expected_delivery_date).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="label">Amount:</span>
                            <span className="amount">R {po.total_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="receive-form">
              <div className="receive-form-header">
                <h3>Receive Goods - {selectedPO.po_number}</h3>
                <button className="btn-back" onClick={resetForm}>← Back to PO Selection</button>
              </div>

              <div className="grn-info-section">
                <h4>Receipt Information</h4>
                <div className="grn-form-row">
                  <div className="grn-form-group">
                    <label>Received Date <span className="required">*</span></label>
                    <input
                      type="date"
                      value={grnData.received_date}
                      onChange={(e) => setGrnData({ ...grnData, received_date: e.target.value })}
                    />
                  </div>
                  <div className="grn-form-group">
                    <label>Received By <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Name of person receiving"
                      value={grnData.received_by}
                      onChange={(e) => setGrnData({ ...grnData, received_by: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grn-form-row">
                  <div className="grn-form-group">
                    <label>Warehouse Location <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g., WH-A, Bay 12"
                      value={grnData.warehouse_location}
                      onChange={(e) => setGrnData({ ...grnData, warehouse_location: e.target.value })}
                    />
                  </div>
                  <div className="grn-form-group">
                    <label>Delivery Note Number</label>
                    <input
                      type="text"
                      placeholder="Supplier's delivery note"
                      value={grnData.delivery_note_number}
                      onChange={(e) => setGrnData({ ...grnData, delivery_note_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grn-form-row">
                  <div className="grn-form-group">
                    <label>Vehicle Number</label>
                    <input
                      type="text"
                      placeholder="e.g., ABC 123 GP"
                      value={grnData.vehicle_number}
                      onChange={(e) => setGrnData({ ...grnData, vehicle_number: e.target.value })}
                    />
                  </div>
                  <div className="grn-form-group">
                    <label>Driver Name</label>
                    <input
                      type="text"
                      placeholder="Driver's name"
                      value={grnData.driver_name}
                      onChange={(e) => setGrnData({ ...grnData, driver_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grn-form-group">
                  <label>Notes</label>
                  <textarea
                    placeholder="Additional notes or observations..."
                    value={grnData.notes}
                    onChange={(e) => setGrnData({ ...grnData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="line-items-section">
                <h4>Line Items</h4>
                <div className="table-container">
                  <table className="grn-line-items-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item Code</th>
                        <th>Description</th>
                        <th>Ordered</th>
                        <th>Received</th>
                        <th>Rejected</th>
                        <th>Accepted</th>
                        <th>UOM</th>
                        <th>Quality</th>
                        <th>Location</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grnLineItems.map((line, index) => (
                        <tr key={line.line_number} className={line.received_quantity > line.ordered_quantity ? 'over-receipt' : ''}>
                          <td>{line.line_number}</td>
                          <td>{line.item_code}</td>
                          <td>{line.description}</td>
                          <td className="qty-cell">{line.ordered_quantity}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.received_quantity}
                              onChange={(e) => handleLineItemChange(index, 'received_quantity', parseFloat(e.target.value) || 0)}
                              className="qty-input"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max={line.received_quantity}
                              step="0.01"
                              value={line.rejected_quantity}
                              onChange={(e) => handleLineItemChange(index, 'rejected_quantity', parseFloat(e.target.value) || 0)}
                              className="qty-input"
                            />
                          </td>
                          <td className="qty-cell accepted">{line.accepted_quantity.toFixed(2)}</td>
                          <td>{line.uom}</td>
                          <td>
                            <select
                              value={line.quality_status}
                              onChange={(e) => handleLineItemChange(index, 'quality_status', e.target.value)}
                              className="quality-select"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PASS">Pass</option>
                              <option value="PARTIAL">Partial</option>
                              <option value="FAIL">Fail</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Location"
                              value={line.warehouse_location}
                              onChange={(e) => handleLineItemChange(index, 'warehouse_location', e.target.value)}
                              className="location-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Inspection notes"
                              value={line.inspection_notes}
                              onChange={(e) => handleLineItemChange(index, 'inspection_notes', e.target.value)}
                              className="notes-input"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="receipt-summary">
                <h4>Receipt Summary</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Total Ordered:</span>
                    <span className="summary-value">{calculateReceiptSummary().totalOrdered}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Received:</span>
                    <span className="summary-value received">{calculateReceiptSummary().totalReceived}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Rejected:</span>
                    <span className="summary-value rejected">{calculateReceiptSummary().totalRejected}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Accepted:</span>
                    <span className="summary-value accepted">{calculateReceiptSummary().totalAccepted}</span>
                  </div>
                </div>
              </div>

              <div className="receive-form-actions">
                <button className="btn-cancel" onClick={resetForm}>Cancel</button>
                <button className="btn-submit" onClick={handleCreateGRN}>Create GRN</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoodsReceivedManagement;
