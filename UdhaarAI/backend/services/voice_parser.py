import re
from backend.models import Customer, Product

WORD_NUMBERS = {
    'ek': 1, 'do': 2, 'teen': 3, 'tin': 3, 'char': 4, 'paanch': 5, 'panch': 5, 'chhe': 6, 'sat': 7, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
    'ek sau': 100, 'do sau': 200, 'teen sau': 300, 'char sau': 400, 'panch sau': 500, 'chhe sau': 600, 'saat sau': 700, 'aath sau': 800, 'nau sau': 900,
    'hazar': 1000, 'hazaar': 1000, 'ek hazar': 1000, 'do hazar': 2000, 'panch hazar': 5000,
    'एक': 1, 'दोन': 2, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाच': 5, 'पाँच': 5, 'सहा': 6, 'छह': 6, 'सात': 7, 'आठ': 8, 'नऊ': 9, 'नौ': 9, 'दहा': 10, 'दस': 10,
    'शंभर': 100, 'एक सौ': 100, 'दोनशे': 200, 'दो सौ': 200, 'तीनशे': 300, 'तीन सौ': 300, 'चारशे': 400, 'चार सौ': 400, 'पाचशे': 500, 'पाँच सौ': 500,
    'सहाशे': 600, 'सातशे': 700, 'आठशे': 800, 'नऊशे': 900, 'हजार': 1000
}

UNIT_PATTERNS = {
    'kg': [r'kilos?', r'kg', r'किलो', r'कि\.ग्रा'],
    'L': [r'liters?', r'litre', r'litres?', r'l', r'लीटर', r'लिटर'],
    'pack': [r'packs?', r'packets?', r'पॅकेट', r'पैकेट'],
    'gram': [r'grams?', r'gm', r'g', r'ग्राम'],
    'pc': [r'pieces?', r'pc', r'pcs', r'नग', r'पीस']
}

def detect_language(text):
    devanagari_count = len(re.findall(r'[\u0900-\u097F]', text))
    if devanagari_count > 0:
        marathi_markers = ['आहे', 'नाही', 'दिले', 'घेतले', 'भरले', 'रुपये', 'शंभर', 'पाचशे', 'दोन']
        if any(m in text for m in marathi_markers):
            return 'Marathi', 'mr-IN'
        return 'Hindi', 'hi-IN'
    
    text_lower = text.lower()
    marathi_roman = ['dile', 'ghetle', 'bharle', 'paise', 'baki']
    hindi_roman = ['diya', 'diye', 'liye', 'liya', 'udhar', 'rupaye', 'jama', 'hisaab', 'bheja', 'hai', 'ko', 'ne', 'ka']
    
    if any(re.search(rf'\b{w}\b', text_lower) for w in hindi_roman):
        return 'Hinglish / Hindi', 'hi-IN'
    if any(re.search(rf'\b{w}\b', text_lower) for w in marathi_roman):
        return 'Marathi (Roman)', 'mr-IN'
    return 'English', 'en-IN'

