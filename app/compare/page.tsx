'use client';

import { ChatInterface } from '@/components/ChatInterface';
import { OptimizedChatInterface } from '@/components/OptimizedChatInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">API Optimization Comparison</h1>
          <p className="text-lg text-muted-foreground">
            Compare the original approach (3 API calls) vs optimized tool calling (1-2 API calls)
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Original Approach */}
          <div className="space-y-4">
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-red-800">
                  🐌 Original Approach
                </CardTitle>
                <div className="text-sm text-red-600 space-y-1">
                  <div>• 3 API calls per query</div>
                  <div>• OpenAI → Weather → OpenAI</div>
                  <div>• ~$0.002 per query</div>
                  <div>• Complex session management</div>
                </div>
              </CardHeader>
            </Card>
            <ChatInterface />
          </div>

          {/* Optimized Approach */}
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-green-800">
                  ⚡ Optimized Tool Calling
                </CardTitle>
                <div className="text-sm text-green-600 space-y-1">
                  <div>• 1-2 API calls per query</div>
                  <div>• OpenAI with tools → Weather</div>
                  <div>• ~$0.001 per query (50% savings)</div>
                  <div>• Simple, stateless</div>
                </div>
              </CardHeader>
            </Card>
            <OptimizedChatInterface />
          </div>
        </div>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Detailed Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left">Aspect</th>
                    <th className="border border-gray-300 p-3 text-left">Original (3 calls)</th>
                    <th className="border border-gray-300 p-3 text-left">Optimized (1-2 calls)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">API Calls</td>
                    <td className="border border-gray-300 p-3">3 calls (OpenAI → Weather → OpenAI)</td>
                    <td className="border border-gray-300 p-3">1-2 calls (OpenAI with tools)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Cost</td>
                    <td className="border border-gray-300 p-3">~$0.002 per query</td>
                    <td className="border border-gray-300 p-3">~$0.001 per query (50% savings)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Response Time</td>
                    <td className="border border-gray-300 p-3">~2-3 seconds</td>
                    <td className="border border-gray-300 p-3">~1-2 seconds</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Context Management</td>
                    <td className="border border-gray-300 p-3">Complex session store</td>
                    <td className="border border-gray-300 p-3">Simple message history</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Error Handling</td>
                    <td className="border border-gray-300 p-3">Multiple failure points</td>
                    <td className="border border-gray-300 p-3">Single failure point</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Scalability</td>
                    <td className="border border-gray-300 p-3">Server-side sessions</td>
                    <td className="border border-gray-300 p-3">Stateless, highly scalable</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Code Complexity</td>
                    <td className="border border-gray-300 p-3">High (multiple files, session mgmt)</td>
                    <td className="border border-gray-300 p-3">Low (single tool definition)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-800">🎯 Test Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Basic Queries:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• "Tokyo weather"</li>
                  <li>• "What's the weather in Varanasi?"</li>
                  <li>• "Mumbai temperature"</li>
                  <li>• "London climate today"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Context Queries:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• "Tomorrow?" (after asking about a city)</li>
                  <li>• "How about yesterday?"</li>
                  <li>• "What about next week?"</li>
                  <li>• "Compare to last month"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}