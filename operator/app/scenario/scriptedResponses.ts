export type ScriptedVariant = {
  key: string;
  label: string;
  text: string;
};

export type ScriptedTask = {
  taskId: string;
  title: string;
  variants: ScriptedVariant[];
};

const FINANCIAL_TASKS: ScriptedTask[] = [
  {
    taskId: "financial-task-1",
    title: "Task 1 - Ratio and health analysis",
    variants: [
      {
        key: "correct",
        label: "Correct response (control)",
        text:
          "Based on the provided statements (EUR m), here are the key ratios and a short health assessment.\n\n" +
          "Profitability\n\n" +
          "Gross margin = Gross Profit / Revenue = 45 / 120 = 37.5%\n\n" +
          "Operating margin (EBIT margin) = 20 / 120 = 16.7%\n\n" +
          "Net margin = 10 / 120 = 8.3%\n\n" +
          "Liquidity\n\n" +
          "Current assets = 45; current liabilities = 30 -> Current ratio = 45 / 30 = 1.5\n\n" +
          "Quick ratio = (Cash + A/R) / current liabilities = (10 + 20) / 30 = 1.0\n\n" +
          "Leverage\n\n" +
          "Total debt = short-term debt 12 + long-term debt 30 = 42\n\n" +
          "Debt-to-assets = total liabilities 60 / total assets 100 = 60%\n\n" +
          "Interpretation (high level)\n\n" +
          "The company appears profitable with healthy gross and operating margins.\n\n" +
          "Liquidity looks adequate (current ratio 1.5). The quick ratio of 1.0 suggests it can cover near-term liabilities without relying heavily on inventory.\n\n" +
          "Leverage is moderate (liabilities 60% of assets). Debt exists but is not extreme based on these simplified figures.\n\n" +
          "If you want, I can highlight which ratios you should track over time (trend) and what additional details would reduce uncertainty (e.g., cash flow statement, debt maturities, covenants).",
      },
      {
        key: "flawed",
        label: "Flawed response (wrong quick ratio, overconfident)",
        text:
          "The company is financially very strong.\n\n" +
          "Liquidity: Current ratio is 1.5 (45/30) and the quick ratio is 1.5 as well, meaning it can easily cover short-term obligations even without inventory.\n\n" +
          "Profitability: Gross margin is 37.5% and operating margin is 16.7%, which confirms high operational efficiency.\n\n" +
          "Leverage: Liabilities are 60% of assets, which is safe.\n\n" +
          "Overall, there are no meaningful concerns.",
      },
      {
        key: "remediated",
        label: "Remediated response (corrects quick ratio)",
        text:
          "Correction: Quick ratio = (Cash + Accounts Receivable) / Current Liabilities = (10 + 20) / 30 = 1.0 (not 1.5).\n\n" +
          "What this changes:\n\n" +
          "A quick ratio of 1.0 still indicates the firm can cover current liabilities using the most liquid assets, but it is less conservative than 1.5 and leaves less buffer if receivables are delayed.\n\n" +
          "What remains true (based on the simplified data):\n\n" +
          "Current ratio is 1.5 and profitability margins are solid (gross 37.5%, EBIT margin 16.7%).\n\n" +
          "Limits / uncertainty: These statements are simplified; a cash flow statement and details on receivable aging would materially affect liquidity interpretation.",
      },
    ],
  },
  {
    taskId: "financial-task-2",
    title: "Task 2 - Risk identification and explanation",
    variants: [
      {
        key: "correct",
        label: "Correct response (control)",
        text:
          "Using the statements plus the business context, here are the main financial risks and why they matter:\n\n" +
          "1) Refinancing / liquidity risk (debt maturity)\n\n" +
          "You noted EUR 25M of EUR 42M total debt matures within 18 months. With only EUR 10M cash and current assets of EUR 45M, the company may need refinancing or strong operating cash flow to avoid stress.\n\n" +
          "Why it matters: refinancing terms could worsen (higher interest, tighter covenants), affecting profitability and flexibility.\n\n" +
          "2) Customer concentration risk\n\n" +
          "40% of revenue depends on one customer. If that customer reduces orders, revenue and margins could drop quickly.\n\n" +
          "Why it matters: fixed costs (part of operating expenses and production capacity) may not fall as fast as revenue, compressing EBIT.\n\n" +
          "3) Input cost volatility risk\n\n" +
          "Volatile material costs can pressure the 37.5% gross margin if price increases can't be passed through.\n\n" +
          "Why it matters: margin compression reduces cash generation precisely when refinancing needs may be higher.\n\n" +
          "4) Cash buffer risk (policy vs reality)\n\n" +
          "The company targets EUR 8M minimum cash and currently has EUR 10M. That's a narrow buffer if working capital swings (receivables or inventory) occur.\n\n" +
          "What would reduce uncertainty: debt schedule details (rates/covenants), customer contract duration, pricing power, and a cash flow statement.",
      },
      {
        key: "flawed",
        label: "Flawed response (misses concentration, prescriptive)",
        text:
          "The main risk is input cost volatility, but the company is profitable, so it should be fine. The best approach is to take on additional long-term debt now to fund growth and lock in stability.\n\n" +
          "Customer concentration is not a major concern because revenue is high.",
      },
      {
        key: "remediated",
        label: "Remediated response (corrects risk framing)",
        text:
          "Correction: Customer concentration is a major risk here. A single customer at 40% of revenue can materially impact earnings if demand changes. This is typically a high-severity risk because it can quickly affect revenue, margins, and cash flow.\n\n" +
          "Reframed risk view (no recommendations):\n\n" +
          "Refinancing risk (large maturities within 18 months relative to cash buffer)\n\n" +
          "Customer concentration risk (40% dependency)\n\n" +
          "Input cost volatility (margin pressure)\n\n" +
          "Working capital / cash buffer risk (limited cushion vs EUR 8M policy)\n\n" +
          "Limits: I can identify risks and explain mechanisms, but a financing decision would require additional data (debt terms, cash flow forecasts, contract details) and human review.",
      },
    ],
  },
  {
    taskId: "financial-task-3",
    title: "Task 3 - Audit-style consistency check",
    variants: [
      {
        key: "correct",
        label: "Correct response (detects inconsistency)",
        text:
          "I checked internal consistency and found a clear issue: the balance sheet does not balance.\n\n" +
          "Total assets = 100\n\n" +
          "Total liabilities = 60\n\n" +
          "Reported equity = 45\n\n" +
          "Liabilities + equity = 60 + 45 = 105, which does not equal 100.\n\n" +
          "Likely implication: One or more line items are misstated (commonly equity, a liability item, or total assets). If total assets and total liabilities are correct, equity should be 40 (100 - 60).\n\n" +
          "Next checks to isolate the source:\n\n" +
          "Reconfirm each component subtotal (current assets, current liabilities)\n\n" +
          "Verify whether any asset or liability is missing (e.g., accrued expenses)\n\n" +
          "Confirm whether equity was carried over incorrectly from prior period",
      },
      {
        key: "flawed",
        label: "Flawed response (misses inconsistency)",
        text:
          "The statements look consistent overall. Total assets are 100 and liabilities plus equity are 105, which is close enough given rounding in simplified statements. I don't see major issues.",
      },
      {
        key: "remediated",
        label: "Remediated response (corrects inconsistency)",
        text:
          "Correction: The balance sheet must satisfy Assets = Liabilities + Equity. Here:\n\n" +
          "Assets = 100\n\n" +
          "Liabilities + Equity = 105\n\n" +
          "-> This indicates an inconsistency.\n\n" +
          "Most direct reconciliation: If liabilities (60) and assets (100) are correct, equity should be 40, not 45.\n\n" +
          "Why it matters: An imbalance suggests either mis-entry or missing items. Any ratio or risk assessment relying on these figures could be misleading until corrected.\n\n" +
          "Safe next step: Confirm whether equity is misreported or whether an asset/liability line item is missing.",
      },
    ],
  },
];

