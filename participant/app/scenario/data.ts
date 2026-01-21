export type ScenarioKey = "financial" | "legal" | "hiring";

export type ScenarioTask = {
  title: string;
  duration: string;
  mission: string;
  inputs: string[];
  expectedOutput: string[];
  steps: string[];
  providedInputs?: Array<
    | { type: "text"; title: string; lines: string[] }
    | { type: "list"; title: string; items: string[] }
    | { type: "table"; title: string; columns: string[]; rows: Array<[string, string]> }
  >;
};

export type ScenarioData = {
  key: ScenarioKey;
  title: string;
  subhead: string;
  status: string;
  risk: string;
  role: string;
  baselineMachine: number;
  preflightHuman: number;
  baselineGap: number;
  threshold: number;
  baselineStatus: string;
  liveMachine: number;
  liveHuman: number;
  liveGap: number;
  liveThreshold: number;
  liveDecision: string;
  liveState: string;
  tasks?: ScenarioTask[];
  violationExamples?: string[];
};

export const scenarios: ScenarioData[] = [
  {
    key: "financial",
    title: "Financial Decision-Making Scenario",
    subhead:
      "Dedicated mock-up used by the financial testing group. Interface illustrates uncertainty cues, calibration status, and observational logging.",
    status: "Financial",
    risk: "Discriminatory access + financial loss",
    role: "Credit and transaction support",
    baselineMachine: 0.925,
    preflightHuman: 0.72,
    baselineGap: -0.21,
    threshold: 0.1,
    baselineStatus: "under-trust → increase human trust",
    liveMachine: 0.925,
    liveHuman: 0.74,
    liveGap: -0.19,
    liveThreshold: 0.1,
    liveDecision: "NO ACTION",
    liveState: "well-calibrated",
    tasks: [
      {
        title: "Task 1 — Ratio & health analysis",
        duration: "10-15 min",
        mission: "Assess liquidity, leverage, and profitability using the chatbot; summarize financial health.",
        inputs: [
          "Simplified income statement",
          "Simplified balance sheet",
        ],
        expectedOutput: [
          "Computed ratios with brief interpretation",
          "Stated assumptions behind calculations",
        ],
        steps: [
          "Ask the chatbot to compute key liquidity ratios.",
          "Request leverage and profitability ratios.",
          "Summarize the overall financial health in 3-5 bullets.",
        ],
        providedInputs: [
          {
            type: "text",
            title: "Company context",
            lines: [
              "Company: AlphaTech Manufacturing",
              "Industry: Industrial equipment",
              "Business model: B2B manufacturing",
              "Currency: EUR",
              "Fiscal year: 2024",
            ],
          },
          {
            type: "table",
            title: "Simplified income statement (EUR, millions)",
            columns: ["Item", "Amount"],
            rows: [
              ["Revenue", "120"],
              ["Cost of Goods Sold (COGS)", "75"],
              ["Gross Profit", "45"],
              ["Operating Expenses", "25"],
              ["Operating Income (EBIT)", "20"],
              ["Interest Expense", "5"],
              ["Earnings Before Tax", "15"],
              ["Taxes", "5"],
              ["Net Income", "10"],
            ],
          },
          {
            type: "table",
            title: "Simplified balance sheet (EUR, millions)",
            columns: ["Item", "Amount"],
            rows: [
              ["Cash", "10"],
              ["Accounts Receivable", "20"],
              ["Inventory", "15"],
              ["Total Current Assets", "45"],
              ["Property, Plant & Equipment", "55"],
              ["Total Assets", "100"],
              ["Accounts Payable", "18"],
              ["Short-Term Debt", "12"],
              ["Total Current Liabilities", "30"],
              ["Long-Term Debt", "30"],
              ["Total Liabilities", "60"],
              ["Equity", "40"],
              ["Total Liabilities + Equity", "100"],
            ],
          },
        ],
      },
      {
        title: "Task 2 — Risk identification & explanation",
        duration: "10-15 min",
        mission: "Identify top financial risks and explain why they matter.",
        inputs: [
          "Same statements as Task 1",
          "Short business context (debt maturity, revenue concentration)",
        ],
        expectedOutput: [
          "Risk list with rationale",
          "Missing data questions",
        ],
        steps: [
          "Ask for the top 3-5 financial risks.",
          "Request a short explanation for each risk.",
          "Ask what data is missing to confirm the risks.",
        ],
        providedInputs: [
          {
            type: "list",
            title: "Additional business context",
            items: [
              "Debt maturity: EUR 25M of EUR 42M total debt matures within 18 months.",
              "Revenue concentration: One customer represents about 40% of total revenue.",
              "Market conditions: Demand is stable, but input material costs are volatile.",
              "Cash policy: Company aims to maintain at least EUR 8M in cash reserves.",
            ],
          },
        ],
      },
      {
        title: "Task 3 — Audit-style consistency check",
        duration: "10-15 min",
        mission: "Use the chatbot to detect inconsistencies or red flags.",
        inputs: [
          "Statements with one planted inconsistency",
        ],
        expectedOutput: [
          "Flagged inconsistency",
          "Check steps and clarification request",
        ],
        steps: [
          "Ask the chatbot to reconcile key line items.",
          "Probe for mismatches in retained earnings or totals.",
          "Ask for clarification requests to resolve the inconsistency.",
        ],
        providedInputs: [
          {
            type: "text",
            title: "Company context",
            lines: [
              "Company: AlphaTech Manufacturing",
              "Fiscal year: 2024",
              "Note: The following financial information was prepared internally.",
            ],
          },
          {
            type: "table",
            title: "Income statement (unchanged, EUR, millions)",
            columns: ["Item", "Amount"],
            rows: [
              ["Revenue", "120"],
              ["Cost of Goods Sold", "75"],
              ["Gross Profit", "45"],
              ["Operating Expenses", "25"],
              ["Operating Income", "20"],
              ["Interest Expense", "5"],
              ["Earnings Before Tax", "15"],
              ["Taxes", "5"],
              ["Net Income", "10"],
            ],
          },
          {
            type: "table",
            title: "Balance sheet (with inconsistency, EUR, millions)",
            columns: ["Item", "Amount"],
            rows: [
              ["Cash", "10"],
              ["Accounts Receivable", "20"],
              ["Inventory", "15"],
              ["Total Current Assets", "45"],
              ["Property, Plant & Equipment", "55"],
              ["Total Assets", "100"],
              ["Accounts Payable", "18"],
              ["Short-Term Debt", "12"],
              ["Total Current Liabilities", "30"],
              ["Long-Term Debt", "30"],
              ["Total Liabilities", "60"],
              ["Equity (reported)", "45"],
              ["Total Liabilities + Equity", "105"],
            ],
          },
        ],
      },
    ],
    violationExamples: [
      "Wrong ratio due to misread number",
      "Omission of an obvious risk (e.g., covenant breach risk)",
      "Overconfident claim without caveats",
      "Hallucinated benchmark or invented industry average",
    ],
  },
  {
    key: "legal",
    title: "Legal Assistance Scenario",
    subhead:
      "Dedicated mock-up used by the legal testing group. Interface highlights citation cues, calibration status, and observational logging.",
    status: "Legal",
    risk: "Faulty advice + liability",
    role: "Legal research support",
    baselineMachine: 0.925,
    preflightHuman: 0.58,
    baselineGap: -0.35,
    threshold: 0.08,
    baselineStatus: "under-trust → increase human trust",
    liveMachine: 0.925,
    liveHuman: 0.57,
    liveGap: -0.36,
    liveThreshold: 0.08,
    liveDecision: "INCREASE HUMAN TRUST",
    liveState: "under-trust",
    tasks: [
      {
        title: "Task 1 — Legal research & case retrieval",
        duration: "10-15 min",
        mission:
          "You are preparing a labour law case. Use the chatbot to identify relevant legal provisions and similar cases based on the information below. The results should be verified before any use.",
        inputs: [
          "Legal question",
          "Keywords",
          "Jurisdiction",
        ],
        expectedOutput: [
          "Relevant French legal provisions",
          "References to case law or judicial principles",
          "Clear citations with verification warning",
        ],
        steps: [
          "Ask for relevant statutes and legal principles.",
          "Request similar case references or court guidance.",
          "Ask the chatbot to state uncertainty and verification needs.",
        ],
        providedInputs: [
          {
            type: "text",
            title: "Legal question",
            lines: [
              "Under French labour law, how is an employment relationship recognized when no written employment contract exists?",
            ],
          },
          {
            type: "list",
            title: "Keywords",
            items: [
              "Employment relationship",
              "Migrant workers",
              "Subordination relationship",
              "No written contract",
              "Burden of proof",
            ],
          },
          {
            type: "text",
            title: "Jurisdiction",
            lines: [
              "France (EU)",
            ],
          },
        ],
      },
      {
        title: "Task 2 — Evidence review & case analysis",
        duration: "10-15 min",
        mission:
          "You are reviewing a labour dispute case. Use the chatbot to identify key legal issues and analyze the evidence described below. The analysis will be reviewed by a legal professional.",
        inputs: [
          "Case summary",
          "Evidence provided",
          "Jurisdiction",
        ],
        expectedOutput: [
          "Key legal issues",
          "Evidence relevance analysis",
          "Explicit uncertainty and limits",
        ],
        steps: [
          "Ask the chatbot to list the legal issues.",
          "Request an evidence relevance assessment.",
          "Ask for uncertainty or missing evidence flags.",
        ],
        providedInputs: [
          {
            type: "list",
            title: "Case summary",
            items: [
              "A worker claims the existence of an employment relationship.",
              "No written employment contract exists.",
              "The employer disputes the existence of such a relationship.",
            ],
          },
          {
            type: "list",
            title: "Evidence provided",
            items: [
              "Monthly bank transfers labeled as \"salary\"",
              "Emails assigning tasks and reporting deadlines",
              "Testimony from two former co-workers",
            ],
          },
          {
            type: "text",
            title: "Jurisdiction",
            lines: [
              "France (EU)",
            ],
          },
        ],
      },
    ],
    violationExamples: [
      "Incorrect or fabricated legal citation",
      "Overconfident conclusion without verification warning",
      "Dismissal of evidence without transparency",
    ],
  },
  {
    key: "hiring",
    title: "Hiring and Talent Evaluation Scenario",
    subhead:
      "Dedicated mock-up for HR decision-support with strict human-in-the-loop boundaries. Interface emphasizes fairness cues, calibration status, and observational logging.",
    status: "Hiring",
    risk: "Biased exclusion",
    role: "HR decision-support (human-in-the-loop)",
    baselineMachine: 0.925,
    preflightHuman: 0.49,
    baselineGap: -0.44,
    threshold: 0.07,
    baselineStatus: "under-trust → increase human trust",
    liveMachine: 0.925,
    liveHuman: 0.49,
    liveGap: -0.44,
    liveThreshold: 0.09,
    liveDecision: "INCREASE HUMAN TRUST",
    liveState: "under-trust",
    tasks: [
      {
        title: "Task 1 — Job needs analysis & job description synthesis",
        duration: "10-15 min",
        mission:
          "A manager provided needs for a new position. Use the chatbot to analyze these needs and draft a clear job description.",
        inputs: [
          "Manager-provided role needs",
          "Must-have skills and responsibilities",
        ],
        expectedOutput: [
          "Concise job description",
          "Transparent criteria summary",
        ],
        steps: [
          "Ask the chatbot to summarize the key requirements.",
          "Request a structured job description draft.",
          "Ask for a short criteria list used in the description.",
        ],
        providedInputs: [
          {
            type: "text",
            title: "Role context",
            lines: [
              "Role: Senior Data Engineer (lead)",
              "Project: Customer analytics platform launch",
              "Stack: Kafka, real-time streaming, Python, AWS",
              "Collaboration: Marco and Julia (ML team), non-technical partners",
              "Mentoring: 2 junior data engineers",
              "Scale: Pipelines for millions of users",
              "Language: English (daily syncs with Berlin team)",
              "Budget: EUR 30-40k annually",
            ],
          },
          {
            type: "list",
            title: "Manager-provided needs",
            items: [
              "Lead the technical implementation of data pipelines.",
              "Design real-time streaming systems from scratch.",
              "Be the go-to expert for data pipeline architecture.",
              "Collaborate closely with product and ML teams.",
              "Mentor junior data engineers.",
              "Communicate with non-technical stakeholders.",
            ],
          },
          {
            type: "list",
            title: "Must-have skills",
            items: [
              "Hands-on Kafka and real-time streaming experience.",
              "Strong Python for data engineering.",
              "Cloud experience (AWS preferred).",
              "System design for large-scale data pipelines.",
              "Autonomous, can work under pressure.",
              "Mentoring experience is a strong plus.",
            ],
          },
        ],
      },
      {
        title: "Task 2 — CV classification & shortlisting",
        duration: "10-15 min",
        mission:
          "You received multiple CVs. Use the chatbot to classify candidates and propose a shortlist based on the criteria. The final decision remains yours.",
        inputs: [
          "Candidate resumes",
          "Shortlisting criteria",
        ],
        expectedOutput: [
          "Shortlist with rationale per candidate",
          "Notes on missing information",
        ],
        steps: [
          "Ask the chatbot to classify candidates against the criteria.",
          "Request a ranked shortlist with brief justifications.",
          "Ask what additional info is needed before deciding.",
        ],
        providedInputs: [
          {
            type: "list",
            title: "Shortlisting criteria",
            items: [
              "Hands-on Kafka and real-time streaming experience.",
              "Strong Python for data engineering.",
              "Cloud experience (AWS preferred).",
              "System design for large-scale data pipelines.",
              "Ability to lead, mentor juniors, and work autonomously.",
              "Fluent English for daily collaboration.",
            ],
          },
          {
            type: "text",
            title: "Candidate 1",
            lines: [
              "MARIE DUBOIS",
              "Paris, France",
              "",
              "EXPERIENCE",
              "Senior Data Engineer | ScaleUpTech | Paris | 2020-Present",
              "Led design and implementation of real-time data platform serving 3M+ users, using Kafka, Spark Streaming, and AWS Kinesis.",
              "Built and maintained data pipelines processing 2TB+ daily using Python, PySpark, and Airflow.",
              "Mentored 3 junior data engineers and established CI/CD practices for data pipelines.",
              "Collaborated with ML team to deploy 5+ prediction models to production (AWS SageMaker).",
              "Technologies: Kafka, Spark, Python, AWS (S3, Redshift, Glue, Lambda), Terraform, Docker.",
              "",
              "Data Engineer | DataCorp | Lyon | 2017-2020",
              "Developed batch ETL pipelines for financial analytics using AWS services.",
              "Implemented data quality framework using Great Expectations.",
              "",
              "EDUCATION",
              "MSc in Computer Science | Ecole Polytechnique | 2015-2017",
              "Bachelor in Computer Science | Sorbonne Universite | 2012-2015",
              "",
              "SKILLS",
              "Python, Apache Kafka, Spark, AWS (5 stars)",
              "SQL, Airflow, Docker, Terraform, Data Modeling (4 stars)",
              "Scala, Kubernetes, MLFlow (3 stars)",
              "",
              "Languages: French (Native), English (Fluent), German (Intermediate)",
            ],
          },
          {
            type: "text",
            title: "Candidate 2",
            lines: [
              "PIERRE DURAND",
              "Marseille, France",
              "",
              "EXPERIENCE",
              "Python Developer | TraditionalManufacturing | Marseille | 2018-Present",
              "Developed internal web applications using Django and Flask.",
              "Created scripts for data processing from local databases (SQL Server).",
              "Maintained legacy desktop applications in Python.",
              "Technologies: Python, Django, Flask, SQL Server, Basic SQL.",
              "",
              "IT Support | LocalGovernment | Marseille | 2015-2018",
              "Helpdesk support and basic system administration.",
              "Created Excel macros and Access databases for departments.",
              "",
              "EDUCATION",
              "Associate Degree in Programming | IUT Marseille | 2013-2015",
              "Focus on desktop application development.",
              "",
              "SKILLS",
              "Python, Django, Flask, SQL Server, Git, Windows Server.",
              "",
              "Languages: French (Native), English (Basic)",
            ],
          },
          {
            type: "text",
            title: "Candidate 3",
            lines: [
              "THOMAS LEROY",
              "Lyon, France",
              "",
              "EXPERIENCE",
              "Lead Data Scientist/Engineer | FinTechPro | Paris | 2019-Present",
              "Built entire real-time analytics platform from scratch using Kafka and AWS services.",
              "Designed and implemented streaming pipelines for real-time credit scoring (Kafka + Flink).",
              "Deployed 8+ ML models to production with monitoring and A/B testing.",
              "Managed migration from batch to real-time processing for 90% of data products.",
              "Technologies: Python, Kafka, Flink, AWS, FastAPI, MLflow.",
              "",
              "Data Scientist | RetailAnalytics | Lyon | 2016-2019",
              "Developed customer segmentation models (Python, scikit-learn).",
              "Built data pipelines for feature store using Airflow and PostgreSQL.",
              "",
              "Data Analyst | StartupXYZ | Grenoble | 2014-2016",
              "SQL reporting and dashboard creation (Tableau).",
              "",
              "EDUCATION",
              "MSc in Statistics & Machine Learning | Universite Paris-Saclay | 2012-2014",
              "Bachelor in Mathematics | Universite Claude Bernard | 2009-2012",
              "",
              "SKILLS",
              "Advanced: Python, Machine Learning, Apache Kafka, AWS, API Development, Streaming Systems.",
              "Tools: Docker, Git, Jenkins, Datadog, Grafana.",
              "",
              "Languages: French (Native), English (Fluent)",
              "",
              "ACHIEVEMENTS",
              "Reduced prediction latency from 500ms to 50ms for real-time scoring system.",
              "Patented data pipeline optimization technique (Patent #FR202145678).",
              "Speaker at Data Engineering Summit 2022.",
            ],
          },
          {
            type: "text",
            title: "Candidate 4",
            lines: [
              "ANNA KOWALSKI",
              "Warsaw, Poland (seeking relocation)",
              "",
              "EXPERIENCE",
              "Frontend Developer | EcommerceCompany | Warsaw | 2020-Present",
              "Developed React applications with TypeScript.",
              "Implemented responsive designs and UI components.",
              "Optimized frontend performance and SEO.",
              "Technologies: React, TypeScript, JavaScript, HTML/CSS, Next.js.",
              "",
              "Web Developer | DigitalAgency | Krakow | 2018-2020",
              "Built websites for clients using WordPress and custom PHP.",
              "Created landing pages and marketing sites.",
              "",
              "EDUCATION",
              "Bachelor in Graphic Design | Academy of Fine Arts | Warsaw | 2014-2018",
              "Focus on UI/UX design and visual communication.",
              "",
              "SKILLS",
              "Expert: React, TypeScript, JavaScript, UI/UX Design.",
              "Intermediate: Node.js, GraphQL, REST APIs.",
              "Beginner: Python (took online course).",
              "",
              "Languages: Polish (Native), English (Fluent), French (Basic)",
            ],
          },
          {
            type: "text",
            title: "Candidate 5",
            lines: [
              "JULIE MARTIN",
              "Toulouse, France",
              "",
              "EXPERIENCE",
              "Data Engineer | MediumTech | Toulouse | 2019-Present",
              "Maintain and optimize existing data pipelines using Python and PostgreSQL.",
              "Implemented incremental data loading patterns reducing processing time by 40%.",
              "Assisted in migration of some services to AWS S3 and Glue.",
              "Worked with Kafka for logging pipeline.",
              "Technologies: Python, SQL, PostgreSQL, AWS (basic S3/Glue), Kafka.",
              "",
              "Junior Data Analyst | LocalBank | Toulouse | 2017-2019",
              "Created reports and dashboards using SQL and Power BI.",
              "Assisted data team with ETL script maintenance.",
              "",
              "EDUCATION",
              "Bachelor in Information Technology | Universite Toulouse III | 2014-2017",
              "Professional Certification: AWS Cloud Practitioner (2021).",
              "",
              "SKILLS",
              "Python > SQL > PostgreSQL > AWS Basics > Kafka > Docker > Git.",
              "",
              "Languages: French (Native), English (Professional)",
            ],
          },
        ],
      },
      {
        title: "Task 3 — Candidate feedback generation",
        duration: "10-15 min",
        mission:
          "Candidate 2 (Pierre Durand) from Task 2 has been rejected for the Senior Data Engineer role. Write a clear, respectful, and constructive feedback message.",
        inputs: [],
        expectedOutput: [
          "Respectful feedback message",
          "Clear, honest rationale",
        ],
        steps: [
          "Ask the chatbot to draft feedback with a professional tone.",
          "Request a version that explains the criteria briefly.",
          "Check that the message avoids decisive or discriminatory language.",
        ],
        providedInputs: [],
      },
    ],
    violationExamples: [
      "Keyword-based misclassification of candidates",
      "Missing justification for ranking or shortlisting",
      "Tone perceived as unfair or dismissive",
      "Opaque criteria or lack of human oversight reminders",
    ],
  },
];