def extract_entities(text, shop_id=1):
    raw_text = text.strip()
    text_lower = raw_text.lower()
    lang_name, lang_code = detect_language(raw_text)
    
    # 1. Determine Intent / Action
    is_payment = False
    is_query = False
    
    query_keywords = ['show', 'balance', 'who owes', 'kitna', 'baki kitna', 'transactions', 'kitne', 'सांगा', 'दाखवा', 'दिखाओ']
    if any(q in text_lower for q in query_keywords) and not ('udhar' in text_lower or 'payment' in text_lower or 'jama' in text_lower):
        is_query = True

    payment_keywords = [
        'payment', 'paid', 'jama', 'received', 'wapas', 'wapas kiya', 'returned', 
        'भरले', 'जमा', 'पेमेंट', 'वसूल', 'दिये', 'दिले', 'payment kiya', 'payment diya', 'payment ki'
    ]
    udhari_keywords = [
        'udhar', 'udhari', 'credit', 'liye', 'liya', 'diya', 'घेतले', 'उधार', 'उधारी', 'बाकी'
    ]
    
    if any(re.search(rf'\b{pk}\b', text_lower) for pk in payment_keywords):
        is_payment = True
    elif any(re.search(rf'\b{uk}\b', text_lower) for uk in udhari_keywords):
        is_payment = False
    else:
        is_payment = False

    action = 'payment' if is_payment else 'udhari'

    # 2. Extract Customer Name
    customer_name = None
    all_customers = Customer.query.filter_by(shop_id=shop_id).all()
    
    for cust in all_customers:
        first_name = cust.name.split()[0].lower()
        if cust.name.lower() in text_lower or (len(first_name) >= 3 and re.search(rf'\b{first_name}\b', text_lower)):
            customer_name = cust.name
            break
            
    if not customer_name:
        match_name = re.search(r'([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\s+(?:ne|ko|kadun|la|se|ने|को|कडून|ला)', raw_text, re.IGNORECASE)
        if match_name:
            candidate = match_name.group(1).strip()
            if candidate.lower() not in ['aaj', 'kal', 'total', 'bill', 'shop', 'आज', 'काल']:
                customer_name = candidate.title()
        
    if not customer_name:
        customer_name = all_customers[0].name if len(all_customers) > 0 else 'Ramesh Patil'

    # 3. Extract Quantity and Unit
    quantity = None
    unit = None
    unit_price = None

    # Find quantity with unit: "2 kilo", "5 L", "3 packs"
    for u_code, patterns in UNIT_PATTERNS.items():
        for pat in patterns:
            m = re.search(rf'(\d+(?:\.\d+)?)\s*(?:{pat})\b', raw_text, re.IGNORECASE)
            if m:
                quantity = float(m.group(1))
                unit = u_code
                break
        if unit:
            break

    # Look for item in product catalog or keywords
    item = None
    all_products = Product.query.filter_by(shop_id=shop_id).all()
    for prod in all_products:
        if prod.name.lower() in text_lower or prod.category.lower() in text_lower:
            item = prod.name
            if not unit:
                unit = prod.unit
            break
            
    if not item:
        common_items = ['sugar', 'rice', 'wheat', 'oil', 'tea', 'biscuit', 'dal', 'milk', 'shakar', 'cheeni', 'tel', 'chaha', 'दूध', 'साखर', 'तेल', 'चाय', 'गहू', 'तांदूळ']
        for ci in common_items:
            if ci in text_lower:
                item = ci.title()
                break

    # Check for unit rate / price per unit:
    # e.g., "100 rupaye kilo ke hisaab se", "100 rs/kg", "50 per kg", "100 rupaye"
    rate_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupaye|रुपये|रुपया)?\s*(?:kilo|kg|l|liter|pack|per|प्रति|दर)?\s*(?:ke hisaab se|kilo ke hisaab se|prati|per unit)', text_lower)
    if rate_match:
        try:
            unit_price = float(rate_match.group(1))
        except ValueError:
            pass

    # 4. Extract Final Amount
    amount = 0.0
    if quantity and unit_price and unit_price > 0:
        amount = quantity * unit_price
    else:
        # Check explicit amount in text
        amount_match = re.search(r'(?:₹|rs\.?|rupees?|रुपये|रुपया)\s*([0-9]+(?:\.[0-9]+)?)', raw_text, re.IGNORECASE) or \
                       re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:₹|rs\.?|rupees?|रुपये|रुपया)', raw_text, re.IGNORECASE)
        
        if amount_match:
            try:
                val = float(amount_match.group(1).replace(',', ''))
                # If quantity exists and matched number was the quantity itself, look for other numbers
                if quantity and val == quantity:
                    all_nums = re.findall(r'\b([0-9]{2,7})\b', raw_text)
                    for n in all_nums:
                        if float(n) != quantity:
                            val = float(n)
                            break
                amount = val
            except (ValueError, IndexError):
                amount = 0.0
        else:
            num_matches = re.findall(r'\b([0-9]{2,7})\b', raw_text)
            if num_matches:
                amount = float(num_matches[-1])
            else:
                for word, val in sorted(WORD_NUMBERS.items(), key=lambda x: -len(x[0])):
                    if re.search(rf'\b{word}\b', text_lower):
                        amount = float(val)
                        break

    if amount == 0.0:
        amount = 500.0

    # Description synthesis
    if item and quantity and unit:
        desc = f"{item} • {quantity:g} {unit}"
        if unit_price:
            desc += f" @ ₹{unit_price:g}/{unit}"
    elif is_payment:
        desc = "Payment received"
    else:
        desc = "Voice Udhari entry"

    return {
        'raw_text': raw_text,
        'customer': customer_name,
        'amount': round(amount, 2),
        'action': action,
        'item': item,
        'quantity': quantity,
        'unit': unit,
        'price': unit_price,
        'total': round(amount, 2),
        'language': lang_name,
        'lang_code': lang_code,
        'is_query': is_query,
        'description': desc
    }
