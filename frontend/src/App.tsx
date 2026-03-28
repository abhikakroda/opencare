import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BedDouble,
  ChevronRight,
  Home,
  Pill,
  ScanText,
  Search,
  Shield,
  Settings2,
  ShieldCheck,
  Stethoscope,
  Ticket,
} from 'lucide-react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { AdminBedTools } from './components/AdminBedTools';
import { AdminDoctorTools } from './components/AdminDoctorTools';
import { AdminLogin } from './components/AdminLogin';
import { AdminMachineTools } from './components/AdminMachineTools';
import { AdminPharmacyTools } from './components/AdminPharmacyTools';
import { AdminQueueTools } from './components/AdminQueueTools';
import { BedPanel } from './components/BedPanel';
import { DoctorPanel } from './components/DoctorPanel';
import { MachinePanel } from './components/MachinePanel';
import { MedicinePanel } from './components/MedicinePanel';
import { QueuePanel } from './components/QueuePanel';
import { VisionPanel } from './components/VisionPanel';
import { ADMIN_AUTH_EXPIRED_EVENT, ADMIN_TOKEN_STORAGE_KEY } from './lib/api';

const patientLinks = [
  { to: '/queue', label: 'Smart Queue', icon: Ticket },
  { to: '/medicines', label: 'Medicine Hub', icon: Pill },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/machines', label: 'Machines', icon: Settings2 },
  { to: '/beds', label: 'Beds & Wards', icon: BedDouble },
  { to: '/scan', label: 'Scan', icon: ScanText },
];

const adminLinks = [
  { to: '/admin/queue', label: 'Queue Desk', icon: Ticket },
  { to: '/admin/pharmacy', label: 'Pharmacy', icon: Pill },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/machines', label: 'Machines', icon: Settings2 },
  { to: '/admin/beds', label: 'Beds', icon: BedDouble },
];

const quickCards = [
  { to: '/queue', title: 'Smart Queue', text: 'Book token and track live position.', icon: Ticket },
  { to: '/medicines', title: 'Medicine Hub', text: 'Search stock and location instantly.', icon: Pill },
  { to: '/doctors', title: 'Doctors', text: 'Check doctor status and next slot.', icon: Stethoscope },
  { to: '/machines', title: 'Machines', text: 'See which equipment is available.', icon: Settings2 },
  { to: '/access', title: 'Switch User', text: 'Open staff or admin sign in separately.', icon: Shield },
];

type InsightCard = {
  label: string;
  value: string;
  note: string;
};

