import { useState } from "react";
import { Check, Copy, Shield } from "lucide-react";
import { useCopyToClipboard } from "../../../hooks/useCopyToClipboard";

const SettingsCard = ({ 
  icon: Icon, 
  title, 
  iconColor = "text-primary", 
  hoverColor = "hover:border-primary/50", 
  action, 
  copyText,
  isSecret,
  children, 
  footer 
}) => {
  const [copied, copy] = useCopyToClipboard();
  const [isRevealed, setIsRevealed] = useState(false);

  const showCopy = copyText && (!isSecret || isRevealed);

  return (
    <div className={`bg-secondary/10 border border-secondary/20 rounded-xl p-6 transition-all ${hoverColor}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-3 ${iconColor}`}>
          <Icon className="w-5 h-5" />
          <h2 className="text-lg font-semibold text-text">{title}</h2>
        </div>
        <div className="flex gap-2">
          {action}
          {isSecret && (
            <button
              onClick={() => setIsRevealed(!isRevealed)}
              className="text-sm text-secondary hover:text-primary transition-colors bg-background px-3 py-1.5 rounded-md border border-secondary/20 cursor-pointer"
            >
              {isRevealed ? "Hide" : "Reveal"}
            </button>
          )}
          {showCopy && (
            <button
              onClick={() => copy(copyText)}
              className="flex items-center gap-2 text-sm text-secondary hover:text-accent transition-colors bg-background px-3 py-1.5 rounded-md border border-secondary/20 cursor-pointer"
            >
              {copied ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>
      <div className={`bg-background border border-secondary/30 rounded-lg p-4 transition-all duration-300 ${isSecret && !isRevealed ? "filter blur-md select-none" : ""}`}>
        {children}
      </div>
      {(footer || (isSecret && !isRevealed)) && (
        <div className="mt-2">
          {isSecret && !isRevealed ? (
            <p className="text-xs text-secondary/70 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Hidden for your security
            </p>
          ) : footer}
        </div>
      )}
    </div>
  );
};

export default SettingsCard;
