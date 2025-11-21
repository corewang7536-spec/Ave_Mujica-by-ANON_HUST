$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://127.0.0.1:8080/')
$listener.Start()
Write-Host 'Server started at http://127.0.0.1:8080/'
while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $localPath = $request.Url.LocalPath
    if ($localPath -eq '/') { $localPath = '/index.html' }
    $filePath = Join-Path (Get-Location) $localPath.TrimStart('/')
    if (Test-Path $filePath -PathType Leaf) {
        $content = Get-Content $filePath -Raw -Encoding UTF8
        $ext = [IO.Path]::GetExtension($filePath)
        $contentType = switch ($ext) {
            '.html' { 'text/html; charset=utf-8' }
            '.css' { 'text/css' }
            '.js' { 'application/javascript' }
            '.png' { 'image/png' }
            '.jpg' { 'image/jpeg' }
            '.jpeg' { 'image/jpeg' }
            '.gif' { 'image/gif' }
            '.mp3' { 'audio/mpeg' }
            default { 'application/octet-stream' }
        }
        $response.ContentType = $contentType
        $response.OutputStream.Write([System.Text.Encoding]::UTF8.GetBytes($content), 0, [System.Text.Encoding]::UTF8.GetBytes($content).Length)
    } else {
        $response.StatusCode = 404
        $response.OutputStream.Write([System.Text.Encoding]::UTF8.GetBytes('404 Not Found'), 0, 9)
    }
    $response.OutputStream.Close()
}