"""
Script to generate the sample Customer Behaviour CSV dataset.
Run: python generate_data.py
"""
import csv
import random
import math

random.seed(42)
n = 500

def lerp(a, b, t): return a + (b - a) * t

rows = []
for i in range(n):
    gender = random.choice(["Male", "Female"])
    city_tier = random.choices(["Tier 1", "Tier 2", "Tier 3"], weights=[40, 35, 25])[0]
    age = random.randint(18, 65)
    monthly_income = random.randint(20000, 150000)

    # Tier boosts income
    tier_boost = {"Tier 1": 1.3, "Tier 2": 1.0, "Tier 3": 0.75}[city_tier]
    monthly_income = int(monthly_income * tier_boost)
    monthly_income = min(max(monthly_income, 15000), 200000)

    daily_internet_hours = round(random.uniform(1, 10), 1)
    smartphone_usage_years = random.randint(1, 12)
    social_media_hours = round(random.uniform(0.5, 6), 1)
    online_payment_trust_score = random.randint(1, 10)
    tech_savvy_score = random.randint(1, 10)

    monthly_online_orders = max(0, int(tech_savvy_score * 1.5 + daily_internet_hours * 0.8 + random.gauss(0, 2)))
    monthly_online_orders = min(monthly_online_orders, 30)
    monthly_store_visits = max(0, int(10 - tech_savvy_score * 0.7 + random.gauss(0, 2)))
    monthly_store_visits = min(monthly_store_visits, 20)

    avg_online_spend = max(200, monthly_income * 0.15 * (tech_savvy_score / 10) + random.gauss(0, 500))
    avg_online_spend = min(round(avg_online_spend, 2), 30000)
    avg_store_spend = max(100, monthly_income * 0.12 * ((10 - tech_savvy_score) / 10) + random.gauss(0, 400))
    avg_store_spend = min(round(avg_store_spend, 2), 25000)

    # Shopping preference based on behavior
    if tech_savvy_score >= 7:
        pref = random.choices(["Online", "Offline", "Both"], weights=[70, 10, 20])[0]
    elif tech_savvy_score <= 3:
        pref = random.choices(["Online", "Offline", "Both"], weights=[15, 65, 20])[0]
    else:
        pref = random.choices(["Online", "Offline", "Both"], weights=[40, 30, 30])[0]

    rows.append({
        "age": age,
        "monthly_income": monthly_income,
        "daily_internet_hours": daily_internet_hours,
        "smartphone_usage_years": smartphone_usage_years,
        "social_media_hours": social_media_hours,
        "online_payment_trust_score": online_payment_trust_score,
        "tech_savvy_score": tech_savvy_score,
        "monthly_online_orders": monthly_online_orders,
        "monthly_store_visits": monthly_store_visits,
        "avg_online_spend": avg_online_spend,
        "avg_store_spend": avg_store_spend,
        "discount_sensitivity": random.randint(1, 10),
        "return_frequency": random.randint(0, 8),
        "avg_delivery_days": random.randint(1, 7),
        "delivery_fee_sensitivity": random.randint(1, 10),
        "free_return_importance": random.randint(1, 10),
        "product_availability_online": random.randint(1, 10),
        "impulse_buying_score": random.randint(1, 10),
        "need_touch_feel_score": random.randint(1, 10),
        "brand_loyalty_score": random.randint(1, 10),
        "environmental_awareness": random.randint(1, 10),
        "time_pressure_level": random.randint(1, 10),
        "gender": gender,
        "city_tier": city_tier,
        "shopping_preference": pref
    })

output_path = r"c:\Users\polu1\Desktop\GFG\data\customer_behaviour.csv"
with open(output_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)

print(f"✅ Dataset created: {n} rows at {output_path}")
