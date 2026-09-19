<#
.SYNOPSIS
  Chuyển video quay màn hình (mp4/mkv/mov/webm...) hoặc chuỗi ảnh PNG thành GIF tối ưu cho bài viết.

.DESCRIPTION
  Dùng ffmpeg (phải có trên PATH, vd. winget install Gyan.FFmpeg) với bảng màu 2 lượt
  (palettegen/paletteuse, stats_mode=diff + diff_mode=rectangle): hợp với quay màn hình phần mềm
  vì phần lớn khung hình đứng yên -> GIF nhỏ mà chữ vẫn nét.

.EXAMPLE
  .\scripts\video-to-gif.ps1 -In D:\rec\draw.mp4 -Out public\tekla\peb-member\img\06-draw.gif -Start 3 -Duration 14

.EXAMPLE
  # Cắt bớt đầu/cuối, tăng tốc 1.5 lần, thu nhỏ còn 900px
  .\scripts\video-to-gif.ps1 -In rec.mp4 -Out out.gif -Start 1.5 -Duration 20 -Speed 1.5 -Width 900

.EXAMPLE
  # Chỉ lấy vùng 720x480 bắt đầu từ điểm (250,140) của video, 6 giây đầu
  .\scripts\video-to-gif.ps1 -In setup.mp4 -Out out.gif -Crop 720:480:250:140 -Duration 6

.EXAMPLE
  # Chuỗi ảnh f_0000.png, f_0001.png... quay sẵn ở 10 khung/giây
  .\scripts\video-to-gif.ps1 -In "frames\f_%04d.png" -InputFps 10 -Out out.gif
#>
param(
  [Parameter(Mandatory = $true)] [string]$In,
  [Parameter(Mandatory = $true)] [string]$Out,
  [int]$Width = 960,          # chiều ngang GIF (px); không phóng to nếu video nhỏ hơn
  [int]$Fps = 12,             # khung hình/giây của GIF
  [double]$Start = 0,         # bỏ qua N giây đầu
  [double]$Duration = 0,      # chỉ lấy N giây (0 = đến hết)
  [double]$Speed = 1.0,       # > 1 để tua nhanh
  [int]$Colors = 128,         # số màu tối đa (64–256); ít màu -> file nhỏ hơn
  [int]$InputFps = 0,         # chỉ dùng cho chuỗi ảnh: số khung/giây lúc quay
  [string]$Crop = ''          # cắt vùng trước khi thu nhỏ, dạng "rộng:cao:x:y" (px của video gốc)
)

$ErrorActionPreference = 'Stop'
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw 'Không tìm thấy ffmpeg trên PATH. Cài bằng: winget install Gyan.FFmpeg'
}

$ci = [Globalization.CultureInfo]::InvariantCulture
$inputArgs = @()
if ($InputFps -gt 0) { $inputArgs += @('-framerate', "$InputFps") }
if ($Start -gt 0) { $inputArgs += @('-ss', $Start.ToString($ci)) }
if ($Duration -gt 0) { $inputArgs += @('-t', $Duration.ToString($ci)) }
$inputArgs += @('-i', $In)

$pts = (1.0 / $Speed).ToString('0.######', $ci)
$cropFilter = if ($Crop) { "crop=$Crop," } else { '' }
$filter = "${cropFilter}setpts=$pts*PTS,fps=$Fps,scale='min($Width,iw)':-1:flags=lanczos,split[a][b];" +
          "[a]palettegen=max_colors=${Colors}:stats_mode=diff[p];" +
          "[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle"

$outDir = Split-Path -Parent $Out
if ($outDir -and -not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

& ffmpeg -hide_banner -loglevel error -y @inputArgs -vf $filter -loop 0 $Out
if ($LASTEXITCODE -ne 0) { throw "ffmpeg lỗi (exit $LASTEXITCODE)." }

$size = (Get-Item $Out).Length
Write-Host ("✔ {0} ({1:N0} KB)" -f $Out, ($size / 1KB))
if ($size -gt 5MB) {
  Write-Host '⚠ GIF > 5 MB: nên cắt ngắn (-Duration), tăng -Speed, giảm -Width/-Fps hoặc -Colors.'
}
