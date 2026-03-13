'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button, Sheet, SheetContent, SheetTrigger } from 'packages/ui'
import ZoneSidebar from './ZoneSidebar'
import ZonesList from './zones/ZonesList'

export function MobileNav({ user }: { user: any }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden flex items-center h-12 px-4 border-b border-white/5 bg-[#0b1220] justify-between z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[320px] bg-[#0b1220] border-r-white/5 flex">
          <div onClick={() => setOpen(false)} className="flex h-full w-full">
            <ZonesList />
            <ZoneSidebar user={user} />
          </div>
        </SheetContent>
      </Sheet>
      
      <div className="font-bold text-sm">OpenChat</div>
      <div className="w-8" /> {/* spacer */}
    </div>
  )
}
