import type { DemoCategoryNode, DemoCourseWithFolder } from "./categories-wireframe/demo-category-data";
import {
  collectAllDemoCoursesWithFolders,
  findCategoryInNodes,
  getCategoryBreadcrumbInNodes
} from "./categories-wireframe/demo-category-data";

export function applyWireframeFolderOverride(
  row: DemoCourseWithFolder,
  folderAssignments: Record<string, string>,
  categoryRoots: readonly DemoCategoryNode[]
): DemoCourseWithFolder {
  const override = folderAssignments[row.id];
  if (!override) {
    return row;
  }
  const cat = findCategoryInNodes(categoryRoots, override);
  if (!cat) {
    return row;
  }
  const path = getCategoryBreadcrumbInNodes(categoryRoots, override)
    .map((n) => n.name)
    .join(" / ");
  return {
    ...row,
    folderId: override,
    folderPath: path,
    folderVisibility: cat.visibility
  };
}

export function resolveWireframeCourseRows(
  folderAssignments: Record<string, string>,
  statusAssignments: Record<string, DemoCourseWithFolder["visibility"]>,
  mergedCategoryRoots: readonly DemoCategoryNode[]
): DemoCourseWithFolder[] {
  const baseRows = collectAllDemoCoursesWithFolders();
  return baseRows.map((r) => {
    const withFolder = applyWireframeFolderOverride(r, folderAssignments, mergedCategoryRoots);
    const st = statusAssignments[r.id];
    return st ? { ...withFolder, visibility: st } : withFolder;
  });
}
