# Memory Storage Test Script - Debug Version
param([string]$BaseUrl = "http://localhost:5000")

$ErrorActionPreference = "Stop"
Write-Host "Testing Memory Storage Implementation - Debug Mode..." -ForegroundColor Green

$authData = @{
    username = "testuser"
    password = "testpass"
}

$global:webSession = $null

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = $null,
        [hashtable]$Headers = @{"Content-Type" = "application/json"}
    )
    
    $uri = "$BaseUrl$Endpoint"
    $params = @{
        Uri = $uri
        Method = $Method
        Headers = $Headers
    }
    
    if ($global:webSession) {
        $params.WebSession = $global:webSession
    } else {
        $params.SessionVariable = "newSession"
    }
    
    if ($Body) {
        $jsonBody = ($Body | ConvertTo-Json -Depth 10)
        Write-Host "Sending to $Endpoint : $jsonBody" -ForegroundColor Gray
        $params.Body = $jsonBody
    }
    
    try {
        $response = Invoke-RestMethod @params
        if ($params.ContainsKey("SessionVariable")) {
            $global:webSession = Get-Variable -Name "newSession" -ValueOnly
        }
        Write-Host "[SUCCESS] $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Host "Status Code: $statusCode" -ForegroundColor Red
            
            try {
                $responseStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($responseStream)
                $responseBody = $reader.ReadToEnd()
                Write-Host "Response Body: '$responseBody'" -ForegroundColor Red
            } catch {
                Write-Host "Could not read response body" -ForegroundColor Red
            }
        }
        return $null
    }
}

Write-Host "`n=== STEP 1: Server Health Check ===" -ForegroundColor Yellow

