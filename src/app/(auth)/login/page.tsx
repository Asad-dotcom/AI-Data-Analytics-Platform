import { LoginForm } from '@/components/auth/LoginForm';
import { LandingNavbar } from '@/components/landing/Navbar';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <LandingNavbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <LoginForm />
      </div>
    </div>
  );
}
