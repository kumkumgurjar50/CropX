"""
CropX Disease Predictor
=======================
Spawns Python process to run infer.py and returns the JSON result as a dict.

Usage:
    from model.predictor import predict
    result = predict(open("leaf.jpg", "rb").read())
"""
import sys
import os
import shutil
import subprocess
import json
import tempfile
from pathlib import Path

def _get_python_exe():
    # 1. Try sys.executable
    if sys.executable and os.path.exists(sys.executable):
        return sys.executable
    # 2. Try shutil.which('python')
    py = shutil.which('python')
    if py and os.path.exists(py):
        return py
    # 3. Fallbacks
    for p in [
        r"C:\Users\faiza\AppData\Local\anaconda3\python.exe",
        r"C:\Users\Krish Patel\anaconda3\python.exe",
        r"C:\anaconda3\python.exe",
    ]:
        if os.path.exists(p):
            return p
    return "python"

ANACONDA_PYTHON = _get_python_exe()
INFER_SCRIPT    = str(Path(__file__).parent / 'infer.py')


def predict(image_bytes: bytes) -> dict:
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    try:
        proc = subprocess.run(
            [ANACONDA_PYTHON, INFER_SCRIPT, tmp_path],
            capture_output=True,
            text=True,
            timeout=120,
        )

        stdout = proc.stdout.strip()
        if not stdout:
            raise RuntimeError(
                f'infer.py produced no output.\nstderr: {proc.stderr[-600:]}'
            )

        # Find the last JSON line (TF may print warnings before it)
        json_line = None
        for line in reversed(stdout.splitlines()):
            line = line.strip()
            if line.startswith('{') and line.endswith('}'):
                json_line = line
                break

        if json_line is None:
            raise RuntimeError(f'No JSON in output:\n{stdout[-400:]}')

        return json.loads(json_line)

    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
