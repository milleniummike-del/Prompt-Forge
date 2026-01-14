import React, { useState, useEffect } from 'react';
import { Zap, DollarSign } from 'lucide-react';
import { getTokenUsage, TokenUsage as TokenUsageType } from '../services/storage';

// Estimated pricing based on Gemini Flash rates (per 1 Million tokens)
const PRICE_PER_1M_INPUT = 0.075;
const PRICE_PER_1M_OUTPUT = 0.30;

export const TokenUsage: React.FC = () => {
    const [usage, setUsage] = useState<TokenUsageType>({ input: 0, output: 0, total: 0 });

    useEffect(() => {
        // Initial load
        setUsage(getTokenUsage());

        // Listen for updates
        const handleUpdate = () => {
            setUsage(getTokenUsage());
        };

        window.addEventListener('token-usage-updated', handleUpdate);
        return () => window.removeEventListener('token-usage-updated', handleUpdate);
    }, []);

    const calculateCost = () => {
        const inputCost = (usage.input / 1_000_000) * PRICE_PER_1M_INPUT;
        const outputCost = (usage.output / 1_000_000) * PRICE_PER_1M_OUTPUT;
        return inputCost + outputCost;
    };

    if (usage.total === 0) return null;

    const estimatedCost = calculateCost();

    return (
        <div className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-slate-400 hover:text-white hover:border-indigo-500/50 transition-colors cursor-help">
            <Zap size={12} className={usage.total > 0 ? "text-yellow-500" : "text-slate-600"} />
            <span>{usage.total.toLocaleString()}</span>
            
            {/* Tooltip */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <h4 className="text-xs font-bold text-white mb-2 pb-1 border-b border-slate-800 flex justify-between">
                    <span>Gemini Usage</span>
                    <span className="text-slate-500 font-normal">Flash Rates</span>
                </h4>
                <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                        <span>Input Tokens:</span>
                        <span className="text-white">{usage.input.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>Output Tokens:</span>
                        <span className="text-white">{usage.output.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-indigo-400 pt-1 mt-1 border-t border-slate-800">
                        <span>Total Tokens:</span>
                        <span>{usage.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold pt-1 mt-1 border-t border-slate-800">
                        <span className="flex items-center gap-1"><DollarSign size={10}/> Est. Cost:</span>
                        <span>${estimatedCost.toFixed(6)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};