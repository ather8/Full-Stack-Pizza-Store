import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { askQuestion } from '../api/query'

interface Message {
    role: 'assistant' | 'user'
    content: string
}

const SUGGESTED = [
    "What is today's total revenue?",
    "List all products low on stock",
    "Which cashier has the most sales?",
    "Show me the most popular items",
]

export default function QueryPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hi! I'm your PizzaStore AI assistant. You can ask me questions about your data, like 'What are my top selling pizzas?' or 'Show me revenue for the last 7 days.'"
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (question: string) => {
        if (!question.trim() || loading) return

        const userMsg: Message = { role: 'user', content: question }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const answer = await askQuestion(question)
            setMessages(prev => [...prev, { role: 'assistant', content: answer }])
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I couldn't process that request. Please try again."
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-8 pb-4">
                <h1 className="text-2xl font-bold text-gray-800">AI Assistant</h1>
                <p className="text-gray-500 text-sm mt-1">Ask questions about your restaurant's data in plain English</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                                <Sparkles size={14} className="text-orange-500" />
                            </div>
                        )}
                        <div className={`max-w-xl px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                            msg.role === 'user'
                                ? 'bg-orange-500 text-white rounded-tr-sm'
                                : 'bg-white text-gray-700 shadow-sm rounded-tl-sm'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <Sparkles size={14} className="text-orange-500" />
                        </div>
                        <div className="bg-white shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Suggested prompts */}
            <div className="px-8 pb-3 flex gap-2 flex-wrap">
                {SUGGESTED.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => handleSend(s)}
                        disabled={loading}
                        className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-orange-300 hover:text-orange-600 transition-colors disabled:opacity-50"
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="px-8 pb-8">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                        placeholder="Ask a question about your data..."
                        className="flex-1 text-sm text-gray-700 outline-none placeholder-gray-400"
                        disabled={loading}
                    />
                    <button
                        onClick={() => handleSend(input)}
                        disabled={loading || !input.trim()}
                        className="w-8 h-8 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-full flex items-center justify-center transition-colors"
                    >
                        <Send size={14} className="text-white" />
                    </button>
                </div>
            </div>
        </div>
    )
}