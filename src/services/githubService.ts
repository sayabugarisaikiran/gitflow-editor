import { Octokit } from 'octokit';
import { Commit, ScenarioState } from '../engine/types';

// Initialize octokit without auth for public endpoints (has rate limit of 60/hr)
const octokit = new Octokit();

export async function fetchRepoCommits(owner: string, repo: string, limit = 50): Promise<ScenarioState> {
    try {
        // Fetch the repository to get the default branch
        const repoData = await octokit.rest.repos.get({
            owner,
            repo,
        });

        const defaultBranch = repoData.data.default_branch;

        // Fetch commits
        const commitData = await octokit.rest.repos.listCommits({
            owner,
            repo,
            per_page: limit,
        });

        const commits: Commit[] = commitData.data.map((githubCommit) => ({
            hash: githubCommit.sha,
            message: githubCommit.commit.message,
            parentHashes: githubCommit.parents.map((p) => p.sha),
            timestamp: new Date(githubCommit.commit.author?.date || Date.now()).getTime(),
            branch: defaultBranch, // Assign all to default branch for simplicity of visualization
        }));

        // Reverse to have oldest first (if needed by UI render, though our engine handles timestamp sorting)
        commits.reverse();

        const latestHash = commits.length > 0 ? commits[commits.length - 1].hash : '';

        const scenario: ScenarioState = {
            id: `github-${owner}-${repo}`,
            name: `${owner}/${repo}`,
            commits,
            branches: {
                [defaultBranch]: latestHash,
            },
            tags: {},
            HEAD: latestHash,
            currentBranch: defaultBranch,
            files: [], // We are purely loading the network graph, no working directory mock yet
        };

        return scenario;
    } catch (error: any) {
        console.error('Failed to fetch from GitHub:', error);
        throw new Error(error.message || 'Failed to load GitHub repository.');
    }
}