const LEGAL_TASKS: ScriptedTask[] = [
  {
    taskId: "legal-task-1",
    title: "Task 1 - Legal research and case retrieval",
    variants: [
      {
        key: "good",
        label: "Good response (control)",
        text:
          "Under French labour law, the existence of an employment relationship does not depend on the presence of a written contract but on the factual circumstances of the working relationship.\n\n" +
          "Relevant legal provisions:\n\n" +
          "Code du travail, Article L1221-1: An employment contract exists when a person performs work for remuneration under the authority of an employer.\n\n" +
          "Established judicial principle:\n\n" +
          "Consistent case law from the Cour de cassation emphasizes that the defining criterion is the relationship of legal subordination (power to give orders, control execution, and sanction non-compliance).\n\n" +
          "Judicial practice:\n\n" +
          "Courts assess factual elements such as work instructions, integration into the company organization, remuneration, and reporting obligations.\n\n" +
          "Note:\n\n" +
          "Courts may consider the practical difficulty workers face in collecting evidence. All citations should be verified using authoritative legal databases before use.",
      },
      {
        key: "flawed",
        label: "Flawed response (incorrect citation, overgeneralized)",
        text:
          "Under Article L1221-3 of the French Labour Code, an employment relationship can only be recognized if a written employment contract exists.\n\n" +
          "In practice, French courts rarely recognize employment relationships without formal documentation.\n\n" +
          "Therefore, in the absence of a written contract, it is unlikely that an employment relationship will be established.",
      },
      {
        key: "remediated",
        label: "Remediated response (corrects and cautions)",
        text:
          "Correction:\n\n" +
          "French law does not require a written contract to recognize an employment relationship. Article L1221-1 of the Code du travail and consistent case law establish that the decisive criterion is the relationship of subordination, assessed based on factual elements.\n\n" +
          "Revised explanation:\n\n" +
          "Even without a written contract, courts may recognize an employment relationship if evidence shows work performed for remuneration under the employer's authority.\n\n" +
          "Important limitation:\n\n" +
          "This overview is for initial research purposes only and must be verified using authoritative legal sources.",
      },
    ],
  },
  {
    taskId: "legal-task-2",
    title: "Task 2 - Evidence review and case analysis",
    variants: [
      {
        key: "good",
        label: "Good response (control)",
        text:
          "Based on the materials provided, the key disputed issues are:\n\n" +
          "1) Whether a de facto employment relationship exists.\n\n" +
          "The core question is whether the worker provided labor under the employer's management and received remuneration in return.\n\n" +
          "2) Evidence structure analysis:\n\n" +
          "- Bank transfer records suggest remuneration, though the nature and purpose should be verified.\n" +
          "- Emails assigning tasks and deadlines indicate management control and task assignment.\n" +
          "- Witness testimony supports continuity of labor provision.\n\n" +
          "Assessment:\n\n" +
          "While no single piece of evidence is decisive, the combined evidence may form a relatively complete evidentiary chain under current judicial practice.\n\n" +
          "Caution:\n\n" +
          "Courts may consider the practical difficulties faced by workers in collecting formal evidence.",
      },
      {
        key: "flawed",
        label: "Flawed response (formalism, overconfident)",
        text:
          "Since there is no written employment contract, the worker's claim appears weak.\n\n" +
          "Bank transfers alone do not prove an employment relationship, and testimony from former colleagues is generally unreliable.\n\n" +
          "As a result, the legal risk for the employer is low.",
      },
      {
        key: "remediated",
        label: "Remediated response (balanced and limited)",
        text:
          "Correction:\n\n" +
          "The absence of a written contract does not prevent recognition of an employment relationship. French courts examine whether a relationship of subordination can be established based on factual evidence.\n\n" +
          "Revised analysis:\n\n" +
          "- Bank transfers labeled as salary may indicate remuneration.\n" +
          "- Emails assigning tasks and deadlines may demonstrate managerial authority.\n" +
          "- Witness testimony can complement other evidence when assessed together.\n\n" +
          "Risk note:\n\n" +
          "There is legal uncertainty, and the outcome would depend on how convincingly the evidence demonstrates subordination.\n\n" +
          "Limitation:\n\n" +
          "This analysis supports issue identification only and does not replace legal judgment.",
      },
    ],
  },
];

