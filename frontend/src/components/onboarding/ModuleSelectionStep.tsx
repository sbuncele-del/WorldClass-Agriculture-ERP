/**
 * Module Selection Step
 * Step 3 of onboarding wizard
 */

import { useState, useEffect } from 'react';
import onboardingService from '../../services/onboarding.service';
import type { OnboardingData } from '../../services/onboarding.service';

interface ModuleSelectionStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const ModuleSelectionStep = ({ data, onUpdate }: ModuleSelectionStepProps) => {
  const modules = onboardingService.getModuleOptions();
  
  const [selectedModules, setSelectedModules] = useState<string[]>(
    data.enabledModules || ['financial', 'sales', 'purchase', 'inventory']
  );

  useEffect(() => {
    onUpdate({ enabledModules: selectedModules });
  }, [selectedModules]);

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) => {
      if (prev.includes(moduleId)) {
        // Don't allow deselecting financial module
        if (moduleId === 'financial') {
          return prev;
        }
        return prev.filter((id) => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  const selectAll = () => {
    setSelectedModules(modules.map((m) => m.id));
  };

  const selectRecommended = () => {
    setSelectedModules(modules.filter((m) => m.recommended).map((m) => m.id));
  };

  return (
    <div className="onboarding-step-content">
      <div className="onboarding-header">
        <h1 className="onboarding-title">Choose your modules</h1>
        <p className="onboarding-subtitle">
          Select the features you need. You can always enable more later.
        </p>
      </div>

      <div className="module-quick-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={selectRecommended}
        >
          Recommended Only
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={selectAll}
        >
          Select All
        </button>
      </div>

      <div className="module-grid">
        {modules.map((module) => (
          <label
            key={module.id}
            className={`module-card ${
              selectedModules.includes(module.id) ? 'selected' : ''
            } ${module.id === 'financial' ? 'required' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedModules.includes(module.id)}
              onChange={() => toggleModule(module.id)}
              disabled={module.id === 'financial'}
            />
            <div className="module-content">
              <div className="module-header">
                <span className="module-icon">{module.icon}</span>
                <div className="module-title-wrapper">
                  <h3 className="module-title">{module.name}</h3>
                  {module.recommended && (
                    <span className="module-badge">Recommended</span>
                  )}
                  {module.id === 'financial' && (
                    <span className="module-badge required-badge">Required</span>
                  )}
                </div>
              </div>
              <p className="module-description">{module.description}</p>
              {selectedModules.includes(module.id) && (
                <div className="module-checkmark">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      <div className="onboarding-help">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>
          Don't worry! You can enable or disable modules anytime from your settings.
          Selected modules: <strong>{selectedModules.length}/{modules.length}</strong>
        </span>
      </div>
    </div>
  );
};

export default ModuleSelectionStep;
