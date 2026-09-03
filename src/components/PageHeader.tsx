import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/green-bharat-logo.png";
import { ArrowLeft, Coins } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Admins return to the admin dashboard.
  // Normal users return to the normal user dashboard.
  const handleBack = () => {
    if (user?.role === "admin") {
      navigate("/admin");
      return;
    }

    navigate("/home");
  };

  return (
    <header className="gradient-dark sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="text-primary-foreground/70 hover:text-primary-foreground mr-1 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <img
            src={logo}
            alt="Green Bharat"
            width={32}
            height={32}
            className="object-contain"
          />

          <div>
            <h1 className="text-sm font-bold text-primary-foreground">
              {title}
            </h1>

            {subtitle && (
              <p className="text-xs text-primary-foreground/60">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {user && (
          <div className="gradient-coin px-3 py-1.5 rounded-full flex items-center gap-2">
            <Coins
              size={14}
              className="text-coin-foreground"
              aria-hidden="true"
            />

            <span className="font-bold text-coin-foreground text-xs">
              {user.bioCoins.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;