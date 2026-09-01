from datetime import datetime, date
from flask import Blueprint, jsonify, request
from backend.models import db, Shop, Customer, Product, Transaction, Payment, Bill, BillItem, Reminder, Notification, Setting
from backend.services.voice_parser import extract_entities
from backend.services.ledger_service import record_transaction, recalculate_customer_balance
from backend.services.report_service import get_dashboard_summary, get_reports_data
from backend.services.ai_assistant import ask_assistant

api_bp = Blueprint('api', __name__, url_prefix='/api')

# ----------------- HEALTH -----------------
@api_bp.get('/health')
def health():
    return jsonify({
        'ok': True,
        'status': 'healthy',
        'service': 'UdhaarAI Python API',
        'database': db.engine.name
    })


# ----------------- DASHBOARD -----------------
@api_bp.get('/dashboard')
def dashboard():
    summary = get_dashboard_summary(shop_id=1)
    return jsonify({'ok': True, 'data': summary})

# ----------------- CUSTOMERS -----------------
@api_bp.get('/customers')
def get_customers():
    status_filter = request.args.get('status')
    search_q = request.args.get('q', '').strip().lower()
    
    query = Customer.query.filter_by(shop_id=1)
    if status_filter and status_filter != 'all':
        query = query.filter(Customer.status == status_filter)
        
    customers = query.order_by(Customer.current_balance.desc()).all()
    
    if search_q:
        customers = [c for c in customers if search_q in c.name.lower() or search_q in c.phone.lower()]

    return jsonify({'ok': True, 'customers': [c.to_dict() for c in customers]})

@api_bp.get('/customers/<int:cust_id>')
def get_customer(cust_id):
    customer = Customer.query.get_or_404(cust_id)
    txns = [t.to_dict() for t in customer.transactions]
    bills = [b.to_dict() for b in customer.bills]
    reminders = [r.to_dict() for r in customer.reminders]
    
    data = customer.to_dict()
    data['transactions'] = txns
    data['bills'] = bills
    data['reminders'] = reminders
    return jsonify({'ok': True, 'customer': data})

@api_bp.post('/customers')
def create_customer():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    
    if not name:
        return jsonify({'ok': False, 'error': 'Customer name is required'}), 400
    if not phone:
        return jsonify({'ok': False, 'error': 'Customer phone number is required'}), 400

    # Check for existing phone
    existing = Customer.query.filter_by(shop_id=1, phone=phone).first()
    if existing:
        return jsonify({'ok': False, 'error': f'Customer with phone {phone} already exists: {existing.name}'}), 400

    opening_balance = float(data.get('opening_balance', 0.0) or 0.0)
    status = 'paid' if opening_balance == 0 else 'pending'

    customer = Customer(
        shop_id=1,
        name=name,
        phone=phone,
        address=data.get('address', '').strip(),
        email=data.get('email', '').strip(),
        notes=data.get('notes', '').strip(),
        current_balance=opening_balance,
        status=status
    )
    db.session.add(customer)
    db.session.commit()

    if opening_balance > 0:
        # Create initial opening balance transaction
        txn = Transaction(
            shop_id=1,
            customer_id=customer.id,
            type='credit',
            amount=opening_balance,
            description='Opening balance entry',
            created_at=datetime.utcnow()
        )
        db.session.add(txn)
        db.session.commit()

    return jsonify({'ok': True, 'message': 'Customer created successfully', 'customer': customer.to_dict()}), 201

@api_bp.put('/customers/<int:cust_id>')
def update_customer(cust_id):
    customer = Customer.query.get_or_404(cust_id)
    data = request.get_json(silent=True) or {}
    
    if 'name' in data and data['name'].strip():
        customer.name = data['name'].strip()
    if 'phone' in data and data['phone'].strip():
        customer.phone = data['phone'].strip()
    if 'address' in data:
        customer.address = data['address'].strip()
    if 'email' in data:
        customer.email = data['email'].strip()
    if 'notes' in data:
        customer.notes = data['notes'].strip()
    if 'status' in data:
        customer.status = data['status']

    customer.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'ok': True, 'message': 'Customer updated successfully', 'customer': customer.to_dict()})

@api_bp.delete('/customers/<int:cust_id>')
def delete_customer(cust_id):
    customer = Customer.query.get_or_404(cust_id)
    name = customer.name
    db.session.delete(customer)
    db.session.commit()
    return jsonify({'ok': True, 'message': f'Customer "{name}" deleted successfully'})

