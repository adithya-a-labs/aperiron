# Read-only local link and project skill metadata checks; no network required.
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$failures = [System.Collections.Generic.List[string]]::new()
$markdownFiles = @()
foreach ($relativePath in @('README.md', 'AGENTS.md')) {
    $absolutePath = Join-Path $repoRoot $relativePath
    if (Test-Path -LiteralPath $absolutePath -PathType Leaf) {
        $markdownFiles += Get-Item -LiteralPath $absolutePath
    } else { $failures.Add("Missing root document: $relativePath") }
}
foreach ($relativeDirectory in @('docs', '.agents/skills')) {
    $absoluteDirectory = Join-Path $repoRoot $relativeDirectory
    if (Test-Path -LiteralPath $absoluteDirectory -PathType Container) {
        $markdownFiles += Get-ChildItem -LiteralPath $absoluteDirectory -Recurse -File -Filter '*.md'
    } else { $failures.Add("Missing directory: $relativeDirectory") }
}
foreach ($markdownFile in $markdownFiles) {
    $content = [System.IO.File]::ReadAllText($markdownFile.FullName)
    # Current documents use inline links. Ignore fenced examples, URLs and anchors.
    $linkContent = [regex]::Replace($content, '(?ms)^```[^\r\n]*\r?\n.*?^```[^\r\n]*$', '')
    foreach ($match in [regex]::Matches($linkContent, '\]\(([^)]+)\)')) {
        $target = $match.Groups[1].Value.Trim()
        if ($target -match '^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|#)') { continue }
        $target = ($target -split '#', 2)[0].Trim('<', '>')
        $target = [System.Uri]::UnescapeDataString($target)
        if (-not $target) { continue }
        if (-not (Test-Path -LiteralPath (Join-Path $markdownFile.DirectoryName $target))) {
            $failures.Add("Broken local link in $($markdownFile.FullName): $target")
        }
    }
}
$expectedSkills = @(
    'aperiron-context', 'aperiron-contract-check', 'aperiron-data-review',
    'aperiron-verify', 'aperiron-doc-sync', 'aperiron-handoff'
)
foreach ($skillName in $expectedSkills) {
    $skillPath = Join-Path $repoRoot ".agents/skills/$skillName/SKILL.md"
    if (-not (Test-Path -LiteralPath $skillPath -PathType Leaf)) {
        $failures.Add("Missing skill: $skillName")
        continue
    }
    $skillContent = [System.IO.File]::ReadAllText($skillPath)
    $frontmatter = [regex]::Match($skillContent, '\A---\r?\n(?<body>.*?)\r?\n---(?:\r?\n|$)', 'Singleline')
    if (-not $frontmatter.Success) {
        $failures.Add("Missing skill frontmatter: $skillName")
        continue
    }
    $body = $frontmatter.Groups['body'].Value
    $nameMatch = [regex]::Match($body, '(?m)^name: ([a-z0-9]+(?:-[a-z0-9]+)*)\r?$')
    $descriptionMatch = [regex]::Match($body, '(?m)^description: (\S[^\r\n]*)\r?$')
    if (-not $nameMatch.Success -or $nameMatch.Groups[1].Value -ne $skillName) {
        $failures.Add("Skill name does not match directory: $skillName")
    }
    if (-not $descriptionMatch.Success -or $descriptionMatch.Groups[1].Value.Length -gt 1024) {
        $failures.Add("Missing or oversized skill description: $skillName")
    }
}
if ($failures.Count -gt 0) {
    foreach ($failure in $failures) { [Console]::Error.WriteLine($failure) }
    exit 1
}
Write-Output "Verified $($markdownFiles.Count) Markdown files and $($expectedSkills.Count) project skills."
