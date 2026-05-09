import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { CreditCard, Tag, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Checkout() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<string>("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [form, setForm] = useState({
    address: "", city: "Paraguaçu Paulista", state: "SP", zipCode: "", phone: "", notes: "",
  });

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const { data: cartItems } = trpc.cart.list.useQuery();
  const utils = trpc.useUtils();

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: () => {
      setOrderPlaced(true);
      utils.cart.list.invalidate();
      toast.success("Pedido realizado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const validateCoupon = trpc.coupons.validate.useQuery(
    { code: couponCode },
    { enabled: false }
  );

  const subtotal = cartItems?.reduce((sum, item) => sum + Number(item.product.price) * item.cartItem.quantity, 0) || 0;
  const discountAmount = discountType === 'percentage' ? subtotal * (discount / 100) : discount;
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    const result = await validateCoupon.refetch();
    if (result.data) {
      setDiscount(result.data.discountValue);
      setDiscountType(result.data.discountType);
      toast.success("Cupom aplicado com sucesso!");
    } else {
      toast.error("Cupom inválido ou expirado");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address || !form.zipCode || !form.phone) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createOrder.mutate({ ...form, couponCode: couponCode || undefined });
  };

  if (orderPlaced) {
    return (
      <div className="container py-20 text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <CheckCircle className="h-20 w-20 text-primary mx-auto" />
        </motion.div>
        <h2 className="text-3xl font-bold font-[Poppins] text-foreground">Pedido Realizado!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Seu pedido foi recebido com sucesso. Entraremos em contato pelo WhatsApp para confirmar a entrega.
        </p>
        <div className="flex gap-4 justify-center">
          <Button className="rounded-full" onClick={() => navigate("/minha-conta")}>Ver Meus Pedidos</Button>
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/catalogo")}>Continuar Comprando</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold font-[Poppins] text-foreground mb-8">
          Finalizar Compra
        </motion.h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Endereço de Entrega</h3>
                <div className="space-y-3">
                  <input type="text" placeholder="Endereço completo *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" required />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    <input type="text" placeholder="Estado" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="CEP *" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" required />
                    <input type="text" placeholder="Telefone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" required />
                  </div>
                  <textarea placeholder="Observações (opcional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>

              {/* Coupon */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Cupom de Desconto</h3>
                <div className="flex gap-2">
                  <input type="text" placeholder="Digite o código" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="flex-1 p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <Button type="button" variant="outline" className="rounded-xl" onClick={handleApplyCoupon}>Aplicar</Button>
                </div>
                {discountAmount > 0 && (
                  <p className="text-sm text-primary font-medium">Desconto de R$ {discountAmount.toFixed(2)} aplicado!</p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 sticky top-24">
                <h3 className="font-semibold text-foreground">Resumo</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cartItems?.map((item) => (
                    <div key={item.cartItem.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">{item.product.name} x{item.cartItem.quantity}</span>
                      <span className="text-foreground font-medium shrink-0">R$ {(Number(item.product.price) * item.cartItem.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Desconto</span><span>- R$ {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Frete</span><span>A combinar</span>
                  </div>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
                </div>
                <Button type="submit" className="w-full rounded-full font-semibold text-base" size="lg" disabled={createOrder.isPending}>
                  {createOrder.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Pedido"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  O pagamento será combinado via WhatsApp
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
