import { ArrowRight, BedDouble } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BedAdminPage() {
  return (
    <section className="feature-grid">
      <Link className="link-card" to="/staff/beds">
        <BedDouble size={22} />
        <strong>Bed &amp; ward workspace</strong>
        <p>Admit, discharge, and mark beds for cleaning.</p>
        <span>
          Open workspace <ArrowRight size={14} />
        </span>
      </Link>
    </section>
  );
}
