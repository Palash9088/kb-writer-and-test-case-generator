import React, { useMemo } from 'react';
import { TestCase } from '../types';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface Props {
  csvContent: string;
}

const TestCaseViewer: React.FC<Props> = ({ csvContent }) => {
  const testCases = useMemo(() => {
    if (!csvContent) return [];
    
    // Simple CSV parser
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const dataRows = lines.slice(1);
    const parsed: TestCase[] = [];

    // Regex to handle quoted CSV fields basic implementation
    const parseCSVLine = (str: string) => {
        const result: string[] = [];
        let cell = '';
        let inQuote = false;
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                result.push(cell.trim());
                cell = '';
            } else {
                cell += char;
            }
        }
        result.push(cell.trim());
        return result;
    };

    dataRows.forEach(line => {
        if (!line.trim()) return;
        const cols = parseCSVLine(line);
        // Mapping based on:
        // 1.ID, 2.Scenario, 3.Module, 4.Type, 5.Title, 6.Pre-reqs, 7.Steps, 8.ER, 9.Actual, 10.Result, 11.Comments, 12.Ticket, 13.Owner
        if (cols.length >= 8) { // Allow for some variation but expect mostly full
             parsed.push({
                id: cols[0]?.replace(/^"|"$/g, '') || '',
                scenario: cols[1]?.replace(/^"|"$/g, '') || '',
                module: cols[2]?.replace(/^"|"$/g, '') || '-',
                caseType: cols[3]?.replace(/^"|"$/g, '') || 'Positive',
                title: cols[4]?.replace(/^"|"$/g, '') || '',
                preconditions: cols[5]?.replace(/^"|"$/g, '') || '-',
                steps: cols[6]?.replace(/^"|"$/g, '') || '',
                expectedResult: cols[7]?.replace(/^"|"$/g, '') || '',
                actualResult: cols[8]?.replace(/^"|"$/g, '') || '-',
                result: cols[9]?.replace(/^"|"$/g, '') || '-',
                comments: cols[10]?.replace(/^"|"$/g, '') || '-',
                ticket: cols[11]?.replace(/^"|"$/g, '') || '-',
                owner: cols[12]?.replace(/^"|"$/g, '') || '-',
             });
        }
    });
    return parsed;
  }, [csvContent]);

  if (testCases.length === 0) {
    return (
        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
            <p>No valid test case data found in response. Raw output may be plain text or invalid CSV.</p>
            <pre className="mt-4 text-xs text-left bg-slate-100 p-2 overflow-auto max-h-32">
                {csvContent}
            </pre>
        </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-max divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 w-24 border-r border-slate-200 shadow-[4px_0_4px_-2px_rgba(0,0,0,0.05)]">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Module / Scenario</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-48">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-64">Steps</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-64">Expected Result</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Actual / Result</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Meta</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {testCases.map((tc, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100 group-hover:bg-slate-50">
                  {tc.id}
                </td>
                <td className="px-4 py-4 text-sm text-slate-700 align-top">
                  <div className="font-medium text-indigo-900">{tc.module}</div>
                  <div className="text-slate-500 text-xs mt-1">{tc.scenario}</div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700 font-medium align-top">
                    {tc.title}
                    {tc.preconditions && tc.preconditions !== '-' && tc.preconditions !== 'NA' && (
                        <div className="mt-2 text-xs text-slate-500 bg-slate-100 p-1.5 rounded border border-slate-200">
                            <strong>Pre:</strong> {tc.preconditions}
                        </div>
                    )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap align-top">
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                     tc.caseType.toLowerCase().includes('negative') 
                     ? 'bg-red-50 text-red-700 border-red-200' 
                     : tc.caseType.toLowerCase().includes('boundary') || tc.caseType.toLowerCase().includes('edge')
                     ? 'bg-amber-50 text-amber-700 border-amber-200'
                     : 'bg-green-50 text-green-700 border-green-200'
                   }`}>
                     {tc.caseType.toLowerCase().includes('negative') ? <AlertCircle className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                     {tc.caseType}
                   </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 whitespace-pre-wrap align-top font-mono text-xs leading-relaxed">
                  {tc.steps}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 align-top bg-green-50/30">
                  {tc.expectedResult}
                </td>
                <td className="px-4 py-4 text-sm text-slate-700 align-top">
                  <div className="mb-1"><span className="text-xs font-semibold text-slate-500 uppercase">Actual:</span> {tc.actualResult}</div>
                  <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      tc.result.toLowerCase().includes('fail') ? 'bg-red-100 text-red-800' :
                      tc.result.toLowerCase().includes('pass') ? 'bg-green-100 text-green-800' :
                      'bg-slate-100 text-slate-800'
                  }`}>
                      {tc.result}
                  </div>
                </td>
                <td className="px-4 py-4 text-xs text-slate-500 align-top space-y-2">
                    {tc.ticket !== 'NA' && tc.ticket !== '-' && (
                        <div className="flex items-center text-amber-700 bg-amber-50 px-2 py-1 rounded">
                            <span className="font-bold mr-1">T:</span> {tc.ticket}
                        </div>
                    )}
                    <div className="flex items-center">
                        <span className="font-bold mr-1">By:</span> {tc.owner}
                    </div>
                    {tc.comments !== 'NA' && tc.comments !== '-' && (
                        <div className="italic text-slate-400 border-l-2 border-slate-300 pl-2">
                            {tc.comments}
                        </div>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestCaseViewer;