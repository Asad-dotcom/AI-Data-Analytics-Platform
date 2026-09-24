import { RegisterForm } from '@/components/auth/RegisterForm';
import { LandingNavbar } from '@/components/landing/Navbar';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <LandingNavbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <RegisterForm />
      </div>
    </div>
  );
}
