"""
CropX Disease Inference Script with Plant/Leaf Image Validation
================================================================
Outputs a single JSON line to stdout.
"""
import sys, json, os

os.environ.setdefault('TF_ENABLE_ONEDNN_OPTS', '0')
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')

import numpy as np
from PIL import Image
import tensorflow as tf

# ── Paths ─────────────────────────────────────────────────────────────────────
MODEL_DIR   = os.path.dirname(os.path.abspath(__file__))
KERAS_DIR   = os.path.join(MODEL_DIR, 'crop_disease_model.keras')
WEIGHTS     = os.path.join(KERAS_DIR,  'model.weights.h5')
CONFIG      = os.path.join(KERAS_DIR,  'config.json')
INDEX_PATH  = os.path.join(MODEL_DIR,  'class_indices.json')

IMG_SIZE = (224, 224)

# ── Load class names ──────────────────────────────────────────────────────────
with open(INDEX_PATH) as f:
    CLASS_NAMES = json.load(f)       # 107 sorted folder names
NUM_CLASSES = len(CLASS_NAMES)

# ── Load model from config + weights ─────────────────────────────────────────
with open(CONFIG) as f:
    cfg_str = f.read()

model = tf.keras.models.model_from_json(cfg_str)
model.load_weights(WEIGHTS)

# ── Disease knowledge base ────────────────────────────────────────────────────
DISEASE_INFO = {
    'healthy': {
        'severity': 'NONE',
        'symptoms': 'No disease symptoms detected. The crop appears healthy.',
        'organic':  'Maintain good agricultural practices. Monitor regularly.',
        'chemical': 'No treatment required.',
    },
    'blight': {
        'severity': 'HIGH',
        'symptoms': 'Brown to black lesions spreading rapidly on leaves and stems. Yellowing around affected areas.',
        'organic':  'Remove infected leaves immediately. Apply Bordeaux mixture (1%). Avoid overhead irrigation.',
        'chemical': 'Mancozeb 75 WP @ 2 g/L or Chlorothalonil 75 WP @ 2 g/L at 10-day intervals.',
    },
    'rust': {
        'severity': 'MEDIUM',
        'symptoms': 'Orange, yellow, or brown powdery pustules on leaf surfaces or undersides. Premature leaf drop.',
        'organic':  'Apply sulfur-based fungicide. Remove and destroy infected leaves and debris.',
        'chemical': 'Propiconazole 25 EC @ 1 ml/L or Tebuconazole 25.9 EC @ 1 ml/L.',
    },
    'rot': {
        'severity': 'HIGH',
        'symptoms': 'Dark water-soaked lesions. Tissue softening and decay. Foul odor in severe cases.',
        'organic':  'Improve soil drainage. Apply Trichoderma viride @ 4 g/kg soil.',
        'chemical': 'Drench with Metalaxyl + Mancozeb @ 2.5 g/L. Carbendazim 50 WP @ 1 g/L.',
    },
    'mildew': {
        'severity': 'MEDIUM',
        'symptoms': 'White or gray powdery coating on leaf surfaces. Leaf curling and stunted growth.',
        'organic':  'Spray neem oil (5 ml/L) or diluted baking soda (1 tsp/L). Ensure good air circulation.',
        'chemical': 'Carbendazim 50 WP @ 1 g/L or Triadimefon 25 WP @ 1 g/L.',
    },
    'spot': {
        'severity': 'MEDIUM',
        'symptoms': 'Circular to irregular spots with defined borders on leaves. Centers may dry out and fall.',
        'organic':  'Copper-based fungicide (Bordeaux mixture 0.5%). Remove infected leaves promptly.',
        'chemical': 'Mancozeb 75 WP @ 2 g/L or Iprodione 50 WP @ 1.5 g/L.',
    },
    'mosaic': {
        'severity': 'HIGH',
        'symptoms': 'Yellow-green mosaic or mottling pattern on leaves. Stunted growth and leaf distortion.',
        'organic':  'Remove and destroy infected plants immediately. Control aphid/whitefly vectors with yellow sticky traps.',
        'chemical': 'No direct cure. Control vectors: Imidacloprid 17.8 SL @ 0.3 ml/L.',
    },
    'bacterial': {
        'severity': 'HIGH',
        'symptoms': 'Water-soaked lesions with yellow halos. Wilting, yellowing, and bacterial ooze on severe infections.',
        'organic':  'Copper-based bactericide. Remove and burn infected material. Avoid wetting foliage.',
        'chemical': 'Streptomycin sulfate 90 SP @ 0.5 g/L + Copper oxychloride 50 WP @ 3 g/L.',
    },
    'wilt': {
        'severity': 'HIGH',
        'symptoms': 'Sudden wilting despite adequate soil moisture. Browning of internal stem tissue.',
        'organic':  'Solarize soil. Apply Trichoderma harzianum. Remove infected plants.',
        'chemical': 'Carbendazim 50 WP soil drench @ 1 g/L.',
    },
    'tungro': {
        'severity': 'HIGH',
        'symptoms': 'Yellow-orange leaf discoloration. Stunted plants and reduced tillering in rice.',
        'organic':  'Remove infected plants. Control green leafhopper vector with reflective mulches.',
        'chemical': 'Carbofuran 3 G @ 25 kg/ha for vector control.',
    },
    'default': {
        'severity': 'MEDIUM',
        'symptoms': 'Visible lesions, discoloration, or abnormal growth patterns on leaf tissue.',
        'organic':  'Neem oil spray (5 ml/L). Remove infected plant material. Improve air circulation.',
        'chemical': 'Consult local agricultural extension for crop-specific fungicide recommendation.',
    },
}

