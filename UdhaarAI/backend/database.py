import logging
from datetime import datetime, timedelta
from pathlib import Path
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import create_engine
from backend.models import db, Shop, User, Customer, Product, Transaction, Payment, Bill, BillItem, Reminder, Notification, Setting
from backend.config import Config

logger = logging.getLogger(__name__)

def test_mysql_connection(uri):
    try:
        engine = create_engine(uri, connect_args={'connect_timeout': 2})
        with engine.connect() as conn:
            pass
        engine.dispose()
        return True
    except Exception as e:
        logger.warning(f"MySQL connection test failed ({e}).")
        return False

def init_db(app):
    instance_dir = Path(app.root_path).parent / 'instance'
    instance_dir.mkdir(exist_ok=True)

    mysql_uri = Config.MYSQL_URI
    if test_mysql_connection(mysql_uri):
        app.config['SQLALCHEMY_DATABASE_URI'] = mysql_uri
        logger.info(f"Connected to MySQL database at {Config.DB_HOST}:{Config.DB_PORT}/{Config.DB_NAME}")
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLITE_URI
        logger.info(f"Using local SQLite database at {Config.SQLITE_URI}")

    db.init_app(app)

    with app.app_context():
        db.create_all()
        seed_data()
        ensure_admin_user()

def ensure_admin_user():
    try:
        user = User.query.filter_by(username='bharat').first()
        if not user:
            user = User(
                username='bharat',
                email='bharat@vyapaarai.local',
                password_hash=generate_password_hash('admin123')
            )
            db.session.add(user)
            db.session.commit()
        else:
            # If dummy or not verifiable, update password to admin123
            if not user.password_hash or not check_password_hash(user.password_hash, 'admin123'):
                user.password_hash = generate_password_hash('admin123')
                db.session.commit()
    except Exception as e:
        logger.warning(f"Could not ensure admin user: {e}")

