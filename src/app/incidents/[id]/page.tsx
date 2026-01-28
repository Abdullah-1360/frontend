'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import IncidentTimeline from '@/components/incidents/IncidentTimeline';
import IncidentStatusBadge from '@/components/incidents/IncidentStatusBadge';
import IncidentPriorityBadge from '@/components/incidents/IncidentPriorityBadge';
import { apiClient, Incident, IncidentEvent } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/utils';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ServerIcon,
  DocumentTextIcon,
  FolderIcon,
  ShieldCheckIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';

interface CommandExecution {
  id: string;
  incidentId: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  timestamp: string;
  serverId: string;
}

interface Evidence {
  id: string;
  incidentId: string;
  evidenceType: string;
  signature: string;
  content: string;
  metadata: any;
  timestamp: string;
}

interface BackupArtifact {
  id: string;
  incidentId: string;
  artifactType: string;
  filePath: string;
  originalPath: string;
  checksum: string;
  size: number;
  metadata: any;
  createdAt: string;
}

interface FileChange {
  id: string;
  incidentId: string;
  filePath: string;
  changeType: string;
  originalContent?: string;
  newContent?: string;
  diff: string;
  checksum: string;
  timestamp: string;
}

interface VerificationResult {
  id: string;
  incidentId: string;
  verificationType: string;
  status: string;
  details: any;
  timestamp: string;
}

