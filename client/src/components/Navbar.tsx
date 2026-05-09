import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, Heart, User, Search, Moon, Sun, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [location] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

  const cartQuery = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const cartCount = cartQuery.data?.length || 0;

  const searchProductsQuery = trpc.products.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  useEffect(() => {
    if (searchProductsQuery.data) {
      setSearchResults(searchProductsQuery.data);
    }
  }, [searchProductsQuery.data]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setMobileMenu(false); }, [location]);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/manus-storage/logo-cooperativa_be0449db.jpeg" alt="Cooperativa Escola" className="h-10 w-10 rounded-full object-cover" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold font-[Poppins] text-primary leading-tight">Doce Escola</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">Cooperativa ETEC</p>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-md relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <AnimatePresence>
              {showSearch && searchQuery.length >= 2 && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {searchResults.slice(0, 5).map((product: any) => (
                    <Link key={product.id} href={`/produto/${product.id}`} onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
                      <div className="flex items-center gap-3 p-3 hover:bg-accent transition-colors">
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-primary font-semibold">R$ {Number(product.price).toFixed(2)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {isAuthenticated && (
              <>
                <Link href="/minha-conta">
                  <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Heart className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/carrinho">
                  <Button variant="ghost" size="icon" className="rounded-full relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link href={user?.role === 'admin' ? '/admin' : '/minha-conta'}>
                  <Button variant="ghost" size="sm" className="rounded-full gap-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user?.name?.split(' ')[0] || 'Conta'}</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="rounded-full gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </Button>
              </a>
            )}

            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <nav className="container py-4 space-y-2">
              <Link href="/" className="block py-2 px-4 rounded-lg hover:bg-accent text-foreground">Início</Link>
              <Link href="/catalogo" className="block py-2 px-4 rounded-lg hover:bg-accent text-foreground">Catálogo</Link>
              {isAuthenticated && (
                <>
                  <Link href="/carrinho" className="block py-2 px-4 rounded-lg hover:bg-accent text-foreground">Carrinho</Link>
                  <Link href="/minha-conta" className="block py-2 px-4 rounded-lg hover:bg-accent text-foreground">Minha Conta</Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin" className="block py-2 px-4 rounded-lg hover:bg-accent text-foreground">Painel Admin</Link>
                  )}
                  <button onClick={() => logout()} className="block w-full text-left py-2 px-4 rounded-lg hover:bg-accent text-destructive">
                    <LogOut className="h-4 w-4 inline mr-2" />Sair
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <a href={getLoginUrl()} className="block py-2 px-4 rounded-lg bg-primary text-primary-foreground text-center font-medium">Entrar / Cadastrar</a>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
