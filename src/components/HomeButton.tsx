import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface HomeButtonProps {
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

const HomeButton = ({ className, variant = "ghost", size = "icon" }: HomeButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on home page
  if (location.pathname === "/") {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate("/")}
      className={className}
      title="الصفحة الرئيسية"
    >
      <Home className="h-5 w-5" />
    </Button>
  );
};

export default HomeButton;
