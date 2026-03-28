import { ArrowRight, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DoctorAdminPage() {
  return (
    <section className="feature-grid">
      <Link className="link-card" to="/staff/queue">
        <Ticket size={22} />
        <strong>Queue &amp; token operations</strong>
        <p>Call patients, advance tokens, and close visits.</p>
        <span>
          Open workspace <ArrowRight size={14} />
        </span>
      </Link>
    </section>
  );
}
