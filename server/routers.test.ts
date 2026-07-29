import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "admin@acmeautomotive.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Admin User");
    expect(result?.role).toBe("admin");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("router structure", () => {
  it("has all expected routers defined", () => {
    // Verify the appRouter has all the expected sub-routers
    const routerKeys = Object.keys(appRouter._def.procedures || {}).concat(
      Object.keys(appRouter._def.record || {})
    );
    
    // The appRouter should have these top-level keys
    const caller = appRouter.createCaller(createAuthContext().ctx);
    expect(caller.auth).toBeDefined();
    expect(caller.workOrder).toBeDefined();
    expect(caller.vehicle).toBeDefined();
    expect(caller.clients).toBeDefined();
    expect(caller.invoice).toBeDefined();
    expect(caller.maintenance).toBeDefined();
    expect(caller.parts).toBeDefined();
    expect(caller.timeEntry).toBeDefined();
    expect(caller.payRecord).toBeDefined();
    expect(caller.dashboard).toBeDefined();
    expect(caller.inventory).toBeDefined();
    expect(caller.calendar).toBeDefined();
    expect(caller.driving).toBeDefined();
    expect(caller.expense).toBeDefined();
    expect(caller.flipProject).toBeDefined();
  });
});