const AppFrame = ({
  children,
  adminToken,
}: {
  children: ReactNode;
  adminToken: string | null;
}) => {
  const location = useLocation();

  const activeSection = useMemo(() => {
    if (location.pathname.startsWith('/admin')) {
      return 'Admin Workspace';
    }
    if (location.pathname === '/access') {
      return 'User Access';
    }
    if (location.pathname === '/') {
      return 'Patient Portal';
    }

    return 'Patient Access';
  }, [location.pathname]);

  const showAdminNav = Boolean(adminToken);
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
        { to: '/access', label: 'Switch', icon: Shield },
      ];

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark large-mark">OC</div>
          <div className="sidebar-brand-copy">
            <strong>OpenCare</strong>
            <span>Hospital suite</span>
          </div>
        </div>

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
          <p className="sidebar-label">User Access</p>
          <nav className="sidebar-nav">
            <NavLink to="/access" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Shield size={18} />
              <span>Switch User</span>
            </NavLink>
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
            <Search size={18} />
            <span>{activeSection}</span>
          </div>
          <nav className="topnav compact-topnav role-switcher">
            <NavLink to="/">Patient</NavLink>
            <NavLink to="/access">{adminToken ? 'Admin Panel' : 'Switch User'}</NavLink>
            {adminToken ? <NavLink to="/admin">Workspace</NavLink> : null}
          </nav>
        </header>

        <div className="content-shell">{children}</div>

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
  <main className="page-shell">
    <section className="hero clinical-hero">
      <div className="hero-copy">
        <p className="eyebrow">OpenCare Medicare</p>
        <h1>Clinical access in one calm flow.</h1>
        <p className="hero-text">
          Move between queue, medicines, doctors, machines, beds, and scan pages without a crowded dashboard.
        </p>
        <div className="hero-cta-row">
          <Link className="hero-primary-link" to="/queue">
            Open patient pages
            <ChevronRight size={16} />
          </Link>
          <div className="hero-chip-row">
            <span>Live queue</span>
            <span>Doctor availability</span>
            <span>Machine status</span>
          </div>
        </div>
      </div>

      <div className="hero-bento">
        <div className="hero-metric hero-metric-primary">
          <p>Current focus</p>
          <strong>Patient Access</strong>
          <span>Responsive pages for web and mobile</span>
        </div>
        <div className="hero-metric">
          <p>Realtime</p>
          <strong>Supabase</strong>
          <span>Queue, beds, doctors, machines</span>
        </div>
        <div className="hero-metric">
          <p>Assistant</p>
          <strong>Gemini Scan</strong>
          <span>Upload and transcribe prescriptions</span>
        </div>
      </div>
    </section>

    <section className="feature-grid">
      {quickCards.map(({ to, title, text, icon: Icon }) => (
        <Link key={to} className="link-card editorial-card" to={to}>
          <div className="editorial-card-icon">
            <Icon size={20} />
          </div>
          <strong>{title}</strong>
          <p>{text}</p>
          <span>
            Open page <ChevronRight size={14} />
          </span>
        </Link>
      ))}
    </section>
  </main>
);

const AccessPortal = ({
  adminToken,
  authNotice,
  onLogin,
}: {
  adminToken: string | null;
  authNotice: string;
  onLogin: (token: string) => void;
}) => {
  const [mode, setMode] = useState<'patient' | 'admin'>('patient');

  return (
    <main className="page-shell">
      <section className="hero section-hero page-hero">
        <div className="hero-copy">
          <p className="eyebrow">Switch User</p>
          <h1>Choose patient or staff access first.</h1>
          <p className="hero-text">
            Patient pages stay public. Staff and admin controls open only after sign in.
          </p>
        </div>
        <div className="page-insights">
          <article className="page-insight-card">
            <span>Patient</span>
            <strong>Open Access</strong>
            <small>Queue, medicines, doctors, machines, beds, and scan</small>
          </article>
          <article className="page-insight-card">
            <span>Admin</span>
            <strong>Protected</strong>
            <small>Queue desk, pharmacy, doctors, machines, and beds</small>
          </article>
        </div>
      </section>

      <section className="panel access-panel">
        <div className="user-switch-row">
          <button
            type="button"
            className={mode === 'patient' ? 'switch-chip active' : 'switch-chip'}
            onClick={() => setMode('patient')}
          >
            Patient
          </button>
          <button
            type="button"
            className={mode === 'admin' ? 'switch-chip active' : 'switch-chip'}
            onClick={() => setMode('admin')}
          >
            Staff / Admin
          </button>
        </div>

        {mode === 'patient' ? (
          <div className="access-grid">
            <Link className="link-card editorial-card" to="/queue">
              <div className="editorial-card-icon">
                <Ticket size={20} />
              </div>
              <strong>Continue as Patient</strong>
              <p>Open queue booking, medicine search, doctor directory, equipment, beds, and scan.</p>
              <span>
                Open patient pages <ChevronRight size={14} />
              </span>
            </Link>
          </div>
        ) : adminToken ? (
          <div className="access-grid">
            <Link className="link-card editorial-card" to="/admin">
              <div className="editorial-card-icon">
                <ShieldCheck size={20} />
              </div>
              <strong>Open Detailed Admin Panel</strong>
              <p>Queue desk, stock updates, doctor availability, machine status, and bed operations.</p>
              <span>
                Open admin panel <ChevronRight size={14} />
              </span>
            </Link>
          </div>
        ) : (
          <AdminLogin onLogin={onLogin} notice={authNotice} />
        )}
      </section>
    </main>
  );
};