def seed_data():
    if Shop.query.first() is not None:
        return
        
    logger.info("Seeding initial demo data into database...")
    
    # 1. Shop & User
    shop = Shop(
        id=1,
        name='Bharat General Store',
        owner_name='Bharat',
        phone='9876543210',
        address='JSPM Market, Pune',
        gstin='27ABCDE1234F1Z5',
        currency='INR',
        default_language='hi'
    )
    db.session.add(shop)
    
    user = User(
        username='bharat',
        email='bharat@vyapaarai.local',
        password_hash=generate_password_hash('admin123')
    )
    db.session.add(user)
    db.session.commit()

    # 2. Products
    products_data = [
        {'name': 'Sugar', 'sku': 'GROC-SUG-01', 'category': 'Grocery', 'price': 50.0, 'stock': 85.0, 'unit': 'kg'},
        {'name': 'Rice (Basmati)', 'sku': 'GROC-RIC-02', 'category': 'Grocery', 'price': 64.0, 'stock': 120.0, 'unit': 'kg'},
        {'name': 'Wheat Flour', 'sku': 'GROC-WHT-03', 'category': 'Grocery', 'price': 48.0, 'stock': 200.0, 'unit': 'kg'},
        {'name': 'Cooking Oil', 'sku': 'GROC-OIL-04', 'category': 'Grocery', 'price': 128.0, 'stock': 45.0, 'unit': 'L'},
        {'name': 'Biscuits (Pack)', 'sku': 'SNK-BIS-05', 'category': 'Snacks', 'price': 20.0, 'stock': 90.0, 'unit': 'pack'},
        {'name': 'Tea Leaves', 'sku': 'BEV-TEA-06', 'category': 'Beverage', 'price': 90.0, 'stock': 35.0, 'unit': 'pack'},
        {'name': 'Toor Dal', 'sku': 'GROC-DAL-07', 'category': 'Grocery', 'price': 140.0, 'stock': 60.0, 'unit': 'kg'},
        {'name': 'Milk (Tetra)', 'sku': 'DAI-MLK-08', 'category': 'Dairy', 'price': 32.0, 'stock': 50.0, 'unit': 'L'}
    ]
    for p in products_data:
        prod = Product(shop_id=1, **p)
        db.session.add(prod)
    db.session.commit()

    # 3. Customers
    customers_data = [
        {'name': 'Ramesh Patil', 'phone': '9823012221', 'address': 'Shop 4, Market Yard', 'balance': 2450.0, 'status': 'overdue', 'notes': 'Regular buyer of sugar and grains.'},
        {'name': 'Suresh Traders', 'phone': '9734110813', 'address': 'Plot 12, Shivaji Nagar', 'balance': 1250.0, 'status': 'pending', 'notes': 'Weekly settlement customer.'},
        {'name': 'Amit Kumar', 'phone': '9611204107', 'address': 'Flat 201, Shanti Heights', 'balance': 0.0, 'status': 'paid', 'notes': 'Prompt payer.'},
        {'name': 'Neha General Store', 'phone': '9945087441', 'address': 'Gali No. 3, Near Temple', 'balance': 3740.0, 'status': 'pending', 'notes': 'Bulk retail partner.'},
        {'name': 'Rahul Shah', 'phone': '9021445530', 'address': 'Station Road, Pune', 'balance': 5800.0, 'status': 'overdue', 'notes': 'Large overdue credit.'},
        {'name': 'Priya Enterprises', 'phone': '9133098208', 'address': 'Main Bazar, Shop 18', 'balance': 920.0, 'status': 'pending', 'notes': 'Beverage customer.'}
    ]
    
    cust_objs = {}
    now = datetime.utcnow()
    for c in customers_data:
        cust = Customer(
            shop_id=1,
            name=c['name'],
            phone=c['phone'],
            address=c['address'],
            current_balance=c['balance'],
            status=c['status'],
            notes=c['notes'],
            created_at=now - timedelta(days=30)
        )
        db.session.add(cust)
        cust_objs[c['name']] = cust
    db.session.commit()

    # 4. Transactions
    txns_data = [
        {'customer': 'Ramesh Patil', 'type': 'credit', 'amount': 500.0, 'item': 'Sugar', 'qty': 2.0, 'unit': 'kg', 'price': 50.0, 'desc': 'Sugar • 2 kg', 'days_ago': 0, 'min_ago': 2},
        {'customer': 'Ramesh Patil', 'type': 'credit', 'amount': 1950.0, 'item': 'Wheat Flour', 'qty': 40.0, 'unit': 'kg', 'price': 48.75, 'desc': 'Wheat Flour • 40 kg', 'days_ago': 5, 'min_ago': 0},
        {'customer': 'Suresh Traders', 'type': 'payment', 'amount': 700.0, 'item': None, 'qty': None, 'unit': None, 'price': None, 'desc': 'Payment received via UPI', 'days_ago': 0, 'min_ago': 8},
        {'customer': 'Suresh Traders', 'type': 'credit', 'amount': 1950.0, 'item': 'Cooking Oil', 'qty': 15.0, 'unit': 'L', 'price': 130.0, 'desc': 'Cooking Oil • 15 L', 'days_ago': 2, 'min_ago': 0},
        {'customer': 'Neha General Store', 'type': 'credit', 'amount': 250.0, 'item': 'Biscuits', 'qty': 3.0, 'unit': 'pack', 'price': 83.33, 'desc': 'Biscuits • 3 packs', 'days_ago': 0, 'min_ago': 21},
        {'customer': 'Neha General Store', 'type': 'credit', 'amount': 3490.0, 'item': 'Rice (Basmati)', 'qty': 50.0, 'unit': 'kg', 'price': 69.8, 'desc': 'Rice • 50 kg', 'days_ago': 1, 'min_ago': 0},
        {'customer': 'Rahul Shah', 'type': 'credit', 'amount': 1250.0, 'item': 'Oil', 'qty': 5.0, 'unit': 'L', 'price': 250.0, 'desc': 'Oil • 5 L', 'days_ago': 0, 'min_ago': 60},
        {'customer': 'Rahul Shah', 'type': 'credit', 'amount': 4550.0, 'item': 'General items', 'qty': 1.0, 'unit': 'lot', 'price': 4550.0, 'desc': 'Monthly ration bundle', 'days_ago': 15, 'min_ago': 0},
        {'customer': 'Amit Kumar', 'type': 'payment', 'amount': 1000.0, 'item': None, 'qty': None, 'unit': None, 'price': None, 'desc': 'Cash payment full settlement', 'days_ago': 1, 'min_ago': 0},
        {'customer': 'Priya Enterprises', 'type': 'credit', 'amount': 920.0, 'item': 'Tea Leaves', 'qty': 10.0, 'unit': 'pack', 'price': 92.0, 'desc': 'Tea • 10 packs', 'days_ago': 3, 'min_ago': 0}
    ]
    
    for t in txns_data:
        cust = cust_objs.get(t['customer'])
        if cust:
            created = now - timedelta(days=t['days_ago'], minutes=t['min_ago'])
            txn = Transaction(
                shop_id=1,
                customer_id=cust.id,
                type=t['type'],
                amount=t['amount'],
                item_name=t['item'],
                quantity=t['qty'],
                unit=t['unit'],
                price_per_unit=t['price'],
                total_amount=t['amount'],
                description=t['desc'],
                created_at=created
            )
            db.session.add(txn)
            db.session.flush()
            
            if t['type'] == 'payment':
                pm = Payment(
                    shop_id=1,
                    customer_id=cust.id,
                    transaction_id=txn.id,
                    amount=t['amount'],
                    payment_method='upi' if 'UPI' in t['desc'] else 'cash',
                    notes=t['desc'],
                    created_at=created
                )
                db.session.add(pm)

    # 5. Bills
    bills_data = [
        {'number': 'UD-1028', 'cust': 'Ramesh Patil', 'subtotal': 500.0, 'disc': 0.0, 'total': 500.0, 'status': 'udhari', 'items': [{'item': 'Sugar', 'qty': 2, 'unit': 'kg', 'price': 50, 'total': 100}, {'item': 'Wheat Flour', 'qty': 8, 'unit': 'kg', 'price': 50, 'total': 400}]},
        {'number': 'UD-1027', 'cust': 'Suresh Traders', 'subtotal': 700.0, 'disc': 0.0, 'total': 700.0, 'status': 'paid', 'items': [{'item': 'Tea Leaves', 'qty': 7, 'unit': 'pack', 'price': 100, 'total': 700}]},
        {'number': 'UD-1026', 'cust': 'Neha General Store', 'subtotal': 250.0, 'disc': 0.0, 'total': 250.0, 'status': 'draft', 'items': [{'item': 'Biscuits', 'qty': 3, 'unit': 'pack', 'price': 83.33, 'total': 250}]},
        {'number': 'UD-1025', 'cust': 'Rahul Shah', 'subtotal': 1250.0, 'disc': 0.0, 'total': 1250.0, 'status': 'udhari', 'items': [{'item': 'Cooking Oil', 'qty': 5, 'unit': 'L', 'price': 250, 'total': 1250}]}
    ]
    for b in bills_data:
        cust = cust_objs.get(b['cust'])
        if cust:
            bill = Bill(
                shop_id=1,
                customer_id=cust.id,
                bill_number=b['number'],
                subtotal=b['subtotal'],
                discount=b['disc'],
                total_amount=b['total'],
                payment_status=b['status'],
                created_at=now - timedelta(hours=2)
            )
            db.session.add(bill)
            db.session.flush()
            for it in b['items']:
                bitem = BillItem(
                    bill_id=bill.id,
                    item_name=it['item'],
                    quantity=it['qty'],
                    unit=it['unit'],
                    price=it['price'],
                    total=it['total']
                )
                db.session.add(bitem)

    # 6. Reminders
    reminders_data = [
        {'cust': 'Rahul Shah', 'amount': 5800.0, 'days': -3, 'status': 'pending', 'notes': 'Overdue by 3 days. Send friendly WhatsApp reminder.'},
        {'cust': 'Ramesh Patil', 'amount': 2450.0, 'days': -1, 'status': 'sent', 'notes': 'Reminder message sent yesterday.'},
        {'cust': 'Neha General Store', 'amount': 3740.0, 'days': 2, 'status': 'pending', 'notes': 'Due at end of the week.'},
        {'cust': 'Priya Enterprises', 'amount': 920.0, 'days': 5, 'status': 'completed', 'notes': 'Paid via PhonePe.'}
    ]
    for r in reminders_data:
        cust = cust_objs.get(r['cust'])
        if cust:
            due = (now + timedelta(days=r['days'])).date()
            rem = Reminder(
                shop_id=1,
                customer_id=cust.id,
                amount=r['amount'],
                due_date=due,
                status=r['status'],
                notes=r['notes']
            )
            db.session.add(rem)

    # 7. Notifications
    notifs_data = [
        {'title': 'Overdue Payment Alert', 'message': 'Rahul Shah has ₹5,800 overdue for 15 days.', 'type': 'overdue', 'read': False},
        {'title': 'Payment Received', 'message': '₹700 payment recorded from Suresh Traders.', 'type': 'payment', 'read': False},
        {'title': 'New Udhari Recorded', 'message': '₹500 Udhari recorded for Ramesh Patil.', 'type': 'udhari', 'read': True},
        {'title': 'Scheduled Reminder', 'message': 'Payment reminder due for Neha General Store.', 'type': 'reminder', 'read': False}
    ]
    for n in notifs_data:
        notif = Notification(shop_id=1, **n)
        db.session.add(notif)

    # 8. Settings
    settings_data = {
        'shop_name': 'Bharat General Store',
        'owner_name': 'Bharat',
        'phone': '9876543210',
        'address': 'JSPM Market, Pune',
        'default_language': 'hi',
        'currency': 'INR',
        'voice_confirmation_required': 'true',
        'notify_overdue_sms': 'true',
        'notify_payment_whatsapp': 'true'
    }
    for k, v in settings_data.items():
        st = Setting(shop_id=1, key=k, value=v)
        db.session.add(st)

    db.session.commit()
    logger.info("Seed data successfully committed.")
