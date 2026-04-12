import { useState, useCallback, useRef } from 'react'

type UseInputWithCursorReturn = {
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  insertAtCursor: (text: string) => void
  setInputRef: (ref: HTMLInputElement | HTMLTextAreaElement | null) => void
}

export function useInputWithCursor(initialValue = ''): UseInputWithCursorReturn {
  const [input, setInput] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const setInputRef = useCallback((ref: HTMLInputElement | HTMLTextAreaElement | null) => {
    (inputRef as React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = ref
  }, [])

  const insertAtCursor = useCallback((text: string) => {
    const inputElement = inputRef.current
    if (!inputElement) {
      setInput(prev => prev + text)
      return
    }

    const start = inputElement.selectionStart ?? input.length
    const end = inputElement.selectionEnd ?? input.length
    const currentValue = inputElement.value

    const newValue = 
      currentValue.substring(0, start) + 
      text + 
      currentValue.substring(end)

    setInput(newValue)

    requestAnimationFrame(() => {
      const newCursorPosition = start + text.length
      inputElement.focus()
      inputElement.setSelectionRange(newCursorPosition, newCursorPosition)
    })
  }, [input.length])

  return {
    input,
    setInput,
    inputRef,
    insertAtCursor,
    setInputRef
  }
}