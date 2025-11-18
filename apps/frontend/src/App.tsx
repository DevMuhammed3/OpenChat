import ChatPage from "web/pages/chat/ChatPage"
import AuthPage from "./pages/auth/AuthPage"

function App() {
  return (
   <div className="h-screen bg-background text-foreground overflow-hidden">
      <main className="h-full flex flex-col">
        <AuthPage />
        <ChatPage />
      </main>
    </div>
  )
}

export default App
