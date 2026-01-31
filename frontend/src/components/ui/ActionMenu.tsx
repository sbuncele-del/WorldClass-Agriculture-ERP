/**
 * Action Menu Component
 * Context menus for row actions with dropdown functionality
 */

import React, { useState, useRef, useEffect } from 'react';
import './ActionMenu.css';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
  disabled?: boolean;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  trigger,
  align = 'right',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item: ActionMenuItem) => {
    if (!item.disabled && !item.divider) {
      item.onClick();
      setIsOpen(false);
    }
  };

  const defaultTrigger = (
    <button className="action-menu-trigger" type="button" disabled={disabled}>
      <span className="action-menu-dots">⋮</span>
    </button>
  );

  return (
    <div className="action-menu" ref={menuRef}>
      <div onClick={() => !disabled && setIsOpen(!isOpen)}>
        {trigger || defaultTrigger}
      </div>

      {isOpen && (
        <div className={`action-menu-dropdown action-menu-${align}`}>
          {items.map((item) => {
            if (item.divider) {
              return <div key={item.id} className="action-menu-divider" />;
            }

            return (
              <button
                key={item.id}
                className={`action-menu-item ${item.danger ? 'action-menu-item-danger' : ''} ${
                  item.disabled ? 'action-menu-item-disabled' : ''
                }`}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                type="button"
              >
                {item.icon && <span className="action-menu-item-icon">{item.icon}</span>}
                <span className="action-menu-item-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Preset action menus for common scenarios
export const EditDeleteMenu: React.FC<{
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}> = ({ onEdit, onDelete, canEdit = true, canDelete = true }) => {
  const items: ActionMenuItem[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: '✎',
      onClick: onEdit,
      disabled: !canEdit,
    },
    {
      id: 'divider',
      label: '',
      onClick: () => {},
      divider: true,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: '🗑',
      onClick: onDelete,
      disabled: !canDelete,
      danger: true,
    },
  ];

  return <ActionMenu items={items} />;
};

export const ViewEditDeleteMenu: React.FC<{
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}> = ({ onView, onEdit, onDelete, canView = true, canEdit = true, canDelete = true }) => {
  const items: ActionMenuItem[] = [
    {
      id: 'view',
      label: 'View',
      icon: '👁',
      onClick: onView,
      disabled: !canView,
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: '✎',
      onClick: onEdit,
      disabled: !canEdit,
    },
    {
      id: 'divider',
      label: '',
      onClick: () => {},
      divider: true,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: '🗑',
      onClick: onDelete,
      disabled: !canDelete,
      danger: true,
    },
  ];

  return <ActionMenu items={items} />;
};

export default ActionMenu;
