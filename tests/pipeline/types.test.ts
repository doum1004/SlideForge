import { describe, expect, it } from "bun:test";
import {
  CopyOutput,
  DesignBriefOutput,
  PlanOutput,
  QAReport,
  ResearchOutput,
} from "../../src/pipeline/types.js";

describe("ResearchOutput schema", () => {
  const VALID = {
    topic: "AI",
    summary: "AI is transforming the world",
    keyFacts: [{ fact: "GPT-4 has 1.7T params" }],
    statistics: [{ value: "90%", description: "adoption rate" }],
    quotes: [{ text: "AI is the new electricity", author: "Andrew Ng" }],
    targetAudience: "Tech professionals",
    keywords: ["AI", "ML"],
  };

  it("accepts valid research output", () => {
    expect(() => ResearchOutput.parse(VALID)).not.toThrow();
  });

  it("allows optional source on keyFacts", () => {
    const data = { ...VALID, keyFacts: [{ fact: "test", source: "Wikipedia" }] };
    expect(() => ResearchOutput.parse(data)).not.toThrow();
  });

  it("rejects missing topic", () => {
    const { topic: _, ...rest } = VALID;
    expect(() => ResearchOutput.parse(rest)).toThrow();
  });

  it("rejects missing keywords array", () => {
    const { keywords: _, ...rest } = VALID;
    expect(() => ResearchOutput.parse(rest)).toThrow();
  });
});

describe("PlanOutput schema", () => {
  const VALID = {
    title: "AI 혁명",
    totalSlides: 5,
    narrative: "empathy to action",
    slides: [
      {
        slideNumber: 1,
        role: "cover",
        emotionPhase: "empathy",
        emotionTemperature: 2,
        purpose: "hook",
        direction: "bold intro",
      },
      {
        slideNumber: 2,
        role: "body",
        emotionPhase: "transition",
        emotionTemperature: 3,
        purpose: "explain",
        direction: "stats",
      },
      {
        slideNumber: 3,
        role: "body",
        emotionPhase: "evidence",
        emotionTemperature: 4,
        purpose: "prove",
        direction: "data",
      },
      {
        slideNumber: 4,
        role: "body",
        emotionPhase: "evidence",
        emotionTemperature: 3,
        purpose: "context",
        direction: "example",
      },
      {
        slideNumber: 5,
        role: "cta",
        emotionPhase: "action",
        emotionTemperature: 5,
        purpose: "convert",
        direction: "call to action",
      },
    ],
  };

  it("accepts valid plan", () => {
    expect(() => PlanOutput.parse(VALID)).not.toThrow();
  });

  it("allows optional subtitle", () => {
    const data = { ...VALID, subtitle: "부제목" };
    expect(() => PlanOutput.parse(data)).not.toThrow();
  });

  it("rejects totalSlides below 3", () => {
    const data = { ...VALID, totalSlides: 2 };
    expect(() => PlanOutput.parse(data)).toThrow();
  });

  it("rejects totalSlides above 20", () => {
    const data = { ...VALID, totalSlides: 21 };
    expect(() => PlanOutput.parse(data)).toThrow();
  });

  it("rejects invalid emotion temperature", () => {
    const data = {
      ...VALID,
      slides: [{ ...VALID.slides[0], emotionTemperature: 6 }],
    };
    expect(() => PlanOutput.parse(data)).toThrow();
  });

  it("rejects invalid slide role", () => {
    const data = {
      ...VALID,
      slides: [{ ...VALID.slides[0], role: "invalid" }],
    };
    expect(() => PlanOutput.parse(data)).toThrow();
  });

  it("rejects invalid emotion phase", () => {
    const data = {
      ...VALID,
      slides: [{ ...VALID.slides[0], emotionPhase: "rage" }],
    };
    expect(() => PlanOutput.parse(data)).toThrow();
  });
});

describe("CopyOutput schema", () => {
  const VALID = {
    title: "AI 혁명",
    slides: [
      { slideNumber: 1, role: "cover", heading: "AI 시대" },
      { slideNumber: 2, role: "body", bodyText: "본문 텍스트" },
      { slideNumber: 3, role: "cta", ctaText: "지금 시작하세요" },
    ],
  };

  it("accepts valid copy", () => {
    expect(() => CopyOutput.parse(VALID)).not.toThrow();
  });

  it("allows all optional fields", () => {
    const data = {
      title: "Test",
      slides: [
        {
          slideNumber: 1,
          role: "body",
          heading: "h",
          subheading: "sh",
          bodyText: "body",
          bulletPoints: ["a", "b"],
          accentText: "accent",
          footnote: "fn",
          ctaText: "cta",
        },
      ],
    };
    expect(() => CopyOutput.parse(data)).not.toThrow();
  });

  it("accepts slide with only required fields", () => {
    const data = {
      title: "Minimal",
      slides: [{ slideNumber: 1, role: "body" }],
    };
    expect(() => CopyOutput.parse(data)).not.toThrow();
  });

  it("rejects missing title", () => {
    const { title: _, ...rest } = VALID;
    expect(() => CopyOutput.parse(rest)).toThrow();
  });
});

