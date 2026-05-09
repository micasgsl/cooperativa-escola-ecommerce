import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center space-y-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Faça login para ver seu carrinho</h2>
        <a href={getLoginUrl()}><Button className="rounded-full">Entrar</Button></a>
      </div>
    );
  }

  const { data: cartItems, isLoading } = trpc.cart.list.useQuery();
  const utils = trpc.useUtils();

  const updateQty = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
  });
  const removeItem = trpc.cart.remove.useMutation({
    onSuccess: () => { toast.success("Item removido"); utils.cart.list.invalidate(); },
  });
  const clearCart = trpc.cart.clear.useMutation({
    onSuccess: () => { toast.success("Carrinho limpo"); utils.cart.list.invalidate(); },
  });

  if (isLoading) return <div className="container py-16"><div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}</div></div>;

  const total = cartItems?.reduce((sum, item) => sum + Number(item.product.price) * item.cartItem.quantity, 0) || 0;

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="container py-20 text-center space-y-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Seu carrinho está vazio</h2>
        <p className="text-muted-foreground">Adicione produtos para começar a comprar</p>
        <Link href="/catalogo"><Button className="rounded-full gap-2">Ver Produtos <ArrowRight className="h-4 w-4" /></Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold font-[Poppins] text-foreground mb-8">
          Carrinho de Compras
        </motion.h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, i) => (
              <motion.div
                key={item.cartItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 bg-card border border-border rounded-2xl p-4"
              >
                <Link href={`/produto/${item.product.id}`}>
                  <img src={item.product.imageUrl || ''} alt={item.product.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/produto/${item.product.id}`}>
                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate">{item.product.name}</h3>
                  </Link>
                  <p className="text-primary font-bold mt-1">R$ {Number(item.product.price).toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty.mutate({ cartItemId: item.cartItem.id, quantity: Math.max(1, item.cartItem.quantity - 1) })}
                      className="p-1 rounded-full bg-muted hover:bg-accent"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium text-foreground">{item.cartItem.quantity}</span>
                    <button
                      onClick={() => updateQty.mutate({ cartItemId: item.cartItem.id, quantity: item.cartItem.quantity + 1 })}
                      className="p-1 rounded-full bg-muted hover:bg-accent"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeItem.mutate({ cartItemId: item.cartItem.id })} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-foreground">R$ {(Number(item.product.price) * item.cartItem.quantity).toFixed(2)}</span>
                </div>
              </motion.div>
            ))}
            <button onClick={() => clearCart.mutate()} className="text-sm text-destructive hover:underline">Limpar carrinho</button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 sticky top-24">
              <h3 className="font-semibold text-foreground text-lg">Resumo do Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({cartItems.length} itens)</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Frete</span>
                  <span className="text-primary font-medium">A calcular</span>
                </div>
              </div>
              <div className="border-t border-border pt-4 flex justify-between items-center">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
              </div>
              <Button className="w-full rounded-full gap-2 font-semibold text-base" size="lg" onClick={() => navigate("/checkout")}>
                Finalizar Compra <ArrowRight className="h-5 w-5" />
              </Button>
              <Link href="/catalogo" className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors">
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
