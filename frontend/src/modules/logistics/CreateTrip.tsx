import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, DatePicker, InputNumber, Button, Card, Row, Col, message, Spin } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import { tripsAPI, vehiclesAPI, driversAPI } from '../../services/logistics.api';
import '../../styles/erp-ui.css';

const { TextArea } = Input;
const { Option } = Select;

const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      // Use the optimized form-data endpoint that fetches all data in one call
      const response = await tripsAPI.getFormData();
      if (response.data) {
        setCustomers(response.data.customers || []);
        setDrivers(response.data.drivers || []);
        setVehicles(response.data.vehicles || []);
      } else {
        // Fallback to individual calls if form-data endpoint fails
        const [driversRes, vehiclesRes, customersRes] = await Promise.all([
          driversAPI.getDrivers({ status: 'ACTIVE' }),
          vehiclesAPI.getVehicles({ status: 'ACTIVE' }),
          tripsAPI.getCustomers()
        ]);
        setDrivers(driversRes.drivers || []);
        setVehicles(vehiclesRes.vehicles || []);
        setCustomers(customersRes.customers || []);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      message.warning('Could not load form data. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const tabs = [
    { id: 'command', label: '🎯 Command Center', path: '/logistics/dashboard' },
    { id: 'planner', label: '📋 Load Planner', path: '/logistics/planner' },
    { id: 'trips', label: '🚚 Trip Management', path: '/logistics/trips' },
    { id: 'fleet', label: '🚛 Fleet', path: '/logistics/fleet' },
    { id: 'drivers', label: '👨‍✈️ Drivers', path: '/logistics/drivers' },
    { id: 'fuel', label: '⛽ Fuel', path: '/logistics/fuel' },
    { id: 'reports', label: '📊 Analytics', path: '/logistics/reports' }
  ];

  const breadcrumbs = [
    { label: 'Logistics', path: '/logistics' },
    { label: 'Trip Management', path: '/logistics/trips' },
    { label: 'Create New Trip' }
  ];

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const tripData = {
        customer: values.customer,
        origin: values.origin,
        destination: values.destination,
        driver: values.driver,
        vehicle_reg: values.vehicle_reg,
        eta: values.delivery_date?.toISOString(),
        cargo_description: values.cargo_description,
        cargo_weight_kg: values.cargo_weight,
        notes: values.special_instructions,
        status: 'Planned',
        pod_status: 'Pending'
      };

      await tripsAPI.createTrip(tripData);
      message.success('Trip created successfully!');
      navigate('/logistics/trips');
    } catch (error: any) {
      console.error('Error creating trip:', error);
      message.error(error.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EnterpriseLayout
      moduleTitle="Create New Trip"
      moduleSubtitle="Plan and assign delivery trip"
      breadcrumbs={breadcrumbs}
      tabs={tabs}
    >
      <Spin spinning={loadingData} tip="Loading...">
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark="optional"
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="customer"
                  label="Customer"
                  rules={[{ required: true, message: 'Please select a customer' }]}
                >
                  <Select 
                    placeholder="Select customer" 
                    size="large" 
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {customers.length > 0 ? customers.map((c: any) => (
                      <Option key={c.id} value={c.name}>
                        {c.name}{c.city ? ` (${c.city})` : ''}
                      </Option>
                    )) : (
                      <Option value="" disabled>No customers available - add in Sales module</Option>
                    )}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="driver"
                  label="Assign Driver"
                  rules={[{ required: true, message: 'Please select a driver' }]}
                >
                  <Select 
                    placeholder="Select driver" 
                    size="large" 
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {drivers.length > 0 ? drivers.map(d => (
                      <Option key={d.driver_id} value={`${d.first_name} ${d.last_name}`}>
                        {d.first_name} {d.last_name}{d.license_number ? ` (${d.license_number})` : ''}
                      </Option>
                    )) : (
                      <Option value="" disabled>No drivers available - add in Driver Management</Option>
                    )}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="origin"
                  label="Origin"
                  rules={[{ required: true, message: 'Please enter origin' }]}
                >
                  <Input placeholder="e.g., JHB Distribution Center" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="destination"
                  label="Destination"
                  rules={[{ required: true, message: 'Please enter destination' }]}
                >
                  <Input placeholder="e.g., Cape Town DC" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="vehicle_reg"
                  label="Vehicle"
                  rules={[{ required: true, message: 'Please select a vehicle' }]}
                >
                  <Select 
                    placeholder="Select vehicle" 
                    size="large" 
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {vehicles.length > 0 ? vehicles.map(v => (
                      <Option key={v.vehicle_id} value={v.registration_number}>
                        {v.registration_number} - {v.make} {v.model} ({v.vehicle_type})
                      </Option>
                    )) : (
                      <Option value="" disabled>No vehicles available - add in Fleet Management</Option>
                    )}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="delivery_date"
                  label="Expected Delivery"
                  rules={[{ required: true, message: 'Please select delivery date' }]}
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                    size="large"
                    placeholder="Select date and time"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="cargo_weight"
                  label="Cargo Weight (kg)"
                  rules={[{ required: true, message: 'Please enter cargo weight' }]}
                >
                  <InputNumber
                    placeholder="e.g., 12000"
                    style={{ width: '100%' }}
                    size="large"
                    min={0}
                    max={50000}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  name="cargo_description"
                  label="Cargo Description"
                  rules={[{ required: true, message: 'Please enter cargo description' }]}
                >
                  <Input placeholder="e.g., Palletized groceries - ambient goods" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  name="special_instructions"
                  label="Special Instructions"
                >
                  <TextArea
                    rows={3}
                    placeholder="e.g., Requires refrigeration, fragile items, gate code: 1234"
                  />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button
                size="large"
                icon={<CloseOutlined />}
                onClick={() => navigate('/logistics/trips')}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={loading}
              >
                Create Trip
              </Button>
            </div>
          </Form>
        </Card>
      </Spin>
    </EnterpriseLayout>
  );
};

export default CreateTrip;
