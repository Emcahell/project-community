import { Navbar } from "@/components/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 pt-8 pb-24 md:pb-8">{children}</main>
    </>
  );
}
