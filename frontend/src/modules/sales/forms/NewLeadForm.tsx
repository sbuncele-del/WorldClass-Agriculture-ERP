import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceApi } from '../../../services/api.service';

interface NewLeadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isQuickCreate?: boolean;
}

const NewLeadForm: React.FC<NewLeadFormProps> = ({ onSuccess, onCancel, isQuickCreate = true }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullForm, setShowFullForm] = useState(!isQuickCreate);
  const [formData, setFormData] = useState({
    lead_name: '',
    company: '',
    contact_person: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    status: 'NEW',
    score: 50,
    estimated_value: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await workspaceApi.sales.createLead(formData);
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/sales/leads');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      {isQuickCreate && (
        <div className="quick-full-toggle">
          <button
            type="button"
            className={!showFullForm ? 'active' : ''}
            onClick={() => setShowFullForm(false)}
          >
            Quick Create
          </button>
          <button
            type="button"
            className={showFullForm ? 'active' : ''}
            onClick={() => setShowFullForm(true)}
          >
            Full Form
          </button>
        </div>
      )}

      {/* Essential Fields (Always shown) */}
      <div className="form-group">
        <label>
          Lead Name <span className="required">*</span>
        </label>
        <input
          type="text"
          name="lead_name"
          value={formData.lead_name}
          onChange={handleChange}
          required
          placeholder="John Smith"
        />
      </div>

      <div className="form-group">
        <label>
          Company <span className="required">*</span>
        </label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          required
          placeholder="Acme Corporation"
        />
      </div>

      <div className="form-group">
        <label>
          Email <span className="required">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="john@acme.com"
        />
      </div>

      <div className="form-group">
        <label>Phone</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+27 11 123 4567"
        />
      </div>

      {/* Additional Fields (Full Form only) */}
      {showFullForm && (
        <>
          <div className="form-group">
            <label>Contact Person</label>
            <input
              type="text"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              placeholder="Primary contact name"
            />
          </div>

          <div className="form-group">
            <label>Lead Source</label>
            <select name="source" value={formData.source} onChange={handleChange}>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Referral</option>
              <option value="COLD_CALL">Cold Call</option>
              <option value="TRADE_SHOW">Trade Show</option>
              <option value="SOCIAL_MEDIA">Social Media</option>
            </select>
          </div>

          <div className="form-group">
            <label>Lead Score (0-100)</label>
            <input
              type="number"
              name="score"
              value={formData.score}
              onChange={handleChange}
              min="0"
              max="100"
            />
            <div className="form-help">Higher score = more likely to convert</div>
          </div>

          <div className="form-group">
            <label>Estimated Value</label>
            <input
              type="number"
              name="estimated_value"
              value={formData.estimated_value}
              onChange={handleChange}
              placeholder="0"
            />
            <div className="form-help">Expected revenue from this lead</div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional information about this lead..."
            />
          </div>
        </>
      )}

      <div className="drawer-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Lead'}
        </button>
      </div>
    </form>
  );
};

export default NewLeadForm;