# ----------------- TRANSACTIONS / LEDGER -----------------
@api_bp.get('/transactions')
def get_transactions():
    cust_id = request.args.get('customer_id', type=int)
    txn_type = request.args.get('type')
    
    query = Transaction.query.filter_by(shop_id=1)
    if cust_id:
        query = query.filter_by(customer_id=cust_id)
    if txn_type and txn_type != 'all':
        query = query.filter_by(type=txn_type)
        
    txns = query.order_by(Transaction.created_at.desc()).all()
    return jsonify({'ok': True, 'transactions': [t.to_dict() for t in txns]})

@api_bp.post('/transactions')
def create_transaction():
    data = request.get_json(silent=True) or {}
    customer_id = data.get('customer_id')
    customer_name = (data.get('name') or data.get('customer') or '').strip()
    raw_action = (data.get('action') or data.get('type') or 'udhari').strip().lower()

    if raw_action in ['udhari', 'credit', 'given']:
        txn_type = 'credit'
    elif raw_action in ['payment', 'paid', 'received']:
        txn_type = 'payment'
    else:
        return jsonify({'ok': False, 'message': 'Action must be "udhari" or "payment"'}), 400

    raw_amount = data.get('amount')
    if raw_amount is None or raw_amount == '':
        return jsonify({'ok': False, 'message': 'Amount is required'}), 400

    try:
        amount = float(raw_amount)
    except (ValueError, TypeError):
        return jsonify({'ok': False, 'message': 'Amount must be a valid number'}), 400

    if amount <= 0 or amount != amount:  # check NaN
        return jsonify({'ok': False, 'message': 'Amount must be greater than zero'}), 400

    if not customer_id and not customer_name:
        return jsonify({'ok': False, 'message': 'Customer name is required'}), 400

    # Resolve customer
    customer = None
    if customer_id:
        customer = Customer.query.filter_by(shop_id=1, id=customer_id).first()
    elif customer_name:
        # Exact match
        customer = Customer.query.filter(Customer.shop_id == 1, Customer.name.ilike(customer_name)).first()
        if not customer:
            # Substring match
            customer = Customer.query.filter(Customer.shop_id == 1, Customer.name.ilike(f"%{customer_name}%")).first()
        if not customer:
            # Auto create customer if not found
            customer = Customer(
                shop_id=1,
                name=customer_name,
                phone='98' + str(int(datetime.utcnow().timestamp()))[-8:],
                current_balance=0.0,
                status='pending'
            )
            db.session.add(customer)
            db.session.commit()
            
    if not customer:
        return jsonify({'ok': False, 'message': 'Customer not found or could not be created'}), 400

    desc = data.get('description') or data.get('desc') or ('Voice transaction' if 'voice' in str(data) else ('Udhari credit' if txn_type == 'credit' else 'Payment received'))
    item_name = data.get('item') or data.get('item_name')
    qty = data.get('quantity')
    unit = data.get('unit')
    price = data.get('price') or data.get('price_per_unit')
    method = data.get('payment_method', 'cash')
    ref = data.get('reference_id', '')

    try:
        qty = float(qty) if qty is not None else None
    except ValueError:
        qty = None
    try:
        price = float(price) if price is not None else None
    except ValueError:
        price = None

    try:
        txn = record_transaction(
            shop_id=1,
            customer_id=customer.id,
            txn_type=txn_type,
            amount=amount,
            description=desc,
            item_name=item_name,
            quantity=qty,
            unit=unit,
            price_per_unit=price,
            payment_method=method,
            reference_id=ref
        )
        return jsonify({
            'ok': True,
            'message': f"₹{amount:g} {'Udhari added' if txn_type == 'credit' else 'payment recorded'} for {customer.name}",
            'transaction': txn.to_dict(),
            'customer': customer.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'ok': False, 'message': str(e)}), 500


@api_bp.delete('/transactions/<int:txn_id>')
def delete_transaction(txn_id):
    txn = Transaction.query.get_or_404(txn_id)
    customer_id = txn.customer_id
    db.session.delete(txn)
    db.session.commit()
    
    # Recalculate customer balance
    recalculate_customer_balance(customer_id)
    return jsonify({'ok': True, 'message': 'Transaction deleted and balance recalculated'})

