import LoginForm from '@/components/admin/LoginForm';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B2419] px-4 py-10">
      <div className="w-full max-w-sm border border-white/15 bg-[#0F3324] p-6 sm:p-8">
        <div className="text-[11px] uppercase tracking-[0.2em] text-[#A6E35A]">11 On Field</div>
        <h1 className="mt-1 text-2xl font-semibold text-white">Đăng nhập quản trị</h1>
        <p className="mb-6 mt-1 text-[14px] text-[#C4D0C8]">Dành cho biên tập viên, ban giám khảo và quản trị viên.</p>
        <LoginForm />
      </div>
    </div>
  );
}
