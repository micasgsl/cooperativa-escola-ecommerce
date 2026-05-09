import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { Package, Heart, User, LogOut, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  preparing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function Account() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center space-y-4">
        <User className="h-16 w-16 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Faça login para acessar sua conta</h2>
        <a href={getLoginUrl()}><Button className="rounded-full">Entrar</Button></a>
      </div>
    );
  }

  const { data: orders } = trpc.orders.list.useQuery();
  const { data: favorites } = trpc.favorites.list.useQuery();
  const utils = trpc.useUtils();
  const removeFav = trpc.favorites.remove.useMutation({
    onSuccess: () => utils.favorites.list.invalidate(),
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold font-[Poppins] text-foreground">{user?.name || 'Usuário'}</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground" onClick={() => logout()}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="orders">
          <TabsList className="w-full justify-start bg-muted rounded-xl p-1 mb-6">
            <TabsTrigger value="orders" className="rounded-lg gap-2 data-[state=active]:bg-background"><Package className="h-4 w-4" /> Pedidos</TabsTrigger>
            <TabsTrigger value="favorites" className="rounded-lg gap-2 data-[state=active]:bg-background"><Heart className="h-4 w-4" /> Favoritos</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {orders && orders.length > 0 ? orders.map((order: any) => (
              <div key={order.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Pedido #{order.id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[order.status] || ''}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">{order.itemCount || 0} itens</span>
                  <span className="font-bold text-primary">R$ {Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum pedido realizado ainda</p>
                <Link href="/catalogo"><Button className="rounded-full mt-4">Ver Produtos</Button></Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            {favorites && favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favorites.map((fav: any) => (
                  <div key={fav.id} className="bg-card border border-border rounded-2xl overflow-hidden flex">
                    <Link href={`/produto/${fav.product.id}`}>
                      <img src={fav.product.imageUrl} alt={fav.product.name} className="w-24 h-24 object-cover shrink-0" />
                    </Link>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <Link href={`/produto/${fav.product.id}`}>
                          <h3 className="font-medium text-foreground text-sm hover:text-primary transition-colors line-clamp-1">{fav.product.name}</h3>
                        </Link>
                        <p className="text-primary font-bold text-sm mt-1">R$ {Number(fav.product.price).toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeFav.mutate({ productId: fav.product.id })} className="text-xs text-destructive hover:underline self-start">
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum favorito ainda</p>
                <Link href="/catalogo"><Button className="rounded-full mt-4">Explorar Produtos</Button></Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
