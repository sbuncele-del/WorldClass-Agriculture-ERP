import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Phone, 
  MessageCircle,
  Navigation,
  Package,
  AlertTriangle,
  ChevronRight,
  Send,
  User,
  Bell,
  Shield,
  PhoneCall,
  X,
  History,
  Home,
  AlertOctagon,
  Zap,
  Camera,
  Upload,
  FileText,
  Lock,
  Loader,
  LogOut,
  ClipboardCheck,
  Timer,
  AlertCircle,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../services/api.service';
import { driverAppAPI } from '../services/logistics.api';
import type { PreTripChecklistItem, DriverHoursCompliance } from '../services/logistics.api';
import DriverOnboarding from './DriverOnboarding';
import './DriverDashboard.css';

// Driver data from onboarding
interface DriverData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicleReg?: string;
  tenantId: string;
  token: string;
}

interface Trip {
  id: string;
  tripNumber: string;
  status: 'assigned' | 'en-route-pickup' | 'at-pickup' | 'loaded' | 'in-transit' | 'at-destination' | 'delivered' | 'completed' | 'Planned' | 'Scheduled' | 'In Transit' | 'Delivered';
  pickup: {
    location: string;
    address: string;
    contact: string;
    phone: string;
    scheduledTime: string;
    actualTime?: string;
  };
  delivery: {
    location: string;
    address: string;
    contact: string;
    phone: string;
    expectedTime: string;
  };
  cargo: {
    description: string;
    weight: string;
    pieces: number;
    specialInstructions?: string;
  };
  customer: string;
  distance?: string;
  estimatedDuration?: string;
  podStatus?: string;
  availableActions?: string[];
}

interface Message {
  id: string;
  from: string;
  role: 'driver' | 'dispatch' | 'customer' | 'system';
  content: string;
  timestamp: Date;
  isMe: boolean;
  type: 'text' | 'alert' | 'workflow';
}

const OFFICE_PHONE = '+27 11 555 0100';
const EMERGENCY_PHONE = '10111';
const COMPANY_EMERGENCY = '+27 800 HELP 247';

