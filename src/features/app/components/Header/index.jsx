import { MessageCircle, SquarePen, Bell, User, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@components/Button";
import useUserStore from "../../../../store/useUserStore";

const Header = ({ currentSection, onSectionChange }) => {
  const profile = useUserStore((state) => state.profile);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleSectionChange = (section) => {
    onSectionChange(section);
    switch (section) {
      case "messages":
        break;
      case "compose":
        break;
      case "notifications":
        break;
      case "profile":
        break;
      default:
        break;
    }
  };

  return (
    <header className="h-full flex flex-col justify-between p-4 border-r border-secondary/20">
      <section className="grid gap-3">
        <Button
          icon={MessageCircle}
          variant={currentSection === "messages" ? "primary" : "ghost"}
          onClick={() => handleSectionChange("messages")}
        />
        <Button
          icon={SquarePen}
          variant={currentSection === "compose" ? "primary" : "ghost"}
          title="In progress"
          onClick={() => handleSectionChange("compose")}
        />
        <Button
          icon={Bell}
          variant={currentSection === "notifications" ? "primary" : "ghost"}
          title="In progress"
          onClick={() => handleSectionChange("notifications")}
        />
      </section>
      <section className="grid gap-3">
        <Button
          icon={theme === "light" ? Moon : Sun}
          onClick={() => toggleTheme()}
          title="Toggle Theme"
        />
        <Button
          variant={currentSection === "profile" ? "primary" : "secondary"}
          rounded="full"
          onClick={() => handleSectionChange("profile")}
          className={profile?.avatar ? "!p-0.5 overflow-hidden" : ""}
        >
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User size={24} />
          )}
        </Button>
      </section>
    </header>
  );
};

export default Header;
