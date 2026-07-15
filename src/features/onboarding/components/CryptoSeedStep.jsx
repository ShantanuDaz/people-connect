import { useNavigate } from "react-router";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useDownloadFile } from "@/hooks/useDownloadFile";
import { useOnboardingStore } from "../stores/useOnboardingStore";
import { Button } from "@/components/Button";
import { Copy, CheckCircle2, Download } from "lucide-react";

export const CryptoSeedStep = () => {
  const { mnemonic, name, setStep, submitOnboarding, submitLoading } = useOnboardingStore();
  const navigate = useNavigate();
  const { isCopied, copy } = useCopyToClipboard();
  const { download } = useDownloadFile();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
        <h3 className="text-primary font-bold mb-2 flex items-center gap-2">
          Your Master Key
        </h3>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Welcome to the decentralized web. We don't store your data on our servers—you own it. 
          This 24-word phrase is your personal master key. Keep it safe offline, as we cannot recover it for you!
        </p>
      </div>

      <div className="bg-secondary/50 rounded-xl p-4 border border-border relative">
        <div className="grid grid-cols-3 gap-x-2 gap-y-3 font-mono text-sm sm:text-base">
          {mnemonic.split(" ").map((word, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-muted-foreground select-none">{String(index + 1).padStart(2, '0')}.</span>
              <span className="font-semibold text-foreground">{word}</span>
            </div>
          ))}
        </div>
        
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            type="button"
            onClick={() => download(mnemonic, { filename: `${name ? name.replace(/\s+/g, '-').toLowerCase() : 'people-connect'}-recovery-phrase.txt` })}
            className="p-2 bg-background rounded-lg border border-border hover:bg-secondary transition-colors"
            title="Download recovery phrase"
          >
            <Download className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
          </button>
          <button
            type="button"
            onClick={() => copy(mnemonic)}
            className="p-2 bg-background rounded-lg border border-border hover:bg-secondary transition-colors"
            title="Copy to clipboard"
          >
            {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />}
          </button>
        </div>
      </div>

      <div className="flex gap-3 w-full mt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setStep(2)} 
          className="flex-1"
          disabled={submitLoading}
        >
          Back
        </Button>
        <Button onClick={() => submitOnboarding(navigate)} className="flex-1" disabled={submitLoading}>
          {submitLoading ? "Creating..." : "I've saved it securely"}
        </Button>
      </div>
    </div>
  );
};
