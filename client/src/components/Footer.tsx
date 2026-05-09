import { Link } from "wouter";
import { Instagram, Phone, MapPin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/manus-storage/logo-cooperativa_be0449db.jpeg" alt="Logo" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <h3 className="font-bold font-[Poppins] text-primary text-lg">Cooperativa ETEC</h3>
                <p className="text-xs text-muted-foreground">Produtos Artesanais</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Produtos artesanais produzidos pelos alunos da ETEC Augusto Tortolero Araújo. Qualidade e tradição em cada produto.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Navegação</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Início</Link></li>
              <li><Link href="/catalogo" className="hover:text-primary transition-colors">Catálogo</Link></li>
              <li><Link href="/catalogo?category=doces" className="hover:text-primary transition-colors">Doces</Link></li>
              <li><Link href="/catalogo?category=hortalicas" className="hover:text-primary transition-colors">Hortaliças</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contato</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href="https://wa.me/5518997368561" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  (18) 99736-8561
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-primary" />
                <a href="https://instagram.com/cooperativaescolaetec" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  @cooperativaescolaetec
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Paraguaçu Paulista/SP</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Redes Sociais</h4>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/cooperativaescolaetec"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/5518997368561"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Phone className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              ETEC Augusto Tortolero Araújo<br />
              Paraguaçu Paulista - SP
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Cooperativa ETEC - ETEC Augusto Tortolero Araújo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
