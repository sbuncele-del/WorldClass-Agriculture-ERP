/**
 * ITEM MANAGEMENT
 * 
 * Complete CRUD for inventory items with categories, UOMs, and stock control
 */

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../services/api.service';

interface Category {
  category_id: number;
  category_code: string;
  category_name: string;
  parent_category_id: number | null;
  is_active: boolean;
}

interface UOM {
  uom_id: number;
  uom_code: string;
  uom_name: string;
  uom_type: string;
}

interface Item {
  item_id: number;
  item_code: string;
  item_name: string;
  description: string;
  category_id: number;
  category_name: string;
  item_type: string;
  base_uom_id: number;
  uom_code: string;
  valuation_method: string;
  standard_cost: number;
  average_cost: number;
  reorder_level: number;
  reorder_quantity: number;
  minimum_stock_level: number;
  maximum_stock_level: number;
  barcode: string;
  sku: string;
  is_active: boolean;
  is_purchasable: boolean;
  is_saleable: boolean;
  total_on_hand: number;
  total_value: number;
}

export default function ItemManagement() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uoms, setUOMs] = useState<UOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');

  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    description: '',
    category_id: '',
    item_type: 'Finished Goods',
    base_uom_id: '',
    valuation_method: 'Weighted Average',
    standard_cost: '0',
    reorder_level: '0',
    reorder_quantity: '0',
    minimum_stock_level: '0',
    maximum_stock_level: '0',
    lead_time_days: '0',
    barcode: '',
    sku: '',
    is_active: true,
    is_purchasable: true,
    is_saleable: true
  });

  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchUOMs();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/items`);
      const result = await response.json();
      
      if (result.success) {
        setItems(result.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/categories`);
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUOMs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/accounts?account_type=Asset`);
      // For now, hardcode UOMs - in real implementation, create a UOM endpoint
      setUOMs([
        { uom_id: 1, uom_code: 'EA', uom_name: 'Each', uom_type: 'Quantity' },
        { uom_id: 2, uom_code: 'PC', uom_name: 'Piece', uom_type: 'Quantity' },
        { uom_id: 3, uom_code: 'BOX', uom_name: 'Box', uom_type: 'Quantity' },
        { uom_id: 7, uom_code: 'KG', uom_name: 'Kilogram', uom_type: 'Weight' },
        { uom_id: 10, uom_code: 'L', uom_name: 'Liter', uom_type: 'Volume' }
      ]);
    } catch (error) {
      console.error('Error fetching UOMs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      base_uom_id: formData.base_uom_id ? parseInt(formData.base_uom_id) : null,
      standard_cost: parseFloat(formData.standard_cost),
      reorder_level: parseFloat(formData.reorder_level),
      reorder_quantity: parseFloat(formData.reorder_quantity),
      minimum_stock_level: parseFloat(formData.minimum_stock_level),
      maximum_stock_level: parseFloat(formData.maximum_stock_level),
      lead_time_days: parseInt(formData.lead_time_days)
    };

    try {
      const url = editingItem
        ? `${API_BASE_URL}/api/inventory/items/${editingItem.item_id}`
        : `${API_BASE_URL}/api/inventory/items`;
      
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        alert(editingItem ? 'Item updated successfully!' : 'Item created successfully!');
        setShowModal(false);
        resetForm();
        fetchItems();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      item_code: item.item_code,
      item_name: item.item_name,
      description: item.description || '',
      category_id: item.category_id?.toString() || '',
      item_type: item.item_type,
      base_uom_id: item.base_uom_id?.toString() || '',
      valuation_method: item.valuation_method,
      standard_cost: item.standard_cost?.toString() || '0',
      reorder_level: item.reorder_level?.toString() || '0',
      reorder_quantity: item.reorder_quantity?.toString() || '0',
      minimum_stock_level: item.minimum_stock_level?.toString() || '0',
      maximum_stock_level: item.maximum_stock_level?.toString() || '0',
      lead_time_days: '0',
      barcode: item.barcode || '',
      sku: item.sku || '',
      is_active: item.is_active,
      is_purchasable: item.is_purchasable,
      is_saleable: item.is_saleable
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      item_code: '',
      item_name: '',
      description: '',
      category_id: '',
      item_type: 'Finished Goods',
      base_uom_id: '',
      valuation_method: 'Weighted Average',
      standard_cost: '0',
      reorder_level: '0',
      reorder_quantity: '0',
      minimum_stock_level: '0',
      maximum_stock_level: '0',
      lead_time_days: '0',
      barcode: '',
      sku: '',
      is_active: true,
      is_purchasable: true,
      is_saleable: true
    });
    setEditingItem(null);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !filterCategory || item.category_id?.toString() === filterCategory;
    const matchesType = !filterType || item.item_type === filterType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(value);
  };

  if (loading) {
    return <div className="loading">Loading items...</div>;
  }

  return (
    <div className="item-management">
      <div className="section-header">
        <h2 className="section-title">🏷️ Item Management</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ New Item
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search items (code, name, barcode)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.category_name}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="Finished Goods">Finished Goods</option>
          <option value="Raw Material">Raw Material</option>
          <option value="Semi-Finished">Semi-Finished</option>
          <option value="Service">Service</option>
          <option value="Consumable">Consumable</option>
          <option value="Asset">Asset</option>
        </select>
      </div>

      {/* Items Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Category</th>
            <th>Type</th>
            <th>UOM</th>
            <th>On Hand</th>
            <th>Value</th>
            <th>Avg Cost</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <tr key={item.item_id}>
                <td>
                  <strong>{item.item_code}</strong>
                  {item.barcode && (
                    <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                      🔲 {item.barcode}
                    </div>
                  )}
                </td>
                <td>
                  <div>{item.item_name}</div>
                  {item.description && (
                    <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                      {item.description.substring(0, 50)}
                      {item.description.length > 50 ? '...' : ''}
                    </div>
                  )}
                </td>
                <td>{item.category_name || '-'}</td>
                <td>
                  <span className="status-badge status-draft">
                    {item.item_type}
                  </span>
                </td>
                <td>{item.uom_code}</td>
                <td>{item.total_on_hand ? parseFloat(item.total_on_hand.toString()).toFixed(2) : '0.00'}</td>
                <td>{formatCurrency(item.total_value || 0)}</td>
                <td>{formatCurrency(item.average_cost || 0)}</td>
                <td>
                  {item.is_active ? (
                    <span className="status-badge status-approved">Active</span>
                  ) : (
                    <span className="status-badge status-cancelled">Inactive</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleEdit(item)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    ✏️ Edit
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
                No items found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingItem ? '✏️ Edit Item' : '➕ Create New Item'}
              </h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Basic Information */}
                <h3 style={{ marginBottom: '1rem' }}>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Item Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.item_code}
                      onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                      required
                      placeholder="e.g., ITEM-001"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Item Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.item_name}
                      onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                      required
                      placeholder="e.g., Product Name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Item description..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Item Type *</label>
                    <select
                      className="form-select"
                      value={formData.item_type}
                      onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                      required
                    >
                      <option value="Finished Goods">Finished Goods</option>
                      <option value="Raw Material">Raw Material</option>
                      <option value="Semi-Finished">Semi-Finished</option>
                      <option value="Service">Service</option>
                      <option value="Consumable">Consumable</option>
                      <option value="Asset">Asset</option>
                    </select>
                  </div>
                </div>

                {/* Product Codes */}
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Product Codes</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Stock Keeping Unit"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Barcode</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="Barcode/EAN"
                    />
                  </div>
                </div>

                {/* Pricing & Valuation */}
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Pricing & Valuation</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Base UOM *</label>
                    <select
                      className="form-select"
                      value={formData.base_uom_id}
                      onChange={(e) => setFormData({ ...formData, base_uom_id: e.target.value })}
                      required
                    >
                      <option value="">Select UOM</option>
                      {uoms.map((uom) => (
                        <option key={uom.uom_id} value={uom.uom_id}>
                          {uom.uom_code} - {uom.uom_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valuation Method</label>
                    <select
                      className="form-select"
                      value={formData.valuation_method}
                      onChange={(e) => setFormData({ ...formData, valuation_method: e.target.value })}
                    >
                      <option value="Weighted Average">Weighted Average</option>
                      <option value="FIFO">FIFO</option>
                      <option value="LIFO">LIFO</option>
                      <option value="Standard Cost">Standard Cost</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Standard Cost (R)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.standard_cost}
                      onChange={(e) => setFormData({ ...formData, standard_cost: e.target.value })}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                {/* Stock Control */}
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Stock Control</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Minimum Stock Level</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.minimum_stock_level}
                      onChange={(e) => setFormData({ ...formData, minimum_stock_level: e.target.value })}
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reorder Level</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reorder Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.reorder_quantity}
                      onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Maximum Stock Level</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.maximum_stock_level}
                      onChange={(e) => setFormData({ ...formData, maximum_stock_level: e.target.value })}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                {/* Settings */}
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Settings</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Active
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        checked={formData.is_purchasable}
                        onChange={(e) => setFormData({ ...formData, is_purchasable: e.target.checked })}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Can be Purchased
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        checked={formData.is_saleable}
                        onChange={(e) => setFormData({ ...formData, is_saleable: e.target.checked })}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Can be Sold
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowModal(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? '💾 Update Item' : '➕ Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
