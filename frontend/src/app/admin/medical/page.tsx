import { ArrowRight, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MedicalAdminPage() {
  return (
    <section className="feature-grid">
      <Link className="link-card" to="/staff/medicines">
        <Pill size={22} />
        <strong>Medicine stock workspace</strong>
        <p>Adjust quantities and keep pharmacy shelves accurate.</p>
        <span>
          Open workspace <ArrowRight size={14} />
        </span>
      </Link>
    </section>
  );
}
