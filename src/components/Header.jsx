import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import { MessageSquare, Settings, Moon, Sun } from "lucide-react";

export function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial state from localStorage or document element
    const savedTheme = localStorage.getItem("theme");
    let isDarkMode = false;
    
    if (savedTheme) {
      isDarkMode = savedTheme === "dark";
    } else {
      isDarkMode = document.documentElement.classList.contains("dark");
    }

    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="w-20 border-r border-border bg-card flex flex-col items-center py-6 gap-6 z-10 shrink-0 shadow-sm justify-between">
      
      {/* Top Section */}
      <nav className="flex flex-col gap-4 w-full px-3">
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex justify-center items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
            }`
          }
        >
          <MessageSquare size={24} />
        </NavLink>
      </nav>

      {/* Bottom Section */}
      <nav className="flex flex-col gap-4 w-full px-3">
        <button
          onClick={toggleTheme}
          className="flex justify-center items-center p-3 rounded-xl transition-all duration-200 cursor-pointer text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
          title="Toggle Theme"
        >
          {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex justify-center items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
            }`
          }
        >
          <Settings size={24} />
        </NavLink>
      </nav>
      
    </header>
  );
}
