param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('explore', 'compare', 'dna', 'market', 'optimizer')]
    [string]$Page
)

$ErrorActionPreference = 'Stop'
$repository = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$destinationBase = Split-Path $repository -Parent
$sourceBase = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE '.codex/worktrees'))
$source = [IO.Path]::GetFullPath((Join-Path $sourceBase "page-$Page/aperiron"))
$destination = [IO.Path]::GetFullPath((Join-Path $destinationBase "aperiron-$Page"))
if ((Split-Path $destination -Parent) -ne $destinationBase -or
    (Split-Path (Split-Path $source -Parent) -Parent) -ne $sourceBase) {
    throw 'Resolved source or destination escaped the intended parent folder.'
}
if (-not (Test-Path -LiteralPath $source -PathType Container)) { throw 'Source checkout missing.' }
if (Test-Path -LiteralPath $destination) { throw 'Destination exists; refusing overwrite.' }
$sourceItem = Get-Item -LiteralPath $source
if ($sourceItem.FullName -ne $source) { throw 'Source path did not resolve as expected.' }
$links = @(Get-ChildItem -LiteralPath $source -Recurse -Force -Attributes ReparsePoint)
if ($links.Count) { throw 'Source contains reparse points; review before copying.' }
$baseline = & git -C $source rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'Source is not a readable Git worktree.' }
$beforeStatus = (& git -C $source status --porcelain=v1 --untracked-files=all) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'Cannot read source status.' }

# Copy ignored dependencies and build output too. Do not delete anything yet.
& robocopy $source $destination /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /MT:8 /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -ge 8) { throw 'Copy failed; source retained.' }
$sourceFiles = @(Get-ChildItem -LiteralPath $source -Recurse -Force -File)
$destinationFiles = @(Get-ChildItem -LiteralPath $destination -Recurse -Force -File)
if ($sourceFiles.Count -ne $destinationFiles.Count) { throw 'File counts differ; source retained.' }
Write-Output "COPIED $Page; checking $($sourceFiles.Count) file hashes."
$verifiedFiles = 0
foreach ($file in $sourceFiles) {
    $relative = $file.FullName.Substring($source.Length + 1)
    $copied = Join-Path $destination $relative
    $sourceHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
    $destinationHash = (Get-FileHash -LiteralPath $copied -Algorithm SHA256).Hash
    if ($sourceHash -ne $destinationHash) { throw "Copy hash mismatch: $relative; source retained." }
    $verifiedFiles++
    if ($verifiedFiles % 2000 -eq 0) { Write-Output "VERIFIED $Page $verifiedFiles/$($sourceFiles.Count) files." }
}
& git -C $repository worktree repair $destination
if ($LASTEXITCODE -ne 0) { throw 'Git repair failed; both copies retained.' }
$actualRoot = & git -C $destination rev-parse --show-toplevel
$actualHead = & git -C $destination rev-parse HEAD
$afterStatus = (& git -C $destination status --porcelain=v1 --untracked-files=all) -join "`n"
if ([IO.Path]::GetFullPath($actualRoot) -ne $destination -or
    $actualHead -ne $baseline -or $afterStatus -ne $beforeStatus) {
    throw 'Moved Git root, commit or working changes differ; original retained.'
}

# Delete only the exact old checkout after verifying every copied file and Git state.
$checkedSource = (Get-Item -LiteralPath $source).FullName
$expectedSource = [IO.Path]::GetFullPath((Join-Path $sourceBase "page-$Page/aperiron"))
if ($checkedSource -ne $expectedSource -or
    -not $checkedSource.StartsWith($sourceBase + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Old checkout failed the final deletion path check.'
}
Remove-Item -LiteralPath $checkedSource -Recurse -Force
Write-Output "MOVED $Page; verified $($sourceFiles.Count) file hashes; Git state preserved."
