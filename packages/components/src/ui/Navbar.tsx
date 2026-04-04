"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "./button";
import { 
  Avatar, 
  AvatarImage, 
  AvatarFallback 
} from "./avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, LogOut, MessageCircle } from "lucide-react";

export default function Navbar({ user }: { user?: any }) {
  const pathname = usePathname();

  const links = [
    { name: "Features", href: "/#features" },
    { name: "Open Source", href: "/open-source" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl"
    >
      <div className="container mx-auto flex items-center justify-between h-20 px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
               <MessageCircle size={18} fill="currentColor" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">OpenChat</span>
              <span className="hidden md:block text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/50 border border-white/10 tracking-wider">OPEN SOURCE</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 ml-8">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`text-sm font-medium transition-colors relative group ${
                    isActive ? "text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div 
                      layoutId="active-link"
                      className="absolute -bottom-8 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
             <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <button className="relative flex items-center gap-2 rounded-full border border-white/10 p-1 hover:bg-white/5 transition-colors">
                 <Avatar className="h-8 w-8">
                   {user.avatar ? (
                     <AvatarImage 
                       src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.avatar}`} 
                       alt={user.username} 
                     />
                   ) : (
                     <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 text-xs text-white">
                       {user.username?.[0]?.toUpperCase()}
                     </AvatarFallback>
                   )}
                 </Avatar>
                 <span className="text-sm font-medium pr-2 hidden sm:block text-zinc-300">{user.username}</span>
               </button>
             </DropdownMenuTrigger>
             <DropdownMenuContent className="w-56 mt-4 glass-dark border-white/10 text-white" align="end">
                {/* ... existing menu content ... */}
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold">{user.name || user.username}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem asChild>
                  <Link href="/zone" className="flex items-center gap-2 py-2 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" className="flex items-center gap-2 py-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem 
                  className="text-red-400 focus:bg-red-500/10 py-2 cursor-pointer"
                  onClick={() => window.location.href = "/auth"}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
             </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="h-10 px-6 rounded-xl bg-primary text-white hover:opacity-90 border-0 font-bold transition-all shadow-lg shadow-primary/20">
              <Link href="/auth">Get Started</Link>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}

