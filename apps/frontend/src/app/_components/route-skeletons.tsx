'use client'

import { Skeleton } from 'packages/ui'

export function DashboardLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-10 w-72 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-[360px] rounded-3xl" />
        <Skeleton className="h-[360px] rounded-3xl" />
      </div>
    </div>
  )
}

export function ZoneLayoutLoadingSkeleton() {
  return (
    <div className="flex h-[100svh] overflow-hidden bg-background">
      <div className="hidden md:flex">
        <div className="flex w-16 flex-col items-center gap-3 border-r border-white/5 py-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-10 rounded-xl" />
          ))}
        </div>
        <div className="flex w-64 flex-col border-r border-white/5">
          <div className="border-b border-white/5 p-4">
            <Skeleton className="h-4 w-28 rounded-lg" />
          </div>
          <div className="flex-1 space-y-3 p-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-9 rounded-lg" />
            ))}
          </div>
          <div className="border-t border-white/5 p-3">
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="border-b border-white/5 p-4 md:hidden">
          <Skeleton className="h-10 rounded-xl" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full rounded-3xl" />
        </div>
      </div>
    </div>
  )
}

export function ChatPageLoadingSkeleton() {
  return (
    <div className="flex h-[100svh] flex-col">
      <div className="flex items-center gap-3 border-b bg-background px-4 py-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-36 rounded-lg" />
      </div>

      <div className="flex-1 space-y-6 overflow-hidden p-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <Skeleton className="h-16 w-[min(24rem,85%)] rounded-3xl" />
          </div>
        ))}
      </div>

      <div className="p-4">
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    </div>
  )
}

export function ChannelPageLoadingSkeleton() {
  return (
    <div className="flex h-[100svh] flex-col bg-[#0b1220]">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <Skeleton className="h-5 w-32 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-hidden p-4">
        <div className="space-y-3 px-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>

        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex gap-4 px-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="p-4">
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    </div>
  )
}
