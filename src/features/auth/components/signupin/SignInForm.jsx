import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { Button } from '@/components/Button';
import { useRef } from 'react';
import { Upload } from 'lucide-react';

export const SignInForm = ({ onSubmit, loading }) => {
  const { name, setName, mnemonic, setMnemonic } = useAuthStore();
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      if (content) {
        setMnemonic(content.trim());
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again if needed
    e.target.value = null;
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2">
          Display Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Satoshi"
          className="w-full bg-input/50 text-foreground border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
          autoFocus
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 flex justify-between items-center">
          <span>Secret Recovery Phrase</span>
          <input
            type="file"
            accept=".txt"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <Upload className="w-3 h-3" />
            Import File
          </button>
        </label>

        <textarea
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          placeholder="Enter your 24-word secret recovery phrase..."
          className="w-full bg-input/50 text-foreground border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all min-h-[100px] resize-y disabled:opacity-50"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <Button
          type="button"
          onClick={onSubmit}
          variant="primary"
          fullWidth
          disabled={loading}
        >
          <span>{loading ? "Importing Account..." : "Import Account"}</span>
        </Button>
      </div>
    </div>
  );
};