const PatientSection = ({
  title,
  description,
  insights,
  children,
}: {
  title: string;
  description: string;
  insights: InsightCard[];
  children: ReactNode;
}) => (
  <main className="page-shell">
    <section className="hero section-hero page-hero">
      <div className="hero-copy">
        <p className="eyebrow">Patient Portal</p>
        <h1>{title}</h1>
        <p className="hero-text">{description}</p>
      </div>
      <div className="page-insights">
        {insights.map((item) => (
          <article key={item.label} className="page-insight-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </div>
    </section>
    <nav className="subnav pill-subnav scroll-subnav">
      {patientLinks.map(({ to, label }) => (
        <NavLink key={to} to={to}>
          {label}
        </NavLink>
      ))}
    </nav>
    {children}
  </main>
);

const AdminSection = ({
  title,
  description,
  insights,
  token,
  authNotice,
  onLogin,
  onLogout,
  children,
}: {
  title: string;
  description: string;
  insights: InsightCard[];
  token: string | null;
  authNotice: string;
  onLogin: (token: string) => void;
  onLogout: () => void;
  children: ReactNode;
}) => (
  <main className="page-shell">
    <section className="hero section-hero page-hero">
      <div className="hero-copy">
        <p className="eyebrow">Admin Console</p>
        <h1>{title}</h1>
        <p className="hero-text">{description}</p>
      </div>
      <div className="page-insights">
        {insights.map((item) => (
          <article key={item.label} className="page-insight-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
        {token ? (
          <article className="page-insight-card action-insight">
            <span>Session</span>
            <strong>Admin</strong>
            <button type="button" onClick={onLogout}>
              Logout
            </button>
          </article>
        ) : null}
      </div>
    </section>
    <nav className="subnav pill-subnav scroll-subnav">
      <NavLink to="/admin">Overview</NavLink>
      {adminLinks.map(({ to, label }) => (
        <NavLink key={to} to={to}>
          {label}
        </NavLink>
      ))}
    </nav>
    {token ? children : <AdminLogin onLogin={onLogin} notice={authNotice} />}
  </main>
);

function App() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState('');

  useEffect(() => {
    const savedToken = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (savedToken) {
      setAdminToken(savedToken);
    }
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setAdminToken(null);
      setAuthNotice('Admin session expired. Please login again.');
    };

    window.addEventListener(ADMIN_AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(ADMIN_AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const handleAdminLogin = (token: string) => {
    setAdminToken(token);
    setAuthNotice('');
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAuthNotice('');
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  };

  return (
    <AppFrame adminToken={adminToken}>
      <Routes>
        <Route path="/" element={<PatientHome />} />
        <Route
          path="/access"
          element={<AccessPortal adminToken={adminToken} authNotice={authNotice} onLogin={handleAdminLogin} />}
        />
        <Route
          path="/queue"
          element={
            <PatientSection
              title="Smart Queue"
              description="Book a token, track your position, and follow live queue movement."
              insights={[
                { label: 'Flow', value: 'Live Queue', note: 'Realtime token movement' },
                { label: 'Updates', value: 'Supabase', note: 'Auto refresh enabled' },
              ]}
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
              insights={[
                { label: 'Inventory', value: 'Live Stock', note: 'Brand and generic search' },
                { label: 'Response', value: 'Fast Lookup', note: 'Location and alternatives' },
              ]}
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
              insights={[
                { label: 'Clinic', value: 'Live Status', note: 'Available, busy, off duty' },
                { label: 'Access', value: 'Room Ready', note: 'Quick doctor-room lookup' },
              ]}
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
              insights={[
                { label: 'Equipment', value: 'Status Board', note: 'Usage and maintenance visibility' },
                { label: 'Coverage', value: 'Hospital Wide', note: 'Imaging and ICU support' },
              ]}
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
              insights={[
                { label: 'Capacity', value: 'Ward View', note: 'Available, occupied, cleaning' },
                { label: 'Planning', value: 'Live Status', note: 'Admission support' },
              ]}
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
              insights={[
                { label: 'AI', value: 'Gemini', note: 'Photo to text summary' },
                { label: 'Use', value: 'Quick Intake', note: 'Prescription support' },
              ]}
            >
              <VisionPanel />
            </PatientSection>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminSection
              title="Admin Workspace"
              description="Choose an admin page for queue, stock, doctors, machines, or bed operations."
              insights={[
                { label: 'Mode', value: 'Control Room', note: 'Separate workflow pages' },
                { label: 'Data', value: 'Supabase', note: 'Realtime operational state' },
              ]}
              token={adminToken}
              authNotice={authNotice}
              onLogin={handleAdminLogin}
              onLogout={handleAdminLogout}
            >
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
          }
        />
        <Route
          path="/admin/queue"
          element={
            <AdminSection
              title="Queue Desk"
              description="Advance tokens and mark consultations from a dedicated queue workspace."
              insights={[
                { label: 'Queue', value: 'Action Desk', note: 'Call and complete tokens' },
                { label: 'Ops', value: 'Live Feed', note: 'Department-based control' },
              ]}
              token={adminToken}
              authNotice={authNotice}
              onLogin={handleAdminLogin}
              onLogout={handleAdminLogout}
            >
              <AdminQueueTools token={adminToken ?? ''} />
            </AdminSection>
          }
        />
        <Route
          path="/admin/pharmacy"
          element={
            <AdminSection
              title="Pharmacy Workspace"
              description="Add medicines and update stock from the pharmacy admin page."
              insights={[
                { label: 'Stock', value: 'Inventory Ops', note: 'Add and update medicines' },
                { label: 'Shelf', value: 'Live Store', note: 'Location-aware records' },
              ]}
              token={adminToken}
              authNotice={authNotice}
              onLogin={handleAdminLogin}
              onLogout={handleAdminLogout}
            >
              <AdminPharmacyTools token={adminToken ?? ''} />
            </AdminSection>
          }
        />
        <Route
          path="/admin/doctors"
          element={
            <AdminSection
              title="Doctor Workspace"
              description="Manage doctor availability, room assignment, and next slot."
              insights={[
                { label: 'Roster', value: 'Clinic Board', note: 'Status and slots' },
                { label: 'Rooms', value: 'Live Mapping', note: 'Update doctor location' },
              ]}
              token={adminToken}
              authNotice={authNotice}
              onLogin={handleAdminLogin}
              onLogout={handleAdminLogout}
            >
              <AdminDoctorTools token={adminToken ?? ''} />
            </AdminSection>
          }
        />
        <Route
          path="/admin/machines"
          element={
            <AdminSection
              title="Machine Workspace"
              description="Track hospital machine availability and quantity."
              insights={[
                { label: 'Equipment', value: 'Status Ops', note: 'Use, maintenance, quantity' },
                { label: 'Coverage', value: 'Facility Wide', note: 'Imaging to ICU support' },
              ]}
              token={adminToken}
              authNotice={authNotice}
              onLogin={handleAdminLogin}
              onLogout={handleAdminLogout}
            >
              <AdminMachineTools token={adminToken ?? ''} />
            </AdminSection>
          }
        />
        <Route
          path="/admin/beds"
          element={
            <AdminSection
              title="Bed Workspace"
              description="Manage admissions, discharge, cleaning, and new bed entries."
              insights={[
                { label: 'Ward', value: 'Capacity Desk', note: 'Admission and discharge flow' },
                { label: 'Turnover', value: 'Live Beds', note: 'Cleaning and occupancy status' },
              ]}
              token={adminToken}
              authNotice={authNotice}
              onLogin={handleAdminLogin}
              onLogout={handleAdminLogout}
            >
              <AdminBedTools token={adminToken ?? ''} />
            </AdminSection>
          }
        />
      </Routes>
    </AppFrame>
  );
}

export default App;
