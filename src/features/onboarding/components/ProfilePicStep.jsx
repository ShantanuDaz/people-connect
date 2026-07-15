import { useRef, useState } from "react";
import { useOnboardingStore } from "../stores/useOnboardingStore";
import { Button } from "@/components/Button";
import { Camera, Upload, FileText, Hash } from "lucide-react";

export const ProfilePicStep = () => {
  const { profilePicBase64, setProfilePicBase64, bio, setBio, interests, setInterests, setStep, generateMnemonic } = useOnboardingStore();
  const fileInputRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = async () => {
    setGenerating(true);
    await generateMnemonic();
    setGenerating(false);
    setStep(3);
  };

  return (
    <div className="flex flex-col gap-6 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div 
        className="w-32 h-32 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors overflow-hidden group relative"
        onClick={() => fileInputRef.current?.click()}
      >
        {profilePicBase64 ? (
          <>
            <img src={profilePicBase64} alt="Profile" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground group-hover:text-primary transition-colors">
            <Camera className="w-8 h-8 mb-2" />
            <span className="text-xs font-medium">Upload</span>
          </div>
        )}
      </div>
      
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      <div className="w-full space-y-4">
        <div className="relative">
          <FileText className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
          <textarea
            placeholder="Write a short bio... What do you like to do?"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground resize-none"
          />
        </div>

        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Interests (e.g. coding, music, gaming)"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex gap-3 w-full mt-2">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1" disabled={generating}>
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1" disabled={generating}>
          {generating ? "Getting unique identity..." : (profilePicBase64 ? "Continue" : "Skip")}
        </Button>
      </div>
    </div>
  );
};
