import { useState, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Star, Filter, X, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const categoryLabels: Record<string, string> = {
  doces: "Doces",
  derivados_de_leite: "Derivados de Leite",
  conservas: "Conservas",
  hortalicas: "Hortaliças",
};

export default function Catalog() {
  const searchParams = new URLSearchParams(useSearch());
  const initialCategory = searchParams.get("category") || "";
  
  const [category, setCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const { data: products, isLoading } = trpc.products.list.useQuery({
    category: category || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 50 ? priceRange[1] : undefined,
    minRating: minRating > 0 ? minRating : undefined,
  });

  const clearFilters = () => {
    setCategory("");
    setPriceRange([0, 50]);
    setMinRating(0);
  };

  const hasFilters = category || priceRange[0] > 0 || priceRange[1] < 50 || minRating > 0;

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold font-[Poppins] text-foreground">
            {category ? categoryLabels[category] || "Catálogo" : "Todos os Produtos"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {products?.length || 0} produtos encontrados
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-6 sticky top-24">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filtros
                </h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-primary hover:underline">Limpar</button>
                )}
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Categoria</label>
                <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="doces">Doces</SelectItem>
                    <SelectItem value="derivados_de_leite">Derivados de Leite</SelectItem>
                    <SelectItem value="conservas">Conservas</SelectItem>
                    <SelectItem value="hortalicas">Hortaliças</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Filter */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Preço: R$ {priceRange[0]} - R$ {priceRange[1]}</label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={50}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Rating Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Avaliação mínima</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setMinRating(minRating === star ? 0 : star)}
                      className="p-1"
                    >
                      <Star className={`h-5 w-5 ${star <= minRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4" /> Filtros
                {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-muted rounded-2xl h-80" />
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
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
                        </div>
                        <div className="p-4 space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{categoryLabels[product.category]}</p>
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
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">Nenhum produto encontrado com os filtros selecionados.</p>
                <Button variant="outline" className="mt-4 rounded-full" onClick={clearFilters}>Limpar Filtros</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
