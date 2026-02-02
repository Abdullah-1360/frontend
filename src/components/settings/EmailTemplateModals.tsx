import React from 'react';
import { XMarkIcon, EyeIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface EmailTemplateModalsProps {
  // Template Editor Modal
  showTemplateEditor: boolean;
  selectedTemplate: any;
  loading: boolean;
  onCloseEditor: () => void;
  onSaveTemplate: (template: any) => void;
  onUpdateTemplate: (template: any) => void;
  onPreviewTemplate: (type: string) => void;
  onTestTemplate: (type: string, email: string) => void;

  // Template Preview Modal
  showPreview: boolean;
  templatePreview: any;
  onClosePreview: () => void;
}

export default function EmailTemplateModals({
  showTemplateEditor,
  selectedTemplate,
  loading,
  onCloseEditor,
  onSaveTemplate,
  onUpdateTemplate,
  onPreviewTemplate,
  onTestTemplate,
  showPreview,
  templatePreview,
  onClosePreview,
}: EmailTemplateModalsProps) {
  const getTemplateDisplayName = (type: string): string => {
    const names: Record<string, string> = {
      'welcome': 'Welcome Email',
      'password_reset_request': 'Password Reset Request',
      'password_reset_confirmation': 'Password Reset Confirmation',
      'password_changed': 'Password Changed',
      'account_locked': 'Account Locked',
      'mfa_enabled': 'MFA Enabled',
      'mfa_disabled': 'MFA Disabled',
      'backup_code_warning': 'Backup Code Warning',
      'role_changed': 'Role Changed',
      'session_revoked': 'Session Revoked',
      'email_verification': 'Email Verification',
      'backup_codes_regenerated': 'Backup Codes Regenerated',
    };
    
    return names[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <>
      {/* Template Editor Modal */}
      {showTemplateEditor && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 w-full max-w-4xl shadow-lg rounded-xl">
            <div className="bg-white rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Edit Template: {getTemplateDisplayName(selectedTemplate.type)}
                  </h3>
                  <button
                    onClick={onCloseEditor}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  onSaveTemplate(selectedTemplate);
                }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={selectedTemplate.subject || ''}
                      onChange={(e) => onUpdateTemplate({
                        ...selectedTemplate,
                        subject: e.target.value
                      })}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Email subject line"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">HTML Template</label>
                    <textarea
                      value={selectedTemplate.htmlTemplate || ''}
                      onChange={(e) => onUpdateTemplate({
                        ...selectedTemplate,
                        htmlTemplate: e.target.value
                      })}
                      rows={10}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="HTML email template with {{variables}}"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plain Text Template</label>
                    <textarea
                      value={selectedTemplate.textTemplate || ''}
                      onChange={(e) => onUpdateTemplate({
                        ...selectedTemplate,
                        textTemplate: e.target.value
                      })}
                      rows={8}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Plain text email template with {{variables}}"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={selectedTemplate.description || ''}
                      onChange={(e) => onUpdateTemplate({
                        ...selectedTemplate,
                        description: e.target.value
                      })}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Template description"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Available Variables</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables?.map((variable: string) => (
                        <span key={variable} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => onPreviewTemplate(selectedTemplate.type)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const testEmail = prompt('Enter test email address:');
                          if (testEmail) {
                            onTestTemplate(selectedTemplate.type, testEmail);
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        Send Test
                      </button>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={onCloseEditor}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Template'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {showPreview && templatePreview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 w-full max-w-4xl shadow-lg rounded-xl">
            <div className="bg-white rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Template Preview</h3>
                  <button
                    onClick={onClosePreview}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Subject</h4>
                    <div className="bg-gray-50 rounded-md p-3 text-sm">
                      {templatePreview.subject}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">HTML Preview</h4>
                    <div className="bg-white border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: templatePreview.html }} />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Plain Text</h4>
                    <div className="bg-gray-50 rounded-md p-3 text-sm font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {templatePreview.text}
                    </div>
                  </div>

                  {templatePreview.sampleData && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Data Used</h4>
                      <div className="bg-gray-50 rounded-md p-3 text-sm font-mono">
                        <pre>{JSON.stringify(templatePreview.sampleData, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={onClosePreview}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}