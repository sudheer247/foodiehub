from django.core.management.base import BaseCommand
from api.models import Food


def unsplash(photo_id):
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=700&q=80"


FOODS = [
    (1, "Chicken Biryani", "Biryani", 220, 4.8, "Aromatic rice cooked with delicious chicken.", "/images/chicken-biryani.svg"),
    (2, "Veg Biryani", "Biryani", 160, 4.5, "Flavorful basmati rice with fresh vegetables.", unsplash("1589302168068-964664d93dc0")),
    (3, "Margherita Pizza", "Pizza", 199, 4.7, "Classic pizza with cheese and tomato.", unsplash("1579751626657-72bc17010498")),
    (4, "Chicken Burger", "Burger", 150, 4.6, "Juicy chicken burger with fresh vegetables.", unsplash("1568901346375-23c9450c58cd")),
    (5, "Masala Dosa", "South Indian", 80, 4.5, "Crispy dosa served with chutney and sambar.", unsplash("1668236543090-82eba5ee5976")),
    (6, "Chocolate Cake", "Dessert", 120, 4.9, "Rich chocolate cake for sweet lovers.", unsplash("1578985545062-69928b1d9587")),
    (7, "Cheese Burger", "Burger", 130, 4.4, "A tasty burger loaded with melted cheese.", "/images/cheese-burger.svg"),
    (8, "Paneer Pizza", "Pizza", 240, 4.7, "Delicious pizza topped with paneer and cheese.", unsplash("1513104890138-7c749659a591")),
    (9, "Gulab Jamun", "Dessert", 70, 4.6, "Soft, sweet dumplings in sugar syrup.", "/images/gulab-jamun.svg"),
    # ---- more dishes (no photo yet: the site shows an emoji tile) ----
    (10, "Mutton Biryani", "Biryani", 280, 4.7, "Tender mutton cooked with fragrant basmati rice.", ""),
    (11, "Egg Biryani", "Biryani", 170, 4.4, "Spiced rice layered with boiled eggs.", ""),
    (12, "Paneer Biryani", "Biryani", 190, 4.5, "Basmati rice with marinated paneer and herbs.", ""),
    (13, "Hyderabadi Dum Biryani", "Biryani", 250, 4.9, "Slow-cooked dum biryani with rich spices.", ""),
    (14, "Farmhouse Pizza", "Pizza", 260, 4.6, "Loaded with capsicum, onion, tomato and mushrooms.", ""),
    (15, "Pepperoni Pizza", "Pizza", 280, 4.7, "Classic pizza topped with spicy pepperoni.", ""),
    (16, "BBQ Chicken Pizza", "Pizza", 290, 4.6, "Smoky barbecue chicken with melted cheese.", ""),
    (17, "Cheese Burst Pizza", "Pizza", 270, 4.8, "Extra cheese inside the crust and on top.", ""),
    (18, "Veg Burger", "Burger", 110, 4.3, "Crispy veg patty with fresh lettuce and sauce.", ""),
    (19, "Paneer Burger", "Burger", 140, 4.5, "Spiced paneer patty with creamy mayo.", ""),
    (20, "Double Patty Burger", "Burger", 190, 4.7, "Two juicy patties stacked with cheese.", ""),
    (21, "Crispy Chicken Burger", "Burger", 160, 4.6, "Golden fried chicken with crunchy lettuce.", ""),
    (22, "Idli Sambar", "South Indian", 60, 4.5, "Soft steamed idlis with hot sambar and chutney.", ""),
    (23, "Medu Vada", "South Indian", 70, 4.4, "Crispy lentil donuts served with chutney.", ""),
    (24, "Ghee Roast Dosa", "South Indian", 100, 4.7, "Thin golden dosa roasted in pure ghee.", ""),
    (25, "Onion Uttapam", "South Indian", 90, 4.4, "Thick pancake topped with onions and chillies.", ""),
    (26, "Rasmalai", "Dessert", 90, 4.8, "Soft paneer discs soaked in sweet saffron milk.", ""),
    (27, "Chocolate Brownie", "Dessert", 140, 4.7, "Warm fudgy brownie with chocolate sauce.", ""),
    (28, "Vanilla Ice Cream Sundae", "Dessert", 110, 4.5, "Creamy vanilla ice cream with toppings.", ""),
    (29, "Jalebi", "Dessert", 60, 4.5, "Crispy swirls dipped in sugar syrup.", ""),
]


class Command(BaseCommand):
    help = "Load the FoodieHub menu (safe to run more than once)"

    def handle(self, *args, **options):
        for id_, name, category, price, rating, description, image in FOODS:
            Food.objects.update_or_create(
                id=id_,
                defaults=dict(name=name, category=category, price=price,
                              rating=rating, description=description, image=image),
            )
        self.stdout.write(self.style.SUCCESS(f"Loaded {len(FOODS)} dishes."))