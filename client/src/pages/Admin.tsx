import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Package, ShoppingBag, Tag, Users, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", preparing: "Preparando",
  shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
};

export default function Admin() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Acesso restrito</h2>
        <a href={getLoginUrl()}><Button className="rounded-full">Entrar</Button></a>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="container py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: products, refetch: refetchProducts } = trpc.admin.products.list.useQuery();
  const { data: orders, refetch: refetchOrders } = trpc.admin.orders.list.useQuery();
  const { data: coupons, refetch: refetchCoupons } = trpc.admin.coupons.list.useQuery();
  const utils = trpc.useUtils();

  const updateStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado"); refetchOrders(); },
  });
  const deleteProduct = trpc.admin.products.delete.useMutation({
    onSuccess: () => { toast.success("Produto removido"); refetchProducts(); },
  });
  const deleteCoupon = trpc.admin.coupons.delete.useMutation({
    onSuccess: () => { toast.success("Cupom removido"); refetchCoupons(); },
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold font-[Poppins] text-foreground mb-8">
          Painel Administrativo
        </motion.h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Produtos", value: stats?.totalProducts || 0, icon: <Package className="h-5 w-5" /> },
            { label: "Pedidos", value: stats?.totalOrders || 0, icon: <ShoppingBag className="h-5 w-5" /> },
            { label: "Usuários", value: stats?.totalUsers || 0, icon: <Users className="h-5 w-5" /> },
            { label: "Receita", value: `R$ ${Number(stats?.totalRevenue || 0).toFixed(2)}`, icon: <Tag className="h-5 w-5" /> },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3 text-primary mb-2">{stat.icon}<span className="text-sm text-muted-foreground">{stat.label}</span></div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="products">
          <TabsList className="bg-muted rounded-xl p-1 mb-6">
            <TabsTrigger value="products" className="rounded-lg">Produtos</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg">Pedidos</TabsTrigger>
            <TabsTrigger value="coupons" className="rounded-lg">Cupons</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Gerenciar Produtos</h3>
              <ProductForm onSuccess={refetchProducts} />
            </div>
            <div className="space-y-3">
              {products?.map((product: any) => (
                <div key={product.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <img src={product.imageUrl || ''} alt={product.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">{product.category} · Estoque: {product.stock}</p>
                  </div>
                  <span className="font-bold text-primary shrink-0">R$ {Number(product.price).toFixed(2)}</span>
                  <div className="flex gap-1">
                    <ProductForm product={product} onSuccess={refetchProducts} />
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Remover produto?")) deleteProduct.mutate({ id: product.id }); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <h3 className="font-semibold text-foreground">Gerenciar Pedidos</h3>
            <div className="space-y-3">
              {orders?.map((order: any) => (
                <div key={order.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Pedido #{order.id} - {order.userName || 'Cliente'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('pt-BR')} · {order.address}</p>
                    </div>
                    <span className="font-bold text-primary">R$ {Number(order.total).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ orderId: order.id, status: v as any })}>
                      <SelectTrigger className="w-40 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              {(!orders || orders.length === 0) && <p className="text-muted-foreground text-center py-8">Nenhum pedido ainda</p>}
            </div>
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Gerenciar Cupons</h3>
              <CouponForm onSuccess={refetchCoupons} />
            </div>
            <div className="space-y-3">
              {coupons?.map((coupon: any) => (
                <div key={coupon.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono font-bold text-foreground">{coupon.code}</p>
                    <p className="text-sm text-muted-foreground">
                      {coupon.discountType === 'percentage' ? `${Number(coupon.discountValue)}%` : `R$ ${Number(coupon.discountValue).toFixed(2)}`} de desconto · Usos: {coupon.usedCount}/{coupon.maxUses}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCoupon.mutate({ id: coupon.id })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!coupons || coupons.length === 0) && <p className="text-muted-foreground text-center py-8">Nenhum cupom criado</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProductForm({ product, onSuccess }: { product?: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product ? Number(product.price) : 0,
    originalPrice: product?.originalPrice ? Number(product.originalPrice) : 0,
    category: product?.category || "doces",
    imageUrl: product?.imageUrl || "",
    stock: product?.stock || 100,
    featured: product?.featured || false,
  });

  const createProduct = trpc.admin.products.create.useMutation({
    onSuccess: () => { toast.success("Produto criado!"); setOpen(false); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const updateProduct = trpc.admin.products.update.useMutation({
    onSuccess: () => { toast.success("Produto atualizado!"); setOpen(false); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      updateProduct.mutate({ id: product.id, ...form });
    } else {
      createProduct.mutate(form as any);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={product ? "ghost" : "default"} size={product ? "icon" : "sm"} className={product ? "" : "rounded-full gap-2"}>
          {product ? <Pencil className="h-4 w-4" /> : <><Plus className="h-4 w-4" /> Novo Produto</>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Nome do produto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground" required />
          <textarea placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none h-20" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" placeholder="Preço" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground" required />
            <input type="number" step="0.01" placeholder="Preço original (opcional)" value={form.originalPrice || ''} onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground" />
          </div>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="doces">Doces</SelectItem>
              <SelectItem value="derivados_de_leite">Derivados de Leite</SelectItem>
              <SelectItem value="conservas">Conservas</SelectItem>
              <SelectItem value="hortalicas">Hortaliças</SelectItem>
            </SelectContent>
          </Select>
          <input type="text" placeholder="URL da imagem" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Estoque" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground" />
            <label className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded" />
              Destaque
            </label>
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={createProduct.isPending || updateProduct.isPending}>
            {(createProduct.isPending || updateProduct.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : (product ? "Salvar" : "Criar Produto")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CouponForm({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "", discountType: "percentage" as "percentage" | "fixed", discountValue: 10, minPurchase: 0, maxUses: 100,
  });

  const createCoupon = trpc.admin.coupons.create.useMutation({
    onSuccess: () => { toast.success("Cupom criado!"); setOpen(false); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gap-2"><Plus className="h-4 w-4" /> Novo Cupom</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Criar Cupom</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); createCoupon.mutate(form); }} className="space-y-4">
          <input type="text" placeholder="Código (ex: DESCONTO10)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground" required />
          <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v as any })}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Porcentagem (%)</SelectItem>
              <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Valor do desconto" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground" required />
            <input type="number" placeholder="Máx. usos" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })} className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground" />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={createCoupon.isPending}>
            {createCoupon.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Cupom"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
