import { useLayoutEffect, useMemo, type ReactNode } from 'react';
import {
  Activity,
  ArrowRight,
  BedDouble,
  Building2,
  Pill,
  ScanText,
  Settings2,
  Stethoscope,
  Ticket,
} from 'lucide-react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import DoctorAdminPage from './app/admin/doctor/page';
import MedicalAdminPage from './app/admin/medical/page';
import BedAdminLanding from './app/admin/beds/page';
import NodalDashboardPage from './app/nodal/page';
import { AdminBedTools } from './components/AdminBedTools';
import { AdminDoctorTools } from './components/AdminDoctorTools';
import { AdminMachineTools } from './components/AdminMachineTools';
import { AdminPharmacyTools } from './components/AdminPharmacyTools';
import { AdminQueueTools } from './components/AdminQueueTools';
import { BedPanel } from './components/BedPanel';
import { DoctorPanel } from './components/DoctorPanel';
import { MachinePanel } from './components/MachinePanel';
import { MedicinePanel } from './components/MedicinePanel';
import { QueuePanel } from './components/QueuePanel';
import { StaffLoginPage } from './components/StaffLoginPage';
import { VisionPanel } from './components/VisionPanel';
import { useAuth } from './context/AuthContext';
import { evaluateRouteAccess, legacyPathRedirect } from './middleware';

const PatientHome = () => (
  <main className="page-shell">
    <section className="hero compact-hero home-hero">
      <div className="hero-copy">
        <p className="eyebrow">OpenCare Medicare</p>
        <h1>Hospital access, made simple.</h1>
        <p className="hero-text">
          Open the page you need for queue, medicines, doctors, machines, beds, or prescription scan.
        </p>
        <div className="hero-pills">
          <span>
            <Activity size={16} /> Realtime queue
          </span>
          <span>
            <Pill size={16} /> Stock lookup
          </span>
          <span>
            <Building2 size={16} /> Bed dashboard
          </span>
        </div>
        <p className="hero-text" style={{ marginTop: '1rem' }}>
          <Link to="/login">Staff / officer sign-in →</Link>
        </p>
      </div>
    </section>

    <section className="feature-grid">
      <Link className="link-card" to="/queue">
        <Ticket size={22} />
        <strong>Queue &amp; Tokens</strong>
        <p>Book OPD token and track position.</p>
        <span>
          Open page <ArrowRight size={14} />
        </span>
      </Link>
      <Link className="link-card" to="/medicines">
        <Pill size={22} />
        <strong>Medicines</strong>
        <p>Search stock, location, and alternatives.</p>
        <span>
          Open page <ArrowRight size={14} />
        </span>
      </Link>
      <Link className="link-card" to="/doctors">
        <Stethoscope size={22} />
        <strong>Doctors</strong>
        <p>Check doctor status, room, and next slot.</p>
        <span>
          Open page <ArrowRight size={14} />
        </span>
      </Link>
      <Link className="link-card" to="/machines">
        <Settings2 size={22} />
        <strong>Machines</strong>
        <p>See if MRI, CT, ventilator, and other equipment are available.</p>
        <span>
          Open page <ArrowRight size={14} />
        </span>
      </Link>
      <Link className="link-card" to="/beds">
        <BedDouble size={22} />
        <strong>Beds &amp; Wards</strong>
        <p>Check live bed occupancy by ward.</p>
        <span>
          Open page <ArrowRight size={14} />
        </span>
      </Link>
      <Link className="link-card" to="/scan">
        <ScanText size={22} />
        <strong>Prescription Scan</strong>
        <p>Upload a photo and transcribe with Gemini.</p>
        <span>
          Open page <ArrowRight size={14} />
        </span>
      </Link>
    </section>
  </main>
);

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
    <section className="hero compact-hero">
      <div className="hero-copy">
        <p className="eyebrow">Patient Portal</p>
        <h1>{title}</h1>
        <p className="hero-text">{description}</p>
      </div>
    </section>
    <nav className="subnav">
      <NavLink to="/queue">Queue</NavLink>
      <NavLink to="/medicines">Medicines</NavLink>
      <NavLink to="/doctors">Doctors</NavLink>
      <NavLink to="/machines">Machines</NavLink>
      <NavLink to="/beds">Beds</NavLink>
      <NavLink to="/scan">Scan</NavLink>
    </nav>
    {children}
  </main>
);

function AdminSectionLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { apiToken, profile, signOut, readOnly } = useAuth();

  const adminLinks = useMemo(() => {
    if (!profile) {
      return [];
    }

    if (profile.role === 'admin' && profile.sub_role === 'doctor_admin') {
      return [
        { to: '/admin/doctor', label: 'Doctor admin' },
        { to: '/staff/queue', label: 'Queue workspace' },
        { to: '/admin/doctors', label: 'Doctor roster' },
        { to: '/admin/machines', label: 'Machines' },
      ];
    }

    if (profile.role === 'admin' && profile.sub_role === 'medical_admin') {
      return [
        { to: '/admin/medical', label: 'Medical admin' },
        { to: '/staff/medicines', label: 'Pharmacy workspace' },
      ];
    }

    if (profile.role === 'admin' && profile.sub_role === 'bed_admin') {
      return [
        { to: '/admin/beds', label: 'Bed admin' },
        { to: '/staff/beds', label: 'Bed workspace' },
      ];
    }

    const links: { to: string; label: string }[] = [{ to: '/admin', label: 'Overview' }];

    if (profile.role === 'nodal_officer' || profile.role === 'staff' || (profile.role === 'admin' && profile.sub_role == null)) {
      links.push(
        { to: '/admin/queue', label: 'Queue' },
        { to: '/admin/pharmacy', label: 'Pharmacy' },
        { to: '/admin/doctors', label: 'Doctors' },
        { to: '/admin/machines', label: 'Machines' },
        { to: '/admin/beds', label: 'Beds' },
      );
    }

    if (profile.role === 'nodal_officer') {
      links.push({ to: '/nodal', label: 'Monitoring' });
    }

    return links;
  }, [profile]);

  return (
    <main className="page-shell">
      <section className="hero compact-hero">
        <div className="hero-copy">
          <p className="eyebrow">Admin Console</p>
          <h1>{title}</h1>
          <p className="hero-text">{description}</p>
        </div>
        {apiToken ? (
          <div className="hero-actions">
            <button type="button" onClick={signOut}>
              Logout
            </button>
          </div>
        ) : null}
      </section>
      <nav className="subnav">
        {adminLinks.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      {readOnly ? <p className="hero-text">Read-only mode: controls are disabled.</p> : null}
      {children}
    </main>
  );
}

const StaffHome = () => (
  <main className="page-shell">
    <section className="hero compact-hero">
      <div className="hero-copy">
        <p className="eyebrow">Staff hub</p>
        <h1>Jump to an operational workspace</h1>
        <p className="hero-text">Queues, pharmacy, beds, doctors, and machines each have focused tools.</p>
      </div>
    </section>
    <section className="feature-grid">
      <Link className="link-card" to="/staff/queue">
        <Ticket size={22} />
        <strong>Queue operations</strong>
        <p>Call patients and update visit status.</p>
        <span>
          Open <ArrowRight size={14} />
        </span>
      </Link>
      <Link className="link-card" to="/staff/medicines">
        <Pill size={22} />
        <strong>Pharmacy stock</strong>
        <p>Adjust on-hand quantities.</p>
        <span>
          Open <ArrowRight size={14} />
        </span>
      </Link>
      <Link className="link-card" to="/staff/beds">
        <BedDouble size={22} />
        <strong>Bed management</strong>
        <p>Ward-level status controls.</p>
        <span>
          Open <ArrowRight size={14} />
        </span>
      </Link>
      <Link className="link-card" to="/admin/doctors">
        <Stethoscope size={22} />
        <strong>Doctor roster admin</strong>
        <p>Update availability, rooms, and slots.</p>
        <span>
          Open <ArrowRight size={14} />
        </span>
      </Link>
      <Link className="link-card" to="/admin/machines">
        <Settings2 size={22} />
        <strong>Machine admin</strong>
        <p>Equipment status and capacity.</p>
        <span>
          Open <ArrowRight size={14} />
        </span>
      </Link>
    </section>
  </main>
);