# ----------------- PAYMENTS -----------------
@api_bp.get('/payments')
def get_payments():
    payments = Payment.query.filter_by(shop_id=1).order_by(Payment.created_at.desc()).all()
    return jsonify({'ok': True, 'payments': [p.to_dict() for p in payments]})

@api_bp.post('/payments')
def create_payment():
    data = request.get_json(silent=True) or {}
    data['type'] = 'payment'
    return create_transaction()

# ----------------- PRODUCTS -----------------
@api_bp.get('/products')
def get_products():
    search_q = request.args.get('q', '').strip().lower()
    query = Product.query.filter_by(shop_id=1)
    if search_q:
        query = query.filter(Product.name.ilike(f"%{search_q}%") | Product.category.ilike(f"%{search_q}%"))
    products = query.order_by(Product.name.asc()).all()
    return jsonify({'ok': True, 'products': [p.to_dict() for p in products]})

@api_bp.post('/products')
def create_product():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'ok': False, 'error': 'Product name is required'}), 400

    price = float(data.get('price', 0))
    stock = float(data.get('stock', 0))
    
    prod = Product(
        shop_id=1,
        name=name,
        sku=data.get('sku', '').strip(),
        category=data.get('category', 'Grocery').strip(),
        price=price,
        stock=stock,
        unit=data.get('unit', 'kg').strip()
    )
    db.session.add(prod)
    db.session.commit()
    return jsonify({'ok': True, 'message': f'Product "{name}" created', 'product': prod.to_dict()}), 201

@api_bp.put('/products/<int:prod_id>')
def update_product(prod_id):
    prod = Product.query.get_or_404(prod_id)
    data = request.get_json(silent=True) or {}
    
    if 'name' in data and data['name'].strip():
        prod.name = data['name'].strip()
    if 'sku' in data:
        prod.sku = data['sku'].strip()
    if 'category' in data:
        prod.category = data['category'].strip()
    if 'price' in data:
        prod.price = float(data['price'])
    if 'stock' in data:
        prod.stock = float(data['stock'])
    if 'unit' in data:
        prod.unit = data['unit'].strip()

    prod.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'ok': True, 'message': 'Product updated', 'product': prod.to_dict()})

@api_bp.delete('/products/<int:prod_id>')
def delete_product(prod_id):
    prod = Product.query.get_or_404(prod_id)
    name = prod.name
    db.session.delete(prod)
    db.session.commit()
    return jsonify({'ok': True, 'message': f'Product "{name}" deleted'})

# ----------------- BILLS -----------------
@api_bp.get('/bills')
def get_bills():
    bills = Bill.query.filter_by(shop_id=1).order_by(Bill.created_at.desc()).all()
    return jsonify({'ok': True, 'bills': [b.to_dict() for b in bills]})

@api_bp.get('/bills/<int:bill_id>')
def get_bill(bill_id):
    bill = Bill.query.get_or_404(bill_id)
    shop = Shop.query.get(1)
    data = bill.to_dict()
    data['shop'] = shop.to_dict() if shop else {}
    return jsonify({'ok': True, 'bill': data})

@api_bp.post('/bills')
def create_bill():
    data = request.get_json(silent=True) or {}
    customer_id = data.get('customer_id')
    items = data.get('items', [])
    
    if not customer_id:
        return jsonify({'ok': False, 'error': 'Customer is required for bill creation'}), 400
    if not items or len(items) == 0:
        return jsonify({'ok': False, 'error': 'At least one item is required in the bill'}), 400

    customer = Customer.query.get_or_404(customer_id)
    bill_number = f"UD-{int(datetime.utcnow().timestamp()) % 100000:05d}"
    
    subtotal = 0.0
    bill_items_objs = []
    for it in items:
        qty = float(it.get('quantity', 1))
        price = float(it.get('price', 0))
        tot = round(qty * price, 2)
        subtotal += tot
        
        # If product_id exists, reduce stock
        prod_id = it.get('product_id')
        if prod_id:
            prod = Product.query.get(prod_id)
            if prod:
                prod.stock = max(0.0, prod.stock - qty)

        bill_items_objs.append(BillItem(
            product_id=prod_id,
            item_name=it.get('item_name', 'Item').strip(),
            quantity=qty,
            unit=it.get('unit', 'pc'),
            price=price,
            total=tot
        ))

    discount = float(data.get('discount', 0))
    total_amount = max(0.0, round(subtotal - discount, 2))
    payment_status = data.get('payment_status', 'udhari')

    bill = Bill(
        shop_id=1,
        customer_id=customer.id,
        bill_number=bill_number,
        subtotal=round(subtotal, 2),
        discount=round(discount, 2),
        total_amount=total_amount,
        payment_status=payment_status,
        notes=data.get('notes', '').strip(),
        created_at=datetime.utcnow()
    )
    db.session.add(bill)
    db.session.flush()

    for bio in bill_items_objs:
        bio.bill_id = bill.id
        db.session.add(bio)

    # If bill is Udhari, create transaction entry
    if payment_status == 'udhari':
        item_summary = ", ".join([f"{it.item_name} x{it.quantity:g}" for it in bill_items_objs[:2]])
        record_transaction(
            shop_id=1,
            customer_id=customer.id,
            txn_type='credit',
            amount=total_amount,
            description=f"Bill #{bill_number} • {item_summary}"
        )
    elif payment_status == 'paid':
        record_transaction(
            shop_id=1,
            customer_id=customer.id,
            txn_type='payment',
            amount=total_amount,
            description=f"Payment for Bill #{bill_number}"
        )

    db.session.commit()
    return jsonify({'ok': True, 'message': f'Bill #{bill_number} created', 'bill': bill.to_dict()}), 201

