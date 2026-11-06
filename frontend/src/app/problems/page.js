'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { problemsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';

function ProblemsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [problems, setProblems] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await problemsApi.list({
        difficulty: difficulty || undefined,
        tag: tag || undefined,
        page,
        size: 15,
      });
      setProblems(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      if (err.status === 401) {
        router.push('/login?redirect=/problems');
        return;
      }
      setError(err.message || 'Failed to load problems');
    } finally {
      setLoading(false);
    }
  }, [difficulty, tag, page, router]);

  useEffect(() => {
    if (!authLoading) {
      fetchProblems();
    }
  }, [authLoading, fetchProblems]);

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-[1000px] mx-auto px-4 py-8 w-full">
      {/* Page Header */}
      <div className="mb-6 pb-4 border-b border-[var(--ink-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--ink)] mb-1">
            Problems
          </h1>
          <p className="text-[14px] text-[var(--ink)] opacity-70">
            Practice algorithmic questions individually with sample test verification.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(0);
            }}
            className="bg-[var(--paper)] text-[var(--ink)] border border-[var(--ink-border)] rounded-[6px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--ink)] transition-hover"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <Input
            type="text"
            placeholder="Filter by tag..."
            value={tag}
            onChange={(e) => {
              setTag(e.target.value);
              setPage(0);
            }}
            className="w-40"
          />

          <Button variant="secondary" onClick={fetchProblems}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[6px] text-[14px] border border-[var(--ink)] bg-[var(--ink-hover)] font-semibold">
          {error}
        </div>
      )}

      {/* Problems Table */}
      <div className="border border-[var(--ink-border)] rounded-[6px] overflow-hidden bg-[var(--paper)]">
        {loading ? (
          <div className="py-16 text-center text-[14px] opacity-60">Loading problems...</div>
        ) : problems.length === 0 ? (
          <div className="py-16 text-center text-[14px] opacity-60">
            No problems match your criteria.
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableHeaderCell className="w-12">#</TableHeaderCell>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Difficulty</TableHeaderCell>
              <TableHeaderCell>Points</TableHeaderCell>
              <TableHeaderCell className="text-right">Action</TableHeaderCell>
            </TableHead>
            <TableBody>
              {problems.map((prob, idx) => {
                const diffLabel =
                  prob.difficulty === 'EASY'
                    ? 'Easy'
                    : prob.difficulty === 'MEDIUM'
                    ? 'Medium'
                    : 'Hard';
                return (
                  <TableRow key={prob.id}>
                    <TableCell className="opacity-50">{page * 15 + idx + 1}</TableCell>
                    <TableCell className="font-semibold">
                      <Link
                        href={`/problems/${prob.slug}`}
                        className="hover:underline transition-hover"
                      >
                        {prob.title}
                      </Link>
                    </TableCell>
                    <TableCell>{diffLabel}</TableCell>
                    <TableCell>{prob.points} pts</TableCell>
                    <TableCell align="right">
                      <Link href={`/problems/${prob.slug}`}>
                        <Button variant="secondary" className="px-3 py-1 text-[12px]">
                          Solve
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-[14px] opacity-70">
          <div>
            Page {page + 1} of {totalPages} ({totalElements} total)
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-[12px]"
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-[12px]"
            >
              Next
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[14px]">Loading...</div>}>
      <ProblemsList />
    </Suspense>
  );
}
