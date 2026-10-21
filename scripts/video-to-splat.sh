#!/bin/bash
# Video of a piece -> showroom-ready .splat, entirely on this Mac (about an hour for a 1-minute video).
#   scripts/video-to-splat.sh "/path/to/video.mp4" work-folder [every-nth-frame=14] [training-steps=20000]
# Needs: ffmpeg + colmap (brew install ffmpeg colmap) and the Brush trainer binary (see SHOWROOM_MODELS.md).
# Prints a camera-path check at the end: a good capture has a steady distance and an azimuth that moves steadily.
set -euo pipefail
export PATH=/opt/homebrew/bin:$PATH
VIDEO=${1:?video file}; WORK=${2:?work folder}; STEP=${3:-14}; STEPS=${4:-20000}
ROOT=$(pwd)
BRUSH=${BRUSH:-capture-work/tools/brush/brush-app-aarch64-apple-darwin/brush_app}
[[ "$BRUSH" = /* ]] || BRUSH="$ROOT/$BRUSH"
mkdir -p "$WORK/images" && cd "$WORK"
echo "[1/5] frames (every ${STEP}th)"
ffmpeg -v error -y -i "$VIDEO" -vf "select='not(mod(n,$STEP))',scale=1080:-2" -fps_mode vfr -q:v 2 images/f_%04d.jpg
echo "[2/5] camera positions (COLMAP, CPU)"
rm -rf db.db sparse && mkdir sparse
colmap feature_extractor --database_path db.db --image_path images --ImageReader.camera_model SIMPLE_RADIAL \
  --ImageReader.single_camera_per_image 1 --FeatureExtraction.use_gpu 0 --FeatureExtraction.max_image_size 1920 --SiftExtraction.max_num_features 6000
colmap exhaustive_matcher --database_path db.db --FeatureMatching.use_gpu 0
colmap mapper --database_path db.db --image_path images --output_path sparse --Mapper.ba_refine_principal_point 0
colmap model_analyzer --path sparse/0 2>&1 | grep -E "Registered images|Points:|Mean reprojection"
echo "[3/5] camera path check (distance from the piece / azimuth should change steadily)"
rm -rf sparse-txt && mkdir sparse-txt && colmap model_converter --input_path sparse/0 --output_path sparse-txt --output_type TXT >/dev/null 2>&1
python3 - <<'PY'
import math
L=[l for l in open('sparse-txt/images.txt') if not l.startswith('#')]; rows=[]
for i in range(0,len(L),2):
    p=L[i].split()
    if len(p)<10: continue
    qw,qx,qy,qz,tx,ty,tz=map(float,p[1:8])
    R=[[1-2*(qy*qy+qz*qz),2*(qx*qy-qz*qw),2*(qx*qz+qy*qw)],[2*(qx*qy+qz*qw),1-2*(qx*qx+qz*qz),2*(qy*qz-qx*qw)],[2*(qx*qz-qy*qw),2*(qy*qz+qx*qw),1-2*(qx*qx+qy*qy)]]
    rows.append((p[9],[-(R[0][j]*tx+R[1][j]*ty+R[2][j]*tz) for j in range(3)]))
rows.sort(); c=[sum(r[1][k] for r in rows)/len(rows) for k in range(3)]
d=[math.dist(r[1],c) for r in rows]; med=sorted(d)[len(d)//2]
spread=sum(1 for x in d if x<0.5*med or x>2*med)/len(d)
print(f"  {len(rows)} cameras; {spread:.0%} are less than half or more than double the typical distance (want < 15%)")
PY
echo "[4/5] training (Brush, $STEPS steps)"
colmap image_undistorter --image_path images --input_path sparse/0 --output_path undist --output_type COLMAP --max_image_size 1920 >/dev/null 2>&1
mkdir -p out && "$BRUSH" undist --total-steps "$STEPS" --max-resolution 1080 --max-splats 450000 --export-path out --export-name "piece_{iter}.ply"
echo "[5/5] convert"
node "$ROOT/scripts/ply-to-splat.mjs" "out/piece_${STEPS}.ply" piece.splat --up -y --max 300000 --opacity 0.25 --max-size 0.08 --radius 0.55
echo "done: $WORK/piece.splat  (add it in Admin -> Gallery -> 3D model, then tune with the preview sliders)"
