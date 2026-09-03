import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/green-bharat-logo.png";
import {
  ArrowLeft,
  Coins,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "admin" || user?.isAdmin;

  const handleBack = () => {
    if (isAdmin) {
      navigate("/home");
    } else {
      navigate("/home");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="gradient-dark sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back to home"
            className="p-1.5 rounded-lg text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <img
            src={logo}
            alt="Green Bharat"
            width={34}
            height={34}
            className="object-contain"
          />

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-primary-foreground truncate">
              {title}
            </h1>

            {subtitle && (
              <p className="text-xs text-primary-foreground/60 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Bio-Coins only for normal users */}
          {user && !isAdmin && (
            <div className="gradient-coin px-3 py-1.5 rounded-full flex items-center gap-2">
              <Coins
                size={14}
                className="text-coin-foreground"
              />

              <span className="font-bold text-coin-foreground text-xs">
                {user.bioCoins.toLocaleString()}
              </span>
            </div>
          )}

          {/* Logout */}
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="p-2 rounded-lg text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            >
              <LogOut size={19} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;