type TabType = 'timeline' | 'commands' | 'evidence' | 'changes' | 'backups' | 'verification' | 'ticket';

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [commands, setCommands] = useState<CommandExecution[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [changes, setChanges] = useState<FileChange[]>([]);
  const [backups, setBackups] = useState<BackupArtifact[]>([]);
  const [verifications, setVerifications] = useState<VerificationResult[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidentData = async () => {
      try {
        setLoading(true);
        
        // Fetch incident details
        const incidentData = await apiClient.getIncident(incidentId);
        setIncident(incidentData);

        // Fetch incident events
        const eventsData = await apiClient.getIncidentEvents(incidentId);
        setEvents(eventsData);

        // TODO: Implement these API endpoints in the backend
        // For now, we'll use mock data or empty arrays
        setCommands([]);
        setEvidence([]);
        setChanges([]);
        setBackups([]);
        setVerifications([]);

      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load incident details');
      } finally {
        setLoading(false);
      }
    };

    if (incidentId) {
      fetchIncidentData();
    }
  }, [incidentId]);

  const handleEscalate = async () => {
    if (!incident) return;
    
    const reason = prompt('Please provide a reason for escalation:');
    if (!reason) return;

    try {
      await apiClient.escalateIncident(incident.id, reason);
      // Refresh incident data
      const updatedIncident = await apiClient.getIncident(incidentId);
      setIncident(updatedIncident);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to escalate incident');
    }
  };

  const tabs = [
    { id: 'timeline', name: 'Timeline', icon: ClockIcon, count: events.length },
    { id: 'commands', name: 'Commands', icon: ServerIcon, count: commands.length },
    { id: 'evidence', name: 'Evidence', icon: DocumentTextIcon, count: evidence.length },
    { id: 'changes', name: 'Changes', icon: FolderIcon, count: changes.length },
    { id: 'backups', name: 'Backups', icon: ShieldCheckIcon, count: backups.length },
    { id: 'verification', name: 'Verification', icon: ShieldCheckIcon, count: verifications.length },
    { id: 'ticket', name: 'Ticket/Handoff', icon: TicketIcon, count: 0 },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !incident) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Incident</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'Incident not found'}</p>
          <div className="mt-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Incidents
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleEscalate}
              disabled={incident.state === 'ESCALATED'}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              {incident.state === 'ESCALATED' ? 'Escalated' : 'Escalate'}
            </button>
          </div>
        </div>

        {/* Incident Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  Incident #{incident.id.slice(0, 8)}
                  <div className="ml-3">
                    <IncidentStatusBadge status={incident.state} size="lg" />
                  </div>
                </h1>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{incident.triggerType}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <span>Priority:</span>
                    <IncidentPriorityBadge priority={incident.priority} size="sm" />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Started</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(incident.createdAt)}
                </div>
                {incident.resolvedAt && (
                  <>
                    <div className="text-sm text-gray-500 mt-2">Duration</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDuration(incident.createdAt, incident.resolvedAt)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Incident Metadata */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Site ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{incident.siteId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fix Attempts</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {incident.fixAttempts} / {incident.maxFixAttempts}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(incident.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Escalation</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {incident.escalatedAt ? formatDate(incident.escalatedAt) : 'Not escalated'}
                </dd>
              </div>
            </div>

            {incident.escalationReason && (
              <div className="mt-4 p-3 bg-red-50 rounded-md">
                <div className="text-sm font-medium text-red-800">Escalation Reason</div>
                <div className="mt-1 text-sm text-red-700">{incident.escalationReason}</div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                    {tab.count > 0 && (
                      <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'timeline' && <IncidentTimeline events={events} />}
            {activeTab === 'commands' && <CommandsTab commands={commands} />}
            {activeTab === 'evidence' && <EvidenceTab evidence={evidence} />}
            {activeTab === 'changes' && <ChangesTab changes={changes} />}
            {activeTab === 'backups' && <BackupsTab backups={backups} />}
            {activeTab === 'verification' && <VerificationTab verifications={verifications} />}
            {activeTab === 'ticket' && <TicketTab incident={incident} />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Commands Tab Component
function CommandsTab({ commands }: { commands: CommandExecution[] }) {
  if (commands.length === 0) {
    return (
      <div className="text-center py-8">
        <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No commands executed</h3>
        <p className="mt-1 text-sm text-gray-500">Command executions will appear here during incident processing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {commands.map((command) => (
        <div key={command.id} className="border border-gray-200 rounded-lg">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ServerIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Command Execution</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  command.exitCode === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  Exit Code: {command.exitCode}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(command.timestamp)} • {command.executionTime}ms
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Command</label>
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                {command.command}
              </pre>
            </div>
            {command.stdout && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Output (stdout)</label>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto max-h-40 overflow-y-auto">
                  {command.stdout}
                </pre>
              </div>
            )}
            {command.stderr && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Error Output (stderr)</label>
                <pre className="bg-red-50 text-red-800 p-3 rounded text-sm overflow-x-auto max-h-40 overflow-y-auto">
                  {command.stderr}
                </pre>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Evidence Tab Component
function EvidenceTab({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) {
    return (
      <div className="text-center py-8">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No evidence collected</h3>
        <p className="mt-1 text-sm text-gray-500">Diagnostic evidence will appear here during incident analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {evidence.map((item) => (
        <div key={item.id} className="border border-gray-200 rounded-lg">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{item.evidenceType}</span>
                <span className="text-xs text-gray-500">Signature: {item.signature}</span>
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(item.timestamp)}
              </div>
            </div>
          </div>
          <div className="p-4">
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto max-h-60 overflow-y-auto">
              {item.content}
            </pre>
            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Metadata</label>
                <pre className="bg-blue-50 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(item.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Changes Tab Component
function ChangesTab({ changes }: { changes: FileChange[] }) {
  if (changes.length === 0) {
    return (
      <div className="text-center py-8">
        <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No file changes</h3>
        <p className="mt-1 text-sm text-gray-500">File modifications will appear here when fixes are applied.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {changes.map((change) => (
        <div key={change.id} className="border border-gray-200 rounded-lg">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{change.filePath}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  change.changeType === 'CREATE' ? 'bg-green-100 text-green-800' :
                  change.changeType === 'DELETE' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {change.changeType}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(change.timestamp)}
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Diff</label>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto max-h-60 overflow-y-auto font-mono">
                {change.diff}
              </pre>
            </div>
            <div className="text-xs text-gray-500">
              Checksum: {change.checksum}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Backups Tab Component
function BackupsTab({ backups }: { backups: BackupArtifact[] }) {
  if (backups.length === 0) {
    return (
      <div className="text-center py-8">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No backup artifacts</h3>
        <p className="mt-1 text-sm text-gray-500">Backup artifacts will appear here before any changes are made.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {backups.map((backup) => (
        <div key={backup.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-900">{backup.artifactType}</span>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(backup.createdAt)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-gray-700">Original Path</dt>
              <dd className="text-gray-900 font-mono">{backup.originalPath}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Backup Path</dt>
              <dd className="text-gray-900 font-mono">{backup.filePath}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Size</dt>
              <dd className="text-gray-900">{(backup.size / 1024).toFixed(2)} KB</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Checksum</dt>
              <dd className="text-gray-900 font-mono text-xs">{backup.checksum}</dd>
            </div>
          </div>
          {backup.metadata && Object.keys(backup.metadata).length > 0 && (
            <div className="mt-3">
              <dt className="text-sm font-medium text-gray-700 mb-1">Metadata</dt>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(backup.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Verification Tab Component
function VerificationTab({ verifications }: { verifications: VerificationResult[] }) {
  if (verifications.length === 0) {
    return (
      <div className="text-center py-8">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No verification results</h3>
        <p className="mt-1 text-sm text-gray-500">Verification results will appear here after fixes are applied.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {verifications.map((verification) => (
        <div key={verification.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className={`h-4 w-4 ${
                verification.status === 'PASSED' ? 'text-green-500' : 'text-red-500'
              }`} />
              <span className="text-sm font-medium text-gray-900">{verification.verificationType}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                verification.status === 'PASSED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {verification.status}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(verification.timestamp)}
            </div>
          </div>
          {verification.details && (
            <div>
              <dt className="text-sm font-medium text-gray-700 mb-1">Details</dt>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(verification.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Ticket Tab Component
function TicketTab({ incident }: { incident: Incident }) {
  const ticketPayload = {
    incidentId: incident.id,
    siteId: incident.siteId,
    priority: incident.priority,
    state: incident.state,
    triggerType: incident.triggerType,
    fixAttempts: incident.fixAttempts,
    createdAt: incident.createdAt,
    escalatedAt: incident.escalatedAt,
    escalationReason: incident.escalationReason,
    summary: `Incident ${incident.id.slice(0, 8)} requires manual intervention`,
    description: `WordPress incident of type "${incident.triggerType}" has reached ${incident.fixAttempts} fix attempts and requires escalation.`,
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Escalation Ticket Payload</h3>
        <p className="text-sm text-gray-600 mb-4">
          This payload can be used to create tickets in external systems or for manual handoff to support teams.
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">JSON Payload</h4>
        </div>
        <div className="p-4">
          <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(ticketPayload, null, 2)}
          </pre>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">Human-Readable Summary</h4>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <dt className="text-sm font-medium text-gray-700">Incident ID</dt>
            <dd className="text-sm text-gray-900">{incident.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-700">Current State</dt>
            <dd className="text-sm text-gray-900">{incident.state}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-700">Issue Type</dt>
            <dd className="text-sm text-gray-900">{incident.triggerType}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-700">Priority Level</dt>
            <dd className="text-sm text-gray-900">{incident.priority}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-700">Automated Fix Attempts</dt>
            <dd className="text-sm text-gray-900">{incident.fixAttempts} of {incident.maxFixAttempts}</dd>
          </div>
          {incident.escalationReason && (
            <div>
              <dt className="text-sm font-medium text-gray-700">Escalation Reason</dt>
              <dd className="text-sm text-gray-900">{incident.escalationReason}</dd>
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify(ticketPayload, null, 2))}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Copy JSON Payload
        </button>
        <button
          onClick={() => {
            const summary = `Incident: ${incident.triggerType} (${incident.priority} priority)\nState: ${incident.state}\nFix Attempts: ${incident.fixAttempts}/${incident.maxFixAttempts}\n${incident.escalationReason ? `Reason: ${incident.escalationReason}` : ''}`;
            navigator.clipboard.writeText(summary);
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Copy Summary
        </button>
      </div>
    </div>
  );
}