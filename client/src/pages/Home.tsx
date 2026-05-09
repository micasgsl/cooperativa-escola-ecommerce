import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowRight, Star, ShoppingCart, Leaf, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  { id: "doces", name: "Doces", icon: "🍬", color: "from-amber-500 to-orange-500" },
  { id: "derivados_de_leite", name: "Derivados de Leite", icon: "🧈", color: "from-yellow-400 to-amber-500" },
  { id: "conservas", name: "Conservas", icon: "🫙", color: "from-red-500 to-rose-500" },
  { id: "hortalicas", name: "Hortaliças", icon: "🥬", color: "from-green-500 to-emerald-500" },
];

export default function Home() {
  const { data: featuredProducts, isLoading } = trpc.products.featured.useQuery();

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Leaf className="h-4 w-4" />
                Produtos 100% Artesanais
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[Poppins] text-foreground leading-tight">
                Sabor e <span className="text-primary">qualidade</span> direto da escola
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Doces, conservas, derivados de leite e hortaliças produzidos com carinho pelos alunos da ETEC Augusto Tortolero Araújo.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/catalogo">
                  <Button size="lg" className="rounded-full gap-2 text-base font-semibold px-8">
                    Ver Produtos <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <a href="https://wa.me/5518997368561" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="rounded-full gap-2 text-base px-8">
                    Fale Conosco
                  </Button>
                </a>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <img src="/manus-storage/doces-variados_af380fc5.jpeg" alt="Doces" className="rounded-2xl shadow-xl w-full h-48 object-cover" />
                <img src="/manus-storage/manteiga-artesanal_fc0925ef.jpeg" alt="Manteiga" className="rounded-2xl shadow-xl w-full h-48 object-cover mt-8" />
                <img src="/manus-storage/conserva-pimenta_acc74f3d.jpeg" alt="Conserva" className="rounded-2xl shadow-xl w-full h-48 object-cover" />
                <img src="/manus-storage/alface_ed870ceb.jpg" alt="Hortaliças" className="rounded-2xl shadow-xl w-full h-48 object-cover mt-8" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold font-[Poppins] text-foreground">Nossas Categorias</h2>
            <p className="text-muted-foreground mt-2">Explore nossos produtos artesanais por categoria</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/catalogo?category=${cat.id}`}>
                  <div className="group relative overflow-hidden rounded-2xl p-6 bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer text-center">
                    <span className="text-4xl block mb-3">{cat.icon}</span>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{cat.name}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl font-bold font-[Poppins] text-foreground">Produtos em Destaque</h2>
              <p className="text-muted-foreground mt-1">Os mais vendidos e bem avaliados</p>
            </div>
            <Link href="/catalogo">
              <Button variant="outline" className="rounded-full gap-2">
                Ver Todos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded-2xl h-80" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts?.slice(0, 8).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/produto/${product.id}`}>
                    <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all">
                      <div className="relative overflow-hidden aspect-square">
                        <img
                          src={product.imageUrl || ''}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {product.originalPrice && (
                          <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
                            OFERTA
                          </span>
                        )}
                        {product.featured && !product.originalPrice && (
                          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                            DESTAQUE
                          </span>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className={`h-3.5 w-3.5 ${idx < Math.round(Number(product.avgRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">({product.totalReviews})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">R$ {Number(product.price).toFixed(2)}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">R$ {Number(product.originalPrice).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center text-primary-foreground space-y-4"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-[Poppins]">Primeira Compra?</h2>
            <p className="text-lg opacity-90 max-w-md mx-auto">Use o cupom <strong className="bg-white/20 px-3 py-1 rounded-full">BEMVINDO10</strong> e ganhe 10% de desconto!</p>
            <Link href="/catalogo">
              <Button size="lg" variant="secondary" className="rounded-full gap-2 mt-4 font-semibold">
                Aproveitar Agora <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Leaf className="h-8 w-8 text-primary" />, title: "100% Artesanal", desc: "Produzido com ingredientes naturais" },
              { icon: <Heart className="h-8 w-8 text-primary" />, title: "Feito com Carinho", desc: "Pelos alunos da ETEC" },
              { icon: <ShoppingCart className="h-8 w-8 text-primary" />, title: "Entrega Rápida", desc: "Paraguaçu Paulista e região" },
            ].map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-6 rounded-2xl bg-card border border-border"
              >
                <div className="shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  {badge.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{badge.title}</h3>
                  <p className="text-sm text-muted-foreground">{badge.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
