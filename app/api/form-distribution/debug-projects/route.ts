import { NextResponse } from "next/server";
import { getFormDistributionCollection } from "@/server/form-distribution/form-distribution";
import { getUsersCollection } from "@/server/auth/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rulesCollection = await getFormDistributionCollection();
    const usersCollection = await getUsersCollection();
    
    const allRules = await rulesCollection.find().toArray();
    const coordinators = await usersCollection.find({ role: 'coordinator', status: 'active' }).toArray();
    
    const ruleProjects = [...new Set(allRules.flatMap(r => r.projects))];
    const coordinatorProjects = [...new Set(coordinators.map(u => u.project).filter(Boolean))];
    
    const ruleMatches = allRules.map(r => {
      const matches = coordinators.filter(u => {
        const normUserProject = (u.project || '').toLowerCase().trim();
        return r.projects.some(p => {
          const normRuleProject = p.toLowerCase().trim();
          return normRuleProject === normUserProject;
        });
      });
      return {
        ruleName: r.name,
        ruleProjects: r.projects,
        ruleProjectsNormalized: r.projects.map(p => p.toLowerCase().trim()),
        matchingCoordinators: matches.map(u => ({
          username: u.username,
          project: u.project,
          projectNormalized: (u.project || '').toLowerCase().trim()
        }))
      };
    });
    
    return NextResponse.json({
      ruleProjects,
      coordinatorProjects,
      rules: ruleMatches
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ message: `Debug failed: ${message}` }, { status: 500 });
  }
}
