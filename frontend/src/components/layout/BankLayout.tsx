import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BankLayoutProps = { children: ReactNode };

export function BankLayout({ children }: BankLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayName = user?.full_name ?? user?.fullName ?? user?.phone ?? "Admin";

  return (
    <div className="flex h-screen bg-app">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-elevated border-r border-line">
        <div className="p-6 border-b border-line">
          <h1 className="text-lg font-bold text-neutral-100">SQB Legal</h1>
          <p className="text-xs text-subtle mt-1">Bank Admin</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          <NavLink
            to="/bank/dashboard"
            className={({ isActive }) =>
              cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-input text-white" : "text-subtle hover:text-white"
              )
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/bank/upload"
            className={({ isActive }) =>
              cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-input text-white" : "text-subtle hover:text-white"
              )
            }
          >
            Upload
          </NavLink>
          <NavLink
            to="/bank/text"
            className={({ isActive }) =>
              cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-input text-white" : "text-subtle hover:text-white"
              )
            }
          >
            Text request
          </NavLink>
          <NavLink
            to="/bank/approvals"
            className={({ isActive }) =>
              cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-input text-white" : "text-subtle hover:text-white"
              )
            }
          >
            Approvals
          </NavLink>
          <NavLink
            to="/bank/history"
            className={({ isActive }) =>
              cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-input text-white" : "text-subtle hover:text-white"
              )
            }
          >
            History
          </NavLink>
        </nav>

        <div className="p-4 border-t border-line">
          <div className="mb-4 pb-4 border-b border-line">
            <p className="text-xs text-faint uppercase">Signed in as</p>
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-danger hover:bg-[#451a1a] rounded-lg transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