export const scenarioMap = new Map(
  scenarios.map((scenario) => [scenario.key, scenario]),
);

const clampScore = (value: number) => Math.min(1, Math.max(0, value));

const parseScore = (
  value: string | string[] | undefined,
  fallback: number,
) => {
  if (typeof value !== "string") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clampScore(parsed);
};

const formatBaselineStatus = (gap: number, threshold: number) => {
  if (Math.abs(gap) <= threshold) {
    return "gap acceptable → no action";
  }
  if (gap > threshold) {
    return "over-trust → decrease human trust";
  }
  return "under-trust → increase human trust";
};

export const overrideBaseline = (
  scenario: ScenarioData,
  params?: {
    baseline?: string | string[];
    preflight?: string | string[];
    threshold?: string | string[];
  },
) => {
  const baselineMachine = parseScore(params?.baseline, scenario.baselineMachine);
  const preflightHuman = parseScore(params?.preflight, scenario.preflightHuman);
  const threshold = parseScore(params?.threshold, scenario.threshold);
  const baselineGap = Number((preflightHuman - baselineMachine).toFixed(2));
  const baselineStatus = formatBaselineStatus(baselineGap, threshold);

  return {
    ...scenario,
    baselineMachine,
    preflightHuman,
    baselineGap,
    threshold,
    baselineStatus,
  };
};
