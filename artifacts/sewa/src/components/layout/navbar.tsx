import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Menu, Package, Heart, CreditCard, LayoutDashboard, User, LogOut } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const { user, logout: clearAuth } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        clearAuth();
        setLocation("/");
        toast({ title: "Berhasil keluar" });
      }
    });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            <span className="font-display text-xl font-bold text-primary tracking-tight">SEWA</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/browse" className="hover:text-primary transition-colors">Telusuri</Link>
            <Link href="/browse?category=buku" className="hover:text-primary transition-colors">Buku</Link>
            <Link href="/browse?category=mainan" className="hover:text-primary transition-colors">Mainan</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>

          <div className="hidden md:flex relative w-64 items-center">
            <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Cari buku atau mainan..." 
              className="h-9 w-full rounded-full border border-input bg-muted/50 px-9 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setLocation(`/browse?search=${encodeURIComponent(e.currentTarget.value)}`);
                }
              }}
            />
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/upload">
                <Button variant="secondary" className="hidden md:flex rounded-full">
                  Sewakan Barang
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                      <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/dashboard")} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/bookings")} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>Pesanan Saya</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/favorites")} className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Disimpan</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/wallet")} className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Dompet Deposit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="rounded-full">Masuk</Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-full">Daftar</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
