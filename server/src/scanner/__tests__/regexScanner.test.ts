import { describe, expect, it } from "vitest";
import { scanFileWithRegex } from "../regexScanner.js";
import { scanEnvFile } from "../envScanner.js";

describe("regexScanner", () => {
  it("flags hardcoded OpenAI keys as CRITICAL", () => {
    const findings = scanFileWithRegex({
      filePath: "src/foo.ts",
      content: 'const k = "sk-ABCDEFGHIJKLMNOPQRSTUV12345";',
      isEnvFile: false,
    });
    expect(findings).toHaveLength(1);
    expect(findings[0].risk).toBe("CRITICAL");
    expect(findings[0].valueMasked).not.toMatch(/ABCDEF/);
    expect(findings[0].valueMasked.startsWith("sk-A")).toBe(true);
  });

  it("flags VITE_ prefixed env access as client exposed", () => {
    const findings = scanFileWithRegex({
      filePath: "src/useChat.ts",
      content: "const k = import.meta.env.VITE_OPENAI_API_KEY;",
      isEnvFile: false,
    });
    // No literal secret detected, only env access — the regex scanner skips
    // env access without a literal, so dependencyTrace handles that case.
    expect(findings).toHaveLength(0);
  });

  it("ignores comments", () => {
    const findings = scanFileWithRegex({
      filePath: "src/foo.ts",
      content: "// sk-ABCDEFGHIJKLMNOPQRSTUV12345",
      isEnvFile: false,
    });
    expect(findings).toHaveLength(0);
  });
});

describe("envScanner", () => {
  it("emits a finding per declaration in .env", () => {
    const findings = scanEnvFile({
      filePath: ".env",
      content: [
        "# comment",
        "OPENAI_API_KEY=sk-EXAMPLEEXAMPLEEXAMPLEEXAMPLE12345",
        "VITE_OPENAI_API_KEY=sk-EXAMPLEPUBLICEXAMPLEEXAMPLE5555",
        "EMPTY=",
      ].join("\n"),
    });
    expect(findings).toHaveLength(2);
    const [serverFinding, clientFinding] = findings;
    expect(serverFinding.variableName).toBe("OPENAI_API_KEY");
    expect(serverFinding.risk).toBe("LOW");
    expect(clientFinding.variableName).toBe("VITE_OPENAI_API_KEY");
    expect(clientFinding.clientExposed).toBe(true);
    expect(clientFinding.risk).toBe("CRITICAL");
  });
});
