import { describe, it, expect } from "vitest";
import {
  classifyCompatibility,
  type McpProbeResult,
  type AuditCheckResult,
} from "../../src/lib/mcp-compatibility-data";

function findCheck(checks: AuditCheckResult[], id: string): AuditCheckResult {
  const check = checks.find((c) => c.id === id);
  if (!check) throw new Error(`Expected a check with id "${id}"`);
  return check;
}

describe("classifyCompatibility — overall verdict", () => {
  it("classifies an unreachable server as unknown, with an empty checks array", () => {
    const probe: McpProbeResult = {
      reachable: false,
      discoverSupported: false,
      errorMessage: "Could not connect to this server.",
    };
    const report = classifyCompatibility(probe);
    expect(report.status).toBe("unknown");
    expect(report.detail).toBe("Could not connect to this server.");
    expect(report.checks).toEqual([]);
  });

  it("falls back to a generic message when unreachable with no errorMessage", () => {
    const report = classifyCompatibility({
      reachable: false,
      discoverSupported: false,
    });
    expect(report.status).toBe("unknown");
    expect(report.detail.length).toBeGreaterThan(0);
  });

  it("classifies a fully clean server/discover response as compatible with no caveats", () => {
    const report = classifyCompatibility({
      reachable: true,
      discoverSupported: true,
      discoverProtocolVersions: ["2026-07-28"],
      discoverResultTypePresent: true,
      discoverSessionIdPresent: false,
      headerEnforcement: "enforced",
      pingCheckApplicable: true,
      pingStillSupported: false,
      getEndpointBehavior: "modern_405",
    });
    expect(report.status).toBe("compatible");
    expect(report.headline).not.toContain("partial migration");
    expect(report.detectedVersion).toBe("2026-07-28");
  });

  it("flags a partial migration when resultType is missing from an otherwise successful discover result", () => {
    const report = classifyCompatibility({
      reachable: true,
      discoverSupported: true,
      discoverResultTypePresent: false,
    });
    expect(report.status).toBe("compatible");
    expect(report.headline).toContain("partial migration");
  });

  it("flags a partial migration when Mcp-Session-Id is still issued on a successful discover response", () => {
    const report = classifyCompatibility({
      reachable: true,
      discoverSupported: true,
      discoverSessionIdPresent: true,
    });
    expect(report.headline).toContain("partial migration");
  });

  it("flags a partial migration when header enforcement isn't actually happening", () => {
    const report = classifyCompatibility({
      reachable: true,
      discoverSupported: true,
      headerEnforcement: "not_enforced",
    });
    expect(report.headline).toContain("partial migration");
    expect(report.detail).toContain("Mcp-Method");
  });

  it("flags a partial migration when the deprecated ping method still works", () => {
    const report = classifyCompatibility({
      reachable: true,
      discoverSupported: true,
      pingCheckApplicable: true,
      pingStillSupported: true,
    });
    expect(report.headline).toContain("partial migration");
    expect(report.detail).toContain("ping");
  });

  it("classifies a recognized modern JSON-RPC error on server/discover as likely compatible", () => {
    const report = classifyCompatibility({
      reachable: true,
      discoverSupported: false,
      discoverRecognizedModernError: {
        code: -32022,
        message: "Unsupported protocol version",
      },
    });
    expect(report.status).toBe("compatible");
    expect(report.headline).toContain("Likely compatible");
    expect(report.detail).toContain("-32022");
  });

  it("classifies a server that only completes the legacy initialize handshake as legacy", () => {
    const report = classifyCompatibility({
      reachable: true,
      discoverSupported: false,
      legacyInitializeProtocolVersion: "2025-11-25",
    });
    expect(report.status).toBe("legacy");
    expect(report.detectedVersion).toBe("2025-11-25");
  });

  it("classifies as legacy from an Mcp-Session-Id header alone, even with no protocol version reported", () => {
    const report = classifyCompatibility({
      reachable: true,
      discoverSupported: false,
      legacySessionIdPresent: true,
    });
    expect(report.status).toBe("legacy");
  });

  it("classifies a reachable server with no interpretable response as unknown, not legacy", () => {
    const report = classifyCompatibility({
      reachable: true,
      discoverSupported: false,
    });
    expect(report.status).toBe("unknown");
  });

  it("every report cites a real MCP spec page as its source", () => {
    const reports = [
      classifyCompatibility({ reachable: false, discoverSupported: false }),
      classifyCompatibility({ reachable: true, discoverSupported: true }),
      classifyCompatibility({
        reachable: true,
        discoverSupported: false,
        discoverRecognizedModernError: { code: -32021 },
      }),
      classifyCompatibility({
        reachable: true,
        discoverSupported: false,
        legacyInitializeProtocolVersion: "2025-11-25",
      }),
      classifyCompatibility({ reachable: true, discoverSupported: false }),
    ];
    for (const report of reports) {
      expect(report.source).toMatch(
        /^https:\/\/modelcontextprotocol\.io\/specification\/2026-07-28\//,
      );
      expect(report.recommendations.length).toBeGreaterThan(0);
    }
  });
});

