import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BedDouble,
  ChevronRight,
  FileClock,
  Home,
  MessageSquareWarning,
  Pill,
  ScanText,
  Search,
  Shield,
  Settings2,
  ShieldCheck,
  Stethoscope,
  Ticket,
} from 'lucide-react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AdminBedTools } from './components/AdminBedTools';
import { AdminComplaintTools } from './components/AdminComplaintTools';
import { AdminDoctorTools } from './components/AdminDoctorTools';
import { AdminMedicalHistoryTools } from './components/AdminMedicalHistoryTools';
import { AdminLogin } from './components/AdminLogin';
import type { AdminAccessRole, AdminSession } from './components/AdminLogin';
import { AdminMachineTools } from './components/AdminMachineTools';
import { AdminPharmacyTools } from './components/AdminPharmacyTools';
import { AdminQueueTools } from './components/AdminQueueTools';
import { BedPanel } from './components/BedPanel';
import { ComplaintPanel } from './components/ComplaintPanel';
import { DoctorPanel } from './components/DoctorPanel';
import { MachinePanel } from './components/MachinePanel';
import { MedicalHistoryPanel } from './components/MedicalHistoryPanel';
import { MedicinePanel } from './components/MedicinePanel';
import { PatientChatWidget } from './components/PatientChatWidget';
import { QueuePanel } from './components/QueuePanel';
import { VisionPanel } from './components/VisionPanel';
import { ADMIN_AUTH_EXPIRED_EVENT, ADMIN_PROFILE_STORAGE_KEY, ADMIN_TOKEN_STORAGE_KEY, api } from './lib/api';
import type { Bed, Complaint, Doctor, Machine, MedicalHistory, Medicine, QueueItem } from './types';

const patientLinks = [
  { to: '/queue', label: 'Smart Queue', icon: Ticket },
  { to: '/medicines', label: 'Medicine Hub', icon: Pill },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/machines', label: 'Machines', icon: Settings2 },
  { to: '/beds', label: 'Beds & Wards', icon: BedDouble },
  { to: '/scan', label: 'Scan', icon: ScanText },
  { to: '/history', label: 'Past History', icon: FileClock },
  { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning },
];

