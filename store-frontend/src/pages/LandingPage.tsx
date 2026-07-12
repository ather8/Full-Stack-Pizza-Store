import { Link } from 'react-router-dom'
import { TrendingUp, MessageSquare, Package, ShieldCheck, ArrowRight, Code } from 'lucide-react'
import heroImg from '../assets/dashboard-preview.png'

const features = [
    {
        icon: TrendingUp,
        title: 'AI Demand Forecasting',
        desc: 'XGBoost model trained on 48,000+ real orders predicts 7-day demand per product with 1.74 MAE.',
    },
    {
        icon: MessageSquare,
        title: 'AI Query Assistant',
        desc: 'Ask questions about sales in plain English — powered by Gemini with secure, template-based SQL generation.',
    },
    {
        icon: Package,
        title: 'Real-Time Inventory',
        desc: 'Track stock levels, categories, and pricing across your full menu from a single dashboard.',
    },
    {
        icon: ShieldCheck,
        title: 'Role-Based Access',
        desc: 'Admin, Manager, and Cashier roles with JWT authentication and scoped permissions throughout.',
    },
]

const steps = [
    { step: '01', title: 'Take Orders', desc: 'Cashiers ring up orders through a fast, category-organized POS screen.' },
    { step: '02', title: 'Track Everything', desc: 'Every transaction, product, and stock change is logged automatically.' },
    { step: '03', title: 'Get AI Insights', desc: 'Managers forecast demand and query sales data in plain English.' },
]

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Nav */}
            <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">P</span>
                    </div>
                    <span className="font-bold">PizzaStore</span>
                </div>
                <Link
                    to="/login"
                    className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                    Staff Login
                </Link>
            </nav>

            {/* Hero */}
            <section className="max-w-6xl mx-auto px-8 pt-16 pb-24 grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                        Restaurant operations,
                        <span className="text-orange-500"> powered by AI.</span>
                    </h1>
                    <p className="text-gray-400 mt-5 text-lg leading-relaxed">
                        A full-stack management system with demand forecasting and a natural-language
                        AI assistant — built for real restaurant teams.
                    </p>
                    <div className="flex gap-3 mt-8">
                        <Link
                            to="/login"
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl text-sm font-medium transition-colors"
                        >
                            Staff Login <ArrowRight size={16} />
                        </Link>
                        <a
                            href="https://github.com/ather8/pizza-store"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-xl text-sm font-medium transition-colors"
                        >
                            <Code size={16} /> View Source
                        </a>
                    </div>
                </div>
                <img src={heroImg} alt="PizzaStore dashboard preview" className="rounded-2xl shadow-2xl" />
            </section>

            {/* Features */}
            <section className="bg-gray-950 py-20">
                <div className="max-w-6xl mx-auto px-8">
                    <h2 className="text-2xl font-bold text-center mb-2">Built for real operations</h2>
                    <p className="text-gray-400 text-center mb-12">Four systems working together, end to end.</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                                    <Icon size={18} className="text-orange-500" />
                                </div>
                                <h3 className="font-semibold mb-2">{title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="max-w-6xl mx-auto px-8 py-20">
                <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map(({ step, title, desc }) => (
                        <div key={step}>
                            <span className="text-orange-500 text-sm font-bold">{step}</span>
                            <h3 className="font-semibold text-lg mt-2 mb-2">{title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-8">
                <div className="max-w-6xl mx-auto px-8 flex items-center justify-between text-sm text-gray-500">
                    <p>FastAPI · React · PostgreSQL · XGBoost · Gemini API</p>
                    <a
                        href="https://github.com/ather8/pizza-store"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-white transition-colors"
                    >
                        github.com/ather8/pizza-store
                    </a>
                </div>
            </footer>
        </div>
    )
}