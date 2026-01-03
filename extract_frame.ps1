# PowerShell script to extract video frame
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

# Load the video file and extract frame at 6:02
$videoPath = "assets/widor-suite-mvt4.mp4"
$outputPath = "assets/widor-suite-mvt4-6m02.jpg"
$timeSeconds = 362  # 6 minutes 2 seconds

try {
    # This is a simplified approach - we'll need to use a different method
    Write-Host "Extracting frame at 6:02 (362 seconds) from $videoPath"
    Write-Host "Output will be saved to: $outputPath"
    
    # Note: This requires additional video processing libraries that may not be available
    # Alternative: Use online tools or install FFmpeg
    Write-Host "This script requires additional video processing capabilities."
    Write-Host "Please install FFmpeg or use an online video frame extractor."
} catch {
    Write-Error "Error extracting frame: $_"
}