const adminLinks = [
  { to: '/admin/queue', label: 'Queue Desk', icon: Ticket },
  { to: '/admin/pharmacy', label: 'Pharmacy', icon: Pill },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/machines', label: 'Machines', icon: Settings2 },
  { to: '/admin/beds', label: 'Beds', icon: BedDouble },
  { to: '/admin/history', label: 'Medical History', icon: FileClock },
  { to: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
];

type InsightCard = {
  label: string;
  value: string;
  note: string;
};

type AdminProfile = {
  email: string;
  role: AdminAccessRole;
  sub_role: string | null;
};

type AdminOverviewData = {
  queue: { waiting: number; called: number; done: number; estimatedWaitMinutes: number };
  queueItems: QueueItem[];
  beds: { available: number; occupied: number; cleaning: number };
  bedItems: Bed[];
  doctors: Doctor[];
  machines: Machine[];
  medicines: Medicine[];
  medicalHistories: MedicalHistory[];
  complaints: Complaint[];
};



const AppFrame = ({
  children,
  adminToken,
  onLogout,
}: {
  children: ReactNode;
  adminToken: string | null;
  onLogout?: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeSection = useMemo(() => {
    if (location.pathname.startsWith('/admin')) return 'Admin';
    if (location.pathname === '/access') return 'Switch User';
    if (location.pathname === '/') return 'Patient Portal';
    const link = patientLinks.find(l => location.pathname.startsWith(l.to));
    return link ? link.label : 'Patient Portal';
  }, [location.pathname]);

  const showAdminNav = Boolean(adminToken);
  const showPatientChat = !location.pathname.startsWith('/admin') && location.pathname !== '/access';
  const mobileLinks = adminToken
    ? [
        { to: '/', label: 'Home', icon: Home },
        { to: '/queue', label: 'Queue', icon: Ticket },
        { to: '/admin', label: 'Admin', icon: ShieldCheck },
        { to: '/access', label: 'Switch', icon: Shield },
      ]
    : [
        { to: '/', label: 'Home', icon: Home },
        { to: '/queue', label: 'Queue', icon: Ticket },
        { to: '/medicines', label: 'Meds', icon: Pill },
        { to: '/scan', label: 'Scan', icon: ScanText },
      ];

  const handleShellLogout = () => {
    onLogout?.();
    navigate('/access', { replace: true });
  };

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark large-mark">GH</div>
          <div className="sidebar-brand-copy">
            <strong>Govt Hospital</strong>
            <span>Srinagar</span>
          </div>
        </div>

        {showAdminNav ? (
          <div className="sidebar-group">
            <p className="sidebar-label">Admin Pages</p>
            <nav className="sidebar-nav">
              <NavLink to="/admin" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                <ShieldCheck size={18} />
                <span>Overview</span>
              </NavLink>
              {adminLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ) : null}

        <div className="sidebar-group">
          <p className="sidebar-label">Patient Pages</p>
          <nav className="sidebar-nav">
            {patientLinks.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-note">
            <span>{adminToken ? 'Admin session active' : 'Patient mode active'}</span>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar refined-topbar">
          <div className="search-shell">
            <Search size={16} />
            <span>{activeSection}</span>
          </div>
          <nav className="topnav compact-topnav role-switcher" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <NavLink to="/">Patient</NavLink>
            {adminToken ? (
              <>
                <NavLink to="/admin">Admin Panel</NavLink>
                <button 
                  type="button" 
                  onClick={handleShellLogout} 
                  style={{ 
                    background: 'transparent', 
                    color: 'var(--danger)', 
                    border: 'none', 
                    padding: '0.4rem 0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/access">Staff Login</NavLink>
            )}
          </nav>
        </header>

        <div className="content-shell">{children}</div>
        {showPatientChat ? <PatientChatWidget /> : null}

        <nav className="mobile-dock">
          {mobileLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `mobile-dock-link${isActive ? ' active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

const PatientHome = () => (
  <main className="page-shell centered-shell">
    <section className="hero clinical-hero centered-hero">
      <div className="hero-copy centered-copy">
        <p className="eyebrow">Govt Hospital, Srinagar</p>
        <h1>Welcome to Govt Hospital</h1>
        <p className="hero-text">
          Authorized personnel please log in to access the hospital management system.
        </p>
        <div className="hero-cta-row centered-cta">
          <Link className="hero-primary-link" to="/admin">
            Staff Login
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  </main>
);

const AdminOverviewCharts = ({ token }: { token: string }) => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError('');
        const [queue, beds, doctors, machines, medicines, medicalHistories, complaints] = await Promise.all([
          api.get<{ items: QueueItem[]; summary: AdminOverviewData['queue'] }>('/queue', token),
          api.get<{ items: Bed[]; summary: AdminOverviewData['beds'] }>('/beds', token),
          api.get<{ items: Doctor[] }>('/doctors', token),
          api.get<{ items: Machine[] }>('/machines', token),
          api.get<{ items: Medicine[] }>('/medicines', token),
          api.get<{ items: MedicalHistory[] }>('/medical-history', token),
          api.get<{ items: Complaint[] }>('/complaints', token),
        ]);

        if (cancelled) {
          return;
        }

        setData({
          queue: queue.summary,
          queueItems: queue.items,
          beds: beds.summary,
          bedItems: beds.items,
          doctors: doctors.items,
          machines: machines.items,
          medicines: medicines.items,
          medicalHistories: medicalHistories.items,
          complaints: complaints.items,
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load overview.');
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return <section className="panel empty-state"><strong>Overview unavailable</strong><p>{error}</p></section>;
  }

  if (!data) {
    return <section className="panel empty-state"><strong>Loading overview</strong><p>Collecting live operational counts.</p></section>;
  }

  const queueMax = Math.max(data.queue.waiting, data.queue.called, data.queue.done, 1);
  const today = new Date().toDateString();
  const todaysPatients = data.queueItems.filter((item) => new Date(item.created_at).toDateString() === today);
  const totalPatients = todaysPatients.length;
  const dailyCompletionRate = totalPatients ? Math.round((todaysPatients.filter((item) => item.status === 'done').length / totalPatients) * 100) : 0;
  const departmentLoad = Array.from(
    todaysPatients.reduce((map, item) => {
      map.set(item.department, (map.get(item.department) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const departmentMax = Math.max(...departmentLoad.map(([, count]) => count), 1);
  const hourlyFlow = Array.from({ length: 6 }, (_, index) => {
    const hour = 9 + index * 2;
    const count = todaysPatients.filter((item) => new Date(item.created_at).getHours() >= hour && new Date(item.created_at).getHours() < hour + 2).length;
    return { label: `${String(hour).padStart(2, '0')}:00`, count };
  });
  const flowMax = Math.max(...hourlyFlow.map((item) => item.count), 1);
  const availableDoctors = data.doctors.filter((item) => item.status === 'available').length;
  const activeMachines = data.machines.filter((item) => item.status === 'available').length;
  const stockedMedicines = data.medicines.filter((item) => item.stock_qty > 0).length;
  const openBeds = data.bedItems.filter((item) => item.status === 'available').length;

  const queueBars = [
    { label: 'Waiting', value: data.queue.waiting, tone: 'queue-waiting' },
    { label: 'Called', value: data.queue.called, tone: 'queue-called' },
    { label: 'Done', value: data.queue.done, tone: 'queue-done' },
  ];

  const bedBars = [
    { label: 'Available', value: data.beds.available, tone: 'bed-available' },
    { label: 'Occupied', value: data.beds.occupied, tone: 'bed-occupied' },
    { label: 'Cleaning', value: data.beds.cleaning, tone: 'bed-cleaning' },
  ];
  const totalBeds = bedBars.reduce((sum, item) => sum + item.value, 0);
  const availableAngle = totalBeds ? (data.beds.available / totalBeds) * 360 : 0;
  const occupiedAngle = totalBeds ? (data.beds.occupied / totalBeds) * 360 : 0;
  const cleaningAngle = Math.max(0, 360 - availableAngle - occupiedAngle);
  const bedChartStyle = {
    background: `conic-gradient(
      #55a9d1 0deg ${availableAngle}deg,
      #7e8bad ${availableAngle}deg ${availableAngle + occupiedAngle}deg,
      #ebb76a ${availableAngle + occupiedAngle}deg ${availableAngle + occupiedAngle + cleaningAngle}deg
    )`,
  };

  return (
    <section className="admin-overview-grid">
      <article className="panel chart-card hero-chart-card">
        <div className="chart-card-head">
          <div>
            <p className="eyebrow">Daily Patient Insights</p>
            <h3>Today at a glance</h3>
          </div>
          <span className="mini-stat">{dailyCompletionRate}% completed</span>
        </div>
        <div className="daily-insight-grid">
          <div className="insight-metric">
            <span>Patients today</span>
            <strong>{totalPatients}</strong>
          </div>
          <div className="insight-metric">
            <span>Available doctors</span>
            <strong>{availableDoctors}</strong>
          </div>
          <div className="insight-metric">
            <span>Available machines</span>
            <strong>{activeMachines}</strong>
          </div>
          <div className="insight-metric">
            <span>Open beds</span>
            <strong>{openBeds}</strong>
          </div>
        </div>
      </article>

      <article className="panel chart-card">
        <div className="chart-card-head">
          <div>
            <p className="eyebrow">Queue Snapshot</p>
            <h3>Live patient movement</h3>
          </div>
          <span className="mini-stat">{data.queue.estimatedWaitMinutes} min wait</span>
        </div>
        <div className="bar-chart">
          {queueBars.map((item) => (
            <div key={item.label} className="bar-row">
              <div className="bar-row-meta">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <div className="bar-track">
                <div className={`bar-fill ${item.tone}`} style={{ width: `${(item.value / queueMax) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="panel chart-card">
        <div className="chart-card-head">
          <div>
            <p className="eyebrow">Daily Flow</p>
            <h3>Patient arrivals today</h3>
          </div>
        </div>
        <div className="mini-column-chart">
          {hourlyFlow.map((item) => (
            <div key={item.label} className="mini-column">
              <div className="mini-column-track">
                <div className="mini-column-fill" style={{ height: `${(item.count / flowMax) * 100}%` }} />
              </div>
              <strong>{item.count}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="panel chart-card">
        <div className="chart-card-head">
          <div>
            <p className="eyebrow">Bed Capacity</p>
            <h3>Ward occupancy split</h3>
          </div>
          <span className="mini-stat">{totalBeds} total beds</span>
        </div>
        <div className="donut-card-body">
          <div className="donut-visual-wrap">
            <div className="donut-chart" style={bedChartStyle}>
              <div className="donut-hole">
                <span>Total</span>
                <strong>{totalBeds}</strong>
              </div>
            </div>
          </div>
          <div className="donut-legend">
            {bedBars.map((item) => (
              <div key={item.label} className="donut-legend-row">
                <div className="donut-legend-copy">
                  <span className={`legend-dot ${item.tone}`} />
                  <span>{item.label}</span>
                </div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="panel chart-card">
        <div className="chart-card-head">
          <div>
            <p className="eyebrow">Department Mix</p>
            <h3>Top queue departments</h3>
          </div>
        </div>
        <div className="bar-chart">
          {departmentLoad.length ? (
            departmentLoad.map(([department, count]) => (
              <div key={department} className="bar-row">
                <div className="bar-row-meta">
                  <span>{department}</span>
                  <strong>{count}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill department-fill" style={{ width: `${(count / departmentMax) * 100}%` }} />
                </div>
              </div>
            ))
          ) : (
            <p className="helper-text">No patient entries yet for today.</p>
          )}
        </div>
      </article>

      <article className="panel metric-strip insight-strip">
        <div className="metric-tile">
          <span>Doctors</span>
          <strong>{data.doctors.length}</strong>
        </div>
        <div className="metric-tile">
          <span>Machines</span>
          <strong>{data.machines.length}</strong>
        </div>
        <div className="metric-tile">
          <span>Medicines</span>
          <strong>{data.medicines.length}</strong>
        </div>
        <div className="metric-tile">
          <span>In stock</span>
          <strong>{stockedMedicines}</strong>
        </div>
        <div className="metric-tile">
          <span>History records</span>
          <strong>{data.medicalHistories.length}</strong>
        </div>
        <div className="metric-tile">
          <span>Open complaints</span>
          <strong>{data.complaints.filter((item) => item.status !== 'resolved').length}</strong>
        </div>
      </article>
    </section>
  );
};

const AccessPortal = ({
  adminToken,
  authNotice,
  onLogin,
}: {
  adminToken: string | null;
  authNotice: string;
  onLogin: (session: AdminSession) => void;
}) => {
  return (
    <main className="page-shell centered-shell">
      {adminToken ? (
        <section className="panel access-panel centered-panel">
          <h2>Staff Session Active</h2>
          <Link className="primary-button" to="/admin" style={{ display: 'inline-flex', marginTop: '1rem' }}>
            Open Admin Panel
          </Link>
        </section>
      ) : (
        <AdminLogin onLogin={onLogin} notice={authNotice} />
      )}
    </main>
  );
};

const PatientSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <main className="page-shell">
    <section className="page-header-plain">
      <div className="hero-copy">
        <p className="eyebrow">Patient Portal</p>
        <h1>{title}</h1>
        <p className="hero-text">{description}</p>
      </div>
    </section>
    {children}
  </main>
);

const AdminLoginPage = ({
  authNotice,
  onLogin,
}: {
  authNotice: string;
  onLogin: (session: AdminSession) => void;
}) => (
  <main className="page-shell centered-shell">
    <AdminLogin onLogin={onLogin} notice={authNotice} />
  </main>
);

const AdminSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  insights: InsightCard[];
  token: string | null;
  profile: AdminProfile | null;
  onLogout: () => void;
  children: ReactNode;
}) => (
  <main className="page-shell admin-page-shell">
    <section className="page-header-plain admin-header-plain">
      <div className="hero-copy">
        <p className="eyebrow">Admin Console</p>
        <h1>{title}</h1>
        <p className="hero-text">{description}</p>
      </div>
    </section>
    {children}
  </main>
);

function App() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [authNotice, setAuthNotice] = useState('');

  useEffect(() => {
    const savedToken = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    const savedProfile = window.localStorage.getItem(ADMIN_PROFILE_STORAGE_KEY);
    if (savedToken) {
      setAdminToken(savedToken);
    }
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile) as AdminProfile;
        setAdminProfile(parsedProfile);
      } catch {
        window.localStorage.removeItem(ADMIN_PROFILE_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
    window.localStorage.removeItem('opencare-theme');
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setAdminToken(null);
      setAdminProfile(null);
      setAuthNotice('Admin session expired. Please login again.');
    };

    window.addEventListener(ADMIN_AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(ADMIN_AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const handleAdminLogin = (session: AdminSession) => {
    setAdminToken(session.token);
    setAdminProfile(session.profile);
    setAuthNotice('');
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, session.token);
    window.localStorage.setItem(ADMIN_PROFILE_STORAGE_KEY, JSON.stringify(session.profile));
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdminProfile(null);
    setAuthNotice('');
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(ADMIN_PROFILE_STORAGE_KEY);
  };

  return (
    <AppFrame adminToken={adminToken} onLogout={handleAdminLogout}>
      <Routes>
        <Route path="/" element={<PatientHome />} />
        <Route
          path="/access"
          element={
            <AccessPortal
              adminToken={adminToken}
              authNotice={authNotice}
              onLogin={handleAdminLogin}
            />
          }
        />
        <Route
          path="/queue"
          element={
            <PatientSection
              title="Smart Queue"
              description="Book a token, track your position, and follow live queue movement."
            >
              <QueuePanel />
            </PatientSection>
          }
        />
        <Route
          path="/medicines"
          element={
            <PatientSection
              title="Medicine Hub"
              description="Search stock, quantity, location, and medicine alternatives."
            >
              <MedicinePanel />
            </PatientSection>
          }
        />
        <Route
          path="/doctors"
          element={
            <PatientSection
              title="Doctor Availability"
              description="See doctor status, room assignment, and next available slot."
            >
              <DoctorPanel />
            </PatientSection>
          }
        />
        <Route
          path="/machines"
          element={
            <PatientSection
              title="Machine Availability"
              description="Check if MRI, CT, ventilators, and other machines are available."
            >
              <MachinePanel />
            </PatientSection>
          }
        />
        <Route
          path="/beds"
          element={
            <PatientSection
              title="Bed and Ward Availability"
              description="View live occupancy and bed status across wards."
            >
              <BedPanel />
            </PatientSection>
          }
        />
        <Route
          path="/scan"
          element={
            <PatientSection
              title="Prescription Scan"
              description="Upload a prescription photo and receive a Gemini-powered transcription."
            >
              <VisionPanel />
            </PatientSection>
          }
        />
        <Route
          path="/history"
          element={
            <PatientSection
              title="Past Medical History"
              description="Verify using the patient mobile number and demo OTP to view saved history records."
            >
              <MedicalHistoryPanel />
            </PatientSection>
          }
        />
        <Route
          path="/complaints"
          element={
            <PatientSection
              title="Complaint Section"
              description="Submit a service complaint so the hospital team can review delays, behavior, or support issues."
            >
              <ComplaintPanel />
            </PatientSection>
          }
        />
        <Route
          path="/admin"
          element={
            adminToken ? (
              <AdminSection
                title="Admin Workspace"
                description="Choose an admin page for queue, stock, doctors, machines, or bed operations."
                insights={[
                  { label: 'Mode', value: 'Control Room', note: 'Separate workflow pages' },
                  { label: 'Data', value: 'Supabase', note: 'Realtime operational state' },
                ]}
                token={adminToken}
                profile={adminProfile}
                onLogout={handleAdminLogout}
              >
                <AdminOverviewCharts token={adminToken} />
                <section className="feature-grid">
                  {adminLinks.map(({ to, label, icon: Icon }) => (
                    <Link key={to} className="link-card editorial-card" to={to}>
                      <div className="editorial-card-icon">
                        <Icon size={20} />
                      </div>
                      <strong>{label}</strong>
                      <p>Open the dedicated admin page for this workflow.</p>
                      <span>
                        Open page <ChevronRight size={14} />
                      </span>
                    </Link>
                  ))}
                </section>
              </AdminSection>
            ) : (
              <AdminLoginPage authNotice={authNotice} onLogin={handleAdminLogin} />
            )
          }
        />
        <Route
          path="/admin/queue"
          element={
            adminToken ? (
              <AdminSection
                title="Queue Desk"
                description="Advance tokens and mark consultations from a dedicated queue workspace."
                insights={[
                  { label: 'Queue', value: 'Action Desk', note: 'Call and complete tokens' },
                  { label: 'Ops', value: 'Live Feed', note: 'Department-based control' },
                ]}
                token={adminToken}
                profile={adminProfile}
                onLogout={handleAdminLogout}
              >
                <AdminQueueTools token={adminToken} />
              </AdminSection>
            ) : (
              <AdminLoginPage authNotice={authNotice} onLogin={handleAdminLogin} />
            )
          }
        />
        <Route
          path="/admin/pharmacy"
          element={
            adminToken ? (
              <AdminSection
                title="Pharmacy Workspace"
                description="Add medicines and update stock from the pharmacy admin page."
                insights={[
                  { label: 'Stock', value: 'Inventory Ops', note: 'Add and update medicines' },
                  { label: 'Shelf', value: 'Live Store', note: 'Location-aware records' },
                ]}
                token={adminToken}
                profile={adminProfile}
                onLogout={handleAdminLogout}
              >
                <AdminPharmacyTools token={adminToken} />
              </AdminSection>
            ) : (
              <AdminLoginPage authNotice={authNotice} onLogin={handleAdminLogin} />
            )
          }
        />
        <Route
          path="/admin/doctors"
          element={
            adminToken ? (
              <AdminSection
                title="Doctor Workspace"
                description="Manage doctor availability, room assignment, and next slot."
                insights={[
                  { label: 'Roster', value: 'Clinic Board', note: 'Status and slots' },
                  { label: 'Rooms', value: 'Live Mapping', note: 'Update doctor location' },
                ]}
                token={adminToken}
                profile={adminProfile}
                onLogout={handleAdminLogout}
              >
                <AdminDoctorTools token={adminToken} />
              </AdminSection>
            ) : (
              <AdminLoginPage authNotice={authNotice} onLogin={handleAdminLogin} />
            )
          }
        />
        <Route
          path="/admin/machines"
          element={
            adminToken ? (
              <AdminSection
                title="Machine Workspace"
                description="Track hospital machine availability and quantity."
                insights={[
                  { label: 'Equipment', value: 'Status Ops', note: 'Use, maintenance, quantity' },
                  { label: 'Coverage', value: 'Facility Wide', note: 'Imaging to ICU support' },
                ]}
                token={adminToken}
                profile={adminProfile}
                onLogout={handleAdminLogout}
              >
                <AdminMachineTools token={adminToken} />
              </AdminSection>
            ) : (
              <AdminLoginPage authNotice={authNotice} onLogin={handleAdminLogin} />
            )
          }
        />
        <Route
          path="/admin/beds"
          element={
            adminToken ? (
              <AdminSection
                title="Bed Workspace"
                description="Manage admissions, discharge, cleaning, and new bed entries."
                insights={[
                  { label: 'Ward', value: 'Capacity Desk', note: 'Admission and discharge flow' },
                  { label: 'Turnover', value: 'Live Beds', note: 'Cleaning and occupancy status' },
                ]}
                token={adminToken}
                profile={adminProfile}
                onLogout={handleAdminLogout}
              >
                <AdminBedTools token={adminToken} />
              </AdminSection>
            ) : (
              <AdminLoginPage authNotice={authNotice} onLogin={handleAdminLogin} />
            )
          }
        />
        <Route
          path="/admin/history"
          element={
            adminToken ? (
              <AdminSection
                title="Medical History Workspace"
                description="Staff can add previous diagnoses, medicines, allergies, and notes manually."
                insights={[
                  { label: 'Records', value: 'Patient Timeline', note: 'Manual staff updates' },
                  { label: 'Access', value: 'Mobile Verified', note: 'Patients view by mobile number and dummy OTP' },
                ]}
                token={adminToken}
                profile={adminProfile}
                onLogout={handleAdminLogout}
              >
                <AdminMedicalHistoryTools token={adminToken} />
              </AdminSection>
            ) : (
              <AdminLoginPage authNotice={authNotice} onLogin={handleAdminLogin} />
            )
          }
        />
        <Route
          path="/admin/complaints"
          element={
            adminToken ? (
              <AdminSection
                title="Complaint Review"
                description="Track all patient complaints, filter by status, and mark response progress."
                insights={[
                  { label: 'Feedback', value: 'Service Desk', note: 'Patient issue tracking' },
                  { label: 'Flow', value: 'Open to Resolved', note: 'Status-based complaint handling' },
                ]}
                token={adminToken}
                profile={adminProfile}
                onLogout={handleAdminLogout}
              >
                <AdminComplaintTools token={adminToken} />
              </AdminSection>
            ) : (
              <AdminLoginPage authNotice={authNotice} onLogin={handleAdminLogin} />
            )
          }
        />
      </Routes>
    </AppFrame>
  );
}

export default App;
