# Test Home API
Write-Host "Testing Home API..." -ForegroundColor Green
$homeResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/home" -Method GET

Write-Host "Home API Response:" -ForegroundColor Yellow
$homeResponse | ConvertTo-Json -Depth 3

# Get first featured artwork ID
if ($homeResponse.data.featuredArtworks -and $homeResponse.data.featuredArtworks.Count -gt 0) {
    $artworkId = $homeResponse.data.featuredArtworks[0]._id
    Write-Host "`nTesting Artwork Details API with ID: $artworkId" -ForegroundColor Green
    
    $artworkResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/home/artwork/$artworkId" -Method GET
    
    Write-Host "Artwork Details Response:" -ForegroundColor Yellow
    $artworkResponse | ConvertTo-Json -Depth 3
} else {
    Write-Host "No featured artworks found" -ForegroundColor Red
}

# Test artist profile if available
if ($homeResponse.data.featuredArtists -and $homeResponse.data.featuredArtists.Count -gt 0) {
    $artistId = $homeResponse.data.featuredArtists[0]._id
    Write-Host "`nTesting Artist Profile API with ID: $artistId" -ForegroundColor Green
    
    $artistResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/home/artist/$artistId" -Method GET
    
    Write-Host "Artist Profile Response:" -ForegroundColor Yellow
    $artistResponse | ConvertTo-Json -Depth 3
} else {
    Write-Host "No featured artists found" -ForegroundColor Red
} 