import { useAuthStore } from "@/features/auth/stores/useAuthStore";
import { Button } from "@/components/Button";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useDownloadFile } from "@/hooks/useDownloadFile";
import { Copy, Download, Check } from "lucide-react";

export const SignUpPhraseStep = ({ onSubmit }) => {
  const { name, mnemonic, setSignupStep } = useAuthStore();
  const { copy, isCopied } = useCopyToClipboard();
  const { download } = useDownloadFile();

  const handleDownload = () => {
    const displayName = name.trim() || "User";
    const content = mnemonic;

    download(content, {
      filename: `${displayName.toLowerCase().replace(/\s+/g, "-")}-recovery-phrase.txt`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2 text-foreground">
          Hey {name.trim() || "there"}! 👋
        </h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Unlike traditional apps, People Connect doesn't use passwords.
          Instead, your account is secured by a unique{" "}
          <strong>24-word Secret Recovery Phrase</strong>. This ensures only{" "}
          <em>you</em> truly own your profile.
        </p>

        <label className="block text-sm font-semibold mb-3 flex justify-between items-center">
          <span>Your Secret Recovery Phrase</span>
        </label>

        <div className="flex flex-wrap gap-2 bg-input/30 p-3 rounded-xl border border-border">
          {mnemonic.split(" ").map((word, i) => (
            <div
              key={i}
              className="flex gap-2 text-sm bg-background border border-border px-2 py-1.5 rounded-lg shadow-sm"
            >
              <span className="text-muted-foreground font-mono text-xs mt-0.5 opacity-50">
                {i + 1}.
              </span>
              <span className="font-medium text-foreground">{word}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            type="button"
            onClick={() => copy(mnemonic)}
            variant="secondary"
            size="sm"
            className="flex-1"
          >
            {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {isCopied ? "Copied!" : "Copy to Clipboard"}
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            variant="secondary"
            size="sm"
            className="flex-1"
          >
            <Download className="w-4 h-4" />
            Download .txt
          </Button>
        </div>
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl mt-4">
          <p className="text-xs text-foreground/80 leading-relaxed">
            <strong>Important:</strong> Please copy or download these words and
            store them somewhere safe. You will need them to log in on other
            devices.
            <span className="block mt-2 opacity-75">
              <em>
                Don't panic! If you skip this step, you can always back up your
                phrase later from your User Settings.
              </em>
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <Button type="button" onClick={onSubmit} variant="primary" fullWidth>
          <span>Create Account</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setSignupStep(1)}
          fullWidth
        >
          Back
        </Button>
      </div>
    </div>
  );
};
