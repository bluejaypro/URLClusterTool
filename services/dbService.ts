
import { ArchitectureRun } from "../types";

const STORAGE_KEY = 'seo_architecture_runs';

export const dbService = {
  async saveRun(run: ArchitectureRun): Promise<void> {
    const runs = await this.getAllRuns();
    const updated = [run, ...runs];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  async getAllRuns(): Promise<ArchitectureRun[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  async getRunById(id: string): Promise<ArchitectureRun | undefined> {
    const runs = await this.getAllRuns();
    return runs.find(r => r.id === id);
  }
};
