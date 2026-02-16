/**
 * Steps Provider Interface (MVP: manual + CSV import)
 *
 * Phase 2: Add Apple Health and Google Fit implementations.
 */

export interface StepsData {
  date: string; // ISO date
  count: number;
  source: string;
}

export interface StepsProvider {
  name: string;
  importSteps(userId: string, data: unknown): Promise<StepsData[]>;
}

/**
 * Manual steps entry — user types in their step count.
 */
export class ManualStepsProvider implements StepsProvider {
  name = "manual";

  async importSteps(
    _userId: string,
    data: unknown
  ): Promise<StepsData[]> {
    const entry = data as { date: string; count: number };
    return [
      {
        date: entry.date,
        count: entry.count,
        source: "manual",
      },
    ];
  }
}

/**
 * CSV import — parse rows of date,count.
 */
export class CsvStepsProvider implements StepsProvider {
  name = "csv_import";

  async importSteps(
    _userId: string,
    data: unknown
  ): Promise<StepsData[]> {
    const csvText = data as string;
    const lines = csvText.trim().split("\n");
    const results: StepsData[] = [];

    for (const line of lines) {
      const [date, countStr] = line.split(",").map((s) => s.trim());
      const count = parseInt(countStr, 10);
      if (date && !isNaN(count) && count > 0) {
        results.push({ date, count, source: "csv_import" });
      }
    }

    return results;
  }
}

/**
 * Stub for Apple Health — Phase 2 implementation.
 */
export class AppleHealthStepsProvider implements StepsProvider {
  name = "apple_health";

  async importSteps(
    _userId: string,
    _data: unknown
  ): Promise<StepsData[]> {
    throw new Error(
      "Apple Health integration not yet implemented. Coming in Phase 2."
    );
  }
}

/**
 * Stub for Google Fit — Phase 2 implementation.
 */
export class GoogleFitStepsProvider implements StepsProvider {
  name = "google_fit";

  async importSteps(
    _userId: string,
    _data: unknown
  ): Promise<StepsData[]> {
    throw new Error(
      "Google Fit integration not yet implemented. Coming in Phase 2."
    );
  }
}

// Registry of available providers
export const stepsProviders: Record<string, StepsProvider> = {
  manual: new ManualStepsProvider(),
  csv_import: new CsvStepsProvider(),
  apple_health: new AppleHealthStepsProvider(),
  google_fit: new GoogleFitStepsProvider(),
};
