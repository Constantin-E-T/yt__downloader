import { SUMMARY_OPTIONS } from "./constants";

export type SummaryType = (typeof SUMMARY_OPTIONS)[number]["value"];
export type AITab = "summary" | "extract" | "qa";
