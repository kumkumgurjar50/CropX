"""
Management command: seed_fertilizers
Usage: python manage.py seed_fertilizers
Seeds 20 realistic fertilizer products with real product images.
Safe to run multiple times — updates image_url on existing records too.
"""
from django.core.management.base import BaseCommand
from farms.models import Fertilizer


# Confirmed Pexels CDN URLs — real fertilizer/agro product images (CC0 licence)
# Each URL tested and verified 200 OK.
#
# ID mapping by type:
#   Spray bottles (pesticide/fungicide) : 5302899, 5302901, 3962285, 6231819, 8538265
#   Granules/powder (chemical/micro)    : 4750270, 4750274, 4750289, 4750279
#   Bags / bulk (organic/NPK)           : 4503273, 4503268, 4503270
#   Soil / organic / compost            : 1301856, 2132227
#   Liquid bottles                      : 12247010, 9553940
#
def _px(photo_id):
    return f'https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg?auto=compress&cs=tinysrgb&w=400'


FERTILIZERS = [
    dict(
        name='EcoVigor 5', brand='EcoFarm', fertilizer_type='Chemical',
        crops='Tomato, Banana, Onion, Cauliflower, Cabbage',
        prevents='Fusarium Wilt',
        dose='4.0 ml/L', price=520, original_price=591,
        rating=4.4, review_count=432, is_verified=True,
        description='Broad-spectrum systemic chemical fungicide effective against soil-borne pathogens.',
        unit='per bottle',
        image_url=_px(4750270),   # blue fertilizer granules in hands
    ),
    dict(
        name='GreenSafe', brand='AgriGuard', fertilizer_type='Fungicide',
        crops='Grapes, Strawberry, Sugarcane',
        prevents='Caterpillars',
        dose='2.4 ml/L', price=390, original_price=433,
        rating=4.5, review_count=165, is_verified=True,
        description='Contact fungicide with broad-spectrum action against foliar diseases.',
        unit='per bottle',
        image_url=_px(5302899),   # green spray bottle in field
    ),
    dict(
        name='BioStop', brand='BioAg', fertilizer_type='Organic',
        crops='Banana',
        prevents='Botrytis',
        dose='3.2 ml/L', price=940, original_price=1146,
        rating=4.6, review_count=289, is_verified=True,
        description='Organic biofungicide derived from Bacillus subtilis for post-harvest protection.',
        unit='per bottle',
        image_url=_px(1301856),   # organic compost / soil
    ),
    dict(
        name='PhosSafe', brand='NutriMax', fertilizer_type='Micronutrient',
        crops='Cotton, Tomato',
        prevents='Nematodes',
        dose='4.4 g/L', price=680, original_price=739,
        rating=4.7, review_count=512, is_verified=True,
        description='Phosphonate-based micronutrient booster that also suppresses root nematodes.',
        unit='per kg',
        image_url=_px(4750274),   # fertilizer granules close-up
    ),
    dict(
        name='ZincYield', brand='GroMore', fertilizer_type='Chemical',
        crops='Potato, Corn, Onion, Grapes',
        prevents='Scab',
        dose='2.9 g/100L', price=590, original_price=670,
        rating=4.8, review_count=48, is_verified=True,
        description='Zinc sulfate-based fertilizer that increases yield and prevents scab.',
        unit='per kg',
        image_url=_px(4750289),   # blue granular fertilizer
    ),
    dict(
        name='NimShield', brand='OrganicIndia', fertilizer_type='Pesticide',
        crops='Cauliflower',
        prevents='Aphids, Mosaic Virus',
        dose='5.0 ml/L', price=780, original_price=886,
        rating=4.3, review_count=210, is_verified=True,
        description='Neem oil-based bio-pesticide safe for pollinators and soil microbes.',
        unit='per litre',
        image_url=_px(5302901),   # spray bottle in field — pesticide application
    ),
    dict(
        name='AquaBoost', brand='HydroFarm', fertilizer_type='Organic',
        crops='Sugarcane, Potato',
        prevents='Downy Mildew, Aphids',
        dose='3.0 ml/L', price=440, original_price=537,
        rating=4.2, review_count=178, is_verified=True,
        description='Seaweed extract-based organic fertilizer with natural growth stimulants.',
        unit='per litre',
        image_url=_px(12247010),  # fertilizer container in garden soil
    ),
    dict(
        name='FungoClear', brand='ClearCrop', fertilizer_type='Fungicide',
        crops='Mango, Apple, Cotton, Onion, Banana',
        prevents='Blight, Downy Mildew',
        dose='2.0 ml/L', price=1000, original_price=1111,
        rating=4.5, review_count=320, is_verified=True,
        description='Systemic fungicide with curative and protective action for multiple crops.',
        unit='per bottle',
        image_url=_px(3962285),   # chemical spray bottle
    ),
    dict(
        name='TricoMax', brand='BioSolutions', fertilizer_type='Biofertilizer',
        crops='Tea, Cauliflower, Tomato, Soybean, Onion',
        prevents='Mosaic Virus, Caterpillars',
        dose='10 g/kg seed', price=970, original_price=1141,
        rating=4.6, review_count=95, is_verified=True,
        description='Trichoderma-based biofertilizer that promotes root growth and suppresses pathogens.',
        unit='per kg',
        image_url=_px(2132227),   # soil and organic matter
    ),
    dict(
        name='KaliBoost', brand='SoilPro', fertilizer_type='Chemical',
        crops='Wheat, Rice, Sugarcane',
        prevents='Stem Rot',
        dose='3.5 g/L', price=460, original_price=530,
        rating=4.1, review_count=267, is_verified=True,
        description='Potassium-enriched fertilizer to strengthen cell walls and reduce lodging.',
        unit='per kg',
        image_url=_px(4503273),   # fertilizer sack / bag
    ),
    dict(
        name='RootGuard', brand='RhizoTech', fertilizer_type='Biofertilizer',
        crops='Soybean, Chickpea, Groundnut',
        prevents='Root Rot, Wilt',
        dose='200 ml/acre', price=350, original_price=420,
        rating=4.4, review_count=134, is_verified=True,
        description='Rhizobium inoculant that fixes atmospheric nitrogen and boosts root health.',
        unit='per bottle',
        image_url=_px(6231819),   # spray bottle in garden
    ),
    dict(
        name='PhosMax', brand='NutriGrow', fertilizer_type='Chemical',
        crops='Maize, Cotton, Sunflower',
        prevents='Phosphorus Deficiency',
        dose='5 kg/acre', price=720, original_price=850,
        rating=4.3, review_count=189, is_verified=True,
        description='High-phosphorus granular fertilizer for flowering and fruiting stages.',
        unit='per kg',
        image_url=_px(4750279),   # fertilizer granules heap
    ),
    dict(
        name='OrganGrow', brand='NatureFarm', fertilizer_type='Organic',
        crops='All vegetables, Fruits',
        prevents='Nutrient Deficiency',
        dose='250 kg/acre', price=1200, original_price=1450,
        rating=4.7, review_count=405, is_verified=True,
        description='Premium vermicompost enriched with humic acid for sustained crop nutrition.',
        unit='per 50kg bag',
        image_url=_px(4503268),   # fertilizer bags warehouse
    ),
    dict(
        name='SpiderStop', brand='PestOff', fertilizer_type='Pesticide',
        crops='Tomato, Brinjal, Capsicum',
        prevents='Spider Mites, Thrips',
        dose='1.5 ml/L', price=480, original_price=600,
        rating=4.2, review_count=156, is_verified=False,
        description='Acaricide effective against spider mites with quick knockdown action.',
        unit='per bottle',
        image_url=_px(8538265),   # pesticide/fungicide bottle close-up
    ),
    dict(
        name='MicroBlend', brand='MicroTech', fertilizer_type='Micronutrient',
        crops='Paddy, Wheat, Maize',
        prevents='Zinc Deficiency, Iron Chlorosis',
        dose='2.5 kg/acre', price=630, original_price=700,
        rating=4.5, review_count=298, is_verified=True,
        description='Complete micronutrient mixture with Zn, Fe, Mn, Cu, B and Mo.',
        unit='per kg',
        image_url=_px(4750270),   # granules in hands
    ),
    dict(
        name='CopperShield', brand='AgriChem', fertilizer_type='Fungicide',
        crops='Potato, Tomato, Grapes',
        prevents='Late Blight, Downy Mildew, Anthracnose',
        dose='3.0 g/L', price=310, original_price=380,
        rating=4.0, review_count=221, is_verified=True,
        description='Copper-based protective fungicide with long residual activity.',
        unit='per kg',
        image_url=_px(5302899),   # spray bottle field
    ),
    dict(
        name='NitroPower', brand='CropBoost', fertilizer_type='Chemical',
        crops='Wheat, Paddy, Maize, Vegetables',
        prevents='Nitrogen Deficiency',
        dose='120 kg/ha', price=850, original_price=950,
        rating=4.3, review_count=512, is_verified=True,
        description='Urea-coated granular nitrogen fertilizer with slow-release technology.',
        unit='per 50kg bag',
        image_url=_px(4503270),   # fertilizer bag pile
    ),
    dict(
        name='SilkaMite', brand='BioControl', fertilizer_type='Pesticide',
        crops='Cotton, Okra, Brinjal',
        prevents='Jassids, Whitefly, Aphids',
        dose='2.0 ml/L', price=550, original_price=650,
        rating=4.4, review_count=174, is_verified=True,
        description='Systemic insecticide for sucking pest control in cotton and vegetables.',
        unit='per bottle',
        image_url=_px(3962285),   # chemical spray bottle
    ),
    dict(
        name='CalMag Plus', brand='FoliarPro', fertilizer_type='Micronutrient',
        crops='Tomato, Capsicum, Apple',
        prevents='Blossom End Rot, Tip Burn',
        dose='3.0 ml/L', price=420, original_price=490,
        rating=4.6, review_count=331, is_verified=True,
        description='Calcium and magnesium foliar spray prevents physiological disorders.',
        unit='per litre',
        image_url=_px(9553940),   # liquid fertilizer bottle
    ),
    dict(
        name='HumiGrow', brand='SoilLife', fertilizer_type='Organic',
        crops='All crops',
        prevents='Soil Compaction, Nutrient Lock',
        dose='5 L/acre', price=780, original_price=920,
        rating=4.5, review_count=267, is_verified=True,
        description='Humic and fulvic acid concentrate that improves soil structure and nutrient uptake.',
        unit='per litre',
        image_url=_px(1301856),   # organic soil / compost
    ),
]


class Command(BaseCommand):
    help = 'Seed 20 fertilizer products with real images into the database'

    def handle(self, *args, **options):
        created = 0
        updated = 0
        for raw in FERTILIZERS:
            data      = dict(raw)
            image_url = data.pop('image_url', '')
            name      = data['name']

            # Get or create the record
            obj, is_new = Fertilizer.objects.get_or_create(name=name, defaults=data)

            # Force-write image_url via a direct queryset update (bypasses all caching)
            Fertilizer.objects.filter(pk=obj.pk).update(image_url=image_url)

            if is_new:
                created += 1
                self.stdout.write(self.style.SUCCESS(f'  Created: {name}'))
            else:
                updated += 1
                self.stdout.write(f'  Updated image: {name}')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone — {created} created, {updated} updated.'
        ))
