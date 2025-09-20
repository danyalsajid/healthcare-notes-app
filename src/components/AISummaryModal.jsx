import { createSignal, Show, createEffect } from 'solid-js';
import Modal from './Modal';

function AISummaryModal(props) {
  const [summary, setSummary] = createSignal('');
  const [isGenerating, setIsGenerating] = createSignal(false);
  const [error, setError] = createSignal('');

  const generateSummary = async () => {
    if (!props.notes || props.notes.length === 0) {
      setError('No notes available to summarize');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSummary('');

    try {
      // Call the AI summary function from props
      const result = await props.onGenerateSummary(props.notes);
      setSummary(result);
    } catch (err) {
      console.error('Failed to generate AI summary:', err);
      setError(err.message || 'Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate summary when modal opens
  createEffect(() => {
    if (props.isOpen && props.notes && props.notes.length > 0) {
      generateSummary();
    }
  });

  const handleClose = () => {
    setSummary('');
    setError('');
    setIsGenerating(false);
    props.onClose();
  };

  const getItemTypeLabel = (type) => {
    const labels = {
      organisation: 'Organization',
      team: 'Team',
      client: 'Client',
      episode: 'Episode'
    };
    return labels[type] || type;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary());
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="AI Summary"
      size="lg"
    >
      <div class="modal-body">
        <div class="text-center mb-4">
          <i class="fas fa-robot" style="font-size: 2.5rem; color: #1e40af; margin-bottom: 1rem;"></i>
          <h4 class="mb-2">AI-Generated Summary</h4>
          <p class="text-muted small mb-0">
            <i class="fas fa-info-circle me-2"></i>
            Summary of {props.notes?.length || 0} note{props.notes?.length !== 1 ? 's' : ''} for {getItemTypeLabel(props.itemType)} "{props.itemName}"
          </p>
        </div>

        <Show when={isGenerating()}>
          <div class="text-center py-5">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <div class="text-muted">
              <i class="fas fa-magic me-2"></i>
              Analyzing notes and generating summary...
            </div>
          </div>
        </Show>

        <Show when={error()}>
          <div class="alert alert-danger d-flex align-items-center">
            <i class="fas fa-exclamation-triangle me-3"></i>
            <div>
              <strong>Error:</strong> {error()}
            </div>
          </div>
          <div class="text-center">
            <button class="btn btn-primary" onClick={generateSummary}>
              <i class="fas fa-redo me-2"></i>
              Try Again
            </button>
          </div>
        </Show>

        <Show when={summary() && !isGenerating()}>
          <div class="card border-primary">
            <div class="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center" >
              <div class="d-flex align-items-center">
                <i class="fas fa-sparkles text-primary me-2"></i>
                <span class="fw-medium text-primary">AI Summary</span>
              </div>
              <div class="d-flex gap-2">
                <button 
                  class="btn btn-outline-primary btn-sm"
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
                >
                  <i class="fas fa-copy"></i>
                </button>
                <button 
                  class="btn btn-outline-primary btn-sm"
                  onClick={generateSummary}
                  title="Regenerate summary"
                >
                  <i class="fas fa-redo"></i>
                </button>
              </div>
            </div>
            <div class="card-body">
              <div class="summary-content" style="white-space: pre-wrap; line-height: 1.6;">
                {summary()}
              </div>
            </div>
          </div>
        </Show>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onClick={handleClose}>
          <i class="fas fa-times me-2"></i>
          Close
        </button>
      </div>
    </Modal>
  );
}

export default AISummaryModal;
