import { addDays, differenceInDays, parseISO, startOfDay } from "date-fns";

export interface CPMTask {
  id: string;
  name: string;
  duration: number;
  dependencies: string[];
  startDate?: string;
  endDate?: string;
  type?: string; // added type to distinguish phases
}

export interface CPMResult {
  taskId: string;
  es: number; // Earliest Start
  ef: number; // Earliest Finish
  ls: number; // Latest Start
  lf: number; // Latest Finish
  slack: number;
  isCritical: boolean;
  calculatedStartDate: Date;
  calculatedEndDate: Date;
}

export const calculateCPM = (
  tasks: CPMTask[], 
  projectStartDate: Date
): { 
  taskResults: Record<string, CPMResult>, 
  projectDuration: number,
  criticalPathIds: string[] 
} => {
  const results: Record<string, Partial<CPMResult>> = {};
  
  // 1. Initialization
  tasks.forEach(t => {
    results[t.id] = { es: 0, ef: 0, ls: 0, lf: 0, slack: 0 };
  });

  // 2. Forward Pass (ES & EF)
  // We iterate enough times to propagate dependencies (Project network size + 1)
  let hasChanged = true;
  let iterations = 0;
  const maxIterations = tasks.length + 5; // Safety break

  while (hasChanged && iterations < maxIterations) {
    hasChanged = false;
    iterations++;

    tasks.forEach((task) => {
      let maxPrevEF = 0;

      // Find max Early Finish of predecessors
      task.dependencies.forEach((depId) => {
        if (results[depId] && results[depId].ef !== undefined) {
          if (results[depId].ef! > maxPrevEF) {
            maxPrevEF = results[depId].ef!;
          }
        }
      });

      const newES = maxPrevEF;
      const duration = task.duration || 1;
      const newEF = newES + duration;

      if (results[task.id]!.es !== newES || results[task.id]!.ef !== newEF) {
        results[task.id]!.es = newES;
        results[task.id]!.ef = newEF;
        hasChanged = true;
      }
    });
  }

  // 3. Determine Project Duration (Max EF of entire network)
  const projectDuration = Math.max(...Object.values(results).map((r) => r.ef || 0));

  // 4. Backward Pass (LS & LF)
  // Initialize LF to Project Duration for everyone initially
  tasks.forEach(t => {
    results[t.id]!.lf = projectDuration;
    results[t.id]!.ls = projectDuration - (t.duration || 1);
  });

  hasChanged = true;
  iterations = 0;

  while (hasChanged && iterations < maxIterations) {
    hasChanged = false;
    iterations++;

    tasks.forEach((task) => {
      // Find successors (tasks that depend on this task)
      const successors = tasks.filter(t => t.dependencies.includes(task.id));
      
      if (successors.length > 0) {
        let minSuccessorLS = Infinity;
        
        successors.forEach(succ => {
          if (results[succ.id] && results[succ.id].ls !== undefined) {
             if (results[succ.id].ls! < minSuccessorLS) {
               minSuccessorLS = results[succ.id].ls!;
             }
          }
        });
        
        // If we found valid successors
        if (minSuccessorLS !== Infinity) {
          const newLF = minSuccessorLS;
          const newLS = newLF - (task.duration || 1);

          if (results[task.id]!.lf !== newLF || results[task.id]!.ls !== newLS) {
            results[task.id]!.lf = newLF;
            results[task.id]!.ls = newLS;
            hasChanged = true;
          }
        }
      }
    });
  }

  // 5. Final Calculation (Dates & Critical Path)
  const criticalPathIds: string[] = [];
  const finalResults: Record<string, CPMResult> = {};

  tasks.forEach(task => {
    const r = results[task.id]!;
    const slack = (r.ls || 0) - (r.es || 0);
    
    // Critical if slack is effectively 0
    const isCritical = slack <= 0.001; 

    if (isCritical) criticalPathIds.push(task.id);

    finalResults[task.id] = {
      taskId: task.id,
      es: r.es!,
      ef: r.ef!,
      ls: r.ls!,
      lf: r.lf!,
      slack,
      isCritical,
      calculatedStartDate: addDays(projectStartDate, r.es!),
      calculatedEndDate: addDays(projectStartDate, r.ef!)
    };
  });

  return {
    taskResults: finalResults,
    projectDuration,
    criticalPathIds
  };
};