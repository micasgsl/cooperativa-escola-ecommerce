import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  products: router({
    list: publicProcedure.input(z.object({
      category: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      minRating: z.number().optional(),
      search: z.string().optional(),
      featured: z.boolean().optional(),
    }).optional()).query(async ({ input }) => {
      return db.getAllProducts(input || undefined);
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const product = await db.getProductById(input.id);
      if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
      return product;
    }),
    featured: publicProcedure.query(async () => {
      return db.getFeaturedProducts();
    }),
    search: publicProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
      return db.searchProducts(input.query);
    }),
    reviews: publicProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => {
      return db.getProductReviews(input.productId);
    }),
    addReview: protectedProcedure.input(z.object({
      productId: z.number(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.createReview(ctx.user.id, input.productId, input.rating, input.comment || '', ctx.user.name || 'Anônimo');
      return { success: true };
    }),
  }),

  cart: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCartItems(ctx.user.id);
    }),
    add: protectedProcedure.input(z.object({
      productId: z.number(),
      quantity: z.number().min(1).default(1),
    })).mutation(async ({ ctx, input }) => {
      await db.addToCart(ctx.user.id, input.productId, input.quantity);
      return { success: true };
    }),
    updateQuantity: protectedProcedure.input(z.object({
      cartItemId: z.number(),
      quantity: z.number(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateCartQuantity(ctx.user.id, input.cartItemId, input.quantity);
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({
      cartItemId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      await db.removeFromCart(ctx.user.id, input.cartItemId);
      return { success: true };
    }),
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  orders: router({
    create: protectedProcedure.input(z.object({
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      phone: z.string(),
      notes: z.string().optional(),
      couponCode: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const cartItems = await db.getCartItems(ctx.user.id);
      if (cartItems.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Carrinho vazio' });
      
      let total = cartItems.reduce((sum, item) => sum + Number(item.product.price) * item.cartItem.quantity, 0);
      let discount = 0;

      if (input.couponCode) {
        const coupon = await db.validateCoupon(input.couponCode);
        if (coupon) {
          if (coupon.discountType === 'percentage') {
            discount = total * (Number(coupon.discountValue) / 100);
          } else {
            discount = Number(coupon.discountValue);
          }
          await db.useCoupon(input.couponCode);
        }
      }

      const finalTotal = Math.max(0, total - discount);
      const items = cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        price: Number(item.product.price),
        quantity: item.cartItem.quantity,
      }));

      const orderId = await db.createOrder(ctx.user.id, {
        total: finalTotal,
        discount,
        couponCode: input.couponCode,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        phone: input.phone,
        notes: input.notes,
      }, items);

      await db.clearCart(ctx.user.id);
      return { orderId, total: finalTotal };
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserOrders(ctx.user.id);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const order = await db.getOrderById(input.id, ctx.user.id);
      if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado' });
      return order;
    }),
  }),

  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserFavorites(ctx.user.id);
    }),
    add: protectedProcedure.input(z.object({ productId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.addFavorite(ctx.user.id, input.productId);
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ productId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.removeFavorite(ctx.user.id, input.productId);
      return { success: true };
    }),
    check: protectedProcedure.input(z.object({ productId: z.number() })).query(async ({ ctx, input }) => {
      return db.isFavorite(ctx.user.id, input.productId);
    }),
  }),

  coupons: router({
    validate: publicProcedure.input(z.object({ code: z.string() })).query(async ({ input }) => {
      const coupon = await db.validateCoupon(input.code);
      if (!coupon) throw new TRPCError({ code: 'NOT_FOUND', message: 'Cupom inválido ou expirado' });
      return { discountType: coupon.discountType, discountValue: Number(coupon.discountValue), minPurchase: Number(coupon.minPurchase) };
    }),
  }),

  admin: router({
    stats: adminProcedure.query(async () => {
      return db.getAdminStats();
    }),
    products: router({
      list: adminProcedure.query(async () => {
        return db.getAllProductsAdmin();
      }),
      create: adminProcedure.input(z.object({
        name: z.string(),
        description: z.string().optional(),
        price: z.number(),
        originalPrice: z.number().optional(),
        category: z.enum(['doces', 'derivados_de_leite', 'conservas', 'hortalicas']),
        imageUrl: z.string().optional(),
        imageUrls: z.string().optional(),
        stock: z.number().default(100),
        featured: z.boolean().default(false),
      })).mutation(async ({ input }) => {
        const id = await db.createProduct({ ...input, price: String(input.price), originalPrice: input.originalPrice ? String(input.originalPrice) : null });
        return { id };
      }),
      update: adminProcedure.input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        originalPrice: z.number().optional(),
        category: z.enum(['doces', 'derivados_de_leite', 'conservas', 'hortalicas']).optional(),
        imageUrl: z.string().optional(),
        imageUrls: z.string().optional(),
        stock: z.number().optional(),
        featured: z.boolean().optional(),
        active: z.boolean().optional(),
      })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.price !== undefined) updateData.price = String(data.price);
        if (data.originalPrice !== undefined) updateData.originalPrice = String(data.originalPrice);
        await db.updateProduct(id, updateData);
        return { success: true };
      }),
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteProduct(input.id);
        return { success: true };
      }),
    }),
    orders: router({
      list: adminProcedure.query(async () => {
        return db.getAllOrders();
      }),
      updateStatus: adminProcedure.input(z.object({
        orderId: z.number(),
        status: z.enum(['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']),
      })).mutation(async ({ input }) => {
        await db.updateOrderStatus(input.orderId, input.status);
        return { success: true };
      }),
      getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
        return db.getOrderById(input.id);
      }),
    }),
    coupons: router({
      list: adminProcedure.query(async () => {
        return db.getAllCoupons();
      }),
      create: adminProcedure.input(z.object({
        code: z.string(),
        discountType: z.enum(['percentage', 'fixed']),
        discountValue: z.number(),
        minPurchase: z.number().default(0),
        maxUses: z.number().default(100),
        expiresAt: z.string().optional(),
      })).mutation(async ({ input }) => {
        await db.createCoupon({ ...input, discountValue: String(input.discountValue), minPurchase: String(input.minPurchase), expiresAt: input.expiresAt ? new Date(input.expiresAt) : null });
        return { success: true };
      }),
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteCoupon(input.id);
        return { success: true };
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
