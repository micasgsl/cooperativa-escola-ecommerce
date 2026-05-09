import { eq, and, like, desc, asc, sql, gte, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, cartItems, orders, orderItems, favorites, coupons, reviews } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== PRODUCTS =====
export async function getAllProducts(filters?: { category?: string; minPrice?: number; maxPrice?: number; minRating?: number; search?: string; featured?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(products).where(eq(products.active, true));
  const conditions: any[] = [eq(products.active, true)];
  if (filters?.category) conditions.push(eq(products.category, filters.category as any));
  if (filters?.minPrice) conditions.push(gte(products.price, String(filters.minPrice)));
  if (filters?.maxPrice) conditions.push(lte(products.price, String(filters.maxPrice)));
  if (filters?.minRating) conditions.push(gte(products.avgRating, String(filters.minRating)));
  if (filters?.featured) conditions.push(eq(products.featured, true));
  if (filters?.search) conditions.push(or(like(products.name, `%${filters.search}%`), like(products.description, `%${filters.search}%`)));
  return db.select().from(products).where(and(...conditions)).orderBy(desc(products.featured), desc(products.createdAt));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.featured, true), eq(products.active, true))).limit(8);
}

export async function searchProducts(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.active, true), or(like(products.name, `%${query}%`), like(products.description, `%${query}%`)))).limit(10);
}

export async function createProduct(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return result[0].insertId;
}

export async function updateProduct(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ active: false }).where(eq(products.id, id));
}

// ===== CART =====
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ cartItem: cartItems, product: products }).from(cartItems).innerJoin(products, eq(cartItems.productId, products.id)).where(eq(cartItems.userId, userId));
}

export async function addToCart(userId: number, productId: number, quantity: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))).limit(1);
  if (existing.length > 0) {
    await db.update(cartItems).set({ quantity: existing[0].quantity + quantity }).where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, productId, quantity });
  }
}

export async function updateCartQuantity(userId: number, cartItemId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)));
  } else {
    await db.update(cartItems).set({ quantity }).where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)));
  }
}

export async function removeFromCart(userId: number, cartItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ===== ORDERS =====
export async function createOrder(userId: number, data: { total: number; discount?: number; couponCode?: string; address?: string; city?: string; state?: string; zipCode?: string; phone?: string; notes?: string }, items: { productId: number; productName: string; price: number; quantity: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const orderResult = await db.insert(orders).values({ userId, ...data, total: String(data.total), discount: data.discount ? String(data.discount) : "0" });
  const orderId = orderResult[0].insertId;
  for (const item of items) {
    await db.insert(orderItems).values({ orderId, productId: item.productId, productName: item.productName, price: String(item.price), quantity: item.quantity });
  }
  return orderId;
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderById(orderId: number, userId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = userId ? and(eq(orders.id, orderId), eq(orders.userId, userId)) : eq(orders.id, orderId);
  const result = await db.select().from(orders).where(conditions).limit(1);
  if (!result[0]) return undefined;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return { ...result[0], items };
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ order: orders, user: { id: users.id, name: users.name, email: users.email } }).from(orders).leftJoin(users, eq(orders.userId, users.id)).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status: status as any }).where(eq(orders.id, orderId));
}

// ===== FAVORITES =====
export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ favorite: favorites, product: products }).from(favorites).innerJoin(products, eq(favorites.productId, products.id)).where(eq(favorites.userId, userId));
}

export async function addFavorite(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.productId, productId))).limit(1);
  if (existing.length === 0) {
    await db.insert(favorites).values({ userId, productId });
  }
}

export async function removeFavorite(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
}

export async function isFavorite(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return { isFavorite: false };
  const result = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.productId, productId))).limit(1);
  return { isFavorite: result.length > 0 };
}

// ===== COUPONS =====
export async function validateCoupon(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coupons).where(and(eq(coupons.code, code), eq(coupons.active, true))).limit(1);
  if (!result[0]) return undefined;
  const coupon = result[0];
  if (coupon.usedCount >= coupon.maxUses) return undefined;
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return undefined;
  return coupon;
}

export async function useCoupon(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.code, code));
}

export async function getAllCoupons() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function createCoupon(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(coupons).values(data);
}

export async function deleteCoupon(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(coupons).where(eq(coupons.id, id));
}

// ===== REVIEWS =====
export async function getProductReviews(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.productId, productId)).orderBy(desc(reviews.createdAt));
}

export async function createReview(userId: number, productId: number, rating: number, comment: string, userName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(reviews).values({ userId, productId, rating, comment, userName });
  // Update product average rating
  const allReviews = await db.select().from(reviews).where(eq(reviews.productId, productId));
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await db.update(products).set({ avgRating: String(avgRating.toFixed(2)), totalReviews: allReviews.length }).where(eq(products.id, productId));
}

// ===== ADMIN STATS =====
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalProducts: 0, totalOrders: 0, totalUsers: 0, totalRevenue: 0 };
  const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.active, true));
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [revenue] = await db.select({ total: sql<number>`COALESCE(SUM(total), 0)` }).from(orders).where(eq(orders.status, "delivered"));
  return { totalProducts: productCount.count, totalOrders: orderCount.count, totalUsers: userCount.count, totalRevenue: Number(revenue.total) };
}

export async function getAllProductsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(desc(products.createdAt));
}
