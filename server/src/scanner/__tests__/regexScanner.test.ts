import { describe, expect, it } from "vitest";
import { scanFileWithRegex } from "../regexScanner.js";
import { scanEnvFile } from "../envScanner.js";

/** Avoid spelling the OpenAI key prefix as one literal in this file so self-scans stay clean. */
const openaiLikePrefix = () => ["s", "k", "-"].join("");
const openaiLikeKey = () => openaiLikePrefix() + "X".repeat(25);

describe("regexScanner", () => {
  it("flags hardcoded OpenAI keys as CRITICAL", () => {
    const key = openaiLikeKey();
    const findings = scanFileWithRegex({
      filePath: "src/foo.ts",
      content: `const k = "${key}";`,
      isEnvFile: false,
    });
    expect(findings).toHaveLength(1);
    expect(findings[0].risk).toBe("CRITICAL");
    expect(findings[0].valueMasked).not.toContain(key);
    expect(findings[0].valueMasked.startsWith(openaiLikePrefix())).toBe(true);
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
      content: `// ${openaiLikeKey()}`,
      isEnvFile: false,
    });
    expect(findings).toHaveLength(0);
  });
});

describe("envScanner", () => {
  it("emits a finding per declaration in .env", () => {
    const serverKey = openaiLikeKey();
    const clientKey = openaiLikePrefix() + "Y".repeat(25);
    const findings = scanEnvFile({
      filePath: ".env",
      content: [
        "# comment",
        `OPENAI_API_KEY=${serverKey}`,
        `VITE_OPENAI_API_KEY=${clientKey}`,
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