@api_bp.delete('/bills/<int:bill_id>')
def delete_bill(bill_id):
    bill = Bill.query.get_or_404(bill_id)
    num = bill.bill_number
    db.session.delete(bill)
    db.session.commit()
    return jsonify({'ok': True, 'message': f'Bill #{num} deleted'})

# ----------------- REMINDERS -----------------
@api_bp.get('/reminders')
def get_reminders():
    status_f = request.args.get('status')
    query = Reminder.query.filter_by(shop_id=1)
    if status_f and status_f != 'all':
        query = query.filter(Reminder.status == status_f)
    reminders = query.order_by(Reminder.due_date.asc()).all()
    return jsonify({'ok': True, 'reminders': [r.to_dict() for r in reminders]})

@api_bp.post('/reminders')
def create_reminder():
    data = request.get_json(silent=True) or {}
    customer_id = data.get('customer_id')
    amount = float(data.get('amount', 0))
    due_date_str = data.get('due_date')
    
    if not customer_id:
        return jsonify({'ok': False, 'error': 'Customer is required'}), 400
    if amount <= 0:
        return jsonify({'ok': False, 'error': 'Amount must be greater than zero'}), 400
    if not due_date_str:
        return jsonify({'ok': False, 'error': 'Due date is required'}), 400

    try:
        due_d = datetime.strptime(due_date_str, '%Y-%m-%d').date()
    except ValueError:
        due_d = date.today()

    rem = Reminder(
        shop_id=1,
        customer_id=customer_id,
        amount=amount,
        due_date=due_d,
        status='pending',
        notes=data.get('notes', '').strip()
    )
    db.session.add(rem)
    db.session.commit()
    return jsonify({'ok': True, 'message': 'Reminder created successfully', 'reminder': rem.to_dict()}), 201

@api_bp.put('/reminders/<int:rem_id>')
def update_reminder(rem_id):
    rem = Reminder.query.get_or_404(rem_id)
    data = request.get_json(silent=True) or {}
    
    if 'status' in data:
        rem.status = data['status']
    if 'amount' in data:
        rem.amount = float(data['amount'])
    if 'notes' in data:
        rem.notes = data['notes']
    if 'due_date' in data:
        try:
            rem.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    db.session.commit()
    return jsonify({'ok': True, 'message': 'Reminder updated', 'reminder': rem.to_dict()})

@api_bp.delete('/reminders/<int:rem_id>')
def delete_reminder(rem_id):
    rem = Reminder.query.get_or_404(rem_id)
    db.session.delete(rem)
    db.session.commit()
    return jsonify({'ok': True, 'message': 'Reminder deleted'})

# ----------------- REPORTS -----------------
@api_bp.get('/reports')
def get_reports():
    period = request.args.get('period', 'month')
    data = get_reports_data(shop_id=1, period=period)
    return jsonify({'ok': True, 'data': data})

# ----------------- VOICE NLP PROCESSING -----------------
@api_bp.post('/voice/process')
def process_voice():
    data = request.get_json(silent=True) or {}
    text = data.get('text', '').strip()
    if not text:
        return jsonify({'ok': False, 'error': 'No text provided for processing'}), 400

    extracted = extract_entities(text, shop_id=1)
    
    # If the user asked a query (e.g. balance inquiry), also compute assistant response
    assistant_reply = None
    if extracted.get('is_query'):
        assistant_reply = ask_assistant(text, shop_id=1)

    return jsonify({
        'ok': True,
        'parsed': extracted,
        'assistant_reply': assistant_reply
    })

