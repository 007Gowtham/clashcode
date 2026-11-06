'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminProblemsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AdminProblemsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active expanded problem for testcases & editing
  const [activeProblem, setActiveProblem] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);

  // New problem form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProblem, setNewProblem] = useState({
    title: '',
    slug: '',
    difficulty: 'EASY',
    tags: '',
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    points: 100,
    statementMarkdown: '',
  });

  // New test case state
  const [newTestCase, setNewTestCase] = useState({
    input: '',
    expectedOutput: '',
    isSample: true,
    orderIndex: 0,
  });

  // Starter code state
  const [starterLang, setStarterLang] = useState('PYTHON');
  const [starterCodeText, setStarterCodeText] = useState('');

  // Check admin authorization
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/admin/problems');
      } else if (user.role !== 'ROLE_ADMIN') {
        router.push('/problems');
      }
    }
  }, [user, authLoading, router]);

  // Fetch admin problem list
  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminProblemsApi.list({ size: 50 });
      setProblems(data.content || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin problems');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'ROLE_ADMIN') {
      fetchProblems();
    }
  }, [user, fetchProblems]);

  // Fetch test cases for active problem
  const fetchTestCases = useCallback(async (problemId) => {
    setLoadingTestCases(true);
    try {
      const cases = await adminProblemsApi.listTestCases(problemId);
      setTestCases(cases);
    } catch (err) {
      console.warn('Failed to fetch test cases', err);
    } finally {
      setLoadingTestCases(false);
    }
  }, []);

  const handleSelectProblem = (prob) => {
    setActiveProblem(prob);
    fetchTestCases(prob.id);
  };

  // Create problem
  const handleCreateProblem = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const tagList = newProblem.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await adminProblemsApi.create({
        ...newProblem,
        tags: tagList,
        timeLimitMs: parseInt(newProblem.timeLimitMs, 10),
        memoryLimitMb: parseInt(newProblem.memoryLimitMb, 10),
        points: parseInt(newProblem.points, 10),
      });

      setSuccess(`Problem "${created.title}" created successfully.`);
      setShowCreateForm(false);
      setNewProblem({
        title: '',
        slug: '',
        difficulty: 'EASY',
        tags: '',
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        points: 100,
        statementMarkdown: '',
      });
      fetchProblems();
      handleSelectProblem(created);
    } catch (err) {
      setError(err.message || 'Failed to create problem');
    }
  };

  // Publish problem
  const handlePublish = async (id) => {
    setError('');
    setSuccess('');
    try {
      const published = await adminProblemsApi.publish(id);
      setSuccess(`Problem "${published.title}" published!`);
      fetchProblems();
      if (activeProblem?.id === id) {
        setActiveProblem(published);
      }
    } catch (err) {
      setError(err.message || 'Failed to publish problem');
    }
  };

  // Delete problem
  const handleDeleteProblem = async (id) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;
    try {
      await adminProblemsApi.delete(id);
      setSuccess('Problem deleted successfully');
      if (activeProblem?.id === id) {
        setActiveProblem(null);
      }
      fetchProblems();
    } catch (err) {
      setError(err.message || 'Failed to delete problem');
    }
  };

  // Add Test Case
  const handleAddTestCase = async (e) => {
    e.preventDefault();
    if (!activeProblem) return;
    setError('');
    setSuccess('');
    try {
      await adminProblemsApi.addTestCase(activeProblem.id, {
        input: newTestCase.input,
        expectedOutput: newTestCase.expectedOutput,
        isSample: Boolean(newTestCase.isSample),
        orderIndex: parseInt(newTestCase.orderIndex, 10),
      });
      setSuccess('Testcase added.');
      setNewTestCase({
        input: '',
        expectedOutput: '',
        isSample: false,
        orderIndex: testCases.length + 1,
      });
      fetchTestCases(activeProblem.id);
    } catch (err) {
      setError(err.message || 'Failed to add testcase');
    }
  };

  // Delete Test Case
  const handleDeleteTestCase = async (testCaseId) => {
    if (!confirm('Delete this test case?')) return;
    try {
      await adminProblemsApi.deleteTestCase(activeProblem.id, testCaseId);
      fetchTestCases(activeProblem.id);
    } catch (err) {
      setError(err.message || 'Failed to delete testcase');
    }
  };

  // Save Starter Code
  const handleSaveStarterCode = async () => {
    if (!activeProblem || !starterCodeText.trim()) return;
    try {
      await adminProblemsApi.upsertStarterCode(activeProblem.id, {
        language: starterLang,
        templateCode: starterCodeText,
      });
      setSuccess(`Starter code for ${starterLang} saved.`);
    } catch (err) {
      setError(err.message || 'Failed to save starter code');
    }
  };

  if (authLoading || (user && user.role !== 'ROLE_ADMIN')) {
    return <div className="p-8 text-xs font-mono text-zinc-400 text-center">Checking admin access...</div>;
  }

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 w-full">
      <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <div>
          <h1 className="text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
            Admin Problem Management
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Author problems, manage hidden and sample test cases, and publish to the contest pool.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-3.5 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-medium rounded hover:bg-zinc-800"
        >
          {showCreateForm ? 'Cancel' : '+ New Problem'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
          {success}
        </div>
      )}

      {/* New Problem Form Modal/Block */}
      {showCreateForm && (
        <div className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg">
          <h2 className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Create Algorithmic Problem
          </h2>
          <form onSubmit={handleCreateProblem} className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Invert Binary Tree"
                  value={newProblem.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setNewProblem({ ...newProblem, title, slug });
                  }}
                  className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Slug (unique URL path)</label>
                <input
                  type="text"
                  required
                  placeholder="invert-binary-tree"
                  value={newProblem.slug}
                  onChange={(e) => setNewProblem({ ...newProblem, slug: e.target.value })}
                  className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Difficulty</label>
                <select
                  value={newProblem.difficulty}
                  onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
                  className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Points</label>
                <input
                  type="number"
                  required
                  value={newProblem.points}
                  onChange={(e) => setNewProblem({ ...newProblem, points: e.target.value })}
                  className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Time Limit (ms)</label>
                <input
                  type="number"
                  required
                  value={newProblem.timeLimitMs}
                  onChange={(e) => setNewProblem({ ...newProblem, timeLimitMs: e.target.value })}
                  className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Memory Limit (MB)</label>
                <input
                  type="number"
                  required
                  value={newProblem.memoryLimitMb}
                  onChange={(e) => setNewProblem({ ...newProblem, memoryLimitMb: e.target.value })}
                  className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="tree, recursion, binary-tree"
                value={newProblem.tags}
                onChange={(e) => setNewProblem({ ...newProblem, tags: e.target.value })}
                className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Statement (Markdown)</label>
              <textarea
                required
                rows={6}
                value={newProblem.statementMarkdown}
                onChange={(e) => setNewProblem({ ...newProblem, statementMarkdown: e.target.value })}
                placeholder="Describe the task, constraints, input format, and output format..."
                className="w-full p-3 font-mono text-xs border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 resize-none"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold rounded"
            >
              Create Draft Problem
            </button>
          </form>
        </div>
      )}

      {/* Main Problems Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 mb-8">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-400 uppercase text-[11px]">
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Difficulty</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Points</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {problems.map((prob) => (
              <tr
                key={prob.id}
                onClick={() => handleSelectProblem(prob)}
                className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${
                  activeProblem?.id === prob.id ? 'bg-zinc-100 dark:bg-zinc-800/60 font-semibold' : ''
                }`}
              >
                <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{prob.title}</td>
                <td className="py-3 px-4">{prob.difficulty}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      prob.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {prob.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-zinc-500">{prob.points}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  {prob.status !== 'PUBLISHED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublish(prob.id);
                      }}
                      className="px-2 py-1 text-[11px] bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProblem(prob.id);
                    }}
                    className="px-2 py-1 text-[11px] border border-red-300 text-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Test Cases & Starter Codes for Active Problem */}
      {activeProblem && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-white dark:bg-zinc-900 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h2 className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
              Manage Test Cases & Starter Code for &quot;{activeProblem.title}&quot;
            </h2>
            <div className="text-xs font-mono text-zinc-500">
              Publish Rule: Requires ≥1 sample case and ≥3 total cases.
            </div>
          </div>

          {/* Test cases list */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase text-zinc-500">
              Test Cases ({testCases.length})
            </h3>

            {testCases.map((tc, idx) => (
              <div
                key={tc.id || idx}
                className="p-3 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 font-mono text-xs flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">#{tc.orderIndex}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] ${
                        tc.isSample
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                          : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {tc.isSample ? 'SAMPLE (Public)' : 'HIDDEN'}
                    </span>
                  </div>
                  <div>Input: <code className="text-zinc-800 dark:text-zinc-200">{tc.input}</code></div>
                  <div>Output: <code className="text-zinc-800 dark:text-zinc-200">{tc.expectedOutput}</code></div>
                </div>

                <button
                  onClick={() => handleDeleteTestCase(tc.id)}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {/* Add Test Case Form */}
          <form onSubmit={handleAddTestCase} className="p-4 border border-dashed border-zinc-300 dark:border-zinc-700 rounded space-y-3 text-xs font-mono">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 block">+ Add Test Case</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-500 mb-1">Input Text</label>
                <textarea
                  rows={2}
                  required
                  value={newTestCase.input}
                  onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                  placeholder="e.g. [2,7,11,15]\n9"
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Expected Output Text</label>
                <textarea
                  rows={2}
                  required
                  value={newTestCase.expectedOutput}
                  onChange={(e) => setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })}
                  placeholder="e.g. [0,1]"
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTestCase.isSample}
                  onChange={(e) => setNewTestCase({ ...newTestCase, isSample: e.target.checked })}
                />
                <span>Is Sample Test Case (Visible to players)</span>
              </label>

              <button
                type="submit"
                className="px-3 py-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold rounded"
              >
                Add Test Case
              </button>
            </div>
          </form>

          {/* Starter Code Editor */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase text-zinc-500">Configure Starter Code</span>
              <div className="flex items-center space-x-2">
                <select
                  value={starterLang}
                  onChange={(e) => setStarterLang(e.target.value)}
                  className="px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900"
                >
                  <option value="PYTHON">Python</option>
                  <option value="JAVA">Java</option>
                  <option value="CPP">C++</option>
                  <option value="JAVASCRIPT">JavaScript</option>
                </select>
                <button
                  type="button"
                  onClick={handleSaveStarterCode}
                  className="px-3 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold rounded"
                >
                  Save Starter Template
                </button>
              </div>
            </div>

            <textarea
              rows={5}
              value={starterCodeText}
              onChange={(e) => setStarterCodeText(e.target.value)}
              placeholder="Enter boilerplate / starter template code..."
              className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded bg-zinc-50 dark:bg-zinc-950 font-mono text-xs resize-none"
            />
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

