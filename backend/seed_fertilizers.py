import os
import django
from decimal import Decimal
import urllib.parse

# 1. Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cropx_backend.settings')
django.setup()

# 2. Import Fertilizer from farms.models
from farms.models import Fertilizer

def generate_product_svg(f_type, name, brand, unit):
    is_bottle = any(u in unit.lower() for u in ['litre', 'liter', 'ml', 'bottle', 'liquid']) or f_type in ['Fungicide', 'Pesticide']
    
    theme_colors = {
        'Chemical': ('#1e40af', '#3b82f6', '#dbeafe'),
        'Organic': ('#15803d', '#22c55e', '#dcfce7'),
        'Fungicide': ('#7e22ce', '#a855f7', '#f3e8ff'),
        'Pesticide': ('#c2410c', '#f97316', '#ffedd5'),
        'Micronutrient': ('#b45309', '#f59e0b', '#fef3c7'),
        'Biofertilizer': ('#0f766e', '#14b8a6', '#ccfbf1'),
    }
    dark, main, light = theme_colors.get(f_type, theme_colors['Chemical'])
    
    brand_text = (brand or 'CropX').upper()[:16]
    clean_name = name.replace(brand, '').strip()
    name_text = clean_name[:20] if clean_name else name[:20]
    unit_text = unit.upper()[:12]
    
    if is_bottle:
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
          <rect width="400" height="300" fill="#f8fafc"/>
          <ellipse cx="200" cy="245" rx="75" ry="14" fill="#e2e8f0"/>
          <rect x="155" y="90" width="90" height="145" rx="16" fill="{main}"/>
          <rect x="155" y="112" width="90" height="100" fill="#ffffff" opacity="0.95"/>
          <rect x="178" y="55" width="44" height="35" rx="4" fill="{dark}"/>
          <rect x="172" y="45" width="56" height="14" rx="3" fill="{dark}"/>
          <rect x="160" y="118" width="80" height="22" rx="4" fill="{dark}"/>
          <text x="200" y="133" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">{brand_text}</text>
          <text x="200" y="156" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="{dark}" text-anchor="middle">{name_text}</text>
          <rect x="168" y="172" width="64" height="16" rx="8" fill="{light}"/>
          <text x="200" y="184" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="{dark}" text-anchor="middle">{f_type.upper()}</text>
          <text x="200" y="200" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#64748b" text-anchor="middle">{unit_text}</text>
        </svg>'''
    else:
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
          <rect width="400" height="300" fill="#f8fafc"/>
          <ellipse cx="200" cy="255" rx="90" ry="18" fill="#e2e8f0"/>
          <path d="M 135 70 Q 200 60 265 70 L 280 240 Q 200 255 120 240 Z" fill="{main}"/>
          <path d="M 135 70 Q 200 60 265 70 L 265 84 Q 200 74 135 84 Z" fill="{dark}"/>
          <rect x="148" y="95" width="104" height="125" rx="8" fill="#ffffff" opacity="0.95"/>
          <rect x="153" y="102" width="94" height="24" rx="4" fill="{dark}"/>
          <text x="200" y="118" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">{brand_text}</text>
          <text x="200" y="145" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="{dark}" text-anchor="middle">{name_text}</text>
          <circle cx="200" cy="172" r="14" fill="{light}" stroke="{dark}" stroke-width="2"/>
          <path d="M 195 172 L 198 175 L 205 167" fill="none" stroke="{dark}" stroke-width="2.5" stroke-linecap="round"/>
          <text x="200" y="202" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="{dark}" text-anchor="middle">{unit_text}</text>
        </svg>'''
    
    return 'data:image/svg+xml;utf8,' + urllib.parse.quote(svg)

def get_image_url(f_type, full_name, brand='', unit=''):
    return generate_product_svg(f_type, full_name, brand, unit)


def seed_fertilizers():
    print("Clearing existing Fertilizer data...")
    # 3. Delete all existing Fertilizer objects
    Fertilizer.objects.all().delete()
    print("Existing fertilizers deleted.")

    # 4. Create exactly 250 unique fertilizer products
    
    # Base Definitions
    base_products = [
        # ==============================================================
        # CHEMICAL FERTILIZERS (50 products: 10 bases x 5 variations)
        # Color: 3b82f6 (blue)
        # ==============================================================
        {
            'fertilizer_type': 'Chemical',
            'base_name': 'Urea 46% N',
            'description': 'High-nitrogen chemical fertilizer that provides essential nutrients for robust plant growth and leaf development.',
            'crops': 'Wheat, Rice, Maize, Sugarcane, Cotton',
            'prevents': 'Nitrogen Deficiency, Stunted Growth',
            'dose': '50 kg/acre',
            'usage_notes': 'Apply as basal dose or top dressing. Incorporate well into the soil to prevent volatilization loss.',
            'unit': '45 kg bag',
            'color': '3b82f6',
            'variations': [
                ('IFFCO', '266.50', '319.80', 150), ('KRIBHCO', '268.00', '321.60', 120),
                ('NFL', '265.00', '318.00', 85), ('RCF', '267.00', '320.40', 200),
                ('GNFC', '270.00', '324.00', 95)
            ]
        },
        {
            'fertilizer_type': 'Chemical',
            'base_name': 'DAP 18-46-0',
            'description': 'Di-ammonium Phosphate provides a rich source of both nitrogen and phosphorus for early root establishment.',
            'crops': 'Wheat, Cotton, Groundnut, Pulses, Potato',
            'prevents': 'Phosphorus Deficiency, Poor Root Development',
            'dose': '50 kg/acre',
            'usage_notes': 'Use as a basal fertilizer during sowing. Avoid placing directly in contact with seeds.',
            'unit': '50 kg bag',
            'color': '3b82f6',
            'variations': [
                ('IFFCO', '1350.00', '1620.00', 140), ('Coromandel', '1380.00', '1656.00', 90),
                ('Paradeep Phosphates', '1340.00', '1608.00', 110), ('Zuari Agro', '1365.00', '1638.00', 105),
                ('Chambal Fertilizers', '1370.00', '1644.00', 75)
            ]
        },
        {
            'fertilizer_type': 'Chemical',
            'base_name': 'MOP 60% K',
            'description': 'Muriate of Potash ensures optimal potassium levels for fruit quality, disease resistance, and water retention.',
            'crops': 'Sugarcane, Banana, Potato, Onion, Rice',
            'prevents': 'Potassium Deficiency, Poor Fruit Quality',
            'dose': '30 kg/acre',
            'usage_notes': 'Apply as a split dose during the active growth and flowering stages.',
            'unit': '50 kg bag',
            'color': '3b82f6',
            'variations': [
                ('IPL', '1700.00', '2040.00', 80), ('Coromandel', '1750.00', '2100.00', 60),
                ('Tata Chemicals', '1720.00', '2064.00', 70), ('SPIC', '1690.00', '2028.00', 110),
                ('FACT', '1715.00', '2058.00', 100)
            ]
        },
        {
            'fertilizer_type': 'Chemical',
            'base_name': 'SSP 16% P',
            'description': 'Single Super Phosphate contains phosphorus along with calcium and sulfur for multi-nutrient enrichment.',
            'crops': 'Oilseeds, Pulses, Cotton, Wheat',
            'prevents': 'Sulphur Deficiency, Weak Stems',
            'dose': '100 kg/acre',
            'usage_notes': 'Excellent basal fertilizer, especially for sulfur-loving crops like oilseeds.',
            'unit': '50 kg bag',
            'color': '3b82f6',
            'variations': [
                ('Khaitan Chemicals', '450.00', '540.00', 150), ('Rama Phosphates', '460.00', '552.00', 120),
                ('Coromandel', '480.00', '576.00', 210), ('Liberty', '440.00', '528.00', 95),
                ('Aries Agro', '490.00', '588.00', 80)
            ]
        },
        {
            'fertilizer_type': 'Chemical',
            'base_name': 'NPK 19:19:19',
            'description': 'Balanced water-soluble fertilizer offering equal proportions of Nitrogen, Phosphorus, and Potassium.',
            'crops': 'Tomato, Chilli, Grapes, Citrus, Floriculture',
            'prevents': 'Overall Nutrient Deficiency',
            'dose': '5 gm/L',
            'usage_notes': 'Suitable for foliar spray and fertigation. Use during the vegetative growth phase.',
            'unit': '1 kg packet',
            'color': '3b82f6',
            'variations': [
                ('IFFCO', '120.00', '144.00', 300), ('Mahadhan', '135.00', '162.00', 250),
                ('Coromandel', '140.00', '168.00', 400), ('Aries Agro', '130.00', '156.00', 180),
                ('Multiplex', '125.00', '150.00', 210)
            ]
        },
        {
            'fertilizer_type': 'Chemical',
            'base_name': 'NPK 12:32:16',
            'description': 'Complex fertilizer with high phosphorus content to encourage strong root formulation and blooming.',
            'crops': 'Soybean, Groundnut, Cotton, Wheat',
            'prevents': 'Phosphorus and Potash Deficiency',
            'dose': '50 kg/acre',
            'usage_notes': 'Use at the time of sowing as a basal application.',
            'unit': '50 kg bag',
            'color': '3b82f6',
            'variations': [
                ('IFFCO', '1450.00', '1740.00', 140), ('KRIBHCO', '1460.00', '1752.00', 100),
                ('GNFC', '1480.00', '1776.00', 110), ('GSFC', '1475.00', '1770.00', 85),
                ('RCF', '1490.00', '1788.00', 130)
            ]
        },
        {
            'fertilizer_type': 'Chemical',
            'base_name': 'NPK 10:26:26',
            'description': 'High PK complex fertilizer for crops requiring elevated potassium and phosphorus levels for fruit and tuber growth.',
            'crops': 'Potato, Onion, Sugarcane, Banana',
            'prevents': 'Suboptimal Fruit Formation',
            'dose': '50 kg/acre',
            'usage_notes': 'Best applied during basal dressing or early growth stages.',
            'unit': '50 kg bag',
            'color': '3b82f6',
            'variations': [
                ('IFFCO', '1470.00', '1764.00', 90), ('Coromandel', '1500.00', '1800.00', 150),
                ('Zuari Agro', '1480.00', '1776.00', 120), ('Paradeep Phosphates', '1460.00', '1752.00', 80),
                ('SPIC', '1490.00', '1788.00', 60)
            ]
        },
        {
            'fertilizer_type': 'Chemical',
            'base_name': 'Ammonium Sulphate',
            'description': 'Provides nitrogen and sulfur, crucial for chlorophyll formation and protein synthesis in plants.',
            'crops': 'Tea, Coffee, Rice, Onion, Garlic',
            'prevents': 'Yellowing of Young Leaves, Sulfur Deficiency',
            'dose': '25 kg/acre',
            'usage_notes': 'Apply to sulfur-deficient soils. Highly soluble in water.',
            'unit': '50 kg bag',
            'color': '3b82f6',
            'variations': [
                ('GSFC', '900.00', '1080.00', 180), ('FACT', '910.00', '1092.00', 150),
                ('SAIL', '880.00', '1056.00', 100), ('Tata Steel', '950.00', '1140.00', 95),
                ('RCF', '920.00', '1104.00', 140)
            ]
        },
        {
            'fertilizer_type': 'Chemical',
            'base_name': 'Calcium Ammonium Nitrate',
            'description': 'Neutral nitrogenous fertilizer offering calcium and nitrogen without affecting soil pH.',
            'crops': 'Apple, Citrus, Vegetable crops',
            'prevents': 'Blossom End Rot, Calcium Deficiency',
            'dose': '25 kg/acre',
            'usage_notes': 'Safe for acidic soils. Apply in split doses.',
            'unit': '50 kg bag',
            'color': '3b82f6',
            'variations': [
                ('NFL', '1100.00', '1320.00', 70), ('RCF', '1120.00', '1344.00', 90),
                ('IFFCO', '1150.00', '1380.00', 130), ('GNFC', '1130.00', '1356.00', 85),
                ('Chambal Fertilizers', '1140.00', '1368.00', 105)
            ]
        },
        {
            'fertilizer_type': 'Chemical',
            'base_name': 'NPK 20:20:0:13',
            'description': 'Ammonium Phosphate Sulphate, providing balanced nitrogen, phosphorus, and sulfur.',
            'crops': 'Paddy, Groundnut, Maize, Oilseeds',
            'prevents': 'Slow Vegetative Growth',
            'dose': '50 kg/acre',
            'usage_notes': 'Apply as basal dressing for best results.',
            'unit': '50 kg bag',
            'color': '3b82f6',
            'variations': [
                ('Coromandel', '1150.00', '1380.00', 110), ('FACT', '1120.00', '1344.00', 140),
                ('SPIC', '1130.00', '1356.00', 95), ('EID Parry', '1160.00', '1392.00', 80),
                ('Zuari Agro', '1145.00', '1374.00', 130)
            ]
        },

        # ==============================================================
        # ORGANIC FERTILIZERS (45 products: 9 bases x 5 variations)
        # Color: 22c55e (green)
        # ==============================================================
        {
            'fertilizer_type': 'Organic',
            'base_name': 'Neem Cake',
            'description': 'Organic manure with pest-repellent properties. Enriches soil organic carbon and slowly releases nutrients.',
            'crops': 'All vegetables, Fruits, Cotton, Spices',
            'prevents': 'Nematodes, Soil Borne Insects',
            'dose': '100 kg/acre',
            'usage_notes': 'Mix well with topsoil before sowing or planting.',
            'unit': '50 kg bag',
            'color': '22c55e',
            'variations': [
                ('Godrej Agrovet', '800.00', '960.00', 200), ('Multiplex', '780.00', '936.00', 150),
                ('Biostadt', '820.00', '984.00', 100), ('EID Parry', '850.00', '1020.00', 90),
                ('Jai Kisan', '790.00', '948.00', 120)
            ]
        },
        {
            'fertilizer_type': 'Organic',
            'base_name': 'Vermicompost',
            'description': 'High-quality earthworm compost rich in humus, micronutrients, and beneficial microbes.',
            'crops': 'All Crops, Gardening, Horticulture',
            'prevents': 'Poor Soil Structure, Nutrient Loss',
            'dose': '200 kg/acre',
            'usage_notes': 'Apply during land preparation and thoroughly mix into soil.',
            'unit': '40 kg bag',
            'color': '22c55e',
            'variations': [
                ('K.N. Biosciences', '400.00', '480.00', 300), ('Romvijay', '350.00', '420.00', 400),
                ('AgriSearch', '420.00', '504.00', 250), ('Green Vision', '380.00', '456.00', 350),
                ('IPL Biologicals', '450.00', '540.00', 280)
            ]
        },
        {
            'fertilizer_type': 'Organic',
            'base_name': 'Humic Acid 98%',
            'description': 'Highly concentrated organic compound to improve nutrient uptake, root growth, and soil conditioning.',
            'crops': 'Wheat, Paddy, Sugarcane, Vegetables',
            'prevents': 'Nutrient Lock-up, Weak Root System',
            'dose': '1 kg/acre',
            'usage_notes': 'Dissolve in water for fertigation or soil drenching.',
            'unit': '1 kg packet',
            'color': '22c55e',
            'variations': [
                ('Aries Agro', '650.00', '780.00', 150), ('Prathista', '620.00', '744.00', 200),
                ('Kan Biosys', '680.00', '816.00', 180), ('Som Phytopharma', '600.00', '720.00', 140),
                ('T. Stanes', '690.00', '828.00', 170)
            ]
        },
        {
            'fertilizer_type': 'Organic',
            'base_name': 'Seaweed Extract',
            'description': 'Organic biostimulant from marine algae. Enhances stress tolerance, fruit setting, and crop yield.',
            'crops': 'Fruits, Vegetables, Cotton, Tea',
            'prevents': 'Environmental Stress, Flower Drop',
            'dose': '2 ml/L',
            'usage_notes': 'Use as a foliar spray during flowering and fruiting stages.',
            'unit': '1 Litre bottle',
            'color': '22c55e',
            'variations': [
                ('Biostadt', '950.00', '1140.00', 120), ('PI Industries', '1100.00', '1320.00', 150),
                ('Godrej Agrovet', '1050.00', '1260.00', 130), ('Aries Agro', '980.00', '1176.00', 180),
                ('Multiplex', '920.00', '1104.00', 200)
            ]
        },
        {
            'fertilizer_type': 'Organic',
            'base_name': 'Bone Meal',
            'description': 'Slow-release organic source of phosphorus and calcium. Excellent for root vegetables and flowering plants.',
            'crops': 'Potato, Carrot, Rose, Citrus',
            'prevents': 'Poor Root Growth, Blossom Drop',
            'dose': '50 kg/acre',
            'usage_notes': 'Apply as a basal dose. Takes time to break down in soil.',
            'unit': '25 kg bag',
            'color': '22c55e',
            'variations': [
                ('AgriSearch', '650.00', '780.00', 100), ('Romvijay', '620.00', '744.00', 150),
                ('Green Vision', '600.00', '720.00', 200), ('Nico Orgo', '680.00', '816.00', 80),
                ('Prathista', '640.00', '768.00', 120)
            ]
        },
        {
            'fertilizer_type': 'Organic',
            'base_name': 'Mustard Cake',
            'description': 'Nutrient-rich organic fertilizer that provides nitrogen and repels harmful soil insects.',
            'crops': 'Vegetables, Spices, Flowers',
            'prevents': 'Soil Borne Pathogens, Slow Growth',
            'dose': '50 kg/acre',
            'usage_notes': 'Ferment in water for a few days before applying, or use directly in soil.',
            'unit': '25 kg bag',
            'color': '22c55e',
            'variations': [
                ('Godrej Agrovet', '550.00', '660.00', 180), ('Jai Kisan', '520.00', '624.00', 190),
                ('EID Parry', '580.00', '696.00', 140), ('Multiplex', '540.00', '648.00', 210),
                ('Biostadt', '570.00', '684.00', 160)
            ]
        },
        {
            'fertilizer_type': 'Organic',
            'base_name': 'Castor Cake',
            'description': 'Natural fertilizer that increases soil fertility and prevents termite and nematode attacks.',
            'crops': 'Sugarcane, Banana, Orchards',
            'prevents': 'Termites, Root Knot Nematodes',
            'dose': '100 kg/acre',
            'usage_notes': 'Apply around the root zone during field preparation.',
            'unit': '50 kg bag',
            'color': '22c55e',
            'variations': [
                ('Romvijay', '750.00', '900.00', 150), ('Green Vision', '720.00', '864.00', 140),
                ('AgriSearch', '780.00', '936.00', 110), ('T. Stanes', '800.00', '960.00', 90),
                ('Kan Biosys', '770.00', '924.00', 130)
            ]
        },
        {
            'fertilizer_type': 'Organic',
            'base_name': 'Organic Potash',
            'description': 'Bio-available potassium derived from plant ashes and organic matter to enhance fruit quality.',
            'crops': 'Banana, Grapes, Potato, Onion',
            'prevents': 'Potassium Deficiency, Water Stress',
            'dose': '25 kg/acre',
            'usage_notes': 'Incorporate during basal or mid-stage growth.',
            'unit': '25 kg bag',
            'color': '22c55e',
            'variations': [
                ('IPL Biologicals', '900.00', '1080.00', 120), ('Aries Agro', '920.00', '1104.00', 100),
                ('Prathista', '880.00', '1056.00', 140), ('Godrej Agrovet', '950.00', '1140.00', 90),
                ('Multiplex', '850.00', '1020.00', 160)
            ]
        },
        {
            'fertilizer_type': 'Organic',
            'base_name': 'Amino Acid Blend',
            'description': 'Liquid organic formulation providing essential amino acids for immediate plant stress relief and vitality.',
            'crops': 'All Crops, Cash Crops, Floriculture',
            'prevents': 'Drought Stress, Heat Shock',
            'dose': '2.5 ml/L',
            'usage_notes': 'Foliar spray during vegetative and flowering stages.',
            'unit': '1 Litre bottle',
            'color': '22c55e',
            'variations': [
                ('Biostadt', '850.00', '1020.00', 180), ('Som Phytopharma', '800.00', '960.00', 150),
                ('T. Stanes', '920.00', '1104.00', 120), ('Aries Agro', '890.00', '1068.00', 140),
                ('K.N. Biosciences', '830.00', '996.00', 170)
            ]
        },

        # ==============================================================
        # FUNGICIDE (40 products: 8 bases x 5 variations)
        # Color: a855f7 (purple)
        # ==============================================================
        {
            'fertilizer_type': 'Fungicide',
            'base_name': 'Mancozeb 75% WP',
            'description': 'Broad-spectrum contact fungicide that offers excellent protection against a wide range of fungal diseases.',
            'crops': 'Potato, Tomato, Grapes, Apple, Chilli',
            'prevents': 'Late Blight, Early Blight, Downy Mildew',
            'dose': '2-3 gm/L',
            'usage_notes': 'Apply preventively or immediately at first sign of disease.',
            'unit': '1 kg packet',
            'color': 'a855f7',
            'variations': [
                ('UPL', '450.00', '540.00', 250), ('Indofil', '480.00', '576.00', 220),
                ('Dhanuka', '460.00', '552.00', 180), ('Crystal Crop', '440.00', '528.00', 210),
                ('Bharat Rasayan', '420.00', '504.00', 190)
            ]
        },
        {
            'fertilizer_type': 'Fungicide',
            'base_name': 'Carbendazim 50% WP',
            'description': 'Systemic fungicide with protective and curative action against a variety of fungal pathogens.',
            'crops': 'Wheat, Rice, Groundnut, Mango',
            'prevents': 'Powdery Mildew, Anthracnose, Smut',
            'dose': '1-1.5 gm/L',
            'usage_notes': 'Can be used for seed treatment as well as foliar spray.',
            'unit': '500 gm packet',
            'color': 'a855f7',
            'variations': [
                ('Bayer CropScience', '320.00', '384.00', 150), ('BASF', '340.00', '408.00', 140),
                ('Syngenta', '330.00', '396.00', 180), ('PI Industries', '310.00', '372.00', 200),
                ('Rallis India', '300.00', '360.00', 220)
            ]
        },
        {
            'fertilizer_type': 'Fungicide',
            'base_name': 'Hexaconazole 5% SC',
            'description': 'Highly effective systemic fungicide that works well against powdery mildew and rusts.',
            'crops': 'Rice, Groundnut, Mango, Tea, Grapes',
            'prevents': 'Sheath Blight, Powdery Mildew, Rust',
            'dose': '2 ml/L',
            'usage_notes': 'Ensure thorough coverage of foliage during application.',
            'unit': '1 Litre bottle',
            'color': 'a855f7',
            'variations': [
                ('Tata Rallis', '650.00', '780.00', 120), ('Sumitomo Chemical', '680.00', '816.00', 110),
                ('Insecticides India', '600.00', '720.00', 140), ('Excel Crop Care', '620.00', '744.00', 150),
                ('Heranba', '580.00', '696.00', 180)
            ]
        },
        {
            'fertilizer_type': 'Fungicide',
            'base_name': 'Propiconazole 25% EC',
            'description': 'Systemic fungicide providing excellent control of severe rust and leaf spot diseases.',
            'crops': 'Wheat, Rice, Groundnut, Tea, Soybean',
            'prevents': 'Karnal Bunt, Rust, Leaf Spot',
            'dose': '1-1.5 ml/L',
            'usage_notes': 'Apply as soon as disease symptoms are noticed.',
            'unit': '500 ml bottle',
            'color': 'a855f7',
            'variations': [
                ('Syngenta', '750.00', '900.00', 90), ('UPL', '700.00', '840.00', 120),
                ('Dhanuka', '680.00', '816.00', 140), ('Coromandel', '720.00', '864.00', 110),
                ('Crystal Crop', '650.00', '780.00', 150)
            ]
        },
        {
            'fertilizer_type': 'Fungicide',
            'base_name': 'Tebuconazole 25.9% EC',
            'description': 'Broad-spectrum systemic fungicide offering both preventive and curative benefits for field crops.',
            'crops': 'Chilli, Onion, Rice, Groundnut',
            'prevents': 'Anthracnose, Purple Blotch, Tikka Disease',
            'dose': '1.5 ml/L',
            'usage_notes': 'Do not apply more than the recommended dose. Avoid spraying during high heat.',
            'unit': '500 ml bottle',
            'color': 'a855f7',
            'variations': [
                ('Bayer CropScience', '1100.00', '1320.00', 80), ('Sumitomo Chemical', '1050.00', '1260.00', 100),
                ('Rallis India', '980.00', '1176.00', 110), ('PI Industries', '1000.00', '1200.00', 120),
                ('Insecticides India', '950.00', '1140.00', 130)
            ]
        },
        {
            'fertilizer_type': 'Fungicide',
            'base_name': 'Copper Oxychloride 50% WP',
            'description': 'Reliable copper-based contact fungicide. Excellent for controlling bacterial blights and fungal spots.',
            'crops': 'Citrus, Banana, Potato, Tomato',
            'prevents': 'Bacterial Blight, Leaf Spot, Scab',
            'dose': '2.5-3 gm/L',
            'usage_notes': 'Use as a preventive spray. Can also be used for soil drenching.',
            'unit': '500 gm packet',
            'color': 'a855f7',
            'variations': [
                ('Indofil', '350.00', '420.00', 250), ('Tata Rallis', '360.00', '432.00', 210),
                ('BASF', '400.00', '480.00', 180), ('Excel Crop Care', '330.00', '396.00', 260),
                ('Bharat Rasayan', '320.00', '384.00', 240)
            ]
        },
        {
            'fertilizer_type': 'Fungicide',
            'base_name': 'Metalaxyl 35% WS',
            'description': 'Systemic fungicide primarily used as a seed treatment to prevent soil and seed-borne diseases.',
            'crops': 'Maize, Sunflower, Sorghum, Pearl Millet',
            'prevents': 'Downy Mildew, Damping Off',
            'dose': '3 gm/kg seed',
            'usage_notes': 'Treat seeds thoroughly before sowing to ensure full protection.',
            'unit': '100 gm packet',
            'color': 'a855f7',
            'variations': [
                ('UPL', '150.00', '180.00', 300), ('Syngenta', '170.00', '204.00', 280),
                ('Dhanuka', '140.00', '168.00', 320), ('Crystal Crop', '135.00', '162.00', 350),
                ('Sumitomo Chemical', '160.00', '192.00', 290)
            ]
        },
        {
            'fertilizer_type': 'Fungicide',
            'base_name': 'Azoxystrobin 23% SC',
            'description': 'Advanced broad-spectrum systemic fungicide offering excellent disease control and crop greening effect.',
            'crops': 'Tomato, Chilli, Grapes, Potato, Mango',
            'prevents': 'Late Blight, Powdery Mildew, Downy Mildew',
            'dose': '1 ml/L',
            'usage_notes': 'Do not mix with emulsifiable concentrate (EC) formulations.',
            'unit': '250 ml bottle',
            'color': 'a855f7',
            'variations': [
                ('Syngenta', '1350.00', '1620.00', 150), ('Bayer CropScience', '1400.00', '1680.00', 120),
                ('UPL', '1250.00', '1500.00', 180), ('PI Industries', '1300.00', '1560.00', 160),
                ('Rallis India', '1200.00', '1440.00', 200)
            ]
        },

        # ==============================================================
        # PESTICIDE (40 products: 8 bases x 5 variations)
        # Color: f97316 (orange)
        # ==============================================================
        {
            'fertilizer_type': 'Pesticide',
            'base_name': 'Chlorpyrifos 20% EC',
            'description': 'Organophosphate insecticide effective against a wide range of soil and foliage insects.',
            'crops': 'Sugarcane, Cotton, Paddy, Vegetables',
            'prevents': 'Termites, Stem Borer, Bollworms',
            'dose': '2-3 ml/L',
            'usage_notes': 'Use protective gear while spraying. Can be used as a soil drench for termites.',
            'unit': '1 Litre bottle',
            'color': 'f97316',
            'variations': [
                ('UPL', '480.00', '576.00', 180), ('Gharda Chemicals', '450.00', '540.00', 200),
                ('Excel Crop Care', '460.00', '552.00', 190), ('Bharat Rasayan', '430.00', '516.00', 210),
                ('Heranba', '420.00', '504.00', 220)
            ]
        },
        {
            'fertilizer_type': 'Pesticide',
            'base_name': 'Imidacloprid 17.8% SL',
            'description': 'Systemic insecticide highly effective for controlling sucking pests like aphids and jassids.',
            'crops': 'Cotton, Chilli, Tomato, Sugarcane',
            'prevents': 'Aphids, Jassids, Whitefly',
            'dose': '0.5 ml/L',
            'usage_notes': 'Apply immediately upon observing early pest incidence.',
            'unit': '250 ml bottle',
            'color': 'f97316',
            'variations': [
                ('Bayer CropScience', '750.00', '900.00', 150), ('UPL', '680.00', '816.00', 170),
                ('Tata Rallis', '700.00', '840.00', 160), ('Dhanuka', '650.00', '780.00', 190),
                ('Sumitomo Chemical', '720.00', '864.00', 140)
            ]
        },
        {
            'fertilizer_type': 'Pesticide',
            'base_name': 'Thiamethoxam 25% WG',
            'description': 'Broad-spectrum systemic insecticide known for rapid action and long-lasting protection against sucking pests.',
            'crops': 'Rice, Cotton, Citrus, Mango',
            'prevents': 'Hoppers, Aphids, Mealybugs',
            'dose': '0.3-0.5 gm/L',
            'usage_notes': 'Good rainfastness. Do not spray during active bee foraging times.',
            'unit': '100 gm packet',
            'color': 'f97316',
            'variations': [
                ('Syngenta', '350.00', '420.00', 250), ('PI Industries', '330.00', '396.00', 220),
                ('Crystal Crop', '310.00', '372.00', 240), ('Insecticides India', '300.00', '360.00', 260),
                ('Rallis India', '320.00', '384.00', 230)
            ]
        },
        {
            'fertilizer_type': 'Pesticide',
            'base_name': 'Lambda Cyhalothrin 5% EC',
            'description': 'Synthetic pyrethroid insecticide that acts on contact and ingestion, providing quick knockdown of pests.',
            'crops': 'Cotton, Paddy, Brinjal, Tomato',
            'prevents': 'Bollworms, Leaf Folder, Fruit Borer',
            'dose': '1-1.5 ml/L',
            'usage_notes': 'Ensure thorough coverage. Alternate with other chemical classes to prevent resistance.',
            'unit': '500 ml bottle',
            'color': 'f97316',
            'variations': [
                ('Syngenta', '450.00', '540.00', 150), ('UPL', '400.00', '480.00', 180),
                ('Gharda Chemicals', '380.00', '456.00', 200), ('Bharat Rasayan', '360.00', '432.00', 210),
                ('Excel Crop Care', '390.00', '468.00', 190)
            ]
        },
        {
            'fertilizer_type': 'Pesticide',
            'base_name': 'Cypermethrin 25% EC',
            'description': 'Potent contact insecticide commonly used to control severe caterpillar and borer infestations.',
            'crops': 'Cotton, Okra, Brinjal, Cabbage',
            'prevents': 'Spotted Bollworm, Shoot and Fruit Borer',
            'dose': '1-1.5 ml/L',
            'usage_notes': 'Do not harvest crops immediately after spraying; observe waiting periods.',
            'unit': '500 ml bottle',
            'color': 'f97316',
            'variations': [
                ('UPL', '380.00', '456.00', 200), ('Gharda Chemicals', '350.00', '420.00', 220),
                ('Sumitomo Chemical', '370.00', '444.00', 190), ('Rallis India', '340.00', '408.00', 230),
                ('Dhanuka', '360.00', '432.00', 210)
            ]
        },
        {
            'fertilizer_type': 'Pesticide',
            'base_name': 'Profenofos 50% EC',
            'description': 'Organophosphate acting as an insecticide and acaricide with excellent translaminar action.',
            'crops': 'Cotton, Soybean, Tea',
            'prevents': 'Red Spider Mite, Bollworms, Whitefly',
            'dose': '2-3 ml/L',
            'usage_notes': 'Apply as soon as pest population reaches economic threshold levels.',
            'unit': '1 Litre bottle',
            'color': 'f97316',
            'variations': [
                ('Syngenta', '850.00', '1020.00', 110), ('PI Industries', '800.00', '960.00', 140),
                ('Tata Rallis', '780.00', '936.00', 150), ('Heranba', '750.00', '900.00', 160),
                ('Crystal Crop', '720.00', '864.00', 180)
            ]
        },
        {
            'fertilizer_type': 'Pesticide',
            'base_name': 'Emamectin Benzoate 5% SG',
            'description': 'Highly effective insecticide for caterpillar control with strong translaminar properties.',
            'crops': 'Cotton, Cabbage, Chilli, Pigeon Pea',
            'prevents': 'Diamondback Moth, Pod Borer, Thrips',
            'dose': '0.5 gm/L',
            'usage_notes': 'Very safe for beneficial insects. Soluble granular formulation is easy to mix.',
            'unit': '100 gm packet',
            'color': 'f97316',
            'variations': [
                ('Syngenta', '550.00', '660.00', 180), ('Dhanuka', '500.00', '600.00', 200),
                ('Rallis India', '480.00', '576.00', 220), ('Insecticides India', '450.00', '540.00', 240),
                ('Sumitomo Chemical', '520.00', '624.00', 190)
            ]
        },
        {
            'fertilizer_type': 'Pesticide',
            'base_name': 'Fipronil 5% SC',
            'description': 'Broad-spectrum insecticide effective via contact and ingestion for rigorous control of stem borers.',
            'crops': 'Rice, Cabbage, Sugarcane, Chilli',
            'prevents': 'Stem Borer, Leaf Folder, Thrips',
            'dose': '1.5-2 ml/L',
            'usage_notes': 'Provides long-lasting protection. Shake well before use.',
            'unit': '500 ml bottle',
            'color': 'f97316',
            'variations': [
                ('Bayer CropScience', '800.00', '960.00', 130), ('BASF', '820.00', '984.00', 120),
                ('Gharda Chemicals', '750.00', '900.00', 160), ('Excel Crop Care', '730.00', '876.00', 170),
                ('Bharat Rasayan', '700.00', '840.00', 190)
            ]
        },

        # ==============================================================
        # MICRONUTRIENT (35 products: 7 bases x 5 variations)
        # Color: f59e0b (amber)
        # ==============================================================
        {
            'fertilizer_type': 'Micronutrient',
            'base_name': 'Zinc Sulphate 21%',
            'description': 'Essential micronutrient for enzyme activation and chlorophyll synthesis, promoting overall plant health.',
            'crops': 'Rice, Wheat, Maize, Cotton, Citrus',
            'prevents': 'Khaira Disease, Stunted Growth',
            'dose': '10 kg/acre',
            'usage_notes': 'Apply as basal dressing or dissolved for foliar spray. Do not mix with phosphatic fertilizers.',
            'unit': '10 kg bag',
            'color': 'f59e0b',
            'variations': [
                ('Aries Agro', '650.00', '780.00', 250), ('Multiplex', '620.00', '744.00', 230),
                ('Coromandel', '680.00', '816.00', 200), ('IFFCO', '600.00', '720.00', 300),
                ('Mahadhan', '630.00', '756.00', 210)
            ]
        },
        {
            'fertilizer_type': 'Micronutrient',
            'base_name': 'Ferrous Sulphate 19%',
            'description': 'Iron supplement necessary for chloroplast development and nitrogen fixation.',
            'crops': 'Sugarcane, Grapes, Citrus, Groundnut',
            'prevents': 'Iron Chlorosis (Yellowing)',
            'dose': '10 kg/acre',
            'usage_notes': 'Best results when applied with organic manure to prevent fixation in the soil.',
            'unit': '10 kg bag',
            'color': 'f59e0b',
            'variations': [
                ('Multiplex', '450.00', '540.00', 180), ('Aries Agro', '480.00', '576.00', 160),
                ('Jai Kisan', '420.00', '504.00', 200), ('T. Stanes', '460.00', '552.00', 190),
                ('Prathista', '440.00', '528.00', 170)
            ]
        },
        {
            'fertilizer_type': 'Micronutrient',
            'base_name': 'Borax 10.5%',
            'description': 'Crucial for cell wall formation, pollen tube growth, and fruit development.',
            'crops': 'Tomato, Cauliflower, Cotton, Papaya',
            'prevents': 'Fruit Cracking, Hollow Heart',
            'dose': '4-5 kg/acre',
            'usage_notes': 'Apply uniformly to soil. Avoid over-application as boron toxicity can occur.',
            'unit': '5 kg bag',
            'color': 'f59e0b',
            'variations': [
                ('Aries Agro', '400.00', '480.00', 150), ('Godrej Agrovet', '420.00', '504.00', 140),
                ('Multiplex', '380.00', '456.00', 180), ('Coromandel', '430.00', '516.00', 130),
                ('IFFCO', '390.00', '468.00', 200)
            ]
        },
        {
            'fertilizer_type': 'Micronutrient',
            'base_name': 'Magnesium Sulphate',
            'description': 'Provides magnesium and sulfur, vital for photosynthesis and preventing premature leaf drop.',
            'crops': 'Cotton, Citrus, Banana, Tea',
            'prevents': 'Interveinal Chlorosis, Premature Leaf Drop',
            'dose': '25 kg/acre',
            'usage_notes': 'Can be used both as a soil applicant or a highly soluble foliar spray.',
            'unit': '25 kg bag',
            'color': 'f59e0b',
            'variations': [
                ('Mahadhan', '600.00', '720.00', 200), ('Aries Agro', '650.00', '780.00', 180),
                ('Multiplex', '620.00', '744.00', 210), ('Coromandel', '680.00', '816.00', 160),
                ('Jai Kisan', '580.00', '696.00', 220)
            ]
        },
        {
            'fertilizer_type': 'Micronutrient',
            'base_name': 'Manganese Sulphate',
            'description': 'Assists in photosynthesis, respiration, and nitrogen assimilation.',
            'crops': 'Wheat, Soybean, Potato, Citrus',
            'prevents': 'Manganese Deficiency, Leaf Mottling',
            'dose': '5-10 kg/acre',
            'usage_notes': 'Apply evenly across the field. Foliar spray is often more effective in alkaline soils.',
            'unit': '10 kg bag',
            'color': 'f59e0b',
            'variations': [
                ('T. Stanes', '700.00', '840.00', 120), ('Prathista', '680.00', '816.00', 140),
                ('Aries Agro', '720.00', '864.00', 110), ('Multiplex', '690.00', '828.00', 130),
                ('Godrej Agrovet', '750.00', '900.00', 90)
            ]
        },
        {
            'fertilizer_type': 'Micronutrient',
            'base_name': 'Copper Sulphate',
            'description': 'Essential for lignin synthesis, enzyme systems, and plant disease resistance.',
            'crops': 'Citrus, Wheat, Onion, Carrots',
            'prevents': 'Dieback, Stunted Growth',
            'dose': '2-3 kg/acre',
            'usage_notes': 'Use carefully to avoid copper accumulation in soil.',
            'unit': '5 kg bag',
            'color': 'f59e0b',
            'variations': [
                ('Multiplex', '800.00', '960.00', 150), ('Aries Agro', '820.00', '984.00', 140),
                ('IFFCO', '750.00', '900.00', 200), ('Coromandel', '850.00', '1020.00', 120),
                ('Mahadhan', '780.00', '936.00', 180)
            ]
        },
        {
            'fertilizer_type': 'Micronutrient',
            'base_name': 'Micronutrient Mixture Grade 4',
            'description': 'State-specific multi-micronutrient blend to correct multiple deficiencies simultaneously.',
            'crops': 'All crops, Vegetables, Fruits',
            'prevents': 'Multiple Micronutrient Deficiencies',
            'dose': '10 kg/acre',
            'usage_notes': 'Ideal for basal application. Mix with sand or dry soil for even broadcasting.',
            'unit': '10 kg bag',
            'color': 'f59e0b',
            'variations': [
                ('Aries Agro', '750.00', '900.00', 220), ('Multiplex', '720.00', '864.00', 250),
                ('T. Stanes', '700.00', '840.00', 200), ('Godrej Agrovet', '780.00', '936.00', 180),
                ('Coromandel', '800.00', '960.00', 160)
            ]
        },

        # ==============================================================
        # BIOFERTILIZER (40 products: 8 bases x 5 variations)
        # Color: 14b8a6 (teal)
        # ==============================================================
        {
            'fertilizer_type': 'Biofertilizer',
            'base_name': 'Trichoderma Viride',
            'description': 'Eco-friendly bio-fungicide that protects crops from soil-borne pathogens and improves root development.',
            'crops': 'Pulses, Oilseeds, Vegetables, Cotton',
            'prevents': 'Root Rot, Wilt, Damping Off',
            'dose': '2 kg/acre',
            'usage_notes': 'Mix with Farm Yard Manure and incubate before applying to the field.',
            'unit': '1 kg packet',
            'color': '14b8a6',
            'variations': [
                ('T. Stanes', '250.00', '300.00', 300), ('Romvijay', '230.00', '276.00', 320),
                ('Kan Biosys', '260.00', '312.00', 280), ('IPL Biologicals', '280.00', '336.00', 250),
                ('Agri Life', '240.00', '288.00', 310)
            ]
        },
        {
            'fertilizer_type': 'Biofertilizer',
            'base_name': 'Pseudomonas Fluorescens',
            'description': 'Beneficial bacteria that suppress plant diseases and promote healthy growth.',
            'crops': 'Paddy, Banana, Sugarcane, Tomato',
            'prevents': 'Bacterial Blight, Sheath Blight',
            'dose': '2 kg/acre',
            'usage_notes': 'Can be used for seed treatment, seedling dip, and soil application.',
            'unit': '1 kg packet',
            'color': '14b8a6',
            'variations': [
                ('K.N. Biosciences', '260.00', '312.00', 250), ('Green Vision', '240.00', '288.00', 270),
                ('AgriSearch', '270.00', '324.00', 230), ('Romvijay', '220.00', '264.00', 290),
                ('T. Stanes', '250.00', '300.00', 260)
            ]
        },
        {
            'fertilizer_type': 'Biofertilizer',
            'base_name': 'Azotobacter',
            'description': 'Free-living nitrogen-fixing bacteria that supplement nitrogen requirement naturally.',
            'crops': 'Wheat, Maize, Cotton, Mustard',
            'prevents': 'Nitrogen Deficiency',
            'dose': '1 L/acre',
            'usage_notes': 'Store in a cool place. Best applied via drip irrigation or mixed with compost.',
            'unit': '1 Litre bottle',
            'color': '14b8a6',
            'variations': [
                ('IPL Biologicals', '300.00', '360.00', 200), ('Agri Life', '280.00', '336.00', 220),
                ('Kan Biosys', '320.00', '384.00', 180), ('Som Phytopharma', '290.00', '348.00', 210),
                ('Nico Orgo', '270.00', '324.00', 230)
            ]
        },
        {
            'fertilizer_type': 'Biofertilizer',
            'base_name': 'Rhizobium',
            'description': 'Symbiotic nitrogen-fixing bacteria tailored for legume crops to enhance root nodulation.',
            'crops': 'Soybean, Groundnut, Gram, Pea',
            'prevents': 'Poor Nodulation, Nitrogen Scarcity',
            'dose': '250 gm/10 kg seed',
            'usage_notes': 'Use strictly as a seed treatment before sowing.',
            'unit': '250 gm packet',
            'color': '14b8a6',
            'variations': [
                ('Romvijay', '100.00', '120.00', 400), ('K.N. Biosciences', '120.00', '144.00', 350),
                ('Green Vision', '110.00', '132.00', 380), ('AgriSearch', '130.00', '156.00', 320),
                ('T. Stanes', '115.00', '138.00', 360)
            ]
        },
        {
            'fertilizer_type': 'Biofertilizer',
            'base_name': 'Vesicular Arbuscular Mycorrhiza (VAM)',
            'description': 'Fungal biofertilizer that expands the root network to mobilize phosphorus and water.',
            'crops': 'Papaya, Citrus, Sugarcane, Vegetables',
            'prevents': 'Phosphorus Deficiency, Drought Stress',
            'dose': '4 kg/acre',
            'usage_notes': 'Apply near the root zone. Avoid concurrent use of chemical fungicides.',
            'unit': '4 kg bag',
            'color': '14b8a6',
            'variations': [
                ('TERI', '450.00', '540.00', 150), ('IPL Biologicals', '480.00', '576.00', 120),
                ('Kan Biosys', '500.00', '600.00', 110), ('Agri Life', '460.00', '552.00', 140),
                ('Som Phytopharma', '440.00', '528.00', 160)
            ]
        },
        {
            'fertilizer_type': 'Biofertilizer',
            'base_name': 'Phosphate Solubilizing Bacteria (PSB)',
            'description': 'Biological culture that solubilizes insoluble soil phosphates into plant-usable forms.',
            'crops': 'All Crops, Legumes, Cereals',
            'prevents': 'Phosphorus Lock-up',
            'dose': '1 L/acre',
            'usage_notes': 'Highly effective in alkaline soils. Drip or soil application.',
            'unit': '1 Litre bottle',
            'color': '14b8a6',
            'variations': [
                ('K.N. Biosciences', '350.00', '420.00', 250), ('Romvijay', '320.00', '384.00', 280),
                ('Green Vision', '340.00', '408.00', 260), ('AgriSearch', '360.00', '432.00', 240),
                ('T. Stanes', '330.00', '396.00', 270)
            ]
        },
        {
            'fertilizer_type': 'Biofertilizer',
            'base_name': 'Potash Mobilizing Bacteria (KMB)',
            'description': 'Biofertilizer capable of mobilizing trapped potash in soil, enhancing crop quality.',
            'crops': 'Potato, Banana, Sugarcane, Grapes',
            'prevents': 'Potassium Deficiency',
            'dose': '1 L/acre',
            'usage_notes': 'Can be mixed with FYM and broadcasted or given through fertigation.',
            'unit': '1 Litre bottle',
            'color': '14b8a6',
            'variations': [
                ('IPL Biologicals', '380.00', '456.00', 180), ('Agri Life', '360.00', '432.00', 200),
                ('Kan Biosys', '400.00', '480.00', 150), ('Som Phytopharma', '370.00', '444.00', 190),
                ('Nico Orgo', '350.00', '420.00', 210)
            ]
        },
        {
            'fertilizer_type': 'Biofertilizer',
            'base_name': 'Zinc Solubilizing Bacteria (ZSB)',
            'description': 'Eco-friendly bacteria that converts unavailable zinc in the soil into an assimilable form.',
            'crops': 'Paddy, Wheat, Maize, Citrus',
            'prevents': 'Zinc Deficiency',
            'dose': '1 L/acre',
            'usage_notes': 'Apply as a soil drench or via drip irrigation for optimal coverage.',
            'unit': '1 Litre bottle',
            'color': '14b8a6',
            'variations': [
                ('Romvijay', '400.00', '480.00', 220), ('K.N. Biosciences', '420.00', '504.00', 200),
                ('Green Vision', '380.00', '456.00', 240), ('AgriSearch', '450.00', '540.00', 180),
                ('T. Stanes', '410.00', '492.00', 210)
            ]
        }
    ]

    fertilizers_to_create = []

    for base in base_products:
        color = base['color']
        f_type = base['fertilizer_type']
        desc = base['description']
        crops = base['crops']
        prevents = base['prevents']
        dose = base['dose']
        usage_notes = base['usage_notes']
        unit = base['unit']
        base_name = base['base_name']

        for brand, price_str, orig_price_str, stock in base['variations']:
            full_name = f"{brand} {base_name}"
            
            fertilizers_to_create.append(
                Fertilizer(
                    name=full_name,
                    brand=brand,
                    fertilizer_type=f_type,
                    description=desc,
                    crops=crops,
                    prevents=prevents,
                    dose=dose,
                    usage_notes=usage_notes,
                    price=Decimal(price_str),
                    original_price=Decimal(orig_price_str),
                    unit=unit,
                    stock=stock,
                    rating=0.0,
                    review_count=0,
                    is_verified=True,
                    is_active=True,
                    image_url=get_image_url(f_type, full_name, brand=brand, unit=unit)
                )
            )

    # Validate we have exactly 250
    print(f"Prepared {len(fertilizers_to_create)} fertilizers for creation.")
    
    # Bulk create
    Fertilizer.objects.bulk_create(fertilizers_to_create)
    
    # 5. Print a summary at the end
    print(f"Successfully seeded {Fertilizer.objects.count()} fertilizers into the database.")
    
    # Optional: Detailed summary by type
    types = ['Chemical', 'Organic', 'Fungicide', 'Pesticide', 'Micronutrient', 'Biofertilizer']
    print("\nSummary by Type:")
    for t in types:
        count = Fertilizer.objects.filter(fertilizer_type=t).count()
        print(f"- {t}: {count}")

if __name__ == '__main__':
    seed_fertilizers()