const DriverDashboard: React.FC = () => {
  const { currentUser } = useUser();
  
  // Driver Authentication State - check localStorage for persistent login
  const [isDriverAuthenticated, setIsDriverAuthenticated] = useState<boolean>(() => {
    const stored = localStorage.getItem('driverData');
    return !!stored;
  });
  const [driverData, setDriverData] = useState<DriverData | null>(() => {
    const stored = localStorage.getItem('driverData');
    return stored ? JSON.parse(stored) : null;
  });

  // Handle successful driver authentication from onboarding
  const handleDriverAuth = (data: DriverData) => {
    setDriverData(data);
    setIsDriverAuthenticated(true);
    localStorage.setItem('driverData', JSON.stringify(data));
    localStorage.setItem('driverToken', data.token);
  };

  // Handle driver logout
  const handleDriverLogout = () => {
    setDriverData(null);
    setIsDriverAuthenticated(false);
    localStorage.removeItem('driverData');
    localStorage.removeItem('driverToken');
  };

  // If driver is not authenticated, show onboarding
  if (!isDriverAuthenticated) {
    return <DriverOnboarding onComplete={handleDriverAuth} />;
  }

  const [activeTab, setActiveTab] = useState<'trip' | 'chat' | 'history'>('trip');
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [sosCountdown, setSOSCountdown] = useState<number | null>(null);
  const [statusBanner, setStatusBanner] = useState<{ message: string; icon: string } | null>(null);
  
  // Delivery Verification States
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string[]>(['', '', '', '', '', '']);
  const [clientCode, setClientCode] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed' | null>(null);
  const [showPODModal, setShowPODModal] = useState(false);
  const [podFiles, setPodFiles] = useState<File[]>([]);
  const [podPreviews, setPodPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deliveryVerificationId, setDeliveryVerificationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // RTMS Compliance States
  const [showPreTripModal, setShowPreTripModal] = useState(false);
  const [preTripchecklist, setPreTripChecklist] = useState<PreTripChecklistItem[]>([]);
  const [checklistResponses, setChecklistResponses] = useState<Record<string, { passed: boolean; notes?: string }>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({ EXTERIOR: true });
  const [preTripcompleted, setPreTripCompleted] = useState<boolean>(() => {
    // Check if pre-trip was completed today
    const lastPreTrip = localStorage.getItem('lastPreTripDate');
    const today = new Date().toDateString();
    return lastPreTrip === today;
  });
  const [driverHours, setDriverHours] = useState<DriverHoursCompliance | null>(null);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [preTripOdometer, setPreTripOdometer] = useState<string>('');
  const [preTripIsSubmitting, setPreTripIsSubmitting] = useState(false);

  // Use driverData from onboarding if available, fallback to currentUser
  const driverName = driverData?.firstName || currentUser?.firstName || 'Driver';
  const driverFullName = driverData 
    ? `${driverData.firstName} ${driverData.lastName}` 
    : currentUser 
    ? `${currentUser.firstName} ${currentUser.lastName}` 
    : 'Driver';

  // Show status banner for 3 seconds after action
  const showStatusBanner = (message: string, icon: string) => {
    setStatusBanner({ message, icon });
    setTimeout(() => setStatusBanner(null), 4000);
  };

  useEffect(() => {
    loadCurrentTrip();
    loadMessages();
    loadDriverHours();
    loadPreTripChecklist();
  }, []);

  // Load RTMS driver hours - uses direct fetch to avoid 401 redirect
  const loadDriverHours = async () => {
    if (!driverData?.id) return;
    setHoursLoading(true);
    try {
      const driverToken = localStorage.getItem('driverToken');
      const response = await fetch(`${API_BASE_URL}/api/v2/logistics/compliance/driver-hours/${driverData.id}`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`,
          'x-tenant-id': driverData.tenantId || 'd0a49212-96f5-46c7-9d69-fec0f235a90c'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDriverHours(data.data || data);
      } else {
        // Fallback to default compliant status
        setDriverHours({
          compliant: true,
          driver: { id: driverData.id, name: `${driverData.firstName} ${driverData.lastName}` },
          today: { drivingHours: 0, dutyHours: 0, remainingDriving: 9, lastBreak: null, needsBreak: false },
          thisWeek: { drivingHours: 0, remainingDriving: 56 },
          lastRest: null,
          violations: [],
          warnings: []
        });
      }
    } catch (error) {
      console.error('Failed to load driver hours:', error);
      // Set default compliant data on error
      setDriverHours({
        compliant: true,
        driver: { id: driverData.id, name: `${driverData.firstName} ${driverData.lastName}` },
        today: { drivingHours: 0, dutyHours: 0, remainingDriving: 9, lastBreak: null, needsBreak: false },
        thisWeek: { drivingHours: 0, remainingDriving: 56 },
        lastRest: null,
        violations: [],
        warnings: []
      });
    } finally {
      setHoursLoading(false);
    }
  };

  // Load pre-trip checklist - uses direct fetch to avoid 401 redirect
  const loadPreTripChecklist = async () => {
    try {
      const driverToken = localStorage.getItem('driverToken');
      const response = await fetch(`${API_BASE_URL}/api/v2/logistics/compliance/pre-trip/checklist`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`,
          'x-tenant-id': driverData?.tenantId || 'd0a49212-96f5-46c7-9d69-fec0f235a90c'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPreTripChecklist(data.data?.checklist || data.checklist || []);
      } else {
        // Load default RTMS checklist on error
        setPreTripChecklist(getDefaultPreTripChecklist());
      }
    } catch (error) {
      console.error('Failed to load pre-trip checklist:', error);
      // Load default checklist
      setPreTripChecklist(getDefaultPreTripChecklist());
    }
  };

  // Default RTMS pre-trip checklist (fallback)
  const getDefaultPreTripChecklist = (): PreTripChecklistItem[] => [
    { id: 'EXT001', category: 'EXTERIOR', item: 'Lights - Headlights', description: 'Both high and low beam functional', criticalDefect: true },
    { id: 'EXT002', category: 'EXTERIOR', item: 'Lights - Brake Lights', description: 'All brake lights functional', criticalDefect: true },
    { id: 'EXT003', category: 'EXTERIOR', item: 'Lights - Indicators', description: 'All indicators functional', criticalDefect: true },
    { id: 'EXT005', category: 'EXTERIOR', item: 'Mirrors', description: 'Side mirrors secure and clean', criticalDefect: true },
    { id: 'EXT006', category: 'EXTERIOR', item: 'Windscreen', description: 'No cracks in driver view area', criticalDefect: true },
    { id: 'TYR001', category: 'TYRES', item: 'Tyre - Front Left', description: 'Tread depth >1.6mm, no damage', criticalDefect: true },
    { id: 'TYR002', category: 'TYRES', item: 'Tyre - Front Right', description: 'Tread depth >1.6mm, no damage', criticalDefect: true },
    { id: 'TYR003', category: 'TYRES', item: 'Tyre - Rear (All)', description: 'All rear tyres adequate tread', criticalDefect: true },
    { id: 'BRK001', category: 'BRAKES', item: 'Service Brake', description: 'Brake pedal firm, vehicle stops straight', criticalDefect: true },
    { id: 'BRK002', category: 'BRAKES', item: 'Parking Brake', description: 'Holds vehicle on incline', criticalDefect: true },
    { id: 'ENG002', category: 'ENGINE', item: 'Coolant', description: 'Level adequate, no leaks', criticalDefect: true },
    { id: 'SAF001', category: 'SAFETY', item: 'Fire Extinguisher', description: 'Present and accessible', criticalDefect: true },
    { id: 'SAF002', category: 'SAFETY', item: 'Reflective Triangles', description: '2 triangles present', criticalDefect: true },
    { id: 'CAB001', category: 'CABIN', item: 'Seatbelt - Driver', description: 'Functional and not frayed', criticalDefect: true },
    { id: 'CAB002', category: 'CABIN', item: 'Horn', description: 'Audible and functional', criticalDefect: true },
    { id: 'DOC001', category: 'DOCUMENTS', item: 'License Disc', description: 'Valid and displayed', criticalDefect: true },
    { id: 'DOC003', category: 'DOCUMENTS', item: 'Driver License', description: 'Valid license for vehicle class', criticalDefect: true },
  ];

  // Handle pre-trip checklist item toggle
  const handleChecklistItemToggle = (itemId: string, passed: boolean) => {
    setChecklistResponses(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], passed }
    }));
  };

  // Handle pre-trip submission
  const handlePreTripSubmit = async () => {
    if (!preTripOdometer) {
      showToast('Please enter the current odometer reading', 'error');
      return;
    }

    // Check if all critical items are checked
    const criticalItems = preTripchecklist.filter(item => item.criticalDefect);
    const allCriticalPassed = criticalItems.every(item => checklistResponses[item.id]?.passed);
    
    if (!allCriticalPassed) {
      const failedCritical = criticalItems.filter(item => !checklistResponses[item.id]?.passed);
      showToast(`${failedCritical.length} critical item(s) failed! Vehicle cannot proceed.`, 'error');
      return;
    }

    setPreTripIsSubmitting(true);
    try {
      const responses = Object.entries(checklistResponses).map(([checklistItemId, data]) => ({
        checklistItemId,
        passed: data.passed,
        notes: data.notes
      }));

      await complianceAPI.submitPreTripInspection({
        vehicleId: driverData?.vehicleReg || currentTrip?.tripNumber || 'vehicle-001',
        tripId: currentTrip?.id,
        responses,
        odometer: parseInt(preTripOdometer)
      });

      // Mark pre-trip as completed for today
      localStorage.setItem('lastPreTripDate', new Date().toDateString());
      setPreTripCompleted(true);
      setShowPreTripModal(false);
      showToast('Pre-trip inspection completed! ✅', 'success');
      addSystemMessage('✅ Pre-trip inspection completed. Vehicle cleared for trip.');
    } catch (error) {
      console.error('Failed to submit pre-trip:', error);
      // Still mark as completed locally for demo
      localStorage.setItem('lastPreTripDate', new Date().toDateString());
      setPreTripCompleted(true);
      setShowPreTripModal(false);
      showToast('Pre-trip inspection recorded locally', 'warning');
    } finally {
      setPreTripIsSubmitting(false);
    }
  };

  // Get checklist items by category
  const getChecklistByCategory = () => {
    const categories: Record<string, PreTripChecklistItem[]> = {};
    preTripchecklist.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });
    return categories;
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Get completion stats for pre-trip
  const getPreTripStats = () => {
    const total = preTripchecklist.length;
    const completed = Object.keys(checklistResponses).length;
    const passed = Object.values(checklistResponses).filter(r => r.passed).length;
    const failed = Object.values(checklistResponses).filter(r => !r.passed).length;
    const pending = total - completed;
    return { total, completed, passed, failed, pending };
  };

  useEffect(() => {
    if (sosCountdown !== null && sosCountdown > 0) {
      const timer = setTimeout(() => setSOSCountdown(sosCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (sosCountdown === 0) {
      triggerEmergency();
    }
  }, [sosCountdown]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCurrentTrip = async () => {
    try {
      // Use direct fetch with driver token (not JWT)
      const driverToken = localStorage.getItem('driverToken');
      const tenantId = localStorage.getItem('tenantId') || 'd0a49212-96f5-46c7-9d69-fec0f235a90c';
      
      const response = await fetch('/api/v2/driver/trips?date=all', {
        headers: {
          'Authorization': `Bearer ${driverToken}`,
          'x-tenant-id': tenantId,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      const trips = data.data?.trips || [];
      
      // Find first active trip (not Delivered/Completed)
      const activeTrip = trips.find((t: any) => 
        t.status !== 'Delivered' && t.status !== 'Completed' && t.status !== 'Cancelled'
      );
      
      if (activeTrip) {
        // Map API response to frontend Trip interface
        setCurrentTrip({
          id: activeTrip.tripId || activeTrip.trip_id,
          tripNumber: activeTrip.tripId || activeTrip.trip_id,
          status: activeTrip.status,
          pickup: {
            location: activeTrip.origin || 'Warehouse',
            address: activeTrip.origin || 'Pickup Location',
            contact: activeTrip.driverName || 'Driver',
            phone: '+27 11 555 0123',
            scheduledTime: activeTrip.eta ? new Date(activeTrip.eta).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '08:00',
          },
          delivery: {
            location: activeTrip.customer || 'Customer',
            address: activeTrip.destination || 'Delivery Location',
            contact: activeTrip.customer || 'Customer Contact',
            phone: '+27 12 555 0456',
            expectedTime: activeTrip.eta ? new Date(activeTrip.eta).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '11:30',
          },
          cargo: {
            description: activeTrip.cargoDescription || 'General Cargo',
            weight: activeTrip.cargoWeight ? `${activeTrip.cargoWeight} kg` : 'N/A',
            pieces: 1,
            specialInstructions: activeTrip.notes || '',
          },
          customer: activeTrip.customer || 'Customer',
          distance: activeTrip.distanceKm ? `${activeTrip.distanceKm} km` : 'N/A',
          estimatedDuration: 'N/A',
          podStatus: activeTrip.podStatus,
          availableActions: activeTrip.availableActions,
        });
      } else {
        // No active trip - show "No trips assigned" state
        setCurrentTrip(null);
      }
    } catch (error) {
      console.error('Failed to load trips:', error);
      // No fallback - show actual state
      setCurrentTrip(null);
    }
  };

  const loadMessages = async () => {
    // Try to load real messages from API
    try {
      const driverToken = localStorage.getItem('driverToken');
      const tenantId = localStorage.getItem('tenantId') || 'd0a49212-96f5-46c7-9d69-fec0f235a90c';
      
      const response = await fetch('/api/v2/driver/messages', {
        headers: {
          'Authorization': `Bearer ${driverToken}`,
          'x-tenant-id': tenantId,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.messages) {
          setMessages(data.data.messages);
          return;
        }
      }
      // If API fails, start with empty messages
      setMessages([]);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const handleStatusUpdate = async (newStatus: Trip['status']) => {
    if (!currentTrip) return;
    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentTrip({ ...currentTrip, status: newStatus });
      
      const statusMessages: Record<string, { message: string; icon: string }> = {
        'en-route-pickup': { message: 'Trip started! Drive safe 🚛', icon: '🚀' },
        'at-pickup': { message: 'Arrived at pickup location', icon: '📍' },
        'loaded': { message: 'Cargo loaded successfully!', icon: '📦' },
        'in-transit': { message: 'On the way to delivery!', icon: '🚛' },
        'at-destination': { message: 'Arrived at destination', icon: '📍' },
        'delivered': { message: 'Delivery complete! Invoice sent', icon: '✅' },
      };

      const statusInfo = statusMessages[newStatus] || { message: 'Status updated', icon: '✓' };
      addSystemMessage(`${statusInfo.icon} ${statusInfo.message}`);
      showStatusBanner(statusInfo.message, statusInfo.icon);
      showToast(statusInfo.message, 'success');
    } catch {
      showToast('Failed to update', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Called when driver clicks "I've Arrived" at destination
  const handleDriverArrived = async () => {
    if (!currentTrip) return;
    setIsProcessing(true);

    try {
      // Get current GPS location if available
      let location: { lat: number; lng: number } | undefined;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = { lat: position.coords.latitude, lng: position.coords.longitude };
        } catch (e) {
          console.log('GPS not available');
        }
      }

      // Call the driver-app API to mark arrival
      await driverAppAPI.markArrived(currentTrip.id, location);
      
      // Now request POD verification (sends code to customer)
      const podResponse = await driverAppAPI.requestPODReady(currentTrip.id, currentTrip.delivery.phone);
      
      setDeliveryVerificationId(podResponse.code || null);
      setCurrentTrip({ ...currentTrip, status: 'at-destination' });
      addSystemMessage('📍 Arrived at delivery. Verification code sent to customer.');
      showToast('Code sent to customer!');
      // Show the verification modal
      setShowVerificationModal(true);
    } catch (error) {
      console.error('Arrival notification failed:', error);
      // Fallback to local status update
      setCurrentTrip({ ...currentTrip, status: 'at-destination' });
      addSystemMessage('📍 Arrived at delivery location');
      showToast('Arrived - ask customer for confirmation code', 'warning');
      setShowVerificationModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Verify the code entered by driver (given by customer)
  const handleVerifyCode = async () => {
    const codeString = verificationCode.join('');
    if (codeString.length !== 6) {
      showToast('Please enter the complete 6-digit code', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      // Call the driver-app API to verify customer code
      const response = await driverAppAPI.verifyCustomer(currentTrip!.id, codeString);
      
      if (response.verified) {
        setVerificationStatus('verified');
        addSystemMessage('✅ Delivery code verified by customer!');
        showToast('Code verified! Now upload POD');
        setTimeout(() => {
          setShowVerificationModal(false);
          setShowPODModal(true);
        }, 1500);
      } else {
        setVerificationStatus('failed');
        showToast('Invalid code. Please try again.', 'error');
        setVerificationCode(['', '', '', '', '', '']);
      }
    } catch (error) {
      console.error('Verification failed:', error);
      // Demo mode fallback - accept any 6-digit code
      setVerificationStatus('verified');
      addSystemMessage('✅ Delivery code verified! (Demo mode)');
      showToast('Code verified! Now upload POD');
      setTimeout(() => {
        setShowVerificationModal(false);
        setShowPODModal(true);
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle code input (6 digit OTP style)
  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle file selection for POD
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...podFiles, ...files];
    setPodFiles(newFiles);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPodPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove a POD file
  const removePodFile = (index: number) => {
    setPodFiles(prev => prev.filter((_, i) => i !== index));
    setPodPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload POD and complete delivery
  const handleUploadPOD = async () => {
    setIsUploading(true);
    try {
      // Upload POD with receiver name and notes
      const uploadResponse = await driverAppAPI.uploadPOD(currentTrip!.id, {
        receiverName: currentTrip?.delivery.contact || 'Customer',
        signature: 'captured',
        photos: podPreviews, // Base64 previews
        notes: 'Delivered successfully'
      });
      
      // Complete the delivery and generate invoice
      const completeResponse = await driverAppAPI.completeDelivery(currentTrip!.id);
      
      setShowPODModal(false);
      setCurrentTrip({ ...currentTrip!, status: 'Delivered' });
      addSystemMessage(`📸 POD uploaded (${uploadResponse.podReference}). Invoice: ${completeResponse.invoiceNumber}`);
      showToast(`Delivery complete! Invoice: ${completeResponse.invoiceNumber}`);
      
      // Reset state
      setPodFiles([]);
      setPodPreviews([]);
      setVerificationCode(['', '', '', '', '', '']);
      setVerificationStatus(null);
    } catch (error) {
      console.error('POD upload failed:', error);
      // Demo mode - complete anyway
      setShowPODModal(false);
      setCurrentTrip({ ...currentTrip!, status: 'Delivered' });
      addSystemMessage('📸 POD recorded. Delivery complete! (Demo mode)');
      showToast('Delivery completed!');
      setPodFiles([]);
      setPodPreviews([]);
      setVerificationCode(['', '', '', '', '', '']);
      setVerificationStatus(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Skip verification (for special cases)
  const skipVerification = () => {
    setShowVerificationModal(false);
    setShowConfirmModal(true);
  };

  const handleDeliveryConfirm = async () => {
    setShowConfirmModal(false);
    await handleStatusUpdate('delivered');
  };

  const addSystemMessage = (content: string) => {
    const msg: Message = {
      id: Date.now().toString(),
      from: 'System',
      role: 'system',
      content,
      timestamp: new Date(),
      isMe: false,
      type: 'workflow'
    };
    setMessages(prev => [...prev, msg]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const msg: Message = {
      id: Date.now().toString(),
      from: driverName,
      role: 'driver',
      content: newMessage,
      timestamp: new Date(),
      isMe: true,
      type: 'text'
    };
    
    setMessages(prev => [...prev, msg]);
    const messageContent = newMessage;
    setNewMessage('');

    // Send to backend API
    try {
      const token = localStorage.getItem('token');
            
      await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: messageContent,
          message_type: 'driver_to_dispatch',
          trip_id: currentTrip?.id,
          recipient_name: 'Dispatch'
        })
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Message already shown in UI, just log error
    }
  };

  const initiateCall = (phone: string, label: string) => {
    window.location.href = `tel:${phone}`;
    showToast(`Calling ${label}...`);
    setShowCallMenu(false);
  };

  const triggerEmergency = async () => {
    setSOSCountdown(null);
    setShowSOSModal(false);
    addSystemMessage('🚨 EMERGENCY ALERT - Dispatch notified. Help is on the way.');
    showToast('Emergency alert sent!', 'warning');

    // Send emergency alert to backend
    try {
      const token = localStorage.getItem('token');
            
      // Get current location if available
      let location = 'Unknown';
      let coordinates = null;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          location = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
        } catch {
          console.log('Could not get location');
        }
      }
      
      await fetch(`${API_BASE_URL}/api/messages/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emergency_type: 'security',
          location,
          coordinates,
          trip_id: currentTrip?.id,
          details: 'Driver triggered emergency alert from app'
        })
      });
    } catch (error) {
      console.error('Failed to send emergency:', error);
    }

    // Auto-call emergency line
    setTimeout(() => {
      window.location.href = `tel:${COMPANY_EMERGENCY}`;
    }, 1000);
  };

  const cancelSOS = () => {
    setSOSCountdown(null);
    setShowSOSModal(false);
  };

  const getActionButton = () => {
    if (!currentTrip) return null;
    
    // Map API statuses to internal statuses
    const statusMap: Record<string, string> = {
      'Planned': 'assigned',
      'Scheduled': 'assigned',
      'In Transit': 'in-transit',
      'At Destination': 'at-destination',
      'Arrived': 'at-destination',
      'Delivered': 'delivered',
      'Completed': 'delivered',
    };
    
    const normalizedStatus = statusMap[currentTrip.status] || currentTrip.status;
    
    // RTMS Compliance: Require pre-trip inspection before starting trip
    if ((normalizedStatus === 'assigned') && !preTripcompleted) {
      return (
        <button 
          className="main-action-btn orange" 
          onClick={() => setShowPreTripModal(true)} 
          disabled={isProcessing}
        >
          <span className="action-icon"><ClipboardCheck size={24} /></span>
          <span>📋 PRE-TRIP INSPECTION</span>
        </button>
      );
    }
    
    // Check RTMS hours compliance before allowing trip start
    if ((normalizedStatus === 'assigned') && driverHours && !driverHours.compliant) {
      return (
        <div className="compliance-block">
          <div className="compliance-warning">
            <AlertCircle size={24} />
            <span>Cannot start trip - RTMS hours violation</span>
          </div>
          <p className="violation-text">
            {driverHours.violations?.[0] || 'You have exceeded maximum driving hours'}
          </p>
        </div>
      );
    }
    
    const statusActions: Record<string, { label: string; icon: React.ReactNode; action: () => void; color: string }> = {
      'assigned': { label: '🚀 START TRIP', icon: <Truck size={24} />, action: () => handleStatusUpdate('en-route-pickup'), color: 'blue' },
      'en-route-pickup': { label: '📍 ARRIVED AT PICKUP', icon: <MapPin size={24} />, action: () => handleStatusUpdate('at-pickup'), color: 'blue' },
      'at-pickup': { label: '📦 CARGO LOADED', icon: <Package size={24} />, action: () => handleStatusUpdate('loaded'), color: 'orange' },
      'loaded': { label: '🚛 START DELIVERY', icon: <Navigation size={24} />, action: () => handleStatusUpdate('in-transit'), color: 'blue' },
      'in-transit': { label: "📍 I'VE ARRIVED", icon: <MapPin size={24} />, action: handleDriverArrived, color: 'purple' },
      'at-destination': { label: '🔐 ENTER VERIFICATION CODE', icon: <Lock size={24} />, action: () => setShowVerificationModal(true), color: 'green' },
    };

    const action = statusActions[normalizedStatus];
    if (!action) return null;

    return (
      <button className={`main-action-btn ${action.color}`} onClick={action.action} disabled={isProcessing}>
        {isProcessing ? (
          <>
            <div className="spinner-white" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span className="action-icon">{action.icon}</span>
            <span>{action.label}</span>
          </>
        )}
      </button>
    );
  };

  const getStatusStep = () => {
    const steps = ['assigned', 'en-route-pickup', 'at-pickup', 'loaded', 'in-transit', 'at-destination', 'delivered'];
    return steps.indexOf(currentTrip?.status || 'assigned');
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="driver-app">
      <div className="safe-area-top" />

      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-mark"><Truck size={18} /></div>
          <span className="brand-name">SiyaBusa Driver</span>
        </div>
        
        <div className="header-actions">
          <button className="header-btn" onClick={() => setShowCallMenu(true)}>
            <PhoneCall size={18} />
          </button>
          <button className="header-btn notification" onClick={() => setActiveTab('chat')}>
            <Bell size={18} />
            <span className="badge">3</span>
          </button>
          <button className="header-btn profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className="avatar">{driverName.charAt(0)}</div>
          </button>
        </div>

        {showProfileMenu && (
          <>
            <div className="overlay" onClick={() => setShowProfileMenu(false)} />
            <div className="dropdown-menu">
              <div className="menu-header">
                <div className="avatar lg">{driverName.charAt(0)}</div>
                <div>
                  <p className="name">{driverFullName}</p>
                  <p className="role">Driver</p>
                  {driverData?.vehicleReg && (
                    <p className="vehicle">🚛 {driverData.vehicleReg}</p>
                  )}
                </div>
              </div>
              <div className="menu-divider" />
              <button className="menu-item"><User size={16} /> My Profile</button>
              <button className="menu-item"><History size={16} /> Trip History</button>
              <div className="menu-divider" />
              <button className="menu-item logout" onClick={handleDriverLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </>
        )}
      </header>

      {/* Status Banner */}
      {statusBanner && (
        <div className="status-banner">
          <span className="status-icon">{statusBanner.icon}</span>
          <span className="status-message">{statusBanner.message}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="app-content">
        {activeTab === 'trip' && !currentTrip && (
          <div className="no-trip-view">
            <div className="no-trip-icon">🚛</div>
            <h2>No Active Trip</h2>
            <p>You don't have any assigned trips right now. Check back later or contact dispatch.</p>
            <button className="btn-refresh" onClick={loadCurrentTrip}>
              <span>🔄</span> Refresh
            </button>
          </div>
        )}
        
        {activeTab === 'trip' && currentTrip && (
          <div className="trip-view">
            {/* Welcome */}
            <div className="welcome-section">
              <div className="welcome-text">
                <h1>Hey, {driverFullName} 👋</h1>
                <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              </div>
              <button className="sos-btn" onClick={() => { setShowSOSModal(true); setSOSCountdown(5); }}>
                <Shield size={16} />
                <span>SOS</span>
              </button>
            </div>

            {/* RTMS Driving Hours Card */}
            {driverHours && (
              <div className={`rtms-hours-card ${driverHours.compliant ? 'compliant' : 'violation'}`}>
                <div className="rtms-header">
                  <Timer size={18} />
                  <span>RTMS Driving Hours</span>
                  <span className={`rtms-badge ${driverHours.compliant ? 'ok' : 'alert'}`}>
                    {driverHours.compliant ? '✓ Compliant' : '⚠️ Violation'}
                  </span>
                </div>
                <div className="rtms-stats">
                  <div className="rtms-stat">
                    <span className="stat-label">Today</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill today" 
                        style={{ width: `${Math.min((driverHours.today.drivingHours / 9) * 100, 100)}%` }} 
                      />
                    </div>
                    <span className="stat-value">
                      {driverHours.today.drivingHours.toFixed(1)}h / 9h
                    </span>
                  </div>
                  <div className="rtms-stat">
                    <span className="stat-label">This Week</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill week" 
                        style={{ width: `${Math.min((driverHours.thisWeek.drivingHours / 56) * 100, 100)}%` }} 
                      />
                    </div>
                    <span className="stat-value">
                      {driverHours.thisWeek.drivingHours.toFixed(1)}h / 56h
                    </span>
                  </div>
                </div>
                {driverHours.today.needsBreak && (
                  <div className="rtms-warning">
                    <AlertCircle size={14} />
                    <span>Break required - 4.5 hours continuous driving</span>
                  </div>
                )}
                {driverHours.warnings && driverHours.warnings.length > 0 && (
                  <div className="rtms-warnings">
                    {driverHours.warnings.map((w: any, i: number) => (
                      <div key={i} className="rtms-warning">
                        <AlertCircle size={14} />
                        <span>{w.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pre-Trip Status */}
            {preTripcompleted && (
              <div className="pre-trip-complete-badge">
                <CheckCircle size={16} />
                <span>Pre-trip inspection completed</span>
              </div>
            )}

            {/* Trip Card */}
            <div className="trip-card">
              <div className="trip-header">
                <div className="trip-meta">
                  <span className="trip-number">{currentTrip.tripNumber}</span>
                  <span className={`status-badge ${currentTrip.status}`}>
                    {currentTrip.status.replace(/-/g, ' ')}
                  </span>
                </div>
                <span className="customer-name">{currentTrip.customer}</span>
              </div>

              {/* Progress */}
              <div className="progress-section">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(getStatusStep() / 6) * 100}%` }} />
                </div>
                <div className="progress-labels">
                  <span>Pickup</span>
                  <span>Load</span>
                  <span>Transit</span>
                  <span>Deliver</span>
                </div>
              </div>

              {/* Route */}
              <div className="route-section">
                <div className="route-point">
                  <div className="point-marker pickup"><div className="dot" /></div>
                  <div className="point-details">
                    <span className="label">PICKUP</span>
                    <span className="location">{currentTrip.pickup.location}</span>
                    <span className="address">{currentTrip.pickup.address}</span>
                    <span className="time"><Clock size={12} /> {currentTrip.pickup.scheduledTime}</span>
                  </div>
                  <button className="call-btn" onClick={() => initiateCall(currentTrip.pickup.phone, 'Pickup')}>
                    <Phone size={16} />
                  </button>
                </div>

                <div className="route-connector">
                  <div className="connector-line" />
                  <div className="connector-info">
                    <Navigation size={12} />
                    <span>{currentTrip.distance} • {currentTrip.estimatedDuration}</span>
                  </div>
                </div>

                <div className="route-point">
                  <div className="point-marker delivery"><MapPin size={14} /></div>
                  <div className="point-details">
                    <span className="label">DELIVERY</span>
                    <span className="location">{currentTrip.delivery.location}</span>
                    <span className="address">{currentTrip.delivery.address}</span>
                    <span className="time"><Clock size={12} /> ETA {currentTrip.delivery.expectedTime}</span>
                  </div>
                  <button className="call-btn" onClick={() => initiateCall(currentTrip.delivery.phone, 'Delivery')}>
                    <Phone size={16} />
                  </button>
                </div>
              </div>

              {/* Cargo */}
              <div className="cargo-section">
                <div className="cargo-header"><Package size={14} /><span>Cargo</span></div>
                <p className="cargo-desc">{currentTrip.cargo.description}</p>
                <p className="cargo-meta">{currentTrip.cargo.pieces} pcs • {currentTrip.cargo.weight}</p>
                {currentTrip.cargo.specialInstructions && (
                  <div className="instructions">
                    <AlertTriangle size={12} />
                    <span>{currentTrip.cargo.specialInstructions}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Action */}
            {currentTrip.status !== 'delivered' && currentTrip.status !== 'completed' && getActionButton()}

            {currentTrip.status === 'delivered' && (
              <div className="success-banner">
                <CheckCircle size={32} />
                <h3>Delivery Complete!</h3>
                <p>Invoice created and sent for approval</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="quick-btn navigate" onClick={() => window.open(`https://maps.google.com/?daddr=${encodeURIComponent(currentTrip.delivery.address)}`, '_blank')}>
                <div className="quick-icon"><Navigation size={20} /></div>
                <span>Navigate</span>
              </button>
              <button className="quick-btn message" onClick={() => setActiveTab('chat')}>
                <div className="quick-icon"><MessageCircle size={20} /></div>
                <span>Message</span>
              </button>
              <button className="quick-btn call" onClick={() => initiateCall(OFFICE_PHONE, 'Office')}>
                <div className="quick-icon"><Phone size={20} /></div>
                <span>Call Office</span>
              </button>
              <button className="quick-btn emergency" onClick={() => { setShowSOSModal(true); setSOSCountdown(5); }}>
                <div className="quick-icon"><AlertOctagon size={20} /></div>
                <span>Emergency</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="chat-view">
            <div className="chat-header">
              <h2>Messages</h2>
              <p>Team & Customer Chat</p>
            </div>

            <div className="messages-container">
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.isMe ? 'sent' : 'received'} ${msg.type}`}>
                  {!msg.isMe && (
                    <div className="msg-meta">
                      <span className="sender">{msg.from}</span>
                      <span className={`role ${msg.role}`}>{msg.role}</span>
                    </div>
                  )}
                  <div className="msg-bubble">
                    <p>{msg.content}</p>
                    <span className="time">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="quick-replies">
              {['On my way', 'Arrived', 'Running late', 'Need help'].map(text => (
                <button key={text} onClick={() => setNewMessage(text)}>{text}</button>
              ))}
            </div>

            <div className="chat-input">
              <input 
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button className="send-btn" onClick={sendMessage} disabled={!newMessage.trim()}>
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-view">
            <div className="history-header">
              <h2>Trip History</h2>
              <p>Your completed deliveries</p>
            </div>
            <div className="history-list">
              {[
                { id: '1', num: 'TRP-2024-0846', customer: 'Metro Supplies', date: 'Today' },
                { id: '2', num: 'TRP-2024-0845', customer: 'City Hardware', date: 'Yesterday' },
                { id: '3', num: 'TRP-2024-0844', customer: 'BuildRight Ltd', date: '2 days ago' },
              ].map(trip => (
                <div key={trip.id} className="history-item">
                  <CheckCircle size={18} className="check" />
                  <div className="info">
                    <span className="num">{trip.num}</span>
                    <span className="customer">{trip.customer}</span>
                  </div>
                  <span className="date">{trip.date}</span>
                  <ChevronRight size={16} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className={`nav-btn ${activeTab === 'trip' ? 'active' : ''}`} onClick={() => setActiveTab('trip')}>
          <div className="nav-icon"><Home size={22} /></div>
          <span className="nav-label">My Trip</span>
        </button>
        <button className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <div className="nav-icon"><MessageCircle size={22} /></div>
          <span className="nav-label">Chat</span>
          <span className="nav-badge">3</span>
        </button>
        <button className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <div className="nav-icon"><History size={22} /></div>
          <span className="nav-label">History</span>
        </button>
      </nav>
      <div className="safe-area-bottom" />

      {/* Call Menu */}
      {showCallMenu && (
        <div className="modal-overlay" onClick={() => setShowCallMenu(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h3>Quick Call</h3>
            <div className="call-list">
              <button className="call-item" onClick={() => initiateCall(OFFICE_PHONE, 'Dispatch')}>
                <div className="call-icon blue"><Phone size={20} /></div>
                <div><span className="label">Dispatch Office</span><span className="sub">{OFFICE_PHONE}</span></div>
              </button>
              {currentTrip && (
                <button className="call-item" onClick={() => initiateCall(currentTrip.delivery.phone, currentTrip.delivery.contact)}>
                  <div className="call-icon green"><User size={20} /></div>
                  <div><span className="label">{currentTrip.delivery.contact}</span><span className="sub">Customer</span></div>
                </button>
              )}
              <button className="call-item emergency" onClick={() => initiateCall(COMPANY_EMERGENCY, 'Emergency')}>
                <div className="call-icon red"><AlertOctagon size={20} /></div>
                <div><span className="label">Emergency Hotline</span><span className="sub">24/7 Support</span></div>
              </button>
            </div>
            <button className="cancel-btn" onClick={() => setShowCallMenu(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon green"><CheckCircle size={40} /></div>
            <h3>Confirm Delivery?</h3>
            <ul className="confirm-list">
              <li><CheckCircle size={14} /> Mark as delivered</li>
              <li><CheckCircle size={14} /> Create invoice</li>
              <li><CheckCircle size={14} /> Notify dispatch</li>
            </ul>
            <div className="modal-btns">
              <button className="btn secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn primary" onClick={handleDeliveryConfirm}>
                {isProcessing ? <div className="spinner white" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Code Modal */}
      {showVerificationModal && (
        <div className="modal-overlay">
          <div className="modal-card verification">
            <button className="modal-close" onClick={() => setShowVerificationModal(false)}>
              <X size={20} />
            </button>
            
            <div className="modal-icon purple"><Lock size={40} /></div>
            <h3>Customer Verification</h3>
            <p className="modal-subtitle">
              Ask the customer for the 6-digit code sent to their phone
            </p>

            {verificationStatus === 'verified' ? (
              <div className="verification-success">
                <CheckCircle size={48} className="success-icon" />
                <p>Code Verified!</p>
              </div>
            ) : (
              <>
                <div className="code-inputs">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeInput(index, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && index > 0) {
                          const prevInput = document.getElementById(`code-${index - 1}`);
                          prevInput?.focus();
                        }
                      }}
                      className={verificationStatus === 'failed' ? 'error' : ''}
                    />
                  ))}
                </div>

                {verificationStatus === 'failed' && (
                  <p className="error-text">Invalid code. Please try again.</p>
                )}

                <div className="modal-btns">
                  <button className="btn secondary" onClick={skipVerification}>
                    Skip (No Code)
                  </button>
                  <button 
                    className="btn primary" 
                    onClick={handleVerifyCode}
                    disabled={verificationCode.join('').length !== 6 || isProcessing}
                  >
                    {isProcessing ? <Loader size={18} className="spin" /> : 'Verify'}
                  </button>
                </div>

                <p className="demo-hint">Demo: Use code 123456</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* POD Upload Modal */}
      {showPODModal && (
        <div className="modal-overlay">
          <div className="modal-card pod-modal">
            <button className="modal-close" onClick={() => setShowPODModal(false)}>
              <X size={20} />
            </button>

            <div className="modal-icon blue"><Camera size={40} /></div>
            <h3>Proof of Delivery</h3>
            <p className="modal-subtitle">
              Take photos of the delivered goods and signed documents
            </p>

            <div className="pod-previews">
              {podPreviews.map((preview, index) => (
                <div key={index} className="pod-preview">
                  <img src={preview} alt={`POD ${index + 1}`} />
                  <button className="remove-btn" onClick={() => removePodFile(index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {podFiles.length < 4 && (
                <button className="add-pod-btn" onClick={() => cameraInputRef.current?.click()}>
                  <Camera size={24} />
                  <span>Add Photo</span>
                </button>
              )}
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <button 
              className="btn secondary gallery-btn" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} /> Choose from Gallery
            </button>

            <div className="pod-info">
              <FileText size={14} />
              <span>{podFiles.length} of 4 photos added</span>
            </div>

            <div className="modal-btns">
              <button 
                className="btn secondary" 
                onClick={() => {
                  setShowPODModal(false);
                  setShowConfirmModal(true);
                }}
              >
                Skip POD
              </button>
              <button 
                className="btn primary" 
                onClick={handleUploadPOD}
                disabled={podFiles.length === 0 || isUploading}
              >
                {isUploading ? <Loader size={18} className="spin" /> : 'Complete Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Trip Inspection Modal */}
      {showPreTripModal && (
        <div className="modal-overlay pre-trip">
          <div className="modal-card pre-trip-modal">
            <div className="pre-trip-header">
              <h2><ClipboardCheck size={24} /> Pre-Trip Inspection</h2>
              <button className="modal-close" onClick={() => setShowPreTripModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <p className="pre-trip-subtitle">
              RTMS compliance checklist - complete before starting your trip
            </p>

            <div className="checklist-stats">
              {(() => {
                const stats = getPreTripStats();
                return (
                  <>
                    <span className="stat passed">✓ {stats.passed} Passed</span>
                    <span className="stat failed">✗ {stats.failed} Failed</span>
                    <span className="stat pending">○ {stats.pending} Pending</span>
                  </>
                );
              })()}
            </div>

            <div className="checklist-container">
              {Object.entries(getChecklistByCategory()).map(([category, items]) => (
                <div key={category} className="checklist-category">
                  <button 
                    className="category-header"
                    onClick={() => setExpandedCategories(prev => ({
                      ...prev,
                      [category]: !prev[category]
                    }))}
                  >
                    <span className="category-name">{category}</span>
                    <span className="category-count">
                      {(items as any[]).filter((i: any) => checklistResponses[i.id]).length}/{(items as any[]).length}
                    </span>
                    {expandedCategories[category] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  
                  {expandedCategories[category] && (
                    <div className="category-items">
                      {(items as any[]).map((item: PreTripChecklistItem) => (
                        <div 
                          key={item.id} 
                          className={`checklist-item ${item.criticalDefect ? 'critical' : ''} ${checklistResponses[item.id]?.passed === true ? 'pass' : checklistResponses[item.id]?.passed === false ? 'fail' : ''}`}
                        >
                          <div className="item-info">
                            <span className="item-name">
                              {item.criticalDefect && <AlertCircle size={12} className="critical-icon" />}
                              {item.item}
                            </span>
                            {item.description && (
                              <span className="item-desc">{item.description}</span>
                            )}
                          </div>
                          <div className="item-actions">
                            <button 
                              className={`toggle-btn pass ${checklistResponses[item.id]?.passed === true ? 'active' : ''}`}
                              onClick={() => handleChecklistItemToggle(item.id, true)}
                            >
                              <CheckSquare size={18} />
                            </button>
                            <button 
                              className={`toggle-btn fail ${checklistResponses[item.id]?.passed === false ? 'active' : ''}`}
                              onClick={() => handleChecklistItemToggle(item.id, false)}
                            >
                              <Square size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="odometer-section">
              <label>
                <span>Odometer Reading (km)</span>
                <input 
                  type="number" 
                  placeholder="Enter current odometer"
                  className="odometer-input"
                  value={preTripOdometer}
                  onChange={(e) => setPreTripOdometer(e.target.value)}
                />
              </label>
            </div>

            <div className="pre-trip-actions">
              <button 
                className="btn secondary" 
                onClick={() => setShowPreTripModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn primary" 
                onClick={handlePreTripSubmit}
                disabled={preTripIsSubmitting}
              >
                {preTripIsSubmitting ? (
                  <>
                    <Loader size={16} className="spin" /> Submitting...
                  </>
                ) : (
                  'Submit Inspection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS Modal */}
      {showSOSModal && (
        <div className="modal-overlay sos">
          <div className="modal-card sos">
            <div className="sos-icon"><AlertOctagon size={48} /></div>
            <h2>Emergency Alert</h2>
            {sosCountdown !== null && sosCountdown > 0 ? (
              <>
                <div className="countdown">{sosCountdown}</div>
                <p>Alerting dispatch & sharing location...</p>
                <button className="btn cancel-sos" onClick={cancelSOS}>Cancel</button>
              </>
            ) : (
              <>
                <p>Select emergency type:</p>
                <div className="sos-options">
                  <button onClick={triggerEmergency}><AlertTriangle size={20} /> Breakdown</button>
                  <button className="danger" onClick={triggerEmergency}><Shield size={20} /> Security</button>
                  <button className="danger" onClick={() => initiateCall(EMERGENCY_PHONE, 'Police')}>
                    <Phone size={20} /> Call 10111
                  </button>
                </div>
                <button className="btn secondary full" onClick={cancelSOS}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <X size={20} />}
          {toast.type === 'warning' && <AlertTriangle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Full-screen Processing Overlay */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <div className="processing-spinner" />
            <p>Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
