import ApiKeyForm from "@/components/settings/ApiKeyForm";

export const metadata = { title: "Ajustes — EduAgent AI" };

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Ajustes</h1>
      <ApiKeyForm />
    </main>
  );
}
