/**
 * PageLoader - Simple Loading Indicator
 * Used for lazy-loaded pages and components
 */

import React from 'react';
import { Spin } from 'antd';

const PageLoader: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      minHeight: '300px',
      width: '100%'
    }}>
      <Spin size="large" tip="Loading..." />
    </div>
  );
};

export default PageLoader;