# Test basic server connectivity
try {
    $healthResponse = Invoke-WebRequest -Uri "$BaseUrl/" -Method GET -TimeoutSec 10
    Write-Host "[SUCCESS] Server is responding (Status: $($healthResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Server is not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the Flask server is running on $BaseUrl" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== STEP 2: Authentication Test ===" -ForegroundColor Yellow

$registerResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/api/register" -Body $authData
if ($registerResponse -and $registerResponse.success) {
    Write-Host "[SUCCESS] Test user registered successfully" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Test user might already exist, proceeding with login..." -ForegroundColor Yellow
}

$loginResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/api/login" -Body $authData
if ($loginResponse -and $loginResponse.success) {
    Write-Host "[SUCCESS] Login successful" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Login failed - cannot proceed with tests" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== STEP 3: API Endpoint Tests ===" -ForegroundColor Yellow

# Test 1: Check if the /api/generate endpoint exists
Write-Host "`nTesting endpoint availability..." -ForegroundColor Cyan
try {
    $testResponse = Invoke-WebRequest -Uri "$BaseUrl/api/generate" -Method GET -WebSession $global:webSession -ErrorAction SilentlyContinue
    Write-Host "GET /api/generate returned: $($testResponse.StatusCode)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    Write-Host "GET /api/generate returned: $statusCode (expected - should be POST only)" -ForegroundColor Gray
}

# Test 2: Minimal POST request
Write-Host "`nTesting minimal POST request..." -ForegroundColor Cyan
$minimalData = @{
    content = "Test"
}
$response1 = Invoke-ApiRequest -Method "POST" -Endpoint "/api/generate" -Body $minimalData

# Test 3: Complete data structure
Write-Host "`nTesting complete data structure..." -ForegroundColor Cyan
$completeData = @{
    content = "Complete Test Data"
    size_px = "256"
    error_correction = "M"
    fg_color = "#000000"
    bg_color = "#FFFFFF"
    box_size = "10"
    margin = "4"
    rounded = "0.0"
}
$response2 = Invoke-ApiRequest -Method "POST" -Endpoint "/api/generate" -Body $completeData

# Test 4: Try the old /generate endpoint (non-API)
Write-Host "`nTesting legacy /generate endpoint..." -ForegroundColor Cyan
try {
    $legacyResponse = Invoke-WebRequest -Uri "$BaseUrl/generate" -Method POST -WebSession $global:webSession -Body ($completeData | ConvertTo-Json) -ContentType "application/json" -ErrorAction SilentlyContinue
    Write-Host "[SUCCESS] Legacy endpoint works: $($legacyResponse.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    Write-Host "[ERROR] Legacy endpoint failed: $statusCode" -ForegroundColor Red
}

Write-Host "`n=== STEP 4: User History Test ===" -ForegroundColor Yellow

$historyResponse = Invoke-ApiRequest -Method "GET" -Endpoint "/api/qr/user"
if ($historyResponse -and $historyResponse.success) {
    Write-Host "[SUCCESS] User history endpoint works" -ForegroundColor Green
    Write-Host "QR codes in history: $($historyResponse.qrs.Count)" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] User history endpoint failed" -ForegroundColor Red
}

Write-Host "`n=== STEP 5: Route Debugging ===" -ForegroundColor Yellow

# Test various endpoints to see what's available
$testEndpoints = @(
    "/api/generate",
    "/generate", 
    "/api/qr/user",
    "/api/dashboard"
)

foreach ($endpoint in $testEndpoints) {
    try {
        $testResp = Invoke-WebRequest -Uri "$BaseUrl$endpoint" -Method GET -WebSession $global:webSession -ErrorAction SilentlyContinue
        Write-Host "[SUCCESS] $endpoint (GET): $($testResp.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode
        if ($statusCode -eq 405) {
            Write-Host "[WARNING] $endpoint (GET): Method Not Allowed - endpoint exists but requires POST" -ForegroundColor Yellow
        } else {
            Write-Host "[ERROR] $endpoint (GET): $statusCode" -ForegroundColor Red
        }
    }
}

Write-Host "`n" + "="*80 -ForegroundColor Cyan
Write-Host "DEBUG SUMMARY" -ForegroundColor Cyan
Write-Host "="*80 -ForegroundColor Cyan

$results = @{
    "Server Health" = $healthResponse.StatusCode -eq 200
    "Authentication" = $loginResponse -and $loginResponse.success
    "User History API" = $historyResponse -and $historyResponse.success
    "QR Generation API" = $response1 -or $response2
}

foreach ($test in $results.GetEnumerator()) {
    $status = if ($test.Value) { "[PASS]" } else { "[FAIL]" }
    Write-Host "$($test.Key): $status" -ForegroundColor $(if ($test.Value) { "Green" } else { "Red" })
}

if (-not ($response1 -or $response2)) {
    Write-Host "`n[DIAGNOSIS]:" -ForegroundColor Yellow
    Write-Host "- Server is running and responding" -ForegroundColor White
    Write-Host "- Authentication works correctly" -ForegroundColor White
    Write-Host "- User history API works correctly" -ForegroundColor White
    Write-Host "- QR Generation API is failing with 400 Bad Request" -ForegroundColor White
    Write-Host "`n[POSSIBLE CAUSES]:" -ForegroundColor Yellow
    Write-Host "1. Missing required fields in the request" -ForegroundColor White
    Write-Host "2. Data validation failing in _extract_form_payload" -ForegroundColor White
    Write-Host "3. CSRF token issues (though endpoint is @csrf.exempt)" -ForegroundColor White
    Write-Host "4. Rate limiting (though unlikely with test data)" -ForegroundColor White
    Write-Host "`n[NEXT STEPS]:" -ForegroundColor Yellow
    Write-Host "1. Check Flask server logs for detailed error messages" -ForegroundColor White
    Write-Host "2. Verify the _extract_form_payload function in routes.py" -ForegroundColor White
    Write-Host "3. Test with curl or Postman to isolate PowerShell issues" -ForegroundColor White
}

Write-Host "`nDebug testing completed." -ForegroundColor Cyan
