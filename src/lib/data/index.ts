import { mockDataSource } from "./mock";
import { liveDataSource } from "./live";
import { DataSourceContract } from "./types";

export const dataSource: DataSourceContract =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "live"
    ? liveDataSource
    : mockDataSource;

export * from "./types";
