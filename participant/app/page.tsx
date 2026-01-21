import Image from "next/image";
import { scenarios } from "./scenario/data";
import openAiLogo from "./scenario/open-ai-logo.png";

export default function Home() {
  return (
    <div className="page">
      <header className="hero">
        <div className="hero-grid">
          <div className="hero-col">
            <p className="eyebrow">CRiDiT Mock-up</p>
            <h1>Three Scenario Test Beds</h1>
            <p className="subhead">Choose a scenario to start the test.</p>
          </div>
          <div className="hero-col hero-right">
            <div className="openai-badge" aria-label="Powered by OpenAI">
              <Image className="openai-mark" src={openAiLogo} alt="OpenAI" width={28} height={28} />
              <span className="openai-label">Powered by</span>
              <span className="openai-wordmark">OpenAI</span>
            </div>
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
                Start
              </a>
            </div>
          </section>
        ))}
      </main>

    </div>
  );
}