function NavigationSentinel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasSession, profile } = useAuth();

  useLayoutEffect(() => {
    const redirectLegacy = legacyPathRedirect(location.pathname, profile);
    if (redirectLegacy) {
      navigate(redirectLegacy, { replace: true });
      return;
    }

    const decision = evaluateRouteAccess(location.pathname, hasSession, profile);
    if (!decision.ok) {
      navigate(decision.redirectTo, { replace: true });
    }
  }, [location.pathname, hasSession, profile, navigate]);

  return null;
}

function TopNav() {
  const { profile, hasSession } = useAuth();

  const showFullAdmin = profile?.role === 'admin' && profile.sub_role == null;
  const isNodal = profile?.role === 'nodal_officer';
  const isStaff = profile?.role === 'staff';

  const doctorScoped = profile?.role === 'admin' && profile.sub_role === 'doctor_admin';
  const medicalScoped = profile?.role === 'admin' && profile.sub_role === 'medical_admin';
  const bedScoped = profile?.role === 'admin' && profile.sub_role === 'bed_admin';

  return (
    <header className="topbar">
      <div className="brand-block">
        <p className="brand-mark">OC</p>
        <div className="brand-copy">
          <strong>OpenCare Hospital Suite</strong>
          <span>Hospital access system</span>
        </div>
      </div>
      <nav className="topnav">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/queue">Queue</NavLink>
        <NavLink to="/medicines">Medicines</NavLink>
        <NavLink to="/doctors">Doctors</NavLink>
        <NavLink to="/machines">Machines</NavLink>
        <NavLink to="/beds">Beds</NavLink>
        <NavLink to="/scan">Scan</NavLink>

        {isNodal ? <NavLink to="/nodal">Monitoring</NavLink> : null}

        {isStaff ? <NavLink to="/staff">Staff</NavLink> : null}

        {showFullAdmin ? <NavLink to="/admin">Admin</NavLink> : null}
        {showFullAdmin ? <NavLink to="/staff">Staff hub</NavLink> : null}

        {doctorScoped ? <NavLink to="/admin/doctor">Doctor admin</NavLink> : null}
        {doctorScoped ? <NavLink to="/staff/queue">Queue workspace</NavLink> : null}
        {doctorScoped ? <NavLink to="/admin/doctors">Doctor roster</NavLink> : null}
        {doctorScoped ? <NavLink to="/admin/machines">Machine admin</NavLink> : null}

        {medicalScoped ? <NavLink to="/admin/medical">Medical admin</NavLink> : null}
        {medicalScoped ? <NavLink to="/staff/medicines">Medicine workspace</NavLink> : null}

        {bedScoped ? <NavLink to="/admin/beds">Bed admin</NavLink> : null}
        {bedScoped ? <NavLink to="/staff/beds">Bed workspace</NavLink> : null}

        {!hasSession ? <NavLink to="/login">Staff login</NavLink> : null}
      </nav>
    </header>
  );
}

