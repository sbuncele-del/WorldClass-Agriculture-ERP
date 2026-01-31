import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Form,
  DatePicker,
  Select,
  InputNumber,
  Input,
  message
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  FireOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import { driversAPI, fuelAPI, vehiclesAPI } from '../../services/logistics.api';
import type { FuelTransaction as FuelTransactionDto } from '../../services/logistics.api';
import { exportToCSV, formatDate, formatCurrency } from '../../utils/export';
import './logistics-enterprise.css';

interface VehicleOption {
  value: string;
  label: string;
  registration: string;
  driverName?: string;
}

interface DriverOption {
  value: string;
  label: string;
}

const FuelManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<FuelTransactionDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  const tabs = [
    { id: 'command', label: '🎯 Command Center', path: '/logistics/dashboard' },
    { id: 'planner', label: '📋 Load Planner', path: '/logistics/planner' },
    { id: 'trips', label: '🚚 Trip Management', path: '/logistics/trips' },
    { id: 'fleet', label: '🚛 Fleet', path: '/logistics/fleet' },
    { id: 'drivers', label: '👨‍✈️ Drivers', path: '/logistics/drivers' },
    { id: 'routes', label: '🗺️ Routes', path: '/logistics/routes' },
    { id: 'incidents', label: '⚠️ Incidents', path: '/logistics/incidents' },
    { id: 'geofences', label: '📍 Geofences', path: '/logistics/geofences' },
    { id: 'fuel', label: '⛽ Fuel', path: '/logistics/fuel' },
    { id: 'reports', label: '📊 Reports', path: '/logistics/reports' },
  ];

  const breadcrumbs = [
    { label: 'Logistics', path: '/logistics' },
    { label: 'Fuel Management' }
  ];

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [fuelResponse, vehiclesResponse, driversResponse] = await Promise.all([
          fuelAPI.getFuelTransactions({ limit: '200' }),
          vehiclesAPI.getVehicles({ status: 'ACTIVE' }),
          driversAPI.getDrivers({ status: 'ACTIVE' })
        ]);

        setTransactions(fuelResponse.fuel_transactions || []);

        setVehicles(
          (vehiclesResponse.vehicles || []).map((vehicle: any) => ({
            value: String(vehicle.vehicle_id),
            label: `${vehicle.vehicle_registration}`,
            registration: vehicle.vehicle_registration,
            driverName: vehicle.current_driver
          }))
        );

        setDrivers(
          (driversResponse.drivers || []).map((driver: any) => ({
            value: String(driver.driver_id),
            label: `${driver.first_name} ${driver.last_name}`.trim()
          }))
        );
      } catch (error) {
        console.error('Error loading fuel data:', error);
        message.error('Could not load fuel transactions');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter((tx) =>
      [
        tx.transaction_number,
        tx.vehicle_registration,
        tx.driver_name,
        tx.fuel_station
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [transactions, searchTerm]);

  const summary = useMemo(() => {
    const totalLitres = filteredTransactions.reduce((sum, tx) => sum + Number(tx.litres || 0), 0);
    const totalSpend = filteredTransactions.reduce((sum, tx) => sum + Number(tx.total_amount || 0), 0);
    const avgPrice = totalLitres ? totalSpend / totalLitres : 0;
    const reconciled = filteredTransactions.filter((tx) => tx.reconciled).length;

    return {
      totalLitres,
      totalSpend,
      avgPrice,
      reconciled,
    };
  }, [filteredTransactions]);

  const columns: ColumnsType<FuelTransactionDto> = [
    {
      title: 'Txn #',
      dataIndex: 'transaction_number',
      key: 'transaction_number',
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 600 }}>{value || record.transaction_id}</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {dayjs(record.transaction_date).format('DD MMM YYYY HH:mm')}
          </span>
        </Space>
      )
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicle_registration',
      key: 'vehicle_registration',
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 600 }}>{value || 'Unassigned'}</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>Odometer {record.odometer_reading?.toLocaleString?.() || '—'} km</span>
        </Space>
      )
    },
    {
      title: 'Driver',
      dataIndex: 'driver_name',
      key: 'driver_name',
      render: (value: string) => value || 'Unassigned'
    },
    {
      title: 'Supplier',
      dataIndex: 'fuel_station',
      key: 'fuel_station',
    },
    {
      title: 'Litres',
      dataIndex: 'litres',
      key: 'litres',
      align: 'right',
      render: (value: number) => `${Number(value || 0).toFixed(2)} L`
    },
    {
      title: 'Price/L',
      dataIndex: 'price_per_litre',
      key: 'price_per_litre',
      align: 'right',
      render: (value: number) => `R ${Number(value || 0).toFixed(2)}`
    },
    {
      title: 'Total Cost',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (value: number) => (
        <span style={{ fontWeight: 600 }}>R {Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'reconciled',
      key: 'reconciled',
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'gold'}>{value ? 'Reconciled' : 'Pending'}</Tag>
      )
    }
  ];

  const openModal = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleCreateTransaction = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        vehicle_id: values.vehicle_id,
        driver_id: values.driver_id,
        transaction_date: values.transaction_date.toISOString(),
        transaction_number: values.transaction_number,
        fuel_station: values.fuel_station,
        location: values.location,
        litres: values.litres,
        price_per_litre: values.price_per_litre,
        odometer_reading: values.odometer_reading,
        payment_method: values.payment_method,
        fuel_type: values.fuel_type || 'Diesel'
      };

      const response = await fuelAPI.createFuelTransaction(payload);
      setTransactions((prev) => [response.fuel_transaction, ...prev]);
      message.success('Fuel transaction logged');
      setModalVisible(false);
    } catch (error) {
      if ((error as any).errorFields) {
        return;
      }
      console.error('Error creating fuel transaction:', error);
      message.error('Could not create fuel transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EnterpriseLayout
      moduleTitle="⛽ Fuel Management"
      moduleSubtitle="Track fuel costs and efficiency across your fleet"
      breadcrumbs={breadcrumbs}
      tabs={tabs}
      actionButtons={[
        {
          label: 'Log Fuel Transaction',
          icon: <PlusOutlined />,
          variant: 'primary' as const,
          onClick: openModal
        }
      ]}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Fuel Spend"
              value={summary.totalSpend}
              prefix={<DollarOutlined />}
              formatter={(value) => `R ${(Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Litres"
              value={summary.totalLitres}
              prefix={<FireOutlined />}
              formatter={(value) => `${(Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} L`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Price / L"
              value={summary.avgPrice}
              prefix={<ThunderboltOutlined />}
              formatter={(value) => `R ${(Number(value) || 0).toFixed(2)}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Reconciled"
              value={summary.reconciled}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Fuel Transactions"
        style={{ marginTop: 24 }}
        extra={
          <Space>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search vehicle, driver or supplier"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 280 }}
            />
            <Button icon={<ExportOutlined />} onClick={() => {
              exportToCSV(filteredTransactions, [
                { key: 'transaction_number', header: 'Transaction #' },
                { key: 'transaction_date', header: 'Date', formatter: formatDate },
                { key: 'vehicle_registration', header: 'Vehicle' },
                { key: 'driver_name', header: 'Driver' },
                { key: 'fuel_station', header: 'Supplier' },
                { key: 'litres', header: 'Litres' },
                { key: 'price_per_litre', header: 'Price/L' },
                { key: 'total_amount', header: 'Total', formatter: (v) => formatCurrency(v) },
                { key: 'odometer_reading', header: 'Odometer' },
              ], 'fuel_transactions');
              message.success('Fuel transactions exported to CSV');
            }}>Export</Button>
          </Space>
        }
      >
        <Table
          dataSource={filteredTransactions}
          columns={columns}
          loading={loading}
          rowKey={(record, index) => record.transaction_id || record.transaction_number || String(index)}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Log Fuel Transaction"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        onOk={handleCreateTransaction}
        okText="Log Transaction"
        width={720}
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{
            transaction_date: dayjs(),
            litres: 0,
            price_per_litre: 0,
            payment_method: 'Fuel Card',
            fuel_type: 'Diesel'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="transaction_date"
                label="Transaction Date"
                rules={[{ required: true, message: 'Select transaction date' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="transaction_number" label="Transaction Reference">
                <Input placeholder="Optional reference number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vehicle_id"
                label="Vehicle"
                rules={[{ required: true, message: 'Select vehicle' }]}
              >
                <Select placeholder="Select vehicle" options={vehicles} showSearch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="driver_id"
                label="Driver"
                rules={[{ required: true, message: 'Select driver' }]}
              >
                <Select placeholder="Select driver" options={drivers} showSearch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fuel_station"
                label="Fuel Supplier"
                rules={[{ required: true, message: 'Enter supplier name' }]}
              >
                <Input placeholder="e.g. Engen Midrand" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="Location">
                <Input placeholder="e.g. Midrand, Gauteng" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="litres"
                label="Litres"
                rules={[{ required: true, message: 'Enter litres pumped' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price_per_litre"
                label="Price per Litre (R)"
                rules={[{ required: true, message: 'Enter price per litre' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} prefix="R" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="odometer_reading"
                label="Odometer (km)"
                rules={[{ required: true, message: 'Enter odometer reading' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_method" label="Payment Method">
                <Select
                  options={[
                    { label: 'Fuel Card', value: 'Fuel Card' },
                    { label: 'Cash', value: 'Cash' },
                    { label: 'Corporate Card', value: 'Corporate Card' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </EnterpriseLayout>
  );
};

export default FuelManagement;
