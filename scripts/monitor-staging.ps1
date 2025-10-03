# PowerShell script for monitoring staging environment
param(
    [string]$BaseUrl = "http://localhost:8080",
    [int]$MonitorDuration = 300  # 5 minutes
)

$ErrorActionPreference = "Continue"

Write-Host "📊 Starting staging environment monitoring..." -ForegroundColor Green
Write-Host "Duration: $MonitorDuration seconds" -ForegroundColor Yellow
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow

$StartTime = Get-Date
$EndTime = $StartTime.AddSeconds($MonitorDuration)

# Monitoring data collection
$MonitoringData = @{
    ResponseTimes = @()
    MemoryUsage = @()
    CacheHits = 0
    CacheMisses = 0
    TotalRequests = 0
    FailedRequests = 0
}

Write-Host "`n🔍 Monitoring metrics every 10 seconds..." -ForegroundColor Cyan

while ((Get-Date) -lt $EndTime) {
    $CurrentTime = Get-Date
    $ElapsedSeconds = [math]::Round(($CurrentTime - $StartTime).TotalSeconds, 0)
    
    Write-Host "`n⏱️ Time: $ElapsedSeconds/$MonitorDuration seconds" -ForegroundColor Yellow
    
    # Test response time
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $healthResponse = Invoke-RestMethod -Uri "$BaseUrl/health" -TimeoutSec 5
        $stopwatch.Stop()
        
        $responseTime = $stopwatch.ElapsedMilliseconds
        $MonitoringData.ResponseTimes += $responseTime
        $MonitoringData.TotalRequests++
        
        Write-Host "   Response Time: ${responseTime}ms" -ForegroundColor Green
    } catch {
        $MonitoringData.FailedRequests++
        Write-Host "   Response Time: FAILED" -ForegroundColor Red
    }
    
    # Get metrics if available
    try {
        $metricsResponse = Invoke-WebRequest -Uri "$BaseUrl/metrics" -TimeoutSec 5
        if ($metricsResponse.StatusCode -eq 200) {
            $metricsContent = $metricsResponse.Content
            
            # Parse cache metrics
            if ($metricsContent -match 'cache_hits_total\s+(\d+)') {
                $currentCacheHits = [int]$matches[1]
                if ($currentCacheHits -gt $MonitoringData.CacheHits) {
                    $MonitoringData.CacheHits = $currentCacheHits
                }
            }
            
            if ($metricsContent -match 'cache_misses_total\s+(\d+)') {
                $currentCacheMisses = [int]$matches[1]
                if ($currentCacheMisses -gt $MonitoringData.CacheMisses) {
                    $MonitoringData.CacheMisses = $currentCacheMisses
                }
            }
            
            # Calculate cache hit rate
            $totalCacheRequests = $MonitoringData.CacheHits + $MonitoringData.CacheMisses
            if ($totalCacheRequests -gt 0) {
                $cacheHitRate = [math]::Round(($MonitoringData.CacheHits / $totalCacheRequests) * 100, 1)
                Write-Host "   Cache Hit Rate: $cacheHitRate%" -ForegroundColor Cyan
            }
            
            Write-Host "   Cache Hits: $($MonitoringData.CacheHits)" -ForegroundColor Green
            Write-Host "   Cache Misses: $($MonitoringData.CacheMisses)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   Metrics: Not available" -ForegroundColor Yellow
    }
    
    # Check Docker container stats
    try {
        $containerStats = docker stats qr-generator-staging --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" 2>$null
        if ($containerStats) {
            $statsLines = $containerStats -split "`n"
            if ($statsLines.Count -gt 1) {
                $statsData = $statsLines[1] -split "`t"
                if ($statsData.Count -ge 2) {
                    Write-Host "   CPU Usage: $($statsData[0])" -ForegroundColor Cyan
                    Write-Host "   Memory Usage: $($statsData[1])" -ForegroundColor Cyan
                }
            }
        }
    } catch {
        Write-Host "   Container Stats: Not available" -ForegroundColor Yellow
    }
    
    Start-Sleep -Seconds 10
}

# Generate monitoring report
Write-Host "`n📈 Monitoring Report" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green

if ($MonitoringData.ResponseTimes.Count -gt 0) {
    $avgResponseTime = ($MonitoringData.ResponseTimes | Measure-Object -Average).Average
    $maxResponseTime = ($MonitoringData.ResponseTimes | Measure-Object -Maximum).Maximum
    $minResponseTime = ($MonitoringData.ResponseTimes | Measure-Object -Minimum).Minimum
    
    Write-Host "`n🚀 Performance Metrics:" -ForegroundColor Cyan
    Write-Host "   Average Response Time: $([math]::Round($avgResponseTime, 2))ms" -ForegroundColor White
    Write-Host "   Min Response Time: $([math]::Round($minResponseTime, 2))ms" -ForegroundColor White
    Write-Host "   Max Response Time: $([math]::Round($maxResponseTime, 2))ms" -ForegroundColor White
    Write-Host "   Total Requests: $($MonitoringData.TotalRequests)" -ForegroundColor White
    Write-Host "   Failed Requests: $($MonitoringData.FailedRequests)" -ForegroundColor White
    
    $successRate = [math]::Round((($MonitoringData.TotalRequests - $MonitoringData.FailedRequests) / $MonitoringData.TotalRequests) * 100, 1)
    Write-Host "   Success Rate: $successRate%" -ForegroundColor White
}

$totalCacheRequests = $MonitoringData.CacheHits + $MonitoringData.CacheMisses
if ($totalCacheRequests -gt 0) {
    $finalCacheHitRate = [math]::Round(($MonitoringData.CacheHits / $totalCacheRequests) * 100, 1)
    
    Write-Host "`n🧠 Memory Cache Metrics:" -ForegroundColor Cyan
    Write-Host "   Total Cache Requests: $totalCacheRequests" -ForegroundColor White
    Write-Host "   Cache Hits: $($MonitoringData.CacheHits)" -ForegroundColor White
    Write-Host "   Cache Misses: $($MonitoringData.CacheMisses)" -ForegroundColor White
    Write-Host "   Cache Hit Rate: $finalCacheHitRate%" -ForegroundColor White
}

# Performance assessment
Write-Host "`n✅ Assessment:" -ForegroundColor Green

$issues = @()
if ($MonitoringData.ResponseTimes.Count -gt 0) {
    $avgResponseTime = ($MonitoringData.ResponseTimes | Measure-Object -Average).Average
    if ($avgResponseTime -gt 200) {
        $issues += "Average response time exceeds 200ms target"
    }
}

if ($MonitoringData.FailedRequests -gt 0) {
    $issues += "Some requests failed during monitoring"
}

if ($totalCacheRequests -gt 0) {
    $finalCacheHitRate = ($MonitoringData.CacheHits / $totalCacheRequests) * 100
    if ($finalCacheHitRate -lt 80) {
        $issues += "Cache hit rate below 80% target"
    }
}

if ($issues.Count -eq 0) {
    Write-Host "🎉 All performance targets met!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Issues identified:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "   - $issue" -ForegroundColor Yellow
    }
}

Write-Host "`n📝 Monitoring completed at $(Get-Date)" -ForegroundColor Cyan