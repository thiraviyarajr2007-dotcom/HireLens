import crypto from 'crypto';

class RunManager {
  constructor() {
    this.runs = new Map();
  }

  createRun(customId = null) {
    const runId = customId || `run_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const run = {
      runId,
      status: 'QUEUED',
      currentStage: null,
      stages: [],
      error: null,
      result: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clients: []
    };
    this.runs.set(runId, run);
    return run;
  }

  getRun(runId) {
    return this.runs.get(runId) || null;
  }

  emitStage(runId, stageName, meta = {}) {
    const run = this.runs.get(runId);
    if (!run) return;

    const stageEntry = {
      stage: stageName,
      timestamp: new Date().toISOString(),
      ...meta
    };

    run.status = 'PROCESSING';
    run.currentStage = stageName;
    run.stages.push(stageEntry);
    run.updatedAt = new Date().toISOString();

    // Broadcast to SSE listeners
    const payload = `event: stage\ndata: ${JSON.stringify(stageEntry)}\n\n`;
    run.clients.forEach(res => {
      try {
        res.write(payload);
      } catch (e) {
        // Client disconnected
      }
    });
  }

  completeRun(runId, result) {
    const run = this.runs.get(runId);
    if (!run) return;

    run.status = 'DONE';
    run.result = result;
    run.updatedAt = new Date().toISOString();

    const payload = `event: complete\ndata: ${JSON.stringify({ status: 'DONE', result })}\n\n`;
    run.clients.forEach(res => {
      try {
        res.write(payload);
        res.end();
      } catch (e) {}
    });
    run.clients = [];
  }

  failRun(runId, error) {
    const run = this.runs.get(runId);
    if (!run) return;

    const errMsg = typeof error === 'string' ? error : (error.message || 'Execution error');
    run.status = 'FAILED';
    run.error = errMsg;
    run.updatedAt = new Date().toISOString();

    const payload = `event: error\ndata: ${JSON.stringify({ status: 'FAILED', error: errMsg })}\n\n`;
    run.clients.forEach(res => {
      try {
        res.write(payload);
        res.end();
      } catch (e) {}
    });
    run.clients = [];
  }

  addSseClient(runId, res) {
    let run = this.runs.get(runId);
    if (!run) {
      run = this.createRun(runId);
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.flushHeaders?.();

    // Send initial snapshot
    res.write(`event: init\ndata: ${JSON.stringify({ runId, status: run.status, stages: run.stages })}\n\n`);

    if (run.status === 'DONE') {
      res.write(`event: complete\ndata: ${JSON.stringify({ status: 'DONE', result: run.result })}\n\n`);
      res.end();
      return;
    }

    if (run.status === 'FAILED') {
      res.write(`event: error\ndata: ${JSON.stringify({ status: 'FAILED', error: run.error })}\n\n`);
      res.end();
      return;
    }

    run.clients.push(res);
  }
}

export const runManager = new RunManager();
