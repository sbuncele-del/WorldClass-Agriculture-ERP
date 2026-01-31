import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './ProductsManager.css';

interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  unit_of_measure: string | null;
  unit_cost: number | null;
  selling_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  code: string;
  name: string;
  description: string;
  category: string;
  unit_of_measure: string;
  unit_cost: string;
  selling_price: string;
}

const ProductsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<ProductFormData>({
    code: '',
    name: '',
    description: '',
    category: '',
    unit_of_measure: 'UNIT',
    unit_cost: '',
    selling_price: '',
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = `${API_BASE_URL}/api/financial/dimensions/products${showInactive ? '?include_inactive=true' : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      category: '',
      unit_of_measure: 'UNIT',
      unit_cost: '',
      selling_price: '',
    });
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      unit_of_measure: product.unit_of_measure || 'UNIT',
      unit_cost: product.unit_cost?.toString() || '',
      selling_price: product.selling_price?.toString() || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      code: formData.code,
      name: formData.name,
      description: formData.description || null,
      category: formData.category || null,
      unit_of_measure: formData.unit_of_measure || null,
      unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
      selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
    };

    try {
      const url = editingProduct
        ? `${API_BASE_URL}/api/financial/dimensions/products/${editingProduct.id}`
        : `${API_BASE_URL}/api/financial/dimensions/products`;
      
      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowModal(false);
        fetchProducts();
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving product: ' + error);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const url = `${API_BASE_URL}/api/financial/dimensions/products/${product.id}/${
        product.is_active ? 'deactivate' : 'activate'
      }`;
      
      const response = await fetch(url, { method: 'PUT' });
      const result = await response.json();
      
      if (result.success) {
        fetchProducts();
      }
    } catch (error) {
      alert('Error toggling product status: ' + error);
    }
  };

  const filteredProducts = products.filter(prod =>
    prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prod.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prod.description && prod.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (prod.category && prod.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="products-manager">
      <div className="manager-header">
        <div className="header-left">
          <h2>📦 Products</h2>
          <p className="subtitle">Product catalog and pricing management</p>
        </div>
        <button className="btn-create" onClick={handleCreate}>
          ➕ New Product
        </button>
      </div>

      <div className="filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          <span>Show inactive products</span>
        </label>
      </div>

      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Product Name</th>
              <th>Description</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Unit Cost</th>
              <th>Selling Price</th>
              <th>Margin</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={10} className="no-data">
                  {searchTerm ? 'No products match your search' : 'No products found'}
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => {
                const margin = product.unit_cost && product.selling_price
                  ? ((product.selling_price - product.unit_cost) / product.selling_price * 100).toFixed(1)
                  : null;
                
                return (
                  <tr key={product.id} className={!product.is_active ? 'inactive-row' : ''}>
                    <td>{product.code}</td>
                    <td>{product.name}</td>
                    <td>{product.description || '-'}</td>
                    <td>{product.category || '-'}</td>
                    <td>{product.unit_of_measure || '-'}</td>
                    <td>R {product.unit_cost ? product.unit_cost.toFixed(2) : '-'}</td>
                    <td>R {product.selling_price ? product.selling_price.toFixed(2) : '-'}</td>
                    <td>{margin ? `${margin}%` : '-'}</td>
                    <td>
                      <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-edit" onClick={() => handleEdit(product)}>
                          ✏️ Edit
                        </button>
                        <button
                          className={product.is_active ? 'btn-deactivate' : 'btn-activate'}
                          onClick={() => handleToggleActive(product)}
                        >
                          {product.is_active ? '🔴 Deactivate' : '🟢 Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Create New Product'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., PROD-001"
                  />
                </div>

                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Office Chair"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Furniture"
                  />
                </div>

                <div className="form-group">
                  <label>Unit of Measure</label>
                  <select
                    value={formData.unit_of_measure}
                    onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                  >
                    <option value="UNIT">Unit</option>
                    <option value="KG">Kilogram (kg)</option>
                    <option value="LITRE">Litre</option>
                    <option value="METER">Meter (m)</option>
                    <option value="BOX">Box</option>
                    <option value="PACK">Pack</option>
                    <option value="HOUR">Hour</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Unit Cost (R)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Selling Price (R)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingProduct ? 'Update' : 'Create'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;