# ----------------- AI ASSISTANT CHAT -----------------
@api_bp.post('/assistant/chat')
def assistant_chat():
    data = request.get_json(silent=True) or {}
    message = data.get('message', '').strip()
    if not message:
        return jsonify({'ok': False, 'error': 'Message is required'}), 400

    reply = ask_assistant(message, shop_id=1)
    return jsonify({
        'ok': True,
        'reply': reply,
        'timestamp': datetime.utcnow().strftime('%I:%M %p')
    })

# ----------------- GLOBAL SEARCH -----------------
@api_bp.get('/search')
def global_search():
    q = request.args.get('q', '').strip().lower()
    if not q or len(q) < 1:
        return jsonify({'ok': True, 'results': {'customers': [], 'bills': [], 'transactions': [], 'products': []}})

    customers = Customer.query.filter(
        Customer.shop_id == 1,
        (Customer.name.ilike(f"%{q}%")) | (Customer.phone.ilike(f"%{q}%"))
    ).limit(5).all()

    bills = Bill.query.filter(
        Bill.shop_id == 1,
        Bill.bill_number.ilike(f"%{q}%")
    ).limit(5).all()

    products = Product.query.filter(
        Product.shop_id == 1,
        (Product.name.ilike(f"%{q}%")) | (Product.sku.ilike(f"%{q}%"))
    ).limit(5).all()

    txns = Transaction.query.filter(
        Transaction.shop_id == 1,
        (Transaction.description.ilike(f"%{q}%")) | (Transaction.item_name.ilike(f"%{q}%"))
    ).limit(5).all()

    return jsonify({
        'ok': True,
        'results': {
            'customers': [c.to_dict() for c in customers],
            'bills': [b.to_dict() for b in bills],
            'products': [p.to_dict() for p in products],
            'transactions': [t.to_dict() for t in txns]
        }
    })

# ----------------- NOTIFICATIONS -----------------
@api_bp.get('/notifications')
def get_notifications():
    notifs = Notification.query.filter_by(shop_id=1).order_by(Notification.created_at.desc()).limit(15).all()
    unread_count = sum(1 for n in notifs if not n.read)
    return jsonify({
        'ok': True,
        'notifications': [n.to_dict() for n in notifs],
        'unread_count': unread_count
    })

@api_bp.post('/notifications/mark-all-read')
def mark_notifications_read():
    Notification.query.filter_by(shop_id=1, read=False).update({'read': True})
    db.session.commit()
    return jsonify({'ok': True, 'message': 'All notifications marked as read'})

# ----------------- SETTINGS & SHOP PROFILE -----------------
@api_bp.get('/settings')
def get_settings():
    shop = Shop.query.get(1)
    settings = Setting.query.filter_by(shop_id=1).all()
    s_dict = {s.key: s.value for s in settings}
    return jsonify({
        'ok': True,
        'shop': shop.to_dict() if shop else {},
        'settings': s_dict
    })

@api_bp.post('/settings')
def update_settings():
    data = request.get_json(silent=True) or {}
    shop = Shop.query.get(1)
    
    if shop:
        if 'name' in data:
            shop.name = data['name'].strip()
        if 'owner_name' in data:
            shop.owner_name = data['owner_name'].strip()
        if 'phone' in data:
            shop.phone = data['phone'].strip()
        if 'address' in data:
            shop.address = data['address'].strip()
        if 'gstin' in data:
            shop.gstin = data['gstin'].strip()
        if 'currency' in data:
            shop.currency = data['currency'].strip()
        if 'default_language' in data:
            shop.default_language = data['default_language'].strip()

    # Save additional key-value settings
    for k, v in data.items():
        if k not in ['name', 'owner_name', 'phone', 'address', 'gstin', 'currency', 'default_language']:
            st = Setting.query.filter_by(shop_id=1, key=k).first()
            if st:
                st.value = str(v)
            else:
                db.session.add(Setting(shop_id=1, key=k, value=str(v)))

    db.session.commit()
    return jsonify({'ok': True, 'message': 'Settings saved successfully', 'shop': shop.to_dict()})
