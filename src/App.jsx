import { Outlet } from "react-router";
import { Header } from "./components/Header";
import "./index.css";

export default function App() {
  return (
    <section className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Header />
      <main className="flex-1 relative bg-background overflow-y-auto">
        <Outlet />
      </main>
    </section>
  );
}
