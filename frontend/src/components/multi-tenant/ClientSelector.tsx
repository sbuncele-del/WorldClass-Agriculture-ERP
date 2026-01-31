/**
 * Client Selector Component
 * Dropdown for switching between clients in multi-tenant environment
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, Check } from 'lucide-react';
import { useClient } from '../../contexts/ClientContext';
import './ClientSelector.css';

const ClientSelector: React.FC = () => {
  const { currentClient, availableClients, switchClient, isLoading } = useClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClientSelect = async (clientId: string) => {
    if (clientId !== currentClient?.id) {
      await switchClient(clientId);
      setIsOpen(false);
    }
  };

  if (!currentClient) {
    return (
      <div className="client-selector">
        <div className="client-selector-button loading">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="client-selector" ref={dropdownRef}>
      <button
        className={`client-selector-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <div className="client-selector-icon">
          <Building2 size={18} />
        </div>
        <div className="client-selector-info">
          <div className="client-selector-label">Client</div>
          <div className="client-selector-name">{currentClient.displayName}</div>
        </div>
        <ChevronDown size={16} className={`client-selector-arrow ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="client-selector-dropdown">
          <div className="client-selector-header">
            <h3>Switch Client</h3>
            <p>{availableClients.length} clients available</p>
          </div>
          
          <div className="client-selector-list">
            {availableClients.map(client => (
              <button
                key={client.id}
                className={`client-selector-item ${client.id === currentClient.id ? 'active' : ''}`}
                onClick={() => handleClientSelect(client.id)}
              >
                <div className="client-item-avatar">
                  {client.code}
                </div>
                <div className="client-item-info">
                  <div className="client-item-name">{client.name}</div>
                  <div className="client-item-details">
                    {client.type} • {client.businessUnits} business units
                  </div>
                </div>
                {client.id === currentClient.id && (
                  <Check size={18} className="client-item-check" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSelector;
