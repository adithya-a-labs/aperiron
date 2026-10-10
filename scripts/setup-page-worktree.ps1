param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('explore', 'compare', 'dna', 'market', 'optimizer')]
    [string]$Page
)

$ErrorActionPreference = 'Stop'
$assignments = @{
    explore = @{ Port = 5174; Scope = 'src/pages/explore/; src/components/WorldMap.tsx and WorldMap.css; src/components/DestinationPanel.tsx and DestinationPanel.css'; Goal = 'Passport map, destination search, country requirements and traveller context.' }
    compare = @{ Port = 5175; Scope = 'src/pages/compare/'; Goal = 'Two-passport selection, shared and unique access, entry-category differences and modeled scores.' }
    dna = @{ Port = 5176; Scope = 'src/pages/dna/'; Goal = 'Deterministic access-pattern rendering and same-passport baseline/simulation comparison.' }
    market = @{ Port = 5177; Scope = 'src/pages/market/'; Goal = 'Treaty cards, purchase validation, remaining credits, impact and reset.' }
    optimizer = @{ Port = 5178; Scope = 'src/pages/optimizer/'; Goal = 'Budget-bounded recommendations, projected impact, explicit purchase and algorithm limits.' }
}
$assignment = $assignments[$Page]
$repository = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$checkout = Join-Path (Split-Path $repository -Parent) "aperiron-$Page"
$actualRoot = & git -C $checkout rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($actualRoot) -ne [IO.Path]::GetFullPath($checkout)) {
    throw "Expected registered aperiron-$Page checkout is missing or has the wrong root."
}
$port = $assignment.Port
$previewPort = $port + 1000
$configPath = Join-Path $checkout 'vite.config.ts'
$config = [IO.File]::ReadAllText($configPath)
$originalServer = 'server: { port: 5173, strictPort: true },'
$assignedServer = "server: { port: $port, strictPort: true },"
if ($config.Contains($originalServer)) {
    $config = $config.Replace($originalServer, "$assignedServer`n  preview: { port: $previewPort, strictPort: true },")
    [IO.File]::WriteAllText($configPath, $config)
} elseif (-not $config.Contains($assignedServer)) {
    throw 'Vite configuration changed; review it rather than overwriting it.'
}
$guide = @"
# $Page worktree

- Developer identity: dev-adithyaa (frontend).
- Checkout: detached HEAD at the common setup baseline; this is a Git worktree, not a separate repository.
- Development port: $port. Start with npm.cmd run dev.
- Preview port: $previewPort. Start with npm.cmd run build, then npm.cmd run preview.
- Both ports are strict: an occupied port causes an error; do not switch another page's port or stop an unrelated process.
- Run each command from this checkout. Each checkout has its own node_modules and dist.

## Assignment

$($assignment.Goal)

Allowed page files: $($assignment.Scope)

The page directories are planned ownership boundaries, not implemented screens.
The current preview still runs the common application until page code is added.

## Shared boundaries

Read AGENTS.md, docs/PRODUCT.md, docs/FRONTEND.md, docs/PARALLEL_FRONTEND.md,
docs/COLOUR_PALETTE.md and the developer state records before implementation.
Use src/shared/contracts.ts and src/shared/engineApi.ts as executable contract authority;
some prose predates their addition. The existing explorer still uses the provisional
frontend adapter. Report integration needs rather than replacing shared seams.
The coordinator owns App.tsx, global styles, shared UI primitives, store, adapters,
dependencies, lockfile and engine integration. Do not silently edit these from a
page task. Page styles must be scoped. Engine/data work belongs to dev-prabhu.

Use the user's playful illustrated reference: rounded controls, clear minimal text,
warm surfaces, palette accents and accessible interaction. Treat generated maps,
sample numbers and labels as illustrative; docs and contracts define behavior.
Never invent regulation facts or hide unknown coverage. Keep real requirements
separate from simulation. Preserve keyboard focus and reduced-motion behavior.

## Handoff

Run npm.cmd run check and the documentation checker. Inspect desktop/mobile and
keyboard behavior for changed UI. Add a unique dev-adithyaa run entry and update
only your worktree's own developer state. Preserve other developer records.
Return the diff and verification results to the coordinator. Commit/push only
under user authorization. These workspace-specific files (WORKTREE.md, the local
AGENTS.md addition and Vite port override) must not replace coordinator config
when integrating page changes. Keep the worktree until its work is preserved.
"@
[IO.File]::WriteAllText((Join-Path $checkout 'WORKTREE.md'), $guide)
$agentsPath = Join-Path $checkout 'AGENTS.md'
$agents = [IO.File]::ReadAllText($agentsPath)
if (-not $agents.Contains('## Local page worktree assignment')) {
    $agents += "`n`n## Local page worktree assignment`n`nRead [WORKTREE.md](WORKTREE.md) before working in this checkout. It defines this`npage's file ownership, assigned ports and integration boundaries.`n"
    [IO.File]::WriteAllText($agentsPath, $agents)
}
Push-Location $checkout
try {
    & npm.cmd ci --fetch-retries=0 --fetch-timeout=30000
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed for $Page" }
    Write-Output "READY: $Page; development $port; preview $previewPort"
} finally {
    Pop-Location
}
