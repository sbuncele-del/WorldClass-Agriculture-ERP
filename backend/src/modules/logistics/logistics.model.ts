// Logistics Load Model
export interface LogisticsLoad {
  loadNo: string;
  date: string;
  from: string;
  to: string;
  qty: number;
  rate: number;
  valueExcl: number;
  ldValue: number;
  orderNumber: string;
  commodity: string;
  vehicleReg: string;
  driver: string;
  status: 'REQUESTED' | 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED';
}
