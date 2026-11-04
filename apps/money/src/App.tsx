import { greeting } from "./content/greeting";

export default function App() {
  return (
    <main className="page">
      <h1>{greeting.title}</h1>
      <p className="lead">{greeting.hello}</p>
      <p>{greeting.promise}</p>
      <p className="small">{greeting.status}</p>
    </main>
  );
}