describe("DesignBriefOutput schema", () => {
  const VALID = {
    theme: "default",
    colorPalette: {
      primary: "#6C5CE7",
      secondary: "#A29BFE",
      accent: "#FD79A8",
      background: "#FFFFFF",
      text: "#2D3436",
    },
    slides: [
      { slideNumber: 1, layoutPattern: "intro-cover" },
      { slideNumber: 2, layoutPattern: "info-stats" },
      { slideNumber: 3, layoutPattern: "intro-cta" },
    ],
  };

  it("accepts valid design brief", () => {
    expect(() => DesignBriefOutput.parse(VALID)).not.toThrow();
  });

  it("allows optional color overrides per slide", () => {
    const data = {
      ...VALID,
      slides: [
        {
          slideNumber: 1,
          layoutPattern: "intro-cover",
          primaryColor: "#000",
          secondaryColor: "#fff",
          backgroundColor: "#eee",
          notes: "dark theme for cover",
        },
      ],
    };
    expect(() => DesignBriefOutput.parse(data)).not.toThrow();
  });

  it("rejects invalid layout pattern", () => {
    const data = {
      ...VALID,
      slides: [{ slideNumber: 1, layoutPattern: "not-a-pattern" }],
    };
    expect(() => DesignBriefOutput.parse(data)).toThrow();
  });

  it("rejects missing color palette field", () => {
    const { accent: _, ...palette } = VALID.colorPalette;
    const data = { ...VALID, colorPalette: palette };
    expect(() => DesignBriefOutput.parse(data)).toThrow();
  });

  it("validates all 28 layout pattern IDs", () => {
    const patterns = [
      "info-stats",
      "info-quote",
      "info-definition",
      "info-list",
      "info-highlight",
      "info-callout",
      "info-icon-grid",
      "proc-steps",
      "proc-timeline",
      "proc-numbered",
      "proc-flowchart",
      "proc-checklist",
      "comp-before-after",
      "comp-versus",
      "comp-table",
      "data-bar",
      "data-pie",
      "data-metric",
      "emph-big-text",
      "emph-centered",
      "emph-split",
      "emph-gradient",
      "code-snippet",
      "code-terminal",
      "mixed-text-image",
      "mixed-card-grid",
      "intro-cover",
      "intro-cta",
    ];
    for (const p of patterns) {
      const data = {
        ...VALID,
        slides: [{ slideNumber: 1, layoutPattern: p }],
      };
      expect(() => DesignBriefOutput.parse(data)).not.toThrow();
    }
  });
});

describe("QAReport schema", () => {
  const VALID = {
    passedAutoChecks: true,
    autoCheckResults: [
      { rule: "canvas-size", passed: true },
      { rule: "overflow-hidden", passed: true },
      { rule: "min-font-size", passed: false, detail: "Found 14px" },
    ],
    issues: [
      {
        slideNumber: 2,
        severity: "high",
        category: "layout",
        description: "Font size below 28px",
        suggestion: "Increase to at least 28px",
      },
    ],
    overallVerdict: "needs_revision",
  };

  it("accepts valid QA report", () => {
    expect(() => QAReport.parse(VALID)).not.toThrow();
  });

  it("accepts passing report with no issues", () => {
    const data = {
      passedAutoChecks: true,
      autoCheckResults: [{ rule: "canvas-size", passed: true }],
      issues: [],
      overallVerdict: "pass",
    };
    expect(() => QAReport.parse(data)).not.toThrow();
  });

  it("allows optional detail in autoCheckResults", () => {
    const data = {
      ...VALID,
      autoCheckResults: [{ rule: "test", passed: true }],
    };
    expect(() => QAReport.parse(data)).not.toThrow();
  });

  it("allows optional suggestion in issues", () => {
    const data = {
      ...VALID,
      issues: [{ slideNumber: 1, severity: "low", category: "style", description: "Minor issue" }],
    };
    expect(() => QAReport.parse(data)).not.toThrow();
  });

  it("rejects invalid verdict", () => {
    const data = { ...VALID, overallVerdict: "maybe" };
    expect(() => QAReport.parse(data)).toThrow();
  });

  it("rejects invalid severity", () => {
    const data = {
      ...VALID,
      issues: [{ slideNumber: 1, severity: "critical", category: "layout", description: "Bad" }],
    };
    expect(() => QAReport.parse(data)).toThrow();
  });

  it("rejects missing passedAutoChecks", () => {
    const { passedAutoChecks: _, ...rest } = VALID;
    expect(() => QAReport.parse(rest)).toThrow();
  });

  it("validates all severity levels", () => {
    for (const severity of ["high", "medium", "low"]) {
      const data = {
        ...VALID,
        issues: [{ slideNumber: 1, severity, category: "test", description: "test" }],
      };
      expect(() => QAReport.parse(data)).not.toThrow();
    }
  });
});
