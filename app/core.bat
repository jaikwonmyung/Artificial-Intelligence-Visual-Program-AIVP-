<# :
@echo off
setlocal
cd /d "%~dp0"
echo ---------------------------------------------------
echo   GENTLE MONSTER SPATIAL AI ENGINE (WINDOWS)
echo ---------------------------------------------------
echo   Starting local server...
echo.

:: Check if PowerShell is available
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: PowerShell is required but not found.
    pause
    exit /b
)

:: Run the PowerShell portion of this script
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression ([System.IO.File]::ReadAllText('%~f0'))"
goto :EOF
#>

# PowerShell Script Starts Here
$port = 3030
$url = "http://localhost:$port/"
$root = Get-Location

# 1. Clean up any process on the port
$port = 3030
Write-Host "Ensuring clean start on port $port..." -ForegroundColor Cyan

# Find any process listening on the port and kill it
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        try {
            $procId = $conn.OwningProcess
            # Don't kill system idle process (0) or similar
            if ($procId -gt 100) {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-Host "Stopped stale process (PID: $procId)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "Could not stop process on port $port. Access denied?" -ForegroundColor Red
        }
    }
    # Wait a moment for release
    Start-Sleep -Seconds 1
}

# Start HTTP Listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
try {
    $listener.Start()
} catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    Exit
}

Write-Host "Server started at $url" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop."

# Open Browser
Start-Sleep -Seconds 1
Start-Process $url

# MIME Types
$mimeTypes = @{
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".otf"  = "font/otf"
    ".ttf"  = "font/ttf"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
}

# Server Loop
while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $path = $request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    
    $localPath = Join-Path $root $path.TrimStart('/')
    
    if (Test-Path $localPath -PathType Leaf) {
        $extension = [System.IO.Path]::GetExtension($localPath).ToLower()
        $contentType = $mimeTypes[$extension]
        if (-not $contentType) { $contentType = "application/octet-stream" }
        
        $response.ContentType = $contentType
        $buffer = [System.IO.File]::ReadAllBytes($localPath)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.StatusCode = 200
    } else {
        $response.StatusCode = 404
    }
    
    $response.Close()
}
