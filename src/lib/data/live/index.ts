import { DataSourceContract } from "../types";
import { mockDataSource } from "../mock";

// Live implementation stub — will call real API/DB once backend is ready
export const liveDataSource: DataSourceContract = {
  ...mockDataSource, // fallback to mock for now
};