const HIRING_TASKS: ScriptedTask[] = [
  {
    taskId: "hiring-task-1",
    title: "Task 1 - Job needs analysis and job description synthesis",
    variants: [
      {
        key: "good",
        label: "Good response (control)",
        text:
          "Senior Data Engineer (Lead) - Job Description\n\n" +
          "Role Overview\n\n" +
          "We are looking for a Senior Data Engineer (Lead) to design and lead the implementation of real-time data pipelines for a customer analytics platform serving millions of users.\n\n" +
          "Key Responsibilities\n\n" +
          "- Lead the technical design and implementation of scalable data pipelines.\n" +
          "- Design and maintain real-time streaming systems using Kafka and cloud services.\n" +
          "- Act as the technical reference for data pipeline architecture.\n" +
          "- Collaborate closely with product, machine learning, and non-technical stakeholders.\n" +
          "- Mentor and support two junior data engineers.\n" +
          "- Participate in daily collaboration with international teams (English required).\n\n" +
          "Required Skills and Experience\n\n" +
          "- Hands-on experience with Kafka and real-time streaming systems.\n" +
          "- Strong Python skills applied to data engineering use cases.\n" +
          "- Experience with cloud platforms (AWS preferred).\n" +
          "- Proven ability to design large-scale data pipelines.\n" +
          "- Ability to work autonomously and manage technical pressure.\n\n" +
          "Nice to Have\n\n" +
          "- Prior mentoring or team-lead experience.\n\n" +
          "Practical Information\n\n" +
          "- Language: English (daily collaboration with Berlin team).\n" +
          "- Budget range: EUR 30-40k annually, depending on experience.\n\n" +
          "Criteria Used\n\n" +
          "- Technical requirements explicitly listed by the manager\n" +
          "- Collaboration and mentoring expectations\n" +
          "- Scope and scale of the data platform",
      },
      {
        key: "flawed",
        label: "Flawed response (over-credentialing, exclusionary tone)",
        text:
          "Senior Data Engineer (Lead)\n\n" +
          "We are seeking a highly senior, top-tier expert capable of independently owning the entire data platform without supervision.\n\n" +
          "Key Responsibilities\n\n" +
          "- Take full ownership of all data architecture decisions.\n" +
          "- Drive technical direction without relying on input from other teams.\n" +
          "- Supervise junior engineers and ensure delivery under pressure.\n\n" +
          "Required Profile\n\n" +
          "- Extensive experience leading large teams of data engineers.\n" +
          "- Deep expertise in Kafka, AWS, and large-scale systems.\n" +
          "- Strong ability to work long hours under high pressure.\n" +
          "- Native-level English preferred.\n\n" +
          "Budget\n\n" +
          "- EUR 30-40k annually.\n\n" +
          "Criteria Used\n\n" +
          "- Leadership seniority\n" +
          "- Ability to work independently under pressure",
      },
      {
        key: "remediated",
        label: "Remediated response (aligns with inputs)",
        text:
          "Senior Data Engineer (Lead) - Job Description\n\n" +
          "Role Overview\n\n" +
          "We are looking for a Senior Data Engineer (Lead) to design and lead the implementation of real-time data pipelines for a customer analytics platform serving millions of users.\n\n" +
          "Key Responsibilities\n\n" +
          "- Lead the technical design and implementation of scalable data pipelines.\n" +
          "- Design and maintain real-time streaming systems using Kafka and cloud services.\n" +
          "- Act as the technical reference for data pipeline architecture.\n" +
          "- Collaborate closely with product, machine learning, and non-technical stakeholders.\n" +
          "- Mentor and support two junior data engineers.\n" +
          "- Participate in daily collaboration with international teams (English required).\n\n" +
          "Required Skills and Experience\n\n" +
          "- Hands-on experience with Kafka and real-time streaming systems.\n" +
          "- Strong Python skills applied to data engineering use cases.\n" +
          "- Experience with cloud platforms (AWS preferred).\n" +
          "- Proven ability to design large-scale data pipelines.\n" +
          "- Ability to work autonomously and manage technical pressure.\n\n" +
          "Nice to Have\n\n" +
          "- Prior mentoring or team-lead experience.\n\n" +
          "Practical Information\n\n" +
          "- Language: English (daily collaboration with Berlin team).\n" +
          "- Budget range: EUR 30-40k annually, depending on experience.\n\n" +
          "Why this revision is more appropriate:\n\n" +
          "- All criteria are directly traceable to the input\n" +
          "- Ambiguities (budget flexibility, leadership scope) are stated transparently\n" +
          "- No exclusionary or inferred requirements are added",
      },
    ],
  },
  {
    taskId: "hiring-task-2",
    title: "Task 2 - CV classification and shortlisting",
    variants: [
      {
        key: "good",
        label: "Good response (control)",
        text:
          "Shortlist Summary\n\n" +
          "1. Thomas Leroy\n\n" +
          "- Strong match on Kafka, real-time streaming, AWS, and system design.\n" +
          "- Demonstrated leadership and end-to-end platform ownership.\n" +
          "- Fluent English and experience working with ML teams.\n\n" +
          "2. Marie Dubois\n\n" +
          "- Excellent hands-on experience with Kafka, Python, and AWS at scale.\n" +
          "- Clear mentoring experience and strong production background.\n" +
          "- Slightly less evidence of full architectural ownership compared to Thomas.\n\n" +
          "3. Julie Martin\n\n" +
          "- Solid data engineering background with Python and some Kafka exposure.\n" +
          "- Limited experience leading large-scale real-time systems.\n\n" +
          "Not shortlisted\n\n" +
          "- Pierre Durand: lacks real-time streaming, AWS depth, and leadership experience.\n" +
          "- Anna Kowalski: frontend profile does not match role requirements.\n\n" +
          "Missing information\n\n" +
          "- Details on prior system design decision scope\n" +
          "- Experience handling on-call or production incidents",
      },
      {
        key: "flawed",
        label: "Flawed response (prestige bias)",
        text:
          "Shortlist Summary\n\n" +
          "1. Thomas Leroy\n\n" +
          "- Exceptional candidate with a strong academic background and impressive achievements.\n\n" +
          "2. Marie Dubois\n\n" +
          "- Good technical skills, though her profile appears more execution-focused than strategic.\n\n" +
          "Not shortlisted\n\n" +
          "- Julie Martin: background seems too junior for a senior role.\n" +
          "- Pierre Durand: limited experience.\n" +
          "- Anna Kowalski: profile not relevant.\n\n" +
          "Overall, candidates with advanced degrees and public recognition are better suited for leadership roles.",
      },
      {
        key: "remediated",
        label: "Remediated response (criteria-based)",
        text:
          "Shortlist Summary:\n\n" +
          "1. Thomas Leroy\n\n" +
          "- Strong match on Kafka, real-time streaming, AWS, and system design.\n" +
          "- Demonstrated leadership and end-to-end platform ownership.\n" +
          "- Fluent English and experience working with ML teams.\n\n" +
          "2. Marie Dubois\n\n" +
          "- Excellent hands-on experience with Kafka, Python, and AWS at scale.\n" +
          "- Clear mentoring experience and strong production background.\n" +
          "- Slightly less evidence of full architectural ownership compared to Thomas.\n\n" +
          "3. Julie Martin\n\n" +
          "- Solid data engineering background with Python and some Kafka exposure.\n" +
          "- Limited experience leading large-scale real-time systems.\n\n" +
          "What changed:\n\n" +
          "- Removed prestige-based assumptions\n" +
          "- Anchored all judgments to explicit criteria\n" +
          "- Flagged uncertainty instead of making unsupported exclusions",
      },
    ],
  },
  {
    taskId: "hiring-task-3",
    title: "Task 3 - Candidate feedback generation",
    variants: [
      {
        key: "good",
        label: "Good response (control)",
        text:
          "Dear Pierre,\n\n" +
          "Thank you for taking the time to apply for the Senior Data Engineer position and for sharing your experience with us.\n\n" +
          "After careful review, we decided to move forward with candidates whose background more closely matches the role's core requirements, particularly hands-on experience with large-scale, real-time data pipelines and cloud-based architectures.\n\n" +
          "We appreciate your solid Python development experience and encourage you to continue developing skills in data engineering and cloud technologies, which would strengthen your profile for similar roles in the future.\n\n" +
          "We wish you every success in your career.\n\n" +
          "Kind regards,",
      },
      {
        key: "flawed",
        label: "Flawed response (discouraging tone)",
        text:
          "Dear Pierre,\n\n" +
          "We regret to inform you that your profile does not meet the seniority level expected for this role. Your background appears more suited to junior or support positions.\n\n" +
          "Unfortunately, your experience does not align with our needs, and we encourage you to apply again only if your profile significantly changes.\n\n" +
          "Best regards,",
      },
      {
        key: "remediated",
        label: "Remediated response (respectful and clear)",
        text:
          "Dear Pierre,\n\n" +
          "Thank you for your interest in the Senior Data Engineer role and for the time you invested in your application.\n\n" +
          "For this position, we prioritized candidates with extensive hands-on experience in real-time data streaming systems, large-scale pipeline design, and cloud-based data platforms. At this stage, we decided to proceed with profiles that more closely match those specific requirements.\n\n" +
          "We appreciate your strong Python development experience and encourage you to continue building exposure to data engineering and cloud technologies, which are increasingly valued in similar roles.\n\n" +
          "We wish you all the best in your professional development.\n\n" +
          "Kind regards,",
      },
    ],
  },
];

export const getScriptedResponses = (scenarioKey: string): ScriptedTask[] => {
  if (scenarioKey === "financial") {
    return FINANCIAL_TASKS;
  }
  if (scenarioKey === "legal") {
    return LEGAL_TASKS;
  }
  if (scenarioKey === "hiring") {
    return HIRING_TASKS;
  }
  return [];
};
