import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * ResultViewer
 * Renders MCP execution results in a visual way
 * 
 */


export default function ResultViewer({ result, tool }) {
    console.log("ResultViewer rendered");
    console.log("ResultViewer received:", { result, tool });
    chrome.runtime.sendMessage({
  type: "DEBUG_LOG",
  payload: result,
});

function resolvePayload(tool, result) {
  const sc = result?.result?.structuredContent;

  if (!sc) return null;

  switch (tool) {
    case "monthly_report":
      return sc; // full object

    case "list_expenses":
    case "summarize_expenses":
      return sc.result; // array

    default:
      return sc.result ?? sc;
  }
}




  // if (!result || !result.result.structuredContent.result) {
  //   return (
  //     <p className="text-sm text-neutral-400">
  //       No data returned
  //       {tool && ": " + result}
  //     </p>
  //   );
  // }

 const payload = resolvePayload(tool, result);

console.log("Resolved payload:", payload);

  if (!payload) {
    return (
      <p className="text-sm text-neutral-400">
        No data returned
        {tool && ": " + result}
      </p>
    );
  }

  switch (tool) {
    case "list_expenses":
      return <ExpenseList expenses={payload} />;

    case "summarize_expenses":
      return <CategorySummary data={payload} />;

    case "monthly_report":
      console.log("Monthly report payload:", payload);
      return <MonthlyReport report={payload} />;

    default:
      return (
        <pre className="text-xs bg-black/60 p-3 rounded">
          {JSON.stringify(payload, null, 2)}
        </pre>
      );
  }
}

/* ===================== LIST EXPENSES ===================== */

function ExpenseList({ expenses }) {
  if (!Array.isArray(expenses)) {
    return (
      <p className="text-sm text-neutral-400">
        Invalid expenses data
      </p>
    );
  }

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-neutral-400">
        No expenses found
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-lg font-semibold">📋 Expenses</h4>

      <div className="max-h-64 overflow-y-auto space-y-2">
        {expenses.map((e) => (
          <div
            key={e.id}
            className="flex justify-between items-center bg-neutral-900 rounded-xl p-3"
          >
            <div>
              <p className="font-medium">{e.category}</p>
              <p className="text-xs text-neutral-400">
                {e.date}
                {e.merchant ? ` • ${e.merchant}` : ""}
              </p>
            </div>
            <p className="font-semibold">₹{e.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== SUMMARY (BAR CHART) ===================== */

function CategorySummary({ data }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <p className="text-sm text-neutral-400">
        No summary data available
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold">📊 Category Summary</h4>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ===================== MONTHLY REPORT ===================== */

function MonthlyReport({ report }) {
  console.log("MonthlyReport received report:", report);
  if (
    !report ||
    !Array.isArray(report.category_breakdown)
  ) {
    return (
      <p className="text-sm text-neutral-400">
        Invalid monthly report
      </p>
    );
  }

  const COLORS = [
    "#6366f1",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-semibold">📈 Monthly Report</h4>
        <p className="text-sm text-neutral-400">
          {report.month}
        </p>
      </div>

      <div className="flex justify-between bg-neutral-900 rounded-xl p-3">
        <span>Total Spending</span>
        <span className="font-semibold">
          ₹{report.total_spending}
        </span>
      </div>

      {report.category_breakdown.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={report.category_breakdown}
              dataKey="total"
              nameKey="category"
              innerRadius={50}
              outerRadius={80}
            >
              {report.category_breakdown.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}

      {report.summary && (
        <p className="text-sm text-neutral-400">
          {report.summary}
        </p>
      )}
    </div>
  );
}