function AppRoutes() {
  const { apiToken, readOnly } = useAuth();

  return (
    <>
      <NavigationSentinel />
      <TopNav />
      <Routes>
        <Route path="/" element={<PatientHome />} />
        <Route path="/login" element={<StaffLoginPage />} />
        <Route
          path="/queue"
          element={
            <PatientSection
              title="Queue and Token Booking"
              description="Book a token, see your place in line, and follow live wait-time updates."
            >
              <QueuePanel />
            </PatientSection>
          }
        />
        <Route
          path="/medicines"
          element={
            <PatientSection
              title="Medicine Availability"
              description="Search by generic or brand name and check stock, quantity, and alternatives."
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
              description="Check which doctors are available, busy, or off duty before visiting."
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
              description="See whether MRI, CT, ventilator, and other hospital machines are available."
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
              description="View live occupancy across wards before admission planning."
            >
              <BedPanel />
            </PatientSection>
          }
        />
        <Route
          path="/scan"
          element={
            <PatientSection
              title="Prescription Photo Scan"
              description="Upload a prescription or document image and get a Gemini-powered transcription."
            >
              <VisionPanel />
            </PatientSection>
          }
        />

        <Route path="/staff" element={<StaffHome />} />
        <Route
          path="/staff/queue"
          element={
            <AdminSectionLayout
              title="Queue workspace"
              description="Operational controls for queue progress."
            >
              <AdminQueueTools token={apiToken ?? ''} readOnly={readOnly} />
            </AdminSectionLayout>
          }
        />
        <Route
          path="/staff/medicines"
          element={
            <AdminSectionLayout
              title="Pharmacy workspace"
              description="Adjust stock counts without touching queue tools."
            >
              <AdminPharmacyTools token={apiToken ?? ''} readOnly={readOnly} />
            </AdminSectionLayout>
          }
        />
        <Route
          path="/staff/beds"
          element={
            <AdminSectionLayout
              title="Bed workspace"
              description="Admit, discharge, and cleaning workflows."
            >
              <AdminBedTools token={apiToken ?? ''} readOnly={readOnly} />
            </AdminSectionLayout>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminSectionLayout
              title="Choose an admin workspace"
              description="Use separate pages for queue calling, pharmacy stock, and bed operations."
            >
              <section className="feature-grid">
                <Link className="link-card" to="/admin/queue">
                  <Ticket size={22} />
                  <strong>Queue Workspace</strong>
                  <p>Call next and close consultations.</p>
                  <span>
                    Open page <ArrowRight size={14} />
                  </span>
                </Link>
                <Link className="link-card" to="/admin/pharmacy">
                  <Pill size={22} />
                  <strong>Pharmacy Workspace</strong>
                  <p>Update medicine stock quantities.</p>
                  <span>
                    Open page <ArrowRight size={14} />
                  </span>
                </Link>
                <Link className="link-card" to="/admin/doctors">
                  <Stethoscope size={22} />
                  <strong>Doctor Workspace</strong>
                  <p>Update doctor availability and slots.</p>
                  <span>
                    Open page <ArrowRight size={14} />
                  </span>
                </Link>
                <Link className="link-card" to="/admin/machines">
                  <Settings2 size={22} />
                  <strong>Machine Workspace</strong>
                  <p>Update equipment status and quantity.</p>
                  <span>
                    Open page <ArrowRight size={14} />
                  </span>
                </Link>
                <Link className="link-card" to="/admin/beds">
                  <BedDouble size={22} />
                  <strong>Bed Workspace</strong>
                  <p>Admit, discharge, and clean beds.</p>
                  <span>
                    Open page <ArrowRight size={14} />
                  </span>
                </Link>
              </section>
            </AdminSectionLayout>
          }
        />
        <Route
          path="/admin/doctor"
          element={
            <AdminSectionLayout
              title="Doctor administrator"
              description="Queue operations and physician workflows."
            >
              <DoctorAdminPage />
            </AdminSectionLayout>
          }
        />
        <Route
          path="/admin/medical"
          element={
            <AdminSectionLayout
              title="Medical administrator"
              description="Pharmacy inventory oversight."
            >
              <MedicalAdminPage />
            </AdminSectionLayout>
          }
        />
        <Route
          path="/admin/queue"
          element={
            <AdminSectionLayout
              title="Queue Workspace"
              description="Queue calling and completion actions live on this page only."
            >
              <AdminQueueTools token={apiToken ?? ''} readOnly={readOnly} />
            </AdminSectionLayout>
          }
        />
        <Route
          path="/admin/pharmacy"
          element={
            <AdminSectionLayout
              title="Pharmacy Workspace"
              description="Stock updates are separated here so staff can work faster without queue noise."
            >
              <AdminPharmacyTools token={apiToken ?? ''} readOnly={readOnly} />
            </AdminSectionLayout>
          }
        />
        <Route
          path="/admin/doctors"
          element={
            <AdminSectionLayout
              title="Doctor Workspace"
              description="Update doctor availability, room, and next slot from this page."
            >
              <AdminDoctorTools token={apiToken ?? ''} readOnly={readOnly} />
            </AdminSectionLayout>
          }
        />
        <Route
          path="/admin/machines"
          element={
            <AdminSectionLayout
              title="Machine Workspace"
              description="Track machine availability and whether equipment is in use or under maintenance."
            >
              <AdminMachineTools token={apiToken ?? ''} readOnly={readOnly} />
            </AdminSectionLayout>
          }
        />
        <Route
          path="/admin/beds"
          element={
            <AdminSectionLayout
              title="Bed Workspace"
              description="Admissions and discharge controls are isolated here for ward operations."
            >
              <BedAdminLanding />
              <AdminBedTools token={apiToken ?? ''} readOnly={readOnly} />
            </AdminSectionLayout>
          }
        />

        <Route path="/nodal" element={<NodalDashboardPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <AppRoutes />;
}
