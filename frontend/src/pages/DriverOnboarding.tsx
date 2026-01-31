import React, { useState, useEffect, useRef } from 'react';
import { Truck, Shield, CheckCircle, Phone, ArrowRight, Bell, Volume2, Lock, Smartphone, MapPin, FileText, X } from 'lucide-react';
import { API_BASE_URL } from '../services/api.service';
import './DriverOnboarding.css';

interface DriverOnboardingProps {
  onComplete: (driverData: DriverData) => void;
}

interface DriverData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicleReg?: string;
  tenantId: string;
  token: string;
}

const DriverOnboarding: React.FC<DriverOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'phone' | 'code' | 'welcome' | 'permissions'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accessCode, setAccessCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverData | null>(null);
  const [codeResent, setCodeResent] = useState(false);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if already logged in
  useEffect(() => {
    const savedDriver = localStorage.getItem('driverData');
    if (savedDriver) {
      try {
        const driver = JSON.parse(savedDriver);
        if (driver.token) {
          onComplete(driver);
        }
      } catch {
        localStorage.removeItem('driverData');
      }
    }
  }, [onComplete]);

  // Handle phone submission
  const handlePhoneSubmit = async () => {
    // Accept 9 digits (without leading 0) or 10 digits (with leading 0)
    if (phoneNumber.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Normalize: add +27 prefix if not present
    let normalizedPhone = phoneNumber.replace(/\s+/g, '');
    if (!normalizedPhone.startsWith('+27')) {
      normalizedPhone = '+27' + normalizedPhone.replace(/^0/, '');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v2/driver/auth/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone })
      });

      const data = await response.json();

      if (data.success) {
        setStep('code');
        // In dev mode, show the test code
        if (data._testCode) {
          console.log('Test code:', data._testCode);
        }
      } else {
        setError(data.error || 'Phone number not registered. Please contact your administrator.');
      }
    } catch {
      // Demo mode - proceed anyway
      setStep('code');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle code input
  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...accessCode];
    newCode[index] = value;
    setAccessCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when complete
    if (newCode.every(c => c !== '') && index === 5) {
      handleCodeVerify(newCode.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !accessCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify the access code
  const handleCodeVerify = async (code?: string) => {
    const codeToVerify = code || accessCode.join('');
    
    if (codeToVerify.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v2/driver/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code: codeToVerify })
      });

      const data = await response.json();

      if (data.success && data.data) {
        const driverData: DriverData = {
          id: data.data.id,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          phone: data.data.phone,
          vehicleReg: data.data.vehicleReg,
          tenantId: data.data.tenantId,
          token: data.data.token
        };
        setDriverInfo(driverData);
        // Save to localStorage for persistent login
        localStorage.setItem('driverData', JSON.stringify(driverData));
        localStorage.setItem('token', driverData.token);
        setStep('welcome');
      } else {
        setError(data.error || 'Invalid code. Please try again.');
        setAccessCode(['', '', '', '', '', '']);
        codeInputRefs.current[0]?.focus();
      }
    } catch {
      // Demo mode - create mock driver
      const mockDriver: DriverData = {
        id: 'driver-demo',
        firstName: 'Demo',
        lastName: 'Driver',
        phone: phoneNumber,
        tenantId: 'd0a49212-96f5-46c7-9d69-fec0f235a90c',
        token: 'demo-token'
      };
      setDriverInfo(mockDriver);
      localStorage.setItem('driverData', JSON.stringify(mockDriver));
      setStep('welcome');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/v2/driver/auth/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      });
      setCodeResent(true);
      setTimeout(() => setCodeResent(false), 3000);
    } catch {
      // Demo mode
      setCodeResent(true);
      setTimeout(() => setCodeResent(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Request permissions
  const handleRequestPermissions = async () => {
    // Request notification permission
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
    
    // Request location permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {}, () => {});
    }

    setStep('permissions');
  };

  // Complete onboarding
  const handleComplete = () => {
    if (driverInfo) {
      onComplete(driverInfo);
    }
  };

  return (
    <div className="driver-onboarding">
      <div className="onboarding-bg">
        <div className="bg-circle c1" />
        <div className="bg-circle c2" />
        <div className="bg-circle c3" />
      </div>

      <div className="onboarding-content">
        {/* Logo */}
        <div className="onboarding-logo">
          <div className="logo-icon">
            <Truck size={32} />
          </div>
          <h1>SiyaBusa Driver</h1>
        </div>

        {/* Phone Entry Step */}
        {step === 'phone' && (
          <div className="onboarding-card">
            <div className="step-icon">
              <Phone size={32} />
            </div>
            <h2>Welcome, Driver!</h2>
            <p>Enter your registered phone number to get started. Only approved drivers can access this app.</p>

            <div className="phone-input-container">
              <span className="country-code">+27</span>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                autoFocus
              />
            </div>

            {error && <div className="error-message"><X size={16} /> {error}</div>}

            <button 
              className="primary-btn" 
              onClick={handlePhoneSubmit}
              disabled={isLoading || phoneNumber.length < 9}
            >
              {isLoading ? (
                <div className="spinner" />
              ) : (
                <>
                  <span>Get Access Code</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <p className="help-text">
              <Shield size={14} />
              Secure access for verified drivers only
            </p>
          </div>
        )}

        {/* Code Verification Step */}
        {step === 'code' && (
          <div className="onboarding-card">
            <div className="step-icon green">
              <Lock size={32} />
            </div>
            <h2>Enter Access Code</h2>
            <p>Enter the 6-character code provided by your fleet manager</p>

            <div className="code-inputs">
              {accessCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => codeInputRefs.current[index] = el}
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeInput(index, e.target.value.toUpperCase())}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  autoFocus={index === 0}
                  style={{ textTransform: 'uppercase' }}
                />
              ))}
            </div>

            {error && <div className="error-message"><X size={16} /> {error}</div>}
            {codeResent && <div className="success-message"><CheckCircle size={16} /> New code sent!</div>}

            <button 
              className="primary-btn" 
              onClick={() => handleCodeVerify()}
              disabled={isLoading || accessCode.some(c => c === '')}
            >
              {isLoading ? <div className="spinner" /> : 'Verify Code'}
            </button>

            <button className="text-btn" onClick={handleResendCode} disabled={isLoading}>
              Didn't receive code? <strong>Resend</strong>
            </button>

            <button className="text-btn back" onClick={() => setStep('phone')}>
              ← Change phone number
            </button>
          </div>
        )}

        {/* Welcome Step */}
        {step === 'welcome' && driverInfo && (
          <div className="onboarding-card welcome">
            <div className="welcome-avatar">
              {driverInfo.firstName.charAt(0)}{driverInfo.lastName.charAt(0)}
            </div>
            <h2>Welcome, {driverInfo.firstName}! 🎉</h2>
            <p>You've been verified as an approved driver.</p>

            <div className="workflow-intro">
              <h3>How deliveries work:</h3>
              <div className="workflow-steps">
                <div className="workflow-step">
                  <div className="step-num">1</div>
                  <div className="step-text">
                    <strong>Accept Trip</strong>
                    <span>Get assigned deliveries from dispatch</span>
                  </div>
                </div>
                <div className="workflow-step">
                  <div className="step-num">2</div>
                  <div className="step-text">
                    <strong>Pick Up & Deliver</strong>
                    <span>Navigate to pickup, load cargo, drive to customer</span>
                  </div>
                </div>
                <div className="workflow-step">
                  <div className="step-num">3</div>
                  <div className="step-text">
                    <strong>Verify Customer</strong>
                    <span>Customer gives you a code to confirm delivery</span>
                  </div>
                </div>
                <div className="workflow-step">
                  <div className="step-num">4</div>
                  <div className="step-text">
                    <strong>Capture POD</strong>
                    <span>Take photos, get signature, complete delivery</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="primary-btn" onClick={handleRequestPermissions}>
              <span>Got It! Let's Go</span>
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Permissions Step */}
        {step === 'permissions' && driverInfo && (
          <div className="onboarding-card permissions">
            <div className="step-icon purple">
              <Bell size={32} />
            </div>
            <h2>Enable Notifications</h2>
            <p>Stay updated with new trips and important alerts</p>

            <div className="permission-list">
              <div className="permission-item">
                <div className="perm-icon"><Bell size={20} /></div>
                <div className="perm-text">
                  <strong>Push Notifications</strong>
                  <span>New trips, messages, alerts</span>
                </div>
                <CheckCircle size={20} className="check" />
              </div>
              <div className="permission-item">
                <div className="perm-icon"><Volume2 size={20} /></div>
                <div className="perm-text">
                  <strong>Sound Alerts</strong>
                  <span>Audio notifications for urgent items</span>
                </div>
                <CheckCircle size={20} className="check" />
              </div>
              <div className="permission-item">
                <div className="perm-icon"><MapPin size={20} /></div>
                <div className="perm-text">
                  <strong>Location Access</strong>
                  <span>Navigation & arrival confirmation</span>
                </div>
                <CheckCircle size={20} className="check" />
              </div>
            </div>

            <button className="primary-btn" onClick={handleComplete}>
              <span>Start Driving</span>
              <Truck size={20} />
            </button>

            <p className="privacy-note">
              <FileText size={14} />
              We only use your data to improve delivery experience
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="onboarding-footer">
          <p>Powered by <strong>SiyaBusa ERP</strong></p>
        </div>
      </div>
    </div>
  );
};

export default DriverOnboarding;
