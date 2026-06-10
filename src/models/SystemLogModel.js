import { mockSystemLogs } from '../mockData';

const STORAGE_KEY = 'dermasmart_system_logs';

export const SystemLogModel = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSystemLogs));
    }
  },

  getAll() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return mockSystemLogs;
    }
  },

  save(logs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('system-logs-updated'));
  },

  addLog(actor, action, target, details, severity = 'Info') {
    this.init();
    const logs = this.getAll();
    const newLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      target,
      details,
      severity,
    };
    logs.unshift(newLog);
    this.save(logs);
    return newLog;
  }
};
