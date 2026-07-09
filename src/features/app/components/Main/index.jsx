import UserSettings from "@/features/UserSettings";

const Main = ({ currentSection = "" }) => {
  const getSection = (section) => {
    switch (section) {
      case "profile":
        return <UserSettings />;
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
