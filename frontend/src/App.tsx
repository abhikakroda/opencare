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
import type { AdminAccessRole, AdminSession } from './components/AdminLogin';
import { AdminMachineTools } from './components/AdminMachineTools';
import { AdminPharmacyTools } from './components/AdminPharmacyTools';
import { AdminQueueTools } from './components/AdminQueueTools';
import { BedPanel } from './components/BedPanel';
import { DoctorPanel } from './components/DoctorPanel';
import { MachinePanel } from './components/MachinePanel';
import { MedicinePanel } from './components/MedicinePanel';
import { PatientChatWidget } from './components/PatientChatWidget';
import { QueuePanel } from './components/QueuePanel';
import { VisionPanel } from './components/VisionPanel';
import { ADMIN_AUTH_EXPIRED_EVENT, ADMIN_PROFILE_STORAGE_KEY, ADMIN_TOKEN_STORAGE_KEY, api } from './lib/api';
import type { Bed, Doctor, Machine, Medicine, QueueItem } from './types';

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
};

const roleOptions: Array<{
  role: AdminAccessRole;
  label: string;
  title: string;
  note: string;
}> = [
  { role: 'admin', label: 'Hospital Admin', title: 'Full Control', note: 'Queue, pharmacy, doctors, machines, beds' },
  { role: 'staff', label: 'Staff', title: 'Operations Desk', note: 'Daily workflow updates and live service handling' },
  { role: 'nodal_officer', label: 'Nodal Officer', title: 'Read Only', note: 'Supervision view with no write actions' },
];

const AppFrame = ({
  children,
  adminToken,
}: {
  children: ReactNode;
  adminToken: string | null;
}) => {
  const location = useLocation();

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
          <>
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

            <div className="sidebar-group">
              <p className="sidebar-label">User Access</p>
              <nav className="sidebar-nav">
                <NavLink to="/access" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                  <Shield size={18} />
                  <span>Switch User</span>
                </NavLink>
              </nav>
            </div>
          </>
        ) : null}

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
          <nav className="topnav compact-topnav role-switcher">
            <NavLink to="/">Patient</NavLink>
            <NavLink to="/access">{adminToken ? 'Admin Panel' : 'Switch User'}</NavLink>
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
  <main className="page-shell">
    <section className="hero clinical-hero">
      <div className="hero-copy">
        <p className="eyebrow">Govt Hospital, Srinagar</p>
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

const AdminOverviewCharts = ({ token }: { token: string }) => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError('');
        const [queue, beds, doctors, machines, medicines] = await Promise.all([
          api.get<{ items: QueueItem[]; summary: AdminOverviewData['queue'] }>('/queue', token),
          api.get<{ items: Bed[]; summary: AdminOverviewData['beds'] }>('/beds', token),
          api.get<{ items: Doctor[] }>('/doctors', token),
          api.get<{ items: Machine[] }>('/machines', token),
          api.get<{ items: Medicine[] }>('/medicines', token),
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
  const bedMax = Math.max(data.beds.available, data.beds.occupied, data.beds.cleaning, 1);
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
            <h3>Ward occupancy</h3>
          </div>
        </div>
        <div className="bar-chart">
          {bedBars.map((item) => (
            <div key={item.label} className="bar-row">
              <div className="bar-row-meta">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <div className="bar-track">
                <div className={`bar-fill ${item.tone}`} style={{ width: `${(item.value / bedMax) * 100}%` }} />
              </div>
            </div>
          ))}
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
      </article>
    </section>
  );
};

const AccessPortal = ({
  adminToken,
  adminProfile,
  authNotice,
  onLogin,
}: {
  adminToken: string | null;
  adminProfile: AdminProfile | null;
  authNotice: string;
  onLogin: (session: AdminSession) => void;
}) => {
  const [mode, setMode] = useState<'patient' | 'admin'>('patient');
  const [selectedRole, setSelectedRole] = useState<AdminAccessRole>('admin');

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
          <article className="page-insight-card access-insight-card">
            <span>Staff Access</span>
            <strong>Protected Login</strong>
            <small>Hospital admin, staff, and nodal officer sign in</small>
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
              <strong>Open Detailed Admin Access</strong>
              <p>
                Signed in as {roleOptions.find((item) => item.role === adminProfile?.role)?.label ?? 'Staff'}.
                Open the dedicated hospital control workspace.
              </p>
              <span>
                Open admin panel <ChevronRight size={14} />
              </span>
            </Link>
          </div>
        ) : (
          <div className="access-grid access-grid-wide">
            <div className="role-card-grid">
              {roleOptions.map((option) => (
                <button
                  key={option.role}
                  type="button"
                  className={selectedRole === option.role ? 'role-card active' : 'role-card'}
                  onClick={() => setSelectedRole(option.role)}
                >
                  <span>{option.label}</span>
                  <strong>{option.title}</strong>
                  <small>{option.note}</small>
                </button>
              ))}
            </div>
            <AdminLogin role={selectedRole} onLogin={onLogin} notice={authNotice} />
          </div>
        )}
      </section>
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
  selectedRole,
  authNotice,
  onLogin,
}: {
  selectedRole: AdminAccessRole;
  authNotice: string;
  onLogin: (session: AdminSession) => void;
}) => (
  <main className="page-shell">
    <section className="hero section-hero admin-login-hero">
      <div className="hero-copy">
        <p className="eyebrow">Admin Sign In</p>
        <h1>Login to open the detailed admin panel.</h1>
        <p className="hero-text">
          Queue control, medicine updates, doctor availability, machines, and bed management are available after sign in.
        </p>
      </div>
    </section>
    <section className="admin-login-page">
      <AdminLogin role={selectedRole} onLogin={onLogin} notice={authNotice} />
    </section>
  </main>
);

const AdminSection = ({
  title,
  description,
  insights,
  token,
  profile,
  onLogout,
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
            <strong>{roleOptions.find((item) => item.role === profile?.role)?.label ?? 'Admin'}</strong>
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
    {children}
  </main>
);

function App() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [authNotice, setAuthNotice] = useState('');
  const [selectedAdminRole, setSelectedAdminRole] = useState<AdminAccessRole>('admin');

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
        setSelectedAdminRole(parsedProfile.role);
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
    setSelectedAdminRole(session.profile.role);
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
    <AppFrame adminToken={adminToken}>
      <Routes>
        <Route path="/" element={<PatientHome />} />
        <Route
          path="/access"
          element={
            <AccessPortal
              adminToken={adminToken}
              adminProfile={adminProfile}
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
              <AdminLoginPage selectedRole={selectedAdminRole} authNotice={authNotice} onLogin={handleAdminLogin} />
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
              <AdminLoginPage selectedRole={selectedAdminRole} authNotice={authNotice} onLogin={handleAdminLogin} />
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
              <AdminLoginPage selectedRole={selectedAdminRole} authNotice={authNotice} onLogin={handleAdminLogin} />
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
              <AdminLoginPage selectedRole={selectedAdminRole} authNotice={authNotice} onLogin={handleAdminLogin} />
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
              <AdminLoginPage selectedRole={selectedAdminRole} authNotice={authNotice} onLogin={handleAdminLogin} />
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
              <AdminLoginPage selectedRole={selectedAdminRole} authNotice={authNotice} onLogin={handleAdminLogin} />
            )
          }
        />
      </Routes>
    </AppFrame>
  );
}

export default App;
