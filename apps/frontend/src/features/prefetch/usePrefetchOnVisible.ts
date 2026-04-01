"use client"

import { useEffect, useEffectEvent, useRef, useState } from "react"

type Options = {
  enabled?: boolean
  rootMargin?: string
}

export function useCoarsePointer() {
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)")
    const update = () => setIsCoarsePointer(mediaQuery.matches)

    update()
    mediaQuery.addEventListener("change", update)

    return () => {
      mediaQuery.removeEventListener("change", update)
    }
  }, [])

  return isCoarsePointer
}

export function usePrefetchOnVisible<T extends HTMLElement>(
  callback: () => Promise<unknown> | unknown,
  options: Options = {},
) {
  const { enabled = true, rootMargin = "240px" } = options
  const ref = useRef<T | null>(null)
  const onVisible = useEffectEvent(() => {
    void callback()
  })

  useEffect(() => {
    if (!enabled || !ref.current || typeof IntersectionObserver === "undefined") {
      return
    }

    const element = ref.current
    let didPrefetch = false
    const observer = new IntersectionObserver(
      (entries) => {
        if (didPrefetch || !entries.some((entry) => entry.isIntersecting)) {
          return
        }

        didPrefetch = true
        onVisible()
        observer.disconnect()
      },
      { rootMargin },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [enabled, rootMargin])

  return ref
}
