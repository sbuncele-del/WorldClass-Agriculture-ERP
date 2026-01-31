/**
 * Team Members Step
 * Step 4 of onboarding wizard
 */

import { useState, useEffect } from 'react';
import onboardingService from '../../services/onboarding.service';
import type { OnboardingData } from '../../services/onboarding.service';

interface TeamMembersStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

interface TeamMember {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const TeamMembersStep = ({ data, onUpdate }: TeamMembersStepProps) => {
  const roles = onboardingService.getRoleOptions();
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    data.teamMembers || []
  );
  
  const [newMember, setNewMember] = useState<TeamMember>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'viewer',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    onUpdate({ teamMembers });
  }, [teamMembers]);

  const validateMember = (member: TeamMember): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!member.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
      newErrors.email = 'Invalid email format';
    } else if (teamMembers.some((m) => m.email === member.email)) {
      newErrors.email = 'This email is already added';
    }

    if (!member.firstName) {
      newErrors.firstName = 'First name is required';
    }

    if (!member.lastName) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddMember = () => {
    if (validateMember(newMember)) {
      setTeamMembers([...teamMembers, newMember]);
      setNewMember({
        email: '',
        firstName: '',
        lastName: '',
        role: 'viewer',
      });
      setErrors({});
    }
  };

  const handleRemoveMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleNewMemberChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewMember((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="onboarding-step-content">
      <div className="onboarding-header">
        <h1 className="onboarding-title">Invite your team</h1>
        <p className="onboarding-subtitle">
          Add team members who will use the system. They'll receive an invitation email.
        </p>
      </div>

      {/* Add new member form */}
      <div className="team-add-form">
        <h3 className="form-section-title">Add Team Member</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="colleague@company.com"
              value={newMember.email}
              onChange={handleNewMemberChange}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="firstName" className="form-label">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              className={`form-input ${errors.firstName ? 'input-error' : ''}`}
              placeholder="John"
              value={newMember.firstName}
              onChange={handleNewMemberChange}
            />
            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lastName" className="form-label">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              className={`form-input ${errors.lastName ? 'input-error' : ''}`}
              placeholder="Doe"
              value={newMember.lastName}
              onChange={handleNewMemberChange}
            />
            {errors.lastName && <span className="error-message">{errors.lastName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">
              Role
            </label>
            <select
              id="role"
              name="role"
              className="form-input"
              value={newMember.role}
              onChange={handleNewMemberChange}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleAddMember}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z" />
          </svg>
          Add Member
        </button>
      </div>

      {/* Team members list */}
      {teamMembers.length > 0 && (
        <div className="team-members-list">
          <h3 className="form-section-title">
            Team Members ({teamMembers.length})
          </h3>
          
          <div className="team-members-table">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-member-row">
                <div className="team-member-avatar">
                  {member.firstName.charAt(0)}
                  {member.lastName.charAt(0)}
                </div>
                <div className="team-member-info">
                  <div className="team-member-name">
                    {member.firstName} {member.lastName}
                  </div>
                  <div className="team-member-email">{member.email}</div>
                </div>
                <div className="team-member-role">
                  {roles.find((r) => r.value === member.role)?.label}
                </div>
                <button
                  type="button"
                  className="team-member-remove"
                  onClick={() => handleRemoveMember(index)}
                  title="Remove member"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {teamMembers.length === 0 && (
        <div className="team-empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="24" cy="14" r="6" />
            <path d="M12 38c0-6.627 5.373-12 12-12s12 5.373 12 12" />
          </svg>
          <p>No team members added yet</p>
          <span>Add team members above or skip this step for now</span>
        </div>
      )}

      <div className="onboarding-help">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>
          Team members will receive an invitation email to create their account and join your workspace.
          You can add or remove team members anytime.
        </span>
      </div>
    </div>
  );
};

export default TeamMembersStep;
