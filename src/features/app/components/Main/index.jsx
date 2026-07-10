import UserSettings from "@/features/UserSettings";
import ConnectionLayout from "@/features/chat/components/ConnectionLayout";

const Main = ({ currentSection = "" }) => {
  const getSection = (section) => {
    switch (section) {
      case "profile":
        return <UserSettings />;
      case "messages":
        return <ConnectionLayout />;
      default:
        return section + " In Progress";
    }
  };
  return (
    <>
      <main className="h-full bg-background text-text p-4 overflow-y-auto">
        {getSection(currentSection)}
      </main>
    </>
  );
};

export default Main;
