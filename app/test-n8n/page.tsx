"use client";

import { useState } from "react";

export default function TestN8nPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const testUserAnalysis = async () => {
    setLoading(true);
    setResult("Loading...");
    try {
      const response = await fetch('https://cpkku.app.n8n.cloud/webhook-test/exam-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'user', userId: '12345' })
      });
      
      // Some webhooks might not return JSON, so we check first
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        setResult(JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        setResult(text);
      }
    } catch (error: any) {
      setResult(JSON.stringify({ error: error.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const testAdminDashboard = async () => {
    setLoading(true);
    setResult("Loading...");
    try {
      const response = await fetch('https://cpkku.app.n8n.cloud/webhook-test/exam-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'admin' })
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        setResult(JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        setResult(text);
      }
    } catch (error: any) {
      setResult(JSON.stringify({ error: error.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Test n8n Workflow</h1>
      <p className="text-gray-600 dark:text-gray-400">
        ทดสอบการทำงานของ Webhook n8n (https://cpkku.app.n8n.cloud/webhook-test/exam-analysis)
      </p>
      
      <div className="flex space-x-4">
        <button 
          onClick={testUserAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Test User Analysis
        </button>
        <button 
          onClick={testAdminDashboard}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          Test Admin Dashboard
        </button>
      </div>
      
      <div className="mt-6 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 min-h-[300px]">
        <h2 className="text-xl font-semibold mb-2">Result:</h2>
        <pre className="whitespace-pre-wrap break-all text-sm font-mono">
          {result || "ผลลัพธ์จะแสดงที่นี่..."}
        </pre>
      </div>
    </div>
  );
}
