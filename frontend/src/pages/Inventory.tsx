/**
 * INVENTORY MANAGEMENT MODULE
 * 
 * Main page with nested routing for all inventory components
 */

import { Routes, Route } from 'react-router-dom';
import './Inventory.css';
import ItemManagement from '../modules/inventory/ItemManagement';
import StockLevels from '../modules/inventory/StockLevels';
import StockMovements from '../modules/inventory/StockMovements';
import StockAdjustments from '../modules/inventory/StockAdjustments';
import InventoryDashboard from '../modules/inventory/InventoryDashboard';

export default function Inventory() {
  return (
    <div className="inventory-module">
      <Routes>
        <Route index element={<InventoryDashboard />} />
        <Route path="items" element={<ItemManagement />} />
        <Route path="stock-levels" element={<StockLevels />} />
        <Route path="movements" element={<StockMovements />} />
        <Route path="adjustments" element={<StockAdjustments />} />
      </Routes>
    </div>
  );
}