def get_info(class_name: str) -> dict:
    n = class_name.lower()
    if 'healthy' in n:
        return DISEASE_INFO['healthy']
    for key in ['tungro', 'mosaic', 'bacterial', 'wilt', 'blight',
                'rust', 'rot', 'mildew', 'spot']:
        if key in n:
            return DISEASE_INFO[key]
    return DISEASE_INFO['default']

def format_class(class_name: str) -> tuple:
    """Return (crop_name, disease_label) from a class string like 'Tomato___early_blight'."""
    clean = class_name.replace('___', '|||').replace('_', ' ')
    parts = clean.split('|||')
    crop    = parts[0].strip().title()
    disease = parts[1].strip().title() if len(parts) > 1 else clean.strip().title()
    return crop, disease

# ── Inference & Validation ───────────────────────────────────────────────────
image_path = sys.argv[1]

try:
    img = Image.open(image_path).convert('RGB')
except Exception:
    img = None

if img is None:
    result = {
        'is_unknown':          True,
        'disease_name':        'Unknown Image',
        'crop_name':           None,
        'confidence':          None,
        'severity':            None,
        'is_healthy':          False,
        'symptoms':            None,
        'organic_treatment':   None,
        'chemical_treatment':  None,
        'message':             'Unknown Image — Please upload a clear image of a supported crop leaf.',
        'top_predictions':     [],
        'model':               'CropX MobileNetV2 Sequential (107 classes)',
    }
    print(json.dumps(result))
    sys.exit(0)

# Feature Extraction for Foliage vs Document/Passbook/Synthetic Non-Leaf Objects
np_img = np.array(img.resize(IMG_SIZE), dtype=np.float32)
r, g, b = np_img[:, :, 0], np_img[:, :, 1], np_img[:, :, 2]

# 1. Natural Green Foliage Ratio (Chlorophyll presence)
green_mask = (g >= (r - 20)) & (g >= (b - 20)) & (g >= 25)
green_ratio = float(np.mean(green_mask))

# 2. Synthetic Orange / Red Print Ink Ratio (Passbooks, ID cards, document covers)
synthetic_ink_mask = (r > 165) & ((r - g) > 60) & (b < 100)
synthetic_ink_ratio = float(np.mean(synthetic_ink_mask))

# 3. Paper / Document Background Ratio (White/Cream flat paper with printed text)
paper_doc_mask = (r > 215) & (g > 210) & (b > 190)
paper_doc_ratio = float(np.mean(paper_doc_mask))

# Model forward pass
arr = np_img[np.newaxis]
preds = model.predict(arr, verbose=0)[0]
top5_idx   = preds.argsort()[::-1][:5]
top_class  = CLASS_NAMES[top5_idx[0]]
confidence = float(preds[top5_idx[0]]) * 100

# Plant / Leaf Validation Rules:
# Rule 1: Synthetic Orange/Red Document Ink detected (e.g. Bank Passbook / ID Card)
# Rule 2: High Paper/Document ratio with low green foliage (< 8% green)
# Rule 3: Zero or negligible green foliage (< 2.5% green pixels)
# Rule 4: Low model confidence (< 40.0%)
is_valid_leaf = True
if synthetic_ink_ratio > 0.03:
    is_valid_leaf = False
elif paper_doc_ratio > 0.30 and green_ratio < 0.08:
    is_valid_leaf = False
elif green_ratio < 0.025:
    is_valid_leaf = False
elif confidence < 40.0:
    is_valid_leaf = False

if not is_valid_leaf:
    result = {
        'is_unknown':          True,
        'disease_name':        'Unknown Image',
        'crop_name':           None,
        'confidence':          None,
        'severity':            None,
        'is_healthy':          False,
        'symptoms':            None,
        'organic_treatment':   None,
        'chemical_treatment':  None,
        'message':             'Unknown Image — Please upload a clear image of a supported crop leaf.',
        'top_predictions':     [],
        'model':               'CropX MobileNetV2 Sequential (107 classes)',
    }
else:
    crop_name, disease_name = format_class(top_class)
    info = get_info(top_class)

    result = {
        'is_unknown':          False,
        'disease_name':        disease_name,
        'crop_name':           crop_name,
        'confidence':          round(confidence, 1),
        'severity':            info['severity'],
        'is_healthy':          'healthy' in top_class.lower(),
        'symptoms':            info['symptoms'],
        'organic_treatment':   info['organic'],
        'chemical_treatment':  info['chemical'],
        'top_predictions': [
            {
                'class':       format_class(CLASS_NAMES[i])[0] + ' — ' + format_class(CLASS_NAMES[i])[1],
                'confidence':  round(float(preds[i]) * 100, 1),
            }
            for i in top5_idx
        ],
        'model': 'CropX MobileNetV2 Sequential (107 classes)',
    }

# Print JSON to stdout — Django reads this
print(json.dumps(result))
