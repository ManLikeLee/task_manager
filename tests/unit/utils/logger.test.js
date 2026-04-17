const logger = require("../../../src/utils/logger");

describe("logger", () => {
  test("writes structured info logs", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    logger.info("request.complete", {
      requestId: "req-1",
      path: "/api/health",
      latencyMs: 10,
    });

    expect(spy).toHaveBeenCalledTimes(1);

    const payload = JSON.parse(spy.mock.calls[0][0]);

    expect(payload.level).toBe("info");
    expect(payload.msg).toBe("request.complete");
    expect(payload.requestId).toBe("req-1");
    expect(payload.path).toBe("/api/health");
    expect(payload.latencyMs).toBe(10);
    expect(payload.timestamp).toEqual(expect.any(String));

    spy.mockRestore();
  });
});
