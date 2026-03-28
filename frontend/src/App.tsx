import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, ArrowRight, BedDouble, Building2, Pill, ScanText, Settings2, Stethoscope, Ticket } from 'lucide-react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
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
          <span><Activity size={16} /> Realtime queue</span>
          <span><Pill size={16} /> Stock lookup</span>
          <span><Building2 size={16} /> Bed dashboard</span>
        </div>
      </div>
    </section>

    <section className="feature-grid">
      <Link className="link-card" to="/queue">
        <Ticket size={22} />
        <strong>Queue & Tokens</strong>
        <p>Book OPD token and track position.</p>
        <span>Open page <ArrowRight size={14} /></span>
      </Link>
      <Link className="link-card" to="/medicines">
        <Pill size={22} />
        <strong>Medicines</strong>
        <p>Search stock, location, and alternatives.</p>
        <span>Open page <ArrowRight size={14} /></span>
      </Link>
      <Link className="link-card" to="/beds">
        <BedDouble size={22} />
        <strong>Beds & Wards</strong>
        <p>Check live bed occupancy by ward.</p>
        <span>Open page <ArrowRight size={14} /></span>
      </Link>
      <Link className="link-card" to="/doctors">
        <Stethoscope size={22} />
        <strong>Doctors</strong>
        <p>Check doctor status, room, and next slot.</p>
        <span>Open page <ArrowRight size={14} /></span>
      </Link>
      <Link className="link-card" to="/machines">
        <Settings2 size={22} />
        <strong>Machines</strong>
        <p>See if MRI, CT, ventilator, and other equipment are available.</p>
        <span>Open page <ArrowRight size={14} /></span>
      </Link>
      <Link className="link-card" to="/scan">
        <ScanText size={22} />
        <strong>Prescription Scan</strong>
        <p>Upload a photo and transcribe with Gemini.</p>
        <span>Open page <ArrowRight size={14} /></span>
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

const AdminSection = ({
  title,
  description,
  token,
  onLogin,
  onLogout,
  children,
}: {
  title: string;
  description: string;
  token: string | null;
  onLogin: (token: string) => void;
  onLogout: () => void;
  children: ReactNode;
}) => (
  <main className="page-shell">
    <section className="hero compact-hero">
      <div className="hero-copy">
        <p className="eyebrow">Admin Console</p>
        <h1>{title}</h1>
        <p className="hero-text">{description}</p>
      </div>
      {token ? (
        <div className="hero-actions">
          <button type="button" onClick={onLogout}>Logout</button>
        </div>
      ) : null}
    </section>
    <nav className="subnav">
      <NavLink to="/admin">Overview</NavLink>
      <NavLink to="/admin/queue">Queue</NavLink>
      <NavLink to="/admin/pharmacy">Pharmacy</NavLink>
      <NavLink to="/admin/doctors">Doctors</NavLink>
      <NavLink to="/admin/machines">Machines</NavLink>
      <NavLink to="/admin/beds">Beds</NavLink>
    </nav>
    {token ? children : <AdminLogin onLogin={onLogin} />}
  </main>
);

function App() {
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = window.localStorage.getItem('opencare-admin-token');
    if (savedToken) {
      setAdminToken(savedToken);
    }
  }, []);

  const handleAdminLogin = (token: string) => {
    setAdminToken(token);
    window.localStorage.setItem('opencare-admin-token', token);
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    window.localStorage.removeItem('opencare-admin-token');
  };

  return (
    <div className="app-shell">
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
          <NavLink to="/admin">Admin</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<PatientHome />} />
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
        <Route
          path="/admin"
          element={
            <AdminSection
              title="Choose an admin workspace"
              description="Use separate pages for queue calling, pharmacy stock, and bed operations."
              token={adminToken}
              onLogin={handleAdminLogin}
              onLogout={handleAdminLogout}
            >
              <section className="feature-grid">
                <Link className="link-card" to="/admin/queue">
                  <Ticket size={22} />
                  <strong>Queue Workspace</strong>
                  <p>Call next and close consultations.</p>
                  <span>Open page <ArrowRight size={14} /></span>
                </Link>
                <Link className="link-card" to="/admin/pharmacy">
                  <Pill size={22} />
                  <strong>Pharmacy Workspace</strong>
                  <p>Update medicine stock quantities.</p>
                  <span>Open page <ArrowRight size={14} /></span>
                </Link>
                <Link className="link-card" to="/admin/beds">
                  <BedDouble size={22} />
                  <strong>Bed Workspace</strong>
                  <p>Admit, discharge, and clean beds.</p>
                  <span>Open page <ArrowRight size={14} /></span>
                </Link>
                <Link className="link-card" to="/admin/doctors">
                  <Stethoscope size={22} />
                  <strong>Doctor Workspace</strong>
                  <p>Update doctor availability and slots.</p>
                  <span>Open page <ArrowRight size={14} /></span>
                </Link>
                <Link className="link-card" to="/admin/machines">
                  <Settings2 size={22} />
                  <strong>Machine Workspace</strong>
                  <p>Update equipment status and quantity.</p>
                  <span>Open page <ArrowRight size={14} /></span>
                </Link>
              </section>
            </AdminSection>
          }
        />
        <Route
          path="/admin/queue"
          element={
            <AdminSection
              title="Queue Workspace"
              description="Queue calling and completion actions live on this page only."
              token={adminToken}
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
              description="Stock updates are separated here so staff can work faster without queue noise."
              token={adminToken}
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
              description="Update doctor availability, room, and next slot from this page."
              token={adminToken}
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
              description="Track machine availability and whether equipment is in use or under maintenance."
              token={adminToken}
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
              description="Admissions and discharge controls are isolated here for ward operations."
              token={adminToken}
              onLogin={handleAdminLogin}
              onLogout={handleAdminLogout}
            >
              <AdminBedTools token={adminToken ?? ''} />
            </AdminSection>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
