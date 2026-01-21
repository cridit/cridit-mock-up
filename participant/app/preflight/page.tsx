import { scenarios } from "../scenario/data";

export default function PreflightPage() {
  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Participant Questionnaire</p>
          <h1>Pre-flight Surveys</h1>
          <p className="subhead">
            Each scenario has its own pre-flight questionnaire. Choose the
            scenario you are about to run.
          </p>
        </div>
        <div className="badge-stack">
          <div className="badge">
            <span className="label">Mode</span>
            <strong>Scenario-specific</strong>
          </div>
        </div>
      </header>

      <main className="grid landing">
        {scenarios.map((scenario) => (
          <section key={scenario.key} className="panel landing-card">
            <h3>{scenario.title}</h3>
            <p className="muted">{scenario.subhead}</p>
            <div className="button-row">
              <a className="primary" href={`/preflight/${scenario.key}`}>
                Open {scenario.status} pre-flight
              </a>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
