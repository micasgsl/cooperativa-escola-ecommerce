import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("products router", () => {
  it("lists products publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets featured products", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.featured();
    expect(Array.isArray(result)).toBe(true);
  });

  it("searches products", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.search({ query: "doce" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets product by id", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const products = await caller.products.list({});
    if (products.length > 0) {
      const product = await caller.products.getById({ id: products[0].id });
      expect(product).toBeDefined();
      expect(product.name).toBeDefined();
      expect(product.price).toBeDefined();
    }
  });
});

describe("cart router", () => {
  it("requires auth to list cart", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.cart.list()).rejects.toThrow();
  });

  it("lists cart for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.cart.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("favorites router", () => {
  it("requires auth to list favorites", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.favorites.list()).rejects.toThrow();
  });

  it("lists favorites for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.favorites.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("checks favorite status", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.favorites.check({ productId: 1 });
    expect(result).toHaveProperty("isFavorite");
    expect(typeof result.isFavorite).toBe("boolean");
  });
});

describe("orders router", () => {
  it("requires auth to list orders", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.orders.list()).rejects.toThrow();
  });

  it("lists orders for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.orders.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin router", () => {
  it("denies access to non-admin users", async () => {
    const caller = appRouter.createCaller(createAuthContext("user"));
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("allows admin access to stats", async () => {
    const caller = appRouter.createCaller(createAuthContext("admin"));
    const result = await caller.admin.stats();
    expect(result).toHaveProperty("totalProducts");
    expect(result).toHaveProperty("totalOrders");
    expect(result).toHaveProperty("totalUsers");
    expect(result).toHaveProperty("totalRevenue");
  });

  it("allows admin to list products", async () => {
    const caller = appRouter.createCaller(createAuthContext("admin"));
    const result = await caller.admin.products.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows admin to list coupons", async () => {
    const caller = appRouter.createCaller(createAuthContext("admin"));
    const result = await caller.admin.coupons.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("coupons router", () => {
  it("returns error for invalid coupon", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.coupons.validate({ code: "INVALID_CODE_XYZ" })).rejects.toThrow();
  });
});