describe("classifyCompatibility — itemized checks", () => {
  it("marks server-discover as pass when discover succeeded", () => {
    const { checks } = classifyCompatibility({
      reachable: true,
      discoverSupported: true,
    });
    expect(findCheck(checks, "server-discover").status).toBe("pass");
  });

  it("marks server-discover as info when only a recognized modern error was seen", () => {
    const { checks } = classifyCompatibility({
      reachable: true,
      discoverSupported: false,
      discoverRecognizedModernError: { code: -32020 },
    });
    expect(findCheck(checks, "server-discover").status).toBe("info");
  });

  it("marks server-discover as fail when neither a result nor a recognized error was seen", () => {
    const { checks } = classifyCompatibility({
      reachable: true,
      discoverSupported: false,
      legacyInitializeProtocolVersion: "2025-11-25",
    });
    expect(findCheck(checks, "server-discover").status).toBe("fail");
  });

  it("marks result-type and no-session-id as not_applicable when discover itself failed", () => {
    const { checks } = classifyCompatibility({
      reachable: true,
      discoverSupported: false,
    });
    expect(findCheck(checks, "result-type").status).toBe("not_applicable");
    expect(findCheck(checks, "no-session-id").status).toBe("not_applicable");
  });

  it("grades result-type and no-session-id correctly when discover succeeded", () => {
    const { checks } = classifyCompatibility({
      reachable: true,
      discoverSupported: true,
      discoverResultTypePresent: true,
      discoverSessionIdPresent: true,
    });
    expect(findCheck(checks, "result-type").status).toBe("pass");
    expect(findCheck(checks, "no-session-id").status).toBe("fail");
  });

  it.each([
    ["enforced", "pass"],
    ["not_enforced", "fail"],
    ["not_applicable", "not_applicable"],
    [undefined, "not_applicable"],
  ] as const)("grades header-enforcement=%s as %s", (input, expected) => {
    const { checks } = classifyCompatibility({
      reachable: true,
      discoverSupported: false,
      headerEnforcement: input,
    });
    expect(findCheck(checks, "header-enforcement").status).toBe(expected);
  });

  it("grades ping-removed as pass when ping correctly stopped working", () => {
    const { checks } = classifyCompatibility({
      reachable: true,
      discoverSupported: false,
      pingCheckApplicable: true,
      pingStillSupported: false,
    });
    expect(findCheck(checks, "ping-removed").status).toBe("pass");
  });

  it("grades ping-removed as fail when the deprecated method still works", () => {
    const { checks } = classifyCompatibility({
      reachable: true,
      discoverSupported: false,
      pingCheckApplicable: true,
      pingStillSupported: true,
    });
    expect(findCheck(checks, "ping-removed").status).toBe("fail");
  });

  it("grades ping-removed as not_applicable when the check was inconclusive", () => {
    const { checks } = classifyCompatibility({
      reachable: true,
      discoverSupported: false,
      pingCheckApplicable: false,
    });
    expect(findCheck(checks, "ping-removed").status).toBe("not_applicable");
  });

  it.each([
    ["modern_405", "pass"],
    ["legacy_sse", "info"],
    ["other", "not_applicable"],
    ["unreachable", "not_applicable"],
    [undefined, "not_applicable"],
  ] as const)("grades get-endpoint=%s as %s", (input, expected) => {
    const { checks } = classifyCompatibility({
      reachable: true,
      discoverSupported: false,
      getEndpointBehavior: input,
    });
    expect(findCheck(checks, "get-endpoint").status).toBe(expected);
  });

  it("legacy-initialize is always informational, never pass/fail, regardless of outcome", () => {
    const reachedChecks = classifyCompatibility({
      reachable: true,
      discoverSupported: true,
      legacyInitializeReached: true,
      legacyInitializeProtocolVersion: "2025-11-25",
    }).checks;
    const notReachedChecks = classifyCompatibility({
      reachable: true,
      discoverSupported: true,
      legacyInitializeReached: false,
    }).checks;
    expect(findCheck(reachedChecks, "legacy-initialize").status).toBe("info");
    expect(findCheck(notReachedChecks, "legacy-initialize").status).toBe(
      "info",
    );
    expect(findCheck(reachedChecks, "legacy-initialize").detail).toContain(
      "2025-11-25",
    );
  });

  it("returns exactly 7 checks for every reachable probe, regardless of outcome shape", () => {
    // server-discover, result-type, no-session-id, header-enforcement,
    // ping-removed, get-endpoint, legacy-initialize — always all 7, each
    // graded pass/fail/info/not_applicable rather than omitted.
    const shapes: McpProbeResult[] = [
      { reachable: true, discoverSupported: true },
      { reachable: true, discoverSupported: false },
      {
        reachable: true,
        discoverSupported: false,
        discoverRecognizedModernError: { code: -32020 },
      },
      {
        reachable: true,
        discoverSupported: false,
        legacyInitializeProtocolVersion: "2025-11-25",
      },
    ];
    for (const probe of shapes) {
      expect(classifyCompatibility(probe).checks).toHaveLength(7);
    }
  });
});
