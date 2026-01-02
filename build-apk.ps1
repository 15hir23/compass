# PowerShell script to build APK with workaround for permission issues
# This script creates a clean build environment

Write-Host "Building APK for Vastu Compass..." -ForegroundColor Cyan

# Set environment variable to skip VCS scanning
$env:EAS_NO_VCS = "1"

# Try to build
Write-Host "`nAttempting EAS Build..." -ForegroundColor Yellow
Write-Host "If this fails, try:" -ForegroundColor Yellow
Write-Host "1. Move project to a different location (e.g., C:\Projects\compass-new)" -ForegroundColor White
Write-Host "2. Or use: eas build --platform android --profile production --local" -ForegroundColor White
Write-Host "   (requires Android SDK setup)" -ForegroundColor Gray
Write-Host "`n" -NoNewline

eas build --platform android --profile production

