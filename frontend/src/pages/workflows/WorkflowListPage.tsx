import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflows, useDeleteWorkflow, useExecuteWorkflow } from '../../hooks/useWorkflows';
import { useCreateWorkflow } from '../../hooks/useWorkflows';
import Badge, { statusVariant } from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDistanceToNow } from 'date-fns';

export default function WorkflowListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useWorkflows({ search: search || undefined, status: statusFilter || undefined });
  const deleteMutation = useDeleteWorkflow();
  const executeMutation = useExecuteWorkflow();
  const createMutation = useCreateWorkflow();

  const workflows = data?.data ?? [];

  const handleNewWorkflow = async () => {
    const w = await createMutation.mutateAsync({
      name: 'Untitled Workflow',
      definition: {
        nodes: [{ id: 'node-1', type: 'WEBHOOK', label: 'Webhook Trigger', config: {}, position: { x: 250, y: 100 } }],
        edges: [],
      },
    });
    navigate(`/workflows/${w.id}/edit`);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Workflows</h1>
          <p className="page-subtitle">Create, manage, and execute your automation workflows</p>
        </div>
        <button className="btn btn-primary" onClick={handleNewWorkflow} disabled={createMutation.isPending}>
          {createMutation.isPending ? <Spinner size="sm" /> : '+'} New Workflow
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <input
          className="input-base"
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <select
          className="input-base"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: 180 }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner size="lg" /></div>
      ) : workflows.length === 0 ? (
        <EmptyState
          icon="⧫"
          title="No workflows yet"
          description="Create your first workflow to start automating your processes."
          action={<button className="btn btn-primary" onClick={handleNewWorkflow}>Create Workflow</button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {workflows.map((workflow) => (
            <div key={workflow.id} className="card glass-hover" style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/workflows/${workflow.id}/edit`)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workflow.name}</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workflow.description || 'No description'}</p>
                </div>
                <Badge variant={statusVariant(workflow.status)}>{workflow.status}</Badge>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{workflow._count?.executions ?? 0}</span>
                  Executions
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)' }}>v{workflow.version}</span>
                  Version
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{workflow.triggerType}</span>
                  Trigger
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/workflows/${workflow.id}/edit`)}
                >Edit</button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={executeMutation.isPending}
                  onClick={() => executeMutation.mutate({ id: workflow.id })}
                >Run</button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (confirm('Delete this workflow?')) deleteMutation.mutate(workflow.id);
                  }}
                >Delete</button>
              </div>

              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                Updated {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
