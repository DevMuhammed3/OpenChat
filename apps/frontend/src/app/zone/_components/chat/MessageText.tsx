'use client'

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
const URL_EXACT_PATTERN = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/i

function normalizeUrl(url: string) {
  return url.startsWith('www.') ? `https://${url}` : url
}

function isInviteUrl(url: string) {
  return /\/zone\/invite\//.test(url)
}

export default function MessageText({ text }: { text: string }) {
  const parts = text.split(URL_PATTERN)

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (!part) return null
        if (!URL_EXACT_PATTERN.test(part)) {
          return <span key={`${part}-${index}`}>{part}</span>
        }

        const href = normalizeUrl(part)
        const invite = isInviteUrl(href)

        return (
          <a
            key={`${href}-${index}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            className={
              invite
                ? "mx-0.5 inline-flex items-center rounded-xl bg-emerald-500/12 px-2.5 py-1 text-emerald-300 ring-1 ring-emerald-500/20 transition hover:bg-emerald-500/18"
                : "mx-0.5 inline-flex items-center rounded-xl bg-sky-500/12 px-2.5 py-1 text-sky-300 ring-1 ring-sky-500/20 transition hover:bg-sky-500/18"
            }
          >
            {invite ? `Invite: ${part}` : part}
          </a>
        )
      })}
    </span>
  )
}
