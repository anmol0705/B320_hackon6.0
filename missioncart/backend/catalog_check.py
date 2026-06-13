import json
with open('app/data/catalog.json', encoding='utf-8') as f:
    products = json.load(f)
total = len(products)
sponsored = [p for p in products if p.get('sponsored')]
now = [p for p in products if p.get('amazon_now_eligible')]
no_safety_sponsored = [p for p in sponsored if not p.get('safety_tags')]
low_rating = [p for p in products if p.get('rating', 5) < 3.5]
required = ['asin','title','category','price','rating','amazon_now_eligible','return_risk','safety_tags','sponsored','pack_size']
missing_fields = [p for p in products if not all(k in p for k in required)]
print('Total products: ' + str(total))
print('Sponsored: ' + str(len(sponsored)) + ' (' + str(round(len(sponsored)/total*100,1)) + '%)')
print('Amazon Now eligible: ' + str(len(now)) + ' (' + str(round(len(now)/total*100,1)) + '%)')
print('Sponsored with NO safety_tags: ' + str(len(no_safety_sponsored)))
print('Products below 3.5 rating: ' + str(len(low_rating)))
print('Products missing required fields: ' + str(len(missing_fields)))
if no_safety_sponsored:
    print('Demo-ready sponsored: ' + no_safety_sponsored[0]['title'])
cats = {}
for p in products:
    c = p.get('category','unknown')
    cats[c] = cats.get(c,0)+1
top = sorted(cats.items(), key=lambda x: -x[1])[:15]
for c,n in top:
    print('  ' + c + ': ' + str(n))
