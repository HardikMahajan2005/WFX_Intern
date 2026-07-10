import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Terminal,
  Database,
  Copy,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  ArrowUp
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  Legend
} from "recharts";

export default function NlQuery() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userQuestion = question.trim();
    setQuestion("");
    setLoading(true);

    const userMsgId = Date.now() + "-user";
    const assistantMsgId = Date.now() + "-assistant";

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: userQuestion },
      {
        id: assistantMsgId,
        role: "assistant",
        sql: "",
        rows: [],
        aiAnswer: "",
        sqlCollapsed: true,
        error: null,
        confidenceScore: null,
        reasoning: null,
        chartConfig: null
      },
    ]);

    const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    const sseUrl = `${VITE_API_URL}/nl-query/stream`;

    try {
      const response = await fetch(sseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userQuestion }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response stream body available.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith("data: ")) {
            const dataStr = cleanLine.substring(6);
            if (dataStr === "[DONE]") continue;

            try {
              const payload = JSON.parse(dataStr);
              const { stage, data: chunkData } = payload;

              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id !== assistantMsgId) return msg;

                  if (stage === "sql_generated") {
                    return { 
                      ...msg, 
                      sql: chunkData.sql,
                      confidenceScore: chunkData.confidenceScore,
                      reasoning: chunkData.reasoning
                    };
                  } else if (stage === "sql_result") {
                    return { 
                      ...msg, 
                      rows: chunkData.rows || [],
                      chartConfig: chunkData.chartConfig || null
                    };
                  } else if (stage === "answer_chunk") {
                    return { ...msg, aiAnswer: msg.aiAnswer + chunkData.token };
                  } else if (stage === "done") {
                    return { ...msg, aiAnswer: chunkData.aiAnswer };
                  }
                  return msg;
                })
              );
            } catch (err) {
              console.warn("Incomplete SSE message parsed:", err.message);
            }
          }
        }
      }
    } catch (err) {
      console.error("SSE stream error:", err);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== assistantMsgId) return msg;
          return { ...msg, error: err.message || "Failed to process question." };
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSqlCollapse = (msgId) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId) {
          return { ...msg, sqlCollapsed: !msg.sqlCollapsed };
        }
        return msg;
      })
    );
  };

  const copySql = (sqlText) => {
    navigator.clipboard.writeText(sqlText);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-5xl mx-auto glass-panel-elev rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-white/5 bg-gradient-to-r from-amber-500/[0.04] to-transparent">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_20px_rgba(245,184,0,0.15)]">
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-eyebrow">AI Copilot</h3>
              <span className="chip-status-live">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-base font-display font-semibold text-stone-100 mt-1 tracking-tight">
              Ask anything about your ERP data
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-7 space-y-7">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-7 max-w-lg mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full animate-pulse-slow" />
              <div className="relative p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <Sparkles className="h-7 w-7 text-amber-400" strokeWidth={1.8} />
              </div>
            </div>
            <div className="space-y-3">
              <span className="text-eyebrow block">Intelligent Query Assistant</span>
              <h4 className="text-3xl font-display font-semibold text-stone-100 tracking-tight">
                Translate questions <span className="italic text-amber-400">into insight.</span>
              </h4>
              <p className="text-sm text-stone-400 leading-relaxed">
                Inspect sales metrics, supplier performance, and billing analytics in natural language. Try a sample query to get started.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <SuggestionChip>Buyers above 220 GSM</SuggestionChip>
              <SuggestionChip>Top suppliers by revenue</SuggestionChip>
              <SuggestionChip>Last quarter sales</SuggestionChip>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,184,0,0.1)]">
                    <Bot className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                )}

                <div className={`space-y-3 max-w-[85%] ${isUser ? "order-1" : "order-2"}`}>
                  {isUser ? (
                    <div className="bg-white/[0.04] text-stone-100 px-5 py-3.5 rounded-2xl border border-white/10 text-sm font-medium leading-relaxed shadow-md">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {msg.sql && (
                        <div className="inner-panel overflow-hidden">
                          <div
                            onClick={() => toggleSqlCollapse(msg.id)}
                            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-2 text-eyebrow">
                                <Terminal className="h-3.5 w-3.5 text-amber-400" />
                                Generated SQL
                              </span>
                              {msg.confidenceScore !== undefined && msg.confidenceScore !== null && (
                                <div className="flex items-center gap-2 ml-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      msg.confidenceScore >= 80
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : msg.confidenceScore >= 50
                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                                    }`}
                                    title={msg.reasoning}
                                  >
                                    {msg.confidenceScore}% Confidence
                                  </span>
                                  {msg.reasoning && (
                                    <span 
                                      className="text-[10px] text-stone-500 max-w-[200px] md:max-w-xs truncate hidden sm:inline" 
                                      title={msg.reasoning}
                                    >
                                      · {msg.reasoning}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copySql(msg.sql);
                                }}
                                className="p-1.5 rounded-md hover:bg-white/5 text-stone-500 hover:text-amber-400 transition-all"
                                title="Copy SQL"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              {msg.sqlCollapsed ? (
                                <ChevronDown className="h-4 w-4 text-stone-500" />
                              ) : (
                                <ChevronUp className="h-4 w-4 text-stone-500" />
                              )}
                            </div>
                          </div>

                          {!msg.sqlCollapsed && (
                            <div className="px-4 py-3 overflow-x-auto border-t border-white/5">
                              <pre className="text-[12px] text-amber-300/90 leading-relaxed select-all">
                                {msg.sql}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {msg.rows && msg.rows.length > 0 && (
                        <>
                          {msg.chartConfig && msg.chartConfig.type && (
                            <DynamicQueryChart chartConfig={msg.chartConfig} data={msg.rows} />
                          )}
                          <div className="inner-panel overflow-hidden">
                            <div className="px-4 py-3 flex items-center gap-2 text-eyebrow border-b border-white/5">
                              <Database className="h-3.5 w-3.5 text-blue-400" />
                              Dataset · {msg.rows.length} {msg.rows.length === 1 ? "row" : "rows"}
                            </div>
                          <div className="overflow-x-auto max-h-64">
                            <table className="w-full text-left text-[12px] border-collapse">
                              <thead>
                                <tr className="bg-white/[0.02] text-stone-400 border-b border-white/5">
                                  {Object.keys(msg.rows[0]).map((key) => (
                                    <th
                                      key={key}
                                      className="px-4 py-2.5 font-bold tracking-wider uppercase text-[10px]"
                                    >
                                      {key.replace(/_/g, " ")}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.04]">
                                {msg.rows.map((row, idx) => (
                                  <tr
                                    key={idx}
                                    className="hover:bg-white/[0.02] transition-colors"
                                  >
                                    {Object.values(row).map((val, cellIdx) => (
                                      <td
                                        key={cellIdx}
                                        className="px-4 py-2.5 text-stone-300 font-mono text-[11px] truncate max-w-[180px]"
                                      >
                                        {val === null || val === undefined ? (
                                          <span className="text-stone-600 italic">null</span>
                                        ) : typeof val === "object" ? (
                                          JSON.stringify(val)
                                        ) : (
                                          String(val)
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        </>
                      )}

                      {(msg.aiAnswer || msg.error || (!msg.sql && !msg.error)) && (
                        <div
                          className={`rounded-2xl p-4.5 text-sm leading-relaxed border-l-2 ${
                            msg.error
                              ? "bg-red-500/[0.05] border-red-400"
                              : "bg-amber-500/[0.04] border-amber-400"
                          }`}
                        >
                          {msg.error ? (
                            <div className="flex items-start gap-2.5 text-red-300">
                              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                              <span className="font-medium">{msg.error}</span>
                            </div>
                          ) : msg.aiAnswer ? (
                            <div className="text-stone-200 whitespace-pre-wrap">
                              {msg.aiAnswer}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 text-stone-400 italic">
                              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                              <span className="text-xs font-medium">
                                Thinking...
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-stone-700/50 border border-white/10 text-stone-300 flex items-center justify-center">
                    <User className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="p-5 border-t border-white/5 bg-[#0a0e1a]/50">
        <form onSubmit={handleQuery} className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            placeholder="Ask about sales, inventory, suppliers, or revenue..."
            className="input-base pr-16 pl-5 py-4"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-stone-700 disabled:cursor-not-allowed text-stone-950 flex items-center justify-center transition-all shadow-lg shadow-amber-500/20"
            aria-label="Send query"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={3} />
          </button>
        </form>
      </div>
    </div>
  );
}

function SuggestionChip({ children }) {
  return (
    <span className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/8 text-[11px] font-medium text-stone-300 hover:border-amber-500/30 hover:text-amber-300 cursor-pointer transition-all">
      {children}
    </span>
  );
}

function DynamicQueryChart({ chartConfig, data }) {
  if (!chartConfig || !chartConfig.type || !data || data.length === 0) return null;

  const { type, xAxisKey, yAxisKey, title } = chartConfig;
  
  // Convert values to numbers for accurate chart plotting
  const chartData = data.map(row => {
    const parsedRow = { ...row };
    if (yAxisKey && parsedRow[yAxisKey] !== undefined) {
      // Clean string values like "$1,200" or commas
      let cleanVal = String(parsedRow[yAxisKey]).replace(/[$,]/g, "");
      parsedRow[yAxisKey] = Number(cleanVal) || 0;
    }
    return parsedRow;
  });

  const colors = ["#f5b800", "#3b82f6", "#10b981", "#ec4899", "#8b5cf6", "#f43f5e"];

  const renderChartContent = () => {
    switch (type.toLowerCase()) {
      case "bar":
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="#78716c" fontSize={11} tickLine={false} />
            <YAxis stroke="#78716c" fontSize={11} tickLine={false} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
              labelStyle={{ color: "#a8a29e", fontWeight: "bold" }}
              itemStyle={{ color: "#f5b800" }}
            />
            <Bar dataKey={yAxisKey} fill="#f5b800" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="#78716c" fontSize={11} tickLine={false} />
            <YAxis stroke="#78716c" fontSize={11} tickLine={false} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
              labelStyle={{ color: "#a8a29e", fontWeight: "bold" }}
              itemStyle={{ color: "#f5b800" }}
            />
            <Line type="monotone" dataKey={yAxisKey} stroke="#f5b800" strokeWidth={2} activeDot={{ r: 6 }} />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorQueryRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f5b800" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f5b800" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="#78716c" fontSize={11} tickLine={false} />
            <YAxis stroke="#78716c" fontSize={11} tickLine={false} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
              labelStyle={{ color: "#a8a29e", fontWeight: "bold" }}
              itemStyle={{ color: "#f5b800" }}
            />
            <Area type="monotone" dataKey={yAxisKey} stroke="#f5b800" strokeWidth={2} fillOpacity={1} fill="url(#colorQueryRevenue)" />
          </AreaChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={yAxisKey}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <RechartsTooltip 
              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
              itemStyle={{ color: "#f5b800" }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="inner-panel overflow-hidden p-5 space-y-4 bg-[#0a0e1a]/40 border border-white/5 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h4 className="text-xs font-display font-semibold text-stone-100 tracking-tight">
          📊 {title || "Query Visualization"}
        </h4>
        <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">
          {type} Chart
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChartContent()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

