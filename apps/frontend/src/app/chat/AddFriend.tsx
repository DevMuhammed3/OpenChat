import { Input } from 'packages/ui'
import { useState } from 'react';

export default function AddFriend() {
  const [input, setInput] = useState('');

  const handleSend = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim()) return;

      // Database connection : TODO
      console.log(input);
      setInput('');   
    }

  };

  return (
    <div className="border-t bg-card p-4">
      <div className="flex items-end gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleSend}
          placeholder="Type your friend’s username..."
          className="flex-1 scrollbar-hide resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-muted-foreground max-h-32 min-h-11"
        />
      </div>
    </div>
  );
}

