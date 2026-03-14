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
import { User, LayoutDashboard, Settings, LogOut } from "lucide-react";

export default function Navbar({ user }: { user?: any }) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mt-4 flex h-14 items-center justify-between rounded-2xl border border-white/10 bg-background/60 backdrop-blur">
          <Link href="/" className="pl-4 text-lg font-bold">
            OpenChat
          </Link>

          <nav className="hidden md:flex gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground">
              How it works
            </a>

            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>

          </nav>

          <div className="mx-4 flex items-center gap-3">
            {user ? (
               <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <button className="relative flex items-center gap-2 rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                   <Avatar className="h-8 w-8 border border-white/10">
                     {user.avatar ? (
                       <AvatarImage 
                         src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.avatar}`} 
                         alt={user.username} 
                       />
                     ) : (
                       <AvatarFallback className="text-xs">
                         {user.username?.[0]?.toUpperCase()}
                       </AvatarFallback>
                     )}
                   </Avatar>
                 </button>
               </DropdownMenuTrigger>
               <DropdownMenuContent className="w-56 mt-2 bg-background/95 backdrop-blur border-white/10 shadow-2xl" align="end" forceMount>
                 <DropdownMenuLabel className="font-normal">
                   <div className="flex flex-col space-y-1">
                     <p className="text-sm font-medium leading-none">{user.name || user.username}</p>
                     <p className="text-xs leading-none text-muted-foreground">
                       {user.email}
                     </p>
                   </div>
                 </DropdownMenuLabel>
                 <DropdownMenuSeparator className="bg-white/5" />
                 <DropdownMenuItem asChild className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                   <Link href="/zone" className="flex items-center gap-2">
                     <LayoutDashboard className="h-4 w-4" />
                     <span>Dashboard</span>
                   </Link>
                 </DropdownMenuItem>
                 <DropdownMenuItem asChild className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
                   <Link href="/settings/profile" className="flex items-center gap-2">
                     <Settings className="h-4 w-4" />
                     <span>Settings</span>
                   </Link>
                 </DropdownMenuItem>
                 <DropdownMenuSeparator className="bg-white/5" />
                 <DropdownMenuItem 
                   className="text-red-400 hover:text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 cursor-pointer"
                   onClick={() => {
                      // We can't use api() here easily without importing it,
                      // and packages shouldn't import from @/lib of an app.
                      // So we'll just redirect to a logout route or clear cookies.
                      // Best way: just redirect to dashboard/zone and let it handle logout if needed,
                      // but here we just want to go to auth.
                      window.location.href = "/auth";
                   }}
                 >
                   <LogOut className="h-4 w-4 mr-2" />
                   <span>Log out</span>
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
            ) : (
              <>
                <Link href="/auth" className="text-sm font-medium hover:text-primary transition-colors">
                  Login
                </Link>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}

