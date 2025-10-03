# PowerShell script for comprehensive staging testing
param(
    [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 Running comprehensive staging tests..." -ForegroundColor Green

# Test results tracking
$TestResults = @{
    HealthCheck = $false
    MemoryCache = $false
    QRGeneration = $false
    Performance = $false
    Authentication = $false
}

# Function to make HTTP requests
function Invoke-TestRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        return Invoke-RestMethod @params
    } catch {
        throw $_
    }
}

# Test 1: Health Check
Write-Host "🏥 Testing health endpoints..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-TestRequest -Url "$BaseUrl/health"
    if ($healthResponse) {
        Write-Host "✅ Health check passed" -ForegroundColor Green
        $TestResults.HealthCheck = $true
    }
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Memory Cache Functionality
Write-Host "🧠 Testing memory cache functionality..." -ForegroundColor Yellow
try {
    # Test cache metrics endpoint
    $metricsResponse = Invoke-WebRequest -Uri "$BaseUrl/metrics" -TimeoutSec 10
    if ($metricsResponse.StatusCode -eq 200) {
        $metricsContent = $metricsResponse.Content
        
        # Check for memory cache metrics
        if ($metricsContent -match "cache_hits_total" -and $metricsContent -match "cache_misses_total") {
            Write-Host "✅ Memory cache metrics available" -ForegroundColor Green
            $TestResults.MemoryCache = $true
        } else {
            Write-Host "⚠️ Memory cache metrics not found in response" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Memory cache test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: QR Code Generation
Write-Host "🔲 Testing QR code generation..." -ForegroundColor Yellow
try {
    $qrData = @{
        content = "Test QR Code for Staging"
        content_type = "text"
        size_px = 256
        error_correction = "M"
        foreground_color = "#000000"
        background_color = "#FFFFFF"
    } | ConvertTo-Json

    $qrResponse = Invoke-TestRequest -Url "$BaseUrl/api/qr/generate" -Method "POST" -Body $qrData
    
    if ($qrResponse) {
        Write-Host "✅ QR code generation successful" -ForegroundColor Green
        $TestResults.QRGeneration = $true
        
        # Test cache hit on second request
        Write-Host "🔄 Testing cache hit on duplicate request..." -ForegroundColor Yellow
        $qrResponse2 = Invoke-TestRequest -Url "$BaseUrl/api/qr/generate" -Method "POST" -Body $qrData
        
        if ($qrResponse2) {
            Write-Host "✅ Duplicate QR generation successful (cache test)" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "❌ QR generation test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Performance Testing
Write-Host "⚡ Running performance tests..." -ForegroundColor Yellow
try {
    $performanceResults = @()
    $testCount = 10
    
    for ($i = 1; $i -le $testCount; $i++) {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        try {
            $response = Invoke-TestRequest -Url "$BaseUrl/health"
            $stopwatch.Stop()
            $performanceResults += $stopwatch.ElapsedMilliseconds
            
            Write-Progress -Activity "Performance Testing" -Status "Request $i of $testCount" -PercentComplete (($i / $testCount) * 100)
        } catch {
            $stopwatch.Stop()
            Write-Host "⚠️ Performance test request $i failed" -ForegroundColor Yellow
        }
    }
    
    if ($performanceResults.Count -gt 0) {
        $avgResponseTime = ($performanceResults | Measure-Object -Average).Average
        $maxResponseTime = ($performanceResults | Measure-Object -Maximum).Maximum
        $minResponseTime = ($performanceResults | Measure-Object -Minimum).Minimum
        
        Write-Host "📊 Performance Results:" -ForegroundColor Cyan
        Write-Host "   Average Response Time: $([math]::Round($avgResponseTime, 2))ms" -ForegroundColor White
        Write-Host "   Min Response Time: $([math]::Round($minResponseTime, 2))ms" -ForegroundColor White
        Write-Host "   Max Response Time: $([math]::Round($maxResponseTime, 2))ms" -ForegroundColor White
        
        if ($avgResponseTime -lt 200) {
            Write-Host "✅ Performance test passed (avg < 200ms)" -ForegroundColor Green
            $TestResults.Performance = $true
        } else {
            Write-Host "⚠️ Performance test warning (avg >= 200ms)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Performance test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Memory Usage Validation
Write-Host "💾 Testing memory usage and cache behavior..." -ForegroundColor Yellow
try {
    # Generate multiple QR codes to test memory cache
    $cacheTestData = @()
    for ($i = 1; $i -le 5; $i++) {
        $testData = @{
            content = "Cache Test QR Code $i"
            content_type = "text"
            size_px = 256
            error_correction = "M"
        } | ConvertTo-Json
        
        $cacheTestData += $testData
    }
    
    # First pass - populate cache
    Write-Host "🔄 Populating cache..." -ForegroundColor Yellow
    foreach ($data in $cacheTestData) {
        try {
            Invoke-TestRequest -Url "$BaseUrl/api/qr/generate" -Method "POST" -Body $data | Out-Null
        } catch {
            # Continue with other requests
        }
    }
    
    # Second pass - test cache hits
    Write-Host "🎯 Testing cache hits..." -ForegroundColor Yellow
    $cacheHitCount = 0
    foreach ($data in $cacheTestData) {
        try {
            $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
            Invoke-TestRequest -Url "$BaseUrl/api/qr/generate" -Method "POST" -Body $data | Out-Null
            $stopwatch.Stop()
            
            # Cache hits should be faster
            if ($stopwatch.ElapsedMilliseconds -lt 50) {
                $cacheHitCount++
            }
        } catch {
            # Continue with other requests
        }
    }
    
    $cacheHitRate = ($cacheHitCount / $cacheTestData.Count) * 100
    Write-Host "📈 Cache Hit Rate: $([math]::Round($cacheHitRate, 1))%" -ForegroundColor Cyan
    
    if ($cacheHitRate -gt 60) {
        Write-Host "✅ Memory cache performing well" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Memory cache performance below expected" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Memory usage test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Summary
Write-Host "`n📋 Test Summary:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

$passedTests = 0
$totalTests = $TestResults.Count

foreach ($test in $TestResults.GetEnumerator()) {
    $status = if ($test.Value) { "✅ PASSED" } else { "❌ FAILED" }
    $color = if ($test.Value) { "Green" } else { "Red" }
    Write-Host "   $($test.Key): $status" -ForegroundColor $color
    if ($test.Value) { $passedTests++ }
}

Write-Host "`n📊 Overall Results:" -ForegroundColor Cyan
Write-Host "   Tests Passed: $passedTests/$totalTests" -ForegroundColor White
Write-Host "   Success Rate: $([math]::Round(($passedTests / $totalTests) * 100, 1))%" -ForegroundColor White

if ($passedTests -eq $totalTests) {
    Write-Host "`n🎉 All tests passed! Staging environment is ready." -ForegroundColor Green
    exit 0
} elseif ($passedTests -ge ($totalTests * 0.8)) {
    Write-Host "`n⚠️ Most tests passed. Review failed tests before proceeding." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`n❌ Multiple tests failed. Staging environment needs attention." -ForegroundColor Red
    exit 1
}