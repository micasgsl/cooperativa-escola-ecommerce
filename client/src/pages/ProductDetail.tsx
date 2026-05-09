import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { Star, ShoppingCart, Zap, Heart, ArrowLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");

  const { data: product, isLoading } = trpc.products.getById.useQuery({ id: Number(id) });
  const { data: reviews } = trpc.products.reviews.useQuery({ productId: Number(id) });
  const { data: isFav } = trpc.favorites.check.useQuery({ productId: Number(id) }, { enabled: isAuthenticated });

  const utils = trpc.useUtils();
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => { toast.success("Adicionado ao carrinho!"); utils.cart.list.invalidate(); },
    onError: () => toast.error("Erro ao adicionar ao carrinho"),
  });
  const toggleFav = trpc.favorites.add.useMutation({
    onSuccess: () => { toast.success("Adicionado aos favoritos!"); utils.favorites.check.invalidate(); utils.favorites.list.invalidate(); },
  });
  const removeFav = trpc.favorites.remove.useMutation({
    onSuccess: () => { toast.success("Removido dos favoritos"); utils.favorites.check.invalidate(); utils.favorites.list.invalidate(); },
  });
  const addReview = trpc.products.addReview.useMutation({
    onSuccess: () => { toast.success("Avaliação enviada!"); utils.products.reviews.invalidate(); setNewRating(0); setNewComment(""); },
  });

  if (isLoading) return (
    <div className="container py-16">
      <div className="animate-pulse grid md:grid-cols-2 gap-12">
        <div className="aspect-square bg-muted rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </div>
    </div>
  );

  if (!product) return <div className="container py-16 text-center"><p>Produto não encontrado.</p></div>;

  const images = product.imageUrls ? product.imageUrls.split(",") : [product.imageUrl || ""];

  const handleBuyNow = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    addToCart.mutate({ productId: product.id, quantity }, { onSuccess: () => navigate("/checkout") });
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    addToCart.mutate({ productId: product.id, quantity });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImage ? 'border-primary' : 'border-border'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <p className="text-sm text-primary font-medium uppercase tracking-wide mb-1">
                {product.category === 'doces' ? 'Doces' : product.category === 'derivados_de_leite' ? 'Derivados de Leite' : product.category === 'conservas' ? 'Conservas' : 'Hortaliças'}
              </p>
              <h1 className="text-3xl font-bold font-[Poppins] text-foreground">{product.name}</h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.round(Number(product.avgRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({product.totalReviews} avaliações)</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">R$ {Number(product.price).toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">R$ {Number(product.originalPrice).toFixed(2)}</span>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">Quantidade:</span>
              <div className="flex items-center gap-2 bg-muted rounded-full px-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:text-primary"><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center font-medium text-foreground">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:text-primary"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="flex-1 rounded-full gap-2 font-semibold text-base" onClick={handleBuyNow}>
                <Zap className="h-5 w-5" /> Comprar Agora
              </Button>
              <Button size="lg" variant="outline" className="flex-1 rounded-full gap-2 font-semibold text-base" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5" /> Adicionar ao Carrinho
              </Button>
            </div>

            {/* Favorite */}
            {isAuthenticated && (
              <button
                onClick={() => isFav?.isFavorite ? removeFav.mutate({ productId: product.id }) : toggleFav.mutate({ productId: product.id })}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Heart className={`h-5 w-5 ${isFav?.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                {isFav?.isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
              </button>
            )}

            {/* Stock */}
            <p className="text-sm text-muted-foreground">
              {product.stock > 0 ? `✓ Em estoque (${product.stock} disponíveis)` : '✗ Fora de estoque'}
            </p>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 space-y-8">
          <h2 className="text-2xl font-bold font-[Poppins] text-foreground">Avaliações</h2>

          {isAuthenticated && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Deixe sua avaliação</h3>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setNewRating(star)}>
                    <Star className={`h-6 w-6 ${star <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva um comentário (opcional)..."
                className="w-full p-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                onClick={() => { if (newRating > 0) addReview.mutate({ productId: product.id, rating: newRating, comment: newComment }); }}
                disabled={newRating === 0}
                className="rounded-full"
              >
                Enviar Avaliação
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {reviews && reviews.length > 0 ? reviews.map((review: any) => (
              <div key={review.id} className="bg-card border border-border rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {review.userName?.charAt(0) || 'A'}
                    </div>
                    <span className="font-medium text-foreground text-sm">{review.userName || 'Anônimo'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-8">Nenhuma avaliação ainda. Seja o primeiro!